import { Analytics } from "@vercel/analytics/react";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { Viewport, Metadata } from "next";
import { InstallPWA } from "@/components/install-pwa";
import { OfflineBanner } from "@/components/offline-banner";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    {
      color: "#0A0A0A",
      media: "(prefers-color-scheme: dark)",
    },
    {
      color: "#ffffff",
      media: "(prefers-color-scheme: light)",
    },
  ],
};

export const metadata: Metadata = {
  title: "XLR8",
  description:
    "XLR8 - A sleek, minimalist task manager that helps you focus on what matters.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://xlr8.dev"),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "XLR8",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} dark:bg-neutral-900 antialiased h-full`}
          suppressHydrationWarning
        >
          <InstallPWA promptDelay={3000} />
          <OfflineBanner />
          <Providers>{children}</Providers>
          <Toaster />
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
