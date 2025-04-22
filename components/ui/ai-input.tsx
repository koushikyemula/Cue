"use client";

import { CornerRightUp } from "lucide-react";
import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea";
import { motion, AnimatePresence } from "framer-motion";

interface AIInput {
  id?: string;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  defaultSelected?: string;
  loadingDuration?: number;
  onSubmit?: (text: string, action?: string) => void;
  onClose?: () => void;
  className?: string;
}

export function AIInput({
  id = "ai-input",
  placeholder = "Enter your text here...",
  minHeight = 64,
  maxHeight = 200,
  loadingDuration = 3000,
  onSubmit,
  onClose,
  className,
}: AIInput) {
  const [inputValue, setInputValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight,
    maxHeight,
  });

  useEffect(() => {
    if (textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [textareaRef]);

  const handleSubmit = () => {
    if (inputValue.trim() && !submitted) {
      setSubmitted(true);
      onSubmit?.(inputValue);
      setInputValue("");
      adjustHeight(true);

      setTimeout(() => {
        setSubmitted(false);
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, loadingDuration);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle Enter for submission
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }

    // Handle Cmd+K or Ctrl+K to close
    if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      e.stopPropagation();
      onClose?.();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    if (!newValue.trim()) {
      adjustHeight(true);
    } else {
      adjustHeight();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn("w-full py-4 px-4 sm:px-0", className)}
    >
      <div className="relative max-w-xl w-full mx-auto">
        <motion.div
          className={cn(
            "relative border transition-all duration-200 ease-in-out",
            "border-black/10 dark:border-white/10",
            isFocused
              ? "border-black/30 dark:border-white/30 shadow-sm"
              : "border-black/10 dark:border-white/10",
            "rounded-2xl bg-black/[0.03] dark:bg-white/[0.03]"
          )}
          whileTap={{ scale: 0.995 }}
        >
          <div className="flex flex-col">
            <div
              className="overflow-y-auto px-4"
              style={{ maxHeight: `${maxHeight - 48}px` }}
            >
              <Textarea
                ref={textareaRef}
                id={id}
                placeholder={placeholder}
                className={cn(
                  "max-w-xl w-full rounded-2xl pr-10 py-4 placeholder:text-black/50 dark:placeholder:text-white/50",
                  "border-none focus:ring-0 text-black dark:text-white resize-none text-wrap bg-transparent",
                  "focus-visible:ring-0 focus-visible:ring-offset-0 leading-[1.2]",
                  `min-h-[${minHeight}px] transition-all duration-200`
                )}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                disabled={submitted}
              />
            </div>
          </div>
          <motion.button
            onClick={handleSubmit}
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 rounded-xl py-1 px-1",
              submitted ? "bg-none" : "bg-black/5 dark:bg-white/5"
            )}
            type="button"
            disabled={submitted || !inputValue.trim()}
          >
            {submitted ? (
              <div
                className="w-4 h-4 bg-black dark:bg-white rounded-sm animate-spin transition duration-700"
                style={{ animationDuration: "3s" }}
              />
            ) : (
              <CornerRightUp
                className={cn(
                  "w-4 h-4 transition-opacity dark:text-white",
                  inputValue ? "opacity-100" : "opacity-30"
                )}
              />
            )}
          </motion.button>
        </motion.div>
        <p className="h-4 text-xs mt-2 text-center text-black/70 dark:text-white/70">
          {submitted ? "AI is thinking..." : "Ready to submit!"}
        </p>
      </div>
    </motion.div>
  );
}
