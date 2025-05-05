import { cn } from "@/lib/utils";

export interface ProgressProps {
  progress: number;
  size?: number;
}

export function Progress({ progress, size = 20 }: ProgressProps) {
  const padding = 2;

  const getColorValue = () => {
    if (progress === 100) return "#22c55e"; // green-500
    if (progress > 0) return "#3b82f6"; // blue-500
    return "#737373"; // neutral-500
  };

  const transitionTiming = "transition-all duration-300 ease-out";

  return (
    <div className="flex items-center gap-2">
      <div className="text-xs font-medium text-neutral-400">{progress}%</div>

      <div
        className="relative rounded-md overflow-hidden"
        style={{ width: size, height: size }}
      >
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ padding }}
        >
          <div className="w-full h-full bg-neutral-100 dark:bg-neutral-800 rounded-md" />
        </div>
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-start",
            transitionTiming
          )}
          style={{ padding }}
        >
          <div
            className={cn("h-full rounded-md", transitionTiming)}
            style={{
              width: `${progress}%`,
              backgroundColor: getColorValue(),
              opacity: 0.85,
            }}
          />
        </div>
        <div
          className="absolute inset-0 border border-neutral-200 dark:border-neutral-700 rounded-md"
          style={{ padding: padding - 1 }}
        />
      </div>
    </div>
  );
}
