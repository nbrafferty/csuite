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

export const appRouter = router({
  auth: authRouter,
  company: companyRouter,
  clientOrg: clientRouter,
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
});

export type AppRouter = typeof appRouter;
