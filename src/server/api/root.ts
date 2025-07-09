import { createTRPCRouter } from "~/server/api/trpc";
import { caseRouter } from "./routers/case";
import { userRouter } from "./routers/user";
import { documentRouter } from "./routers/document";
import { messageRouter } from "./routers/message";
import { invoiceRouter } from "./routers/invoice";
import { paymentRouter } from "./routers/payment";
import { ticketRouter } from "./routers/ticket";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  case: caseRouter,
  user: userRouter,
  document: documentRouter,
  message: messageRouter,
  invoice: invoiceRouter,
  payment: paymentRouter,
  ticket: ticketRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
