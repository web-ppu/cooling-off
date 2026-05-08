"use client";

import {
  QueryClient,
  QueryClientProvider,
  QueryClientProviderProps,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export const queryClient = new QueryClient();

export type TanstackProviderProps = Omit<
  QueryClientProviderProps,
  "client"
> & {};

export default function TanstackProvider({
  children,
  ...props
}: TanstackProviderProps) {
  return (
    <QueryClientProvider client={queryClient} {...props}>
      {children}
      {process.env.NODE_ENV === "development" && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}
