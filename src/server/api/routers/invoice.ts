import { z } from "zod";
import { createTRPCRouter, protectedProcedure, staffProcedure } from "~/server/api/trpc";

export const invoiceRouter = createTRPCRouter({
  // Get invoices for a user
  getByUserId: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(10),
      offset: z.number().min(0).default(0),
      status: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { user } = ctx.session;
      
      let whereClause: any = {};
      
      if (user.role === "CLIENT") {
        whereClause.clientId = user.id;
      }
      
      if (input.status) {
        whereClause.status = input.status;
      }

      const invoices = await ctx.db.invoice.findMany({
        where: whereClause,
        include: {
          client: {
            select: { id: true, name: true, email: true },
          },
          case: {
            select: { id: true, caseNumber: true, title: true },
          },
          payments: {
            select: { id: true, amount: true, status: true, createdAt: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        skip: input.offset,
      });

      const total = await ctx.db.invoice.count({ where: whereClause });

      return {
        invoices,
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),

  // Create invoice
  create: staffProcedure
    .input(
      z.object({
        clientId: z.string(),
        caseId: z.string(),
        amount: z.number().positive(),
        currency: z.string().default("GHS"),
        description: z.string().optional(),
        dueDate: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Generate invoice number
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      
      const invoiceCount = await ctx.db.invoice.count();
      const invoiceNumber = `INV-${year}${month}-${String(invoiceCount + 1).padStart(4, '0')}`;

      const invoice = await ctx.db.invoice.create({
        data: {
          invoiceNumber,
          ...input,
        },
        include: {
          client: {
            select: { id: true, name: true, email: true },
          },
          case: {
            select: { id: true, caseNumber: true, title: true },
          },
        },
      });

      return invoice;
    }),
});
