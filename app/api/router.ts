import { createRouter, publicQuery } from "./middleware";
import { paymentRouter } from "./routers/payment";
import { shippingRouter } from "./routers/shipping";
import { orderRouter } from "./routers/order";
import { dispatchRouter } from "./routers/dispatch";
import { cloudinaryRouter } from "./routers/cloudinary";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  payment: paymentRouter,
  shipping: shippingRouter,
  order: orderRouter,
  dispatch: dispatchRouter,
  cloudinary: cloudinaryRouter,
});

export type AppRouter = typeof appRouter;
