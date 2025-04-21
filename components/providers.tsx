"use client";

import { type ReactNode } from "react";
import { InstallPWA } from "./install-pwa";
import { ThemeProvider } from "./theme-provider";

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
    </ThemeProvider>
  );
}
