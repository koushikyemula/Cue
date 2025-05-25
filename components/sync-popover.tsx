import { Button } from "@/components/ui/button";
import { FileInput } from "@/components/ui/file-input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  ArrowsClockwise,
  FileArrowDown,
  FileArrowUp,
} from "@phosphor-icons/react";
import GoogleCalendarSync from "@/components/google-calendar-sync";

interface SyncPopoverProps {
  syncOpen: boolean;
  setSyncOpen: (open: boolean) => void;
  handleExport: () => void;
  handleImport: (file: File) => void;
  className?: string;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
}

export function SyncPopover({
  syncOpen,
  setSyncOpen,
  handleExport,
  handleImport,
  className,
  align = "end",
  side = "bottom",
  sideOffset = 8,
}: SyncPopoverProps) {
  return (
    <Popover open={syncOpen} onOpenChange={setSyncOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          data-sync-trigger
          className={cn(
            "px-2 bg-transparent border-0 shadow-none h-9 hover:cursor-pointer hover:bg-accent/30 hover:text-accent-foreground dark:text-neutral-400 dark:hover:text-foreground",
            className
          )}
        >
          <ArrowsClockwise
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              syncOpen && "rotate-90"
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[240px] p-0 border-border/40 bg-neutral-800 dark:bg-neutral-800 shadow-md"
        align={align}
        side={side}
        sideOffset={sideOffset}
      >
        <div className="flex flex-col">
          <div className="px-3 pt-3 pb-2">
            <h3 className="text-sm font-medium">Data Sync</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Backup or restore your tasks
            </p>
          </div>
          <div className="px-1 py-1 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExport}
              className="justify-start w-full h-8 gap-2 px-2 text-xs font-normal hover:cursor-pointer text-neutral-300 hover:text-foreground hover:bg-accent/30"
            >
              <FileArrowUp weight="light" className="size-4" />
              Export tasks as JSON
            </Button>
            <FileInput onFileSelect={handleImport} accept=".json">
              <Button
                variant="ghost"
                size="sm"
                className="justify-start w-full h-8 gap-2 px-2 text-xs font-normal hover:cursor-pointer text-neutral-300 hover:text-foreground hover:bg-accent/30"
              >
                <FileArrowDown weight="light" className="size-4" />
                Import from JSON file
              </Button>
            </FileInput>
          </div>
          <div className="border-t px-3 py-2.5">
            <GoogleCalendarSync />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
