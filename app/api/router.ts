import { createRouter, publicQuery } from "./trpc-middleware";
import { paymentRouter } from "./routers/payment";
import { shippingRouter } from "./routers/shipping";
import { orderRouter } from "./routers/order";
import { productRouter } from "./routers/product";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  payment: paymentRouter,
  shipping: shippingRouter,
  order: orderRouter,
  product: productRouter,
});

export type AppRouter = typeof appRouter;
