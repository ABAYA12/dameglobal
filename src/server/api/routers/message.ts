import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const messageRouter = createTRPCRouter({
  // Get messages for a case
  getByCaseId: protectedProcedure
    .input(z.object({ 
      caseId: z.string(),
      limit: z.number().min(1).max(50).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
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

      // Check permissions
      if (user.role === "CLIENT" && case_.clientId !== user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only access messages for your own cases",
        });
      }

      if (user.role === "STAFF" && case_.assignedToId !== user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only access messages for cases assigned to you",
        });
      }

      // Filter messages based on user role
      let whereClause: any = { caseId: input.caseId };

      if (user.role === "CLIENT") {
        // Clients can only see messages where they are sender or receiver
        whereClause.OR = [
          { senderId: user.id },
          { receiverId: user.id },
        ];
      }

      const messages = await ctx.db.message.findMany({
        where: whereClause,
        include: {
          sender: {
            select: { id: true, name: true, role: true },
          },
          receiver: {
            select: { id: true, name: true, role: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        skip: input.offset,
      });

      const total = await ctx.db.message.count({ where: whereClause });

      return {
        messages,
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),

  // Send a message
  send: protectedProcedure
    .input(
      z.object({
        caseId: z.string(),
        receiverId: z.string(),
        subject: z.string().optional(),
        content: z.string().min(1, "Message content is required"),
        type: z.enum(["INTERNAL", "CLIENT_COMMUNICATION", "EMAIL", "SMS", "SYSTEM"]).default("CLIENT_COMMUNICATION"),
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

      // Check permissions
      if (user.role === "CLIENT" && case_.clientId !== user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only send messages for your own cases",
        });
      }

      if (user.role === "STAFF" && case_.assignedToId !== user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only send messages for cases assigned to you",
        });
      }

      // Verify receiver exists
      const receiver = await ctx.db.user.findUnique({
        where: { id: input.receiverId },
        select: { id: true, name: true, email: true },
      });

      if (!receiver) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Receiver not found",
        });
      }

      const message = await ctx.db.message.create({
        data: {
          caseId: input.caseId,
          senderId: user.id,
          receiverId: input.receiverId,
          subject: input.subject,
          content: input.content,
          type: input.type,
        },
        include: {
          sender: {
            select: { id: true, name: true, role: true },
          },
          receiver: {
            select: { id: true, name: true, role: true },
          },
        },
      });

      // Create timeline entry
      await ctx.db.caseTimeline.create({
        data: {
          caseId: input.caseId,
          event: "Message Sent",
          description: `Message sent to ${receiver.name}`,
          eventType: "MESSAGE_SENT",
          createdById: user.id,
        },
      });

      // TODO: Send email notification to receiver

      return message;
    }),

  // Mark message as read
  markAsRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx.session;

      const message = await ctx.db.message.findUnique({
        where: { id: input.id },
      });

      if (!message) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Message not found",
        });
      }

      // Only the receiver can mark message as read
      if (message.receiverId !== user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only mark your own messages as read",
        });
      }

      const updatedMessage = await ctx.db.message.update({
        where: { id: input.id },
        data: {
          isRead: true,
          readAt: new Date(),
        },
        include: {
          sender: {
            select: { id: true, name: true, role: true },
          },
          receiver: {
            select: { id: true, name: true, role: true },
          },
        },
      });

      return updatedMessage;
    }),

  // Get unread message count
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const { user } = ctx.session;

    const unreadCount = await ctx.db.message.count({
      where: {
        receiverId: user.id,
        isRead: false,
      },
    });

    return { unreadCount };
  }),

  // Get conversation between two users for a case
  getConversation: protectedProcedure
    .input(
      z.object({
        caseId: z.string(),
        otherUserId: z.string(),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
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

      // Check permissions
      if (user.role === "CLIENT" && case_.clientId !== user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only access conversations for your own cases",
        });
      }

      if (user.role === "STAFF" && case_.assignedToId !== user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only access conversations for cases assigned to you",
        });
      }

      const messages = await ctx.db.message.findMany({
        where: {
          caseId: input.caseId,
          OR: [
            { senderId: user.id, receiverId: input.otherUserId },
            { senderId: input.otherUserId, receiverId: user.id },
          ],
        },
        include: {
          sender: {
            select: { id: true, name: true, role: true },
          },
          receiver: {
            select: { id: true, name: true, role: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        skip: input.offset,
      });

      return { messages };
    }),

  // Get client messages
  getClientMessages: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.role !== "CLIENT") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only clients can access their messages",
      });
    }

    return ctx.db.message.findMany({
      where: {
        OR: [
          { senderId: ctx.session.user.id },
          { receiverId: ctx.session.user.id },
        ],
      },
      include: {
        sender: true,
        receiver: true,
        case: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });
  }),
});
