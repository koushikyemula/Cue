"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";
import { useMediaQuery } from "@/hooks";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "dark" } = useTheme();
  const isMobile = useMediaQuery("(max-width: 768px)");

  if (isMobile) {
    return null;
  }

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group border border-neutral-800/70 bg-neutral-900 !rounded-none shadow-md backdrop-blur-sm",
          title: "text-sm font-medium text-neutral-100",
          description: "text-xs text-neutral-400",
          actionButton: "bg-neutral-800 text-neutral-100 hover:bg-neutral-700",
          cancelButton: "bg-neutral-800 hover:bg-neutral-700 text-neutral-400",
          success:
            "border-l-2 border-l-neutral-500 bg-neutral-900 text-neutral-100",
          error:
            "border-l-2 border-l-red-500/70 bg-neutral-900 text-neutral-100",
          info: "border-l-2 border-l-blue-500/70 bg-neutral-900 text-neutral-100",
          closeButton: "text-neutral-400 hover:text-neutral-100",
        },
      }}
      position="bottom-right"
      expand={false}
      closeButton={true}
      visibleToasts={3}
      offset={35}
      gap={8}
      style={
        {
          "--normal-bg": "rgb(23, 23, 23)",
          "--normal-text": "rgb(229, 229, 229)",
          "--normal-border": "rgb(38, 38, 38)",
          "--success-bg": "rgb(23, 23, 23)",
          "--success-border": "rgb(64, 64, 64)",
          "--success-text": "rgb(229, 229, 229)",
          "--error-bg": "rgb(23, 23, 23)",
          "--error-border": "rgb(239, 68, 68, 0.7)",
          "--error-text": "rgb(229, 229, 229)",
          "--toast-radius": "0.25rem",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
