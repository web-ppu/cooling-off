import type { Metadata } from "next";
import TanstackProvider from "@/app/provider";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Cooling off",
  description: "Cooling off",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={cn("antialiased", "font-sans", inter.variable)}>
      <body>
        <TanstackProvider>{children}</TanstackProvider>
      </body>
    </html>
  );
}
