import { OfflineBanner } from "@/components/offline-banner";
import { Providers } from "@/components/providers";
import { ClerkProvider } from "@clerk/nextjs";
import { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
  title: "Cue",
  description:
    "Cue - A sleek, minimalist task manager that helps you focus on what matters.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://cuedot.tech",
  ),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Cue",
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
          <OfflineBanner />
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
