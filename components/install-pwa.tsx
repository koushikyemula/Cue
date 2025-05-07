"use client";

import { useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPWA({ promptDelay = 1500 }: { promptDelay?: number }) {
  useEffect(() => {
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

    if (!isMobile) return;

    if (localStorage.getItem("pwa-prompt-dismissed") === "true") return;

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;

    if (isStandalone) return;

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();

      setTimeout(() => {
        e.prompt()
          .then(() => {
            return e.userChoice;
          })
          .then((choiceResult) => {
            if (choiceResult.outcome === "dismissed") {
              localStorage.setItem("pwa-prompt-dismissed", "true");
            }
          });
      }, promptDelay);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt as EventListener
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt as EventListener
      );
    };
  }, [promptDelay]);

  return null;
}
