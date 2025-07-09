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

      return documents;
    }),

  // Update document with case association
  update: protectedProcedure
    .input(z.object({
      fileUrl: z.string(),
      caseId: z.string().optional(),
      fileName: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const document = await ctx.db.document.findFirst({
        where: { url: input.fileUrl },
      });

      if (!document) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found",
        });
      }

      // Check if user can update this document
      if (document.uploadedById !== ctx.session.user.id && 
          !["ADMIN", "STAFF", "LEGAL"].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only update your own documents",
        });
      }

      return ctx.db.document.update({
        where: { id: document.id },
        data: {
          caseId: input.caseId,
          filename: input.fileName ?? document.filename,
        },
      });
    }),

  // Delete a document
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const document = await ctx.db.document.findUnique({
        where: { id: input.id },
      });

      if (!document) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found",
        });
      }

      // Check permissions - only uploader, admin, or legal can delete
      if (document.uploadedById !== ctx.session.user.id && 
          !["ADMIN", "LEGAL"].includes(ctx.session.user.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to delete this document",
        });
      }

      return ctx.db.document.delete({
        where: { id: input.id },
      });
    }),

  // Get all documents for current user
  getMyDocuments: protectedProcedure
    .query(async ({ ctx }) => {
      const { user } = ctx.session;

      let whereClause: any = {};

      if (user.role === "CLIENT") {
        // Clients can only see their own documents
        whereClause = { uploadedById: user.id };
      } else if (user.role === "STAFF") {
        // Staff can see documents for cases assigned to them
        whereClause = {
          case: {
            assignedToId: user.id,
          },
        };
      }
      // LEGAL and ADMIN can see all documents (no where clause)

      const documents = await ctx.db.document.findMany({
        where: whereClause,
        include: {
          uploadedBy: {
            select: { id: true, name: true },
          },
          case: {
            select: { id: true, caseNumber: true, title: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return documents;
    }),

  // Create document (for UploadThing integration)
  create: protectedProcedure
    .input(z.object({
      filename: z.string(),
      originalName: z.string(),
      url: z.string(),
      size: z.number(),
      mimeType: z.string(),
      caseId: z.string(),
      folder: z.enum(["CONTRACTS", "EVIDENCE", "CORRESPONDENCE", "LEGAL_DOCS", "INVOICES", "OTHER"]).default("OTHER"),
      description: z.string().optional(),
      isPublic: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.document.create({
        data: {
          filename: input.filename,
          originalName: input.originalName,
          url: input.url,
          size: input.size,
          mimeType: input.mimeType,
          folder: input.folder,
          caseId: input.caseId,
          uploadedById: ctx.session.user.id,
          description: input.description,
          isPublic: input.isPublic,
        },
      });
    }),
});
