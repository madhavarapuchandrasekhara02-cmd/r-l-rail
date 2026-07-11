import { createRouter, publicQuery } from "./trpc-middleware";
import { shippingRouter } from "./routers/shipping";
import { orderRouter } from "./routers/order";
import { dispatchRouter } from "./routers/dispatch";
import { cloudinaryRouter } from "./routers/cloudinary";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  shipping: shippingRouter,
  order: orderRouter,
  dispatch: dispatchRouter,
  cloudinary: cloudinaryRouter,
});

export type AppRouter = typeof appRouter;
