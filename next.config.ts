import {
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_BUILD,
} from "next/constants";
import type { NextConfig } from "next";

const nextConfigBase: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "@phosphor-icons/react"],
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

const nextConfig = async (phase: string): Promise<NextConfig> => {
  if (phase === PHASE_DEVELOPMENT_SERVER || phase === PHASE_PRODUCTION_BUILD) {
    const withSerwist = (await import("@serwist/next")).default({
      swSrc: "lib/service-worker/worker.ts",
      swDest: "public/sw.js",
      reloadOnOnline: false,
      disable: process.env.NODE_ENV !== "production",
    });
    return withSerwist(nextConfigBase);
  }

  return nextConfigBase;
};

export default nextConfig;
