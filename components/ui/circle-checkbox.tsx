import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { CircleCheckboxProps } from "@/types";

export const CircleCheckbox = React.forwardRef<
  HTMLButtonElement,
  CircleCheckboxProps
>(({ checked = false, onCheckedChange, className, ...props }, ref) => {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      data-slot="checkbox"
      ref={ref}
      className={cn(
        "peer size-5 shrink-0   border border-input",
        "shadow-xs transition-all flex items-center justify-center",
        "dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
        "dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        "outline-none disabled:cursor-not-allowed disabled:opacity-50",
        checked && "data-[state=checked]",
        className
      )}
      onClick={() => onCheckedChange?.(!checked)}
      {...props}
    >
      {checked && (
        <Check
          className="size-3.5 text-current transition-none"
          strokeWidth={3}
        />
      )}
    </button>
  );
});

CircleCheckbox.displayName = "CircleCheckbox";
