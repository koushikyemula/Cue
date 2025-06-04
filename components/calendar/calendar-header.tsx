import { Button } from "@/components/ui/button";
import { CaretLeft, CaretRight, Plus } from "@phosphor-icons/react";
import { format, endOfMonth } from "date-fns";

interface CalendarHeaderProps {
  firstDayCurrentMonth: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onGoToToday: () => void;
  onNewTask: () => void;
  children?: React.ReactNode;
}

export function CalendarHeader({
  firstDayCurrentMonth,
  onPreviousMonth,
  onNextMonth,
  onGoToToday,
  onNewTask,
  children,
}: CalendarHeaderProps) {
  // Safety check for invalid dates
  const isValidDate =
    firstDayCurrentMonth && !isNaN(firstDayCurrentMonth.getTime());
  const safeDate = isValidDate ? firstDayCurrentMonth : new Date();

  return (
    <div className="flex flex-col space-y-4 p-4 md:flex-row md:items-center md:justify-between md:space-y-0 border-b border-neutral-800/40">
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <h2 className="text-lg font-medium text-foreground">
            {format(safeDate, "MMMM yyyy")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {format(safeDate, "MMM d")} -{" "}
            {format(endOfMonth(safeDate), "MMM d, yyyy")}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="inline-flex -space-x-px rounded-md border border-neutral-800">
          <Button
            onClick={onPreviousMonth}
            className="rounded-none cursor-pointer shadow-none first:rounded-l-md last:rounded-r-md focus-visible:z-10 bg-transparent border-0 hover:bg-neutral-800"
            variant="outline"
            size="icon"
            aria-label="Previous month"
          >
            <CaretLeft size={16} />
          </Button>
          <Button
            onClick={onGoToToday}
            className="rounded-none cursor-pointer shadow-none first:rounded-l-md last:rounded-r-md focus-visible:z-10 bg-transparent border-0 hover:bg-neutral-800 px-4"
            variant="outline"
          >
            Today
          </Button>
          <Button
            onClick={onNextMonth}
            className="rounded-none cursor-pointer shadow-none first:rounded-l-md last:rounded-r-md focus-visible:z-10 bg-transparent border-0 hover:bg-neutral-800"
            variant="outline"
            size="icon"
            aria-label="Next month"
          >
            <CaretRight size={16} />
          </Button>
        </div>

        <Button
          onClick={onNewTask}
          variant="secondary"
          className="gap-2 cursor-pointer"
        >
          <Plus size={16} />
          <span>New Task</span>
        </Button>

        {children}
      </div>
    </div>
  );
}
