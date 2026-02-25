import { router } from "./trpc";
import { authRouter } from "./routers/auth";
import { companyRouter } from "./routers/company";
import { clientRouter } from "./routers/client";
import { orderRouter } from "./routers/order";
import { threadRouter } from "./routers/thread";
import { messageRouter } from "./routers/message";
import { projectsRouter } from "./routers/projects";

export const appRouter = router({
  auth: authRouter,
  company: companyRouter,
  clientOrg: clientRouter,
  order: orderRouter,
  thread: threadRouter,
  message: messageRouter,
  projects: projectsRouter,
});

export type AppRouter = typeof appRouter;
