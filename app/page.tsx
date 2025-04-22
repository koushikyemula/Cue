"use client";

import { useState, useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { AnimatePresence } from "framer-motion";
import { AIInput } from "@/components/ui/ai-input";

export default function Home() {
  const [isInputVisible, setIsInputVisible] = useState(false);
  const inputRef = useRef<HTMLDivElement>(null);

  useHotkeys("meta+k, ctrl+k", (e) => {
    e.preventDefault();
    setIsInputVisible((prev) => !prev);
  });

  const handleClose = () => {
    setIsInputVisible(false);
  };

  return (
    <main className="h-full w-full flex mx-auto">
      <div
        className="flex w-full flex-col items-center justify-end mb-[120px]"
        ref={inputRef}
      >
        <AnimatePresence>
          {isInputVisible && (
            <AIInput
              placeholder="Enter your task here..."
              minHeight={50}
              onClose={handleClose}
            />
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
