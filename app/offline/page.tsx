"use client";

import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function OfflinePage() {
  const router = useRouter();
  const [isOffline, setIsOffline] = useState<boolean | null>(null);

  useEffect(() => {
    // Check connection status on mount
    const checkConnection = () => {
      if (typeof window !== "undefined") {
        setIsOffline(!navigator.onLine);

        if (navigator.onLine) {
          router.push("/");
          return;
        }
      }
    };

    checkConnection();

    const handleOnline = () => {
      setIsOffline(false);
      router.push("/");
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [router]);

  // Don't render anything until we've determined the connection status
  if (isOffline === null) {
    return null;
  }

  // If user is online, don't render the page content
  if (isOffline === false) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-zinc-50 dark:bg-zinc-900">
      <div className="max-w-md w-full px-6 py-8 bg-white dark:bg-zinc-800  shadow-sm border border-zinc-200 dark:border-zinc-700">
        <div className="w-16 h-16 mx-auto mb-6 bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center">
          <RefreshCw className="h-8 w-8 text-zinc-500 dark:text-zinc-400" />
        </div>

        <h1 className="text-2xl font-medium mb-3 text-zinc-900 dark:text-zinc-50">
          You're offline
        </h1>

        <p className="text-zinc-600 dark:text-zinc-300 mb-2">
          It looks like you've lost your internet connection.
        </p>

        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-8">
          You can still access your cached tasks and content.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium text-sm hover:opacity-90 transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            Retry Connection
          </button>

          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back Home
          </Link>
        </div>
      </div>
    </div>
  );
}
