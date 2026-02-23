import { router } from "./trpc";
import { authRouter } from "./routers/auth";
import { companyRouter } from "./routers/company";
import { orderRouter } from "./routers/order";

export const appRouter = router({
  auth: authRouter,
  company: companyRouter,
  order: orderRouter,
});

export type AppRouter = typeof appRouter;
