"use client";

import { type ReactNode } from "react";
import { InstallPWA } from "./install-pwa";
import { ThemeProvider } from "./theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      disableTransitionOnChange
    >
      {children}
      <InstallPWA />
      <Toaster />
      <Analytics />
    </ThemeProvider>
  );
}
