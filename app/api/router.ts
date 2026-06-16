import { createRouter, publicQuery } from "./trpc-middleware";
import { paymentRouter } from "./routers/payment";
import { shippingRouter } from "./routers/shipping";
import { orderRouter } from "./routers/order";


export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  payment: paymentRouter,
  shipping: shippingRouter,
  order: orderRouter,

});

export type AppRouter = typeof appRouter;
