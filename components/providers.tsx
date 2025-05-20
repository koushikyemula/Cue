"use client";

import { type ReactNode, useEffect } from "react";
import { InstallPWA } from "./install-pwa";
import { ThemeProvider } from "./theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";
import { registerServiceWorker } from "@/lib/service-worker/registration";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      process.env.NODE_ENV === "production"
    ) {
      registerServiceWorker();
    }
  }, []);

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
