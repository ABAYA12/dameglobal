import { z } from "zod";
import { createTRPCRouter, protectedProcedure, staffProcedure, adminProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

// Case filing schema
const caseFilingSchema = z.object({
  // Creditor Information
  creditorName: z.string().min(1, "Creditor name is required"),
  creditorRegNumber: z.string().optional(),
  creditorContactPerson: z.string().optional(),
  creditorEmail: z.string().email("Valid email is required"),
  creditorPhone: z.string().min(1, "Phone number is required"),
  creditorAddress: z.string().min(1, "Address is required"),
  creditorPostalAddress: z.string().optional(),
  
  // Debtor Information
  debtorName: z.string().min(1, "Debtor name is required"),
  debtorRegNumber: z.string().optional(),
  debtorAddress: z.string().min(1, "Debtor address is required"),
  debtorPhone: z.string().optional(),
  debtorEmail: z.string().email().optional(),
  debtorBusinessType: z.string().optional(),
  
  // Debt Details
  principalAmount: z.number().positive("Principal amount must be positive"),
  currency: z.string().default("GHS"),
  interestRate: z.number().optional(),
  accruedInterest: z.number().default(0),
  originalDueDate: z.date(),
  paymentTerms: z.string().optional(),
  debtCategory: z.string().min(1, "Debt category is required"),
  
  // Case Details
  title: z.string().min(1, "Case title is required"),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  preferredRecoveryMethod: z.string().optional(),
  previousAttempts: z.string().optional(),
  specialInstructions: z.string().optional(),
  preferredCommunication: z.string().optional(),
});

export const caseRouter = createTRPCRouter({
  // Get all cases (with role-based filtering)
  getAll: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(10),
      offset: z.number().min(0).default(0),
      status: z.string().optional(),
      priority: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { user } = ctx.session;
      
      // Build where clause based on user role
      let whereClause: any = {};
      
      if (user.role === "CLIENT") {
        whereClause.clientId = user.id;
      } else if (user.role === "STAFF") {
        whereClause.assignedToId = user.id;
      }
      // LEGAL and ADMIN can see all cases
      
      if (input.status) {
        whereClause.status = input.status;
      }
      
      if (input.priority) {
        whereClause.priority = input.priority;
      }

      const cases = await ctx.db.case.findMany({
        where: whereClause,
        include: {
          client: {
            select: { id: true, name: true, email: true },
          },
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: {
              documents: true,
              messages: true,
              timeline: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        skip: input.offset,
      });

      const total = await ctx.db.case.count({ where: whereClause });

      return {
        cases,
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),

  // Get case by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { user } = ctx.session;
      
      const case_ = await ctx.db.case.findUnique({
        where: { id: input.id },
        include: {
          client: {
            select: { id: true, name: true, email: true, phone: true },
          },
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
          documents: {
            include: {
              uploadedBy: {
                select: { id: true, name: true },
              },
            },
            orderBy: { createdAt: "desc" },
          },
          messages: {
            include: {
              sender: {
                select: { id: true, name: true },
              },
              receiver: {
                select: { id: true, name: true },
              },
            },
            orderBy: { createdAt: "desc" },
          },
          timeline: {
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!case_) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Case not found",
        });
      }

      // Check permissions
      if (user.role === "CLIENT" && case_.clientId !== user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only access your own cases",
        });
      }

      if (user.role === "STAFF" && case_.assignedToId !== user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only access cases assigned to you",
        });
      }

      return case_;
    }),

  // File a new case
  create: protectedProcedure
    .input(caseFilingSchema)
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;

      // Generate unique case number
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      
      // Get the count of cases created today
      const todayStart = new Date(year, currentDate.getMonth(), currentDate.getDate());
      const todayEnd = new Date(year, currentDate.getMonth(), currentDate.getDate() + 1);
      
      const casesCount = await ctx.db.case.count({
        where: {
          createdAt: {
            gte: todayStart,
            lt: todayEnd,
          },
        },
      });

      const caseNumber = `DMK-${year}-${month}${day}-${String(casesCount + 1).padStart(4, '0')}`;

      // Calculate total amount due
      const totalAmountDue = input.principalAmount + (input.accruedInterest || 0);

      // Find next available staff member for assignment (round-robin)
      const staffMembers = await ctx.db.user.findMany({
        where: { role: "STAFF" },
        include: {
          casesAsAssigned: {
            where: { status: { not: "CLOSED" } },
          },
        },
      });

      let assignedToId: string | null = null;
      if (staffMembers.length > 0) {
        // Find staff member with least active cases
        const staffWithLeastCases = staffMembers.reduce((prev, current) => {
          return prev.casesAsAssigned.length <= current.casesAsAssigned.length ? prev : current;
        });
        assignedToId = staffWithLeastCases.id;
      }

      // Create the case
      const newCase = await ctx.db.case.create({
        data: {
          caseNumber,
          clientId: user.id,
          assignedToId,
          totalAmountDue,
          ...input,
        },
        include: {
          client: {
            select: { id: true, name: true, email: true },
          },
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // Create initial timeline entry
      await ctx.db.caseTimeline.create({
        data: {
          caseId: newCase.id,
          event: "Case Created",
          description: `Case ${caseNumber} has been filed and assigned to ${newCase.assignedTo?.name || 'staff'}`,
          eventType: "CASE_CREATED",
          createdById: user.id,
        },
      });

      // TODO: Send notifications to assigned staff and admin

      return newCase;
    }),

  // Update case status
  updateStatus: staffProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(["RECEIVED", "UNDER_REVIEW", "INVESTIGATION", "ACTIVE_RECOVERY", "NEGOTIATION", "LEGAL_ACTION", "RESOLVED", "CLOSED"]),
      note: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;

      const case_ = await ctx.db.case.findUnique({
        where: { id: input.id },
      });

      if (!case_) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Case not found",
        });
      }

      // Check if user can update this case
      if (user.role === "STAFF" && case_.assignedToId !== user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only update cases assigned to you",
        });
      }

      const updatedCase = await ctx.db.case.update({
        where: { id: input.id },
        data: { status: input.status },
        include: {
          client: {
            select: { id: true, name: true, email: true },
          },
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // Create timeline entry
      await ctx.db.caseTimeline.create({
        data: {
          caseId: input.id,
          event: "Status Updated",
          description: `Case status changed to ${input.status}${input.note ? `. Note: ${input.note}` : ''}`,
          eventType: "STATUS_CHANGE",
          createdById: user.id,
        },
      });

      return updatedCase;
    }),

  // Assign case to staff member
  assign: adminProcedure
    .input(z.object({
      caseId: z.string(),
      staffId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;

      const case_ = await ctx.db.case.findUnique({
        where: { id: input.caseId },
      });

      if (!case_) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Case not found",
        });
      }

      const staff = await ctx.db.user.findUnique({
        where: { id: input.staffId },
      });

      if (!staff || !["STAFF", "LEGAL"].includes(staff.role)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid staff member",
        });
      }

      const updatedCase = await ctx.db.case.update({
        where: { id: input.caseId },
        data: { assignedToId: input.staffId },
        include: {
          client: {
            select: { id: true, name: true, email: true },
          },
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // Create timeline entry
      await ctx.db.caseTimeline.create({
        data: {
          caseId: input.caseId,
          event: "Case Reassigned",
          description: `Case assigned to ${staff.name}`,
          eventType: "ASSIGNMENT_CHANGED",
          createdById: user.id,
        },
      });

      return updatedCase;
    }),

  // Get case statistics
  getStats: staffProcedure
    .query(async ({ ctx }) => {
      const { user } = ctx.session;

      let whereClause: any = {};
      if (user.role === "STAFF") {
        whereClause.assignedToId = user.id;
      }

      const totalCases = await ctx.db.case.count({ where: whereClause });
      
      const casesByStatus = await ctx.db.case.groupBy({
        by: ['status'],
        where: whereClause,
        _count: { status: true },
      });

      const casesByPriority = await ctx.db.case.groupBy({
        by: ['priority'],
        where: whereClause,
        _count: { priority: true },
      });

      return {
        totalCases,
        casesByStatus,
        casesByPriority,
      };
    }),

  // Get client's cases
  getClientCases: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.session.user.role !== "CLIENT") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only clients can access their cases",
        });
      }

      return await ctx.db.case.findMany({
        where: { clientId: ctx.session.user.id },
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: {
              documents: true,
              messages: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  // Get staff's assigned cases
  getStaffCases: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.session.user.role !== "STAFF") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only staff can access their assigned cases",
        });
      }

      return await ctx.db.case.findMany({
        where: { assignedToId: ctx.session.user.id },
        include: {
          client: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: {
              documents: true,
              messages: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  // Get legal cases
  getLegalCases: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.session.user.role !== "LEGAL") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only legal team can access legal cases",
        });
      }

      return await ctx.db.case.findMany({
        where: {
          OR: [
            { status: "LEGAL_ACTION" },
            { status: "NEGOTIATION" },
          ],
        },
        include: {
          client: {
            select: { id: true, name: true, email: true },
          },
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: {
              documents: true,
              messages: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }),
});
