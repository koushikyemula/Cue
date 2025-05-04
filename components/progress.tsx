import { cn } from "@/lib/utils";

export interface ProgressProps {
  progress: number;
  size?: number;
}

export function Progress({ progress, size = 20 }: ProgressProps) {
  const strokeWidth = 1.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const getProgressColor = () => {
    if (progress === 100) return "text-green-500";
    if (progress > 0) return "text-blue-500";
    return "text-neutral-500";
  };

  // Get color values for conic gradient
  const getColorValue = () => {
    if (progress === 100) return "#22c55e"; // green-500
    if (progress > 0) return "#3b82f6"; // blue-500
    return "#737373"; // neutral-500
  };

  const transitionTiming = "transition-all duration-200 ease-out";

  return (
    <div className="flex items-center gap-2">
      <div className="text-xs font-medium text-neutral-400">{progress}%</div>

      <div className="relative" style={{ width: size, height: size }}>
        <div
          className={cn("absolute inset-0 rounded-full", transitionTiming)}
          style={{
            background: `conic-gradient(${getColorValue()} ${progress}%, transparent ${progress}%)`,
            opacity: progress > 0 ? 0.25 : 0,
          }}
        />

        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            className="text-muted-foreground/15"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="none"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          <circle
            className={cn(getProgressColor(), transitionTiming)}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="none"
            r={radius}
            cx={size / 2}
            cy={size / 2}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
      </div>
    </div>
  );
}
