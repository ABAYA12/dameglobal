import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const paymentRouter = createTRPCRouter({
  // Get payments for a user
  getByUserId: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(10),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      const { user } = ctx.session;
      
      let whereClause: any = {};
      
      if (user.role === "CLIENT") {
        whereClause.clientId = user.id;
      }

      const payments = await ctx.db.payment.findMany({
        where: whereClause,
        include: {
          client: {
            select: { id: true, name: true, email: true },
          },
          invoice: {
            select: { id: true, invoiceNumber: true, amount: true },
          },
          case: {
            select: { id: true, caseNumber: true, title: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        skip: input.offset,
      });

      const total = await ctx.db.payment.count({ where: whereClause });

      return {
        payments,
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),
});
