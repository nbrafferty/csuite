import { router } from "./trpc";
import { authRouter } from "./routers/auth";
import { companyRouter } from "./routers/company";
import { clientRouter } from "./routers/client";
import { orderRouter } from "./routers/order";
import { invoiceRouter } from "./routers/invoice";
import { shipmentRouter } from "./routers/shipment";
import { quoteRequestRouter } from "./routers/quote-request";
import { quoteRouter } from "./routers/quote";
import { vendorRouter } from "./routers/vendor";
import { catalogRouter } from "./routers/catalog";
import { threadRouter } from "./routers/thread";
import { messageRouter } from "./routers/message";
import { projectsRouter } from "./routers/projects";
import { dashboardRouter } from "./routers/dashboard";
import { taskRouter } from "./routers/task";
import { clientProductRouter } from "./routers/client-product";
import { automationRouter } from "./routers/automation";
import { expenseRouter } from "./routers/expense";
import { artworkRouter } from "./routers/artwork";
import { proofRouter } from "./routers/proof";
import { userRouter } from "./routers/user";

export const appRouter = router({
  dashboard: dashboardRouter,
  auth: authRouter,
  company: companyRouter,
  clientOrg: clientRouter,
  user: userRouter,
  order: orderRouter,
  invoice: invoiceRouter,
  shipment: shipmentRouter,
  quoteRequest: quoteRequestRouter,
  quote: quoteRouter,
  vendor: vendorRouter,
  catalog: catalogRouter,
  thread: threadRouter,
  message: messageRouter,
  projects: projectsRouter,
  task: taskRouter,
  clientProduct: clientProductRouter,
  automation: automationRouter,
  expense: expenseRouter,
  artwork: artworkRouter,
  proof: proofRouter,
});

export type AppRouter = typeof appRouter;
