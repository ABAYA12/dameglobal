import { z } from "zod";
import { createTRPCRouter, protectedProcedure, staffProcedure } from "~/server/api/trpc";

export const ticketRouter = createTRPCRouter({
  // Get tickets
  getAll: staffProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(10),
      offset: z.number().min(0).default(0),
      status: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      let whereClause: any = {};
      
      if (input.status) {
        whereClause.status = input.status;
      }

      const tickets = await ctx.db.ticket.findMany({
        where: whereClause,
        include: {
          case: {
            select: { id: true, caseNumber: true, title: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        skip: input.offset,
      });

      const total = await ctx.db.ticket.count({ where: whereClause });

      return {
        tickets,
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),

  // Create ticket
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        category: z.string().min(1),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
        caseId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Generate ticket number
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      
      const ticketCount = await ctx.db.ticket.count();
      const ticketNumber = `TKT-${year}${month}${day}-${String(ticketCount + 1).padStart(4, '0')}`;

      const ticket = await ctx.db.ticket.create({
        data: {
          ticketNumber,
          ...input,
        },
        include: {
          case: {
            select: { id: true, caseNumber: true, title: true },
          },
        },
      });

      return ticket;
    }),

  // Get staff tickets
  getStaffTickets: staffProcedure.query(async ({ ctx }) => {
    return ctx.db.ticket.findMany({
      where: {
        OR: [
          { assignedToId: ctx.session.user.id },
          { assignedToId: null }, // Unassigned tickets
        ],
      },
      include: {
        case: {
          select: { id: true, caseNumber: true, title: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }),
});
