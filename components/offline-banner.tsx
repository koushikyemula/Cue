"use client";

import { useEffect, useState } from "react";

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Set initial online status
    const online = navigator.onLine;
    setIsOnline(online);
    setShowBanner(!online);

    // Handle online/offline events from browser
    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(true);
      // Hide the "back online" banner after a few seconds
      setTimeout(() => setShowBanner(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div
      className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transform rounded-md border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm shadow-lg transition-all duration-300 ease-in-out ${
        showBanner
          ? "opacity-100 translate-y-0"
          : "pointer-events-none opacity-0 translate-y-4"
      } ${
        isOnline
          ? "border-green-600/30 bg-green-950/60 text-green-300 backdrop-blur"
          : "border-neutral-800 bg-neutral-950/60 text-neutral-300 backdrop-blur"
      }`}
    >
      {isOnline ? "Connection restored" : "You are currently offline"}
    </div>
  );
}
