import { z } from "zod";
import { createTRPCRouter, protectedProcedure, staffProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const documentRouter = createTRPCRouter({
  // Get documents for a case
  getByCaseId: protectedProcedure
    .input(z.object({ caseId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { user } = ctx.session;

      // First, check if user has access to this case
      const case_ = await ctx.db.case.findUnique({
        where: { id: input.caseId },
        select: { clientId: true, assignedToId: true },
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
          message: "You can only access documents for your own cases",
        });
      }

      if (user.role === "STAFF" && case_.assignedToId !== user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only access documents for cases assigned to you",
        });
      }

      // Filter documents based on user role
      let whereClause: any = { caseId: input.caseId };

      if (user.role === "CLIENT") {
        // Clients can only see public documents and documents they uploaded
        whereClause.OR = [
          { isPublic: true },
          { uploadedById: user.id },
        ];
      }

      const documents = await ctx.db.document.findMany({
        where: whereClause,
        include: {
          uploadedBy: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Group documents by folder
      const documentsByFolder = documents.reduce((acc, doc) => {
        if (!acc[doc.folder]) {
          acc[doc.folder] = [];
        }
        acc[doc.folder].push(doc);
        return acc;
      }, {} as Record<string, typeof documents>);

      return {
        documents,
        documentsByFolder,
      };
    }),

  // Create document record (after upload)
  create: protectedProcedure
    .input(
      z.object({
        caseId: z.string(),
        filename: z.string(),
        originalName: z.string(),
        url: z.string(),
        size: z.number(),
        mimeType: z.string(),
        folder: z.enum([
          "CLIENT_UPLOADS",
          "INTERNAL_DOCUMENTS",
          "LEGAL_DOCUMENTS",
          "EVIDENCE_FILES",
          "CONTRACTS",
          "INVOICES",
          "CORRESPONDENCE",
        ]),
        description: z.string().optional(),
        isPublic: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;

      // Check if user has access to this case
      const case_ = await ctx.db.case.findUnique({
        where: { id: input.caseId },
        select: { clientId: true, assignedToId: true },
      });

      if (!case_) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Case not found",
        });
      }

      // Check permissions for document upload
      if (user.role === "CLIENT") {
        if (case_.clientId !== user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only upload documents to your own cases",
          });
        }
        // Clients can only upload to CLIENT_UPLOADS folder
        if (input.folder !== "CLIENT_UPLOADS") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Clients can only upload to the Client Uploads folder",
          });
        }
      }

      if (user.role === "STAFF" && case_.assignedToId !== user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only upload documents to cases assigned to you",
        });
      }

      const document = await ctx.db.document.create({
        data: {
          ...input,
          uploadedById: user.id,
        },
        include: {
          uploadedBy: {
            select: { id: true, name: true },
          },
        },
      });

      // Create timeline entry
      await ctx.db.caseTimeline.create({
        data: {
          caseId: input.caseId,
          event: "Document Uploaded",
          description: `Document "${input.originalName}" uploaded to ${input.folder}`,
          eventType: "DOCUMENT_UPLOADED",
          createdById: user.id,
        },
      });

      return document;
    }),

  // Delete document
  delete: staffProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;

      const document = await ctx.db.document.findUnique({
        where: { id: input.id },
        include: {
          case: {
            select: { assignedToId: true },
          },
        },
      });

      if (!document) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found",
        });
      }

      // Check permissions
      if (user.role === "STAFF" && document.case.assignedToId !== user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete documents from cases assigned to you",
        });
      }

      await ctx.db.document.delete({
        where: { id: input.id },
      });

      // TODO: Delete actual file from storage

      return { success: true };
    }),

  // Update document visibility
  updateVisibility: staffProcedure
    .input(
      z.object({
        id: z.string(),
        isPublic: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;

      const document = await ctx.db.document.findUnique({
        where: { id: input.id },
        include: {
          case: {
            select: { assignedToId: true },
          },
        },
      });

      if (!document) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found",
        });
      }

      // Check permissions
      if (user.role === "STAFF" && document.case.assignedToId !== user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only modify documents from cases assigned to you",
        });
      }

      const updatedDocument = await ctx.db.document.update({
        where: { id: input.id },
        data: { isPublic: input.isPublic },
        include: {
          uploadedBy: {
            select: { id: true, name: true },
          },
        },
      });

      return updatedDocument;
    }),

  // Get client documents
  getClientDocuments: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.role !== "CLIENT") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only clients can access their documents",
      });
    }

    return ctx.db.document.findMany({
      where: {
        OR: [
          { uploadedById: ctx.session.user.id },
          {
            case: { clientId: ctx.session.user.id },
            isPublic: true,
          },
        ],
      },
      include: {
        case: true,
        uploadedBy: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }),

  // Get legal documents
  getLegalDocuments: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.role !== "LEGAL" && ctx.session.user.role !== "ADMIN") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only legal counsel can access legal documents",
      });
    }

    return ctx.db.document.findMany({
      where: {
        documentType: { in: ["CONTRACT", "LEGAL_BRIEF", "COURT_FILING", "JUDGMENT"] },
      },
      include: {
        case: true,
        uploadedBy: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }),
});
