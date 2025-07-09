import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const userRouter = createTRPCRouter({
  // Get current user profile
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        company: true,
        phone: true,
        address: true,
        postalAddress: true,
        createdAt: true,
        _count: {
          select: {
            casesAsClient: true,
            casesAsAssigned: true,
          },
        },
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return user;
  }),

  // Update user profile
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required").optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        postalAddress: z.string().optional(),
        company: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updatedUser = await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: input,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          company: true,
          phone: true,
          address: true,
          postalAddress: true,
        },
      });

      return updatedUser;
    }),

  // Get all users (admin only)
  getAll: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        offset: z.number().min(0).default(0),
        role: z.enum(["CLIENT", "STAFF", "LEGAL", "ADMIN"]).optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const whereClause: any = {};

      if (input.role) {
        whereClause.role = input.role;
      }

      if (input.search) {
        whereClause.OR = [
          { name: { contains: input.search, mode: "insensitive" } },
          { email: { contains: input.search, mode: "insensitive" } },
          { company: { contains: input.search, mode: "insensitive" } },
        ];
      }

      const users = await ctx.db.user.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          company: true,
          phone: true,
          createdAt: true,
          _count: {
            select: {
              casesAsClient: true,
              casesAsAssigned: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        skip: input.offset,
      });

      const total = await ctx.db.user.count({ where: whereClause });

      return {
        users,
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),

  // Get all users (admin only)
  getAllUsers: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        company: true,
        phone: true,
        createdAt: true,
        status: true,
        _count: {
          select: {
            casesAsClient: true,
            casesAsAssigned: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }),

  // Get user by ID
  getById: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          company: true,
          phone: true,
          address: true,
          postalAddress: true,
          createdAt: true,
          casesAsClient: {
            select: {
              id: true,
              caseNumber: true,
              title: true,
              status: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 5,
          },
          casesAsAssigned: {
            select: {
              id: true,
              caseNumber: true,
              title: true,
              status: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 5,
          },
          _count: {
            select: {
              casesAsClient: true,
              casesAsAssigned: true,
              sentMessages: true,
              uploadedDocuments: true,
            },
          },
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return user;
    }),

  // Create new user (admin only)
  create: adminProcedure
    .input(
      z.object({
        email: z.string().email("Valid email is required"),
        name: z.string().min(1, "Name is required"),
        role: z.enum(["CLIENT", "STAFF", "LEGAL", "ADMIN"]),
        company: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        postalAddress: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user with email already exists
      const existingUser = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User with this email already exists",
        });
      }

      const newUser = await ctx.db.user.create({
        data: input,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          company: true,
          phone: true,
          createdAt: true,
        },
      });

      return newUser;
    }),

  // Update user role (admin only)
  updateRole: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.enum(["CLIENT", "STAFF", "LEGAL", "ADMIN"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const updatedUser = await ctx.db.user.update({
        where: { id: input.userId },
        data: { role: input.role },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          company: true,
          phone: true,
        },
      });

      return updatedUser;
    }),

  // Get staff members for case assignment
  getStaffMembers: adminProcedure.query(async ({ ctx }) => {
    const staffMembers = await ctx.db.user.findMany({
      where: {
        role: { in: ["STAFF", "LEGAL"] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        _count: {
          select: {
            casesAsAssigned: {
              where: {
                status: { not: "CLOSED" },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return staffMembers;
  }),

  // Register new client
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email("Valid email is required"),
        name: z.string().min(1, "Name is required"),
        company: z.string().optional(),
        phone: z.string().min(1, "Phone number is required"),
        address: z.string().min(1, "Address is required"),
        postalAddress: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user with email already exists
      const existingUser = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User with this email already exists",
        });
      }

      const newUser = await ctx.db.user.create({
        data: {
          ...input,
          role: "CLIENT",
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          company: true,
          phone: true,
        },
      });

      return newUser;
    }),

  // Get user statistics
  getStats: adminProcedure.query(async ({ ctx }) => {
    const totalUsers = await ctx.db.user.count();

    const usersByRole = await ctx.db.user.groupBy({
      by: ['role'],
      _count: { role: true },
    });

    const recentUsers = await ctx.db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return {
      totalUsers,
      usersByRole,
      recentUsers,
    };
  }),
});
