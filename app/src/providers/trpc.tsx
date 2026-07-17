"use client";
import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import superjson from "superjson";
import type { AppRouter } from "../../api/router";
import { ReactNode, useEffect } from "react";

export const trpc = createTRPCReact<AppRouter>();

const queryClient = new QueryClient();
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

export function TRPCProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    console.log(
      "%c🌿 Designed & Engineered by Chatruveda Technologies 🌿\n%cLike what you see? Let's build your dream product: https://wa.me/919573826186?text=Hi%20Chatruveda%20Technologies!%20I%20saw%20your%20work%20on%20Roots%20%26%20Leaves%20and%20would%20like%20to%20discuss%20a%20project.",
      "color: #B37943; font-family: serif; font-size: 16px; font-weight: bold;",
      "color: #4A3525; font-size: 12px; font-family: sans-serif;"
    );
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
