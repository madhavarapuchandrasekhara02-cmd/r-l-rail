import { createRouter, publicQuery, adminQuery } from "./trpc-middleware";
import { shippingRouter } from "./routers/shipping";
import { orderRouter } from "./routers/order";
import { dispatchRouter } from "./routers/dispatch";
import { cloudinaryRouter } from "./routers/cloudinary";
import { productRouter } from "./routers/product";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  verifyAdmin: adminQuery.query(() => ({ authorized: true })),
  shipping: shippingRouter,
  order: orderRouter,
  dispatch: dispatchRouter,
  cloudinary: cloudinaryRouter,
  product: productRouter,
});

export type AppRouter = typeof appRouter;
