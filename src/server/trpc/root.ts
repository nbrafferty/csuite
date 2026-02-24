import { router } from "@/lib/trpc/init";
import { threadRouter } from "./routers/thread";
import { messageRouter } from "./routers/message";

export const appRouter = router({
  thread: threadRouter,
  message: messageRouter,
});

export type AppRouter = typeof appRouter;
