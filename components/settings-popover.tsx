"use client";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Settings } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SortOption } from "@/types";

export interface UserSettings {
  defaultAIInputOpen: boolean;
  autoRemoveCompleted: boolean;
  defaultPriority: "high" | "medium" | "low" | undefined;
  defaultSortBy: SortOption;
}

const defaultSettings: UserSettings = {
  defaultAIInputOpen: false,
  autoRemoveCompleted: false,
  defaultPriority: undefined,
  defaultSortBy: "newest",
};

export function SettingsPopover({
  onSettingsChange,
  isMobile,
}: {
  onSettingsChange: (settings: UserSettings) => void;
  isMobile: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useLocalStorage<UserSettings>(
    "user-settings",
    defaultSettings
  );

  useEffect(() => {
    onSettingsChange(settings);
  }, [settings, onSettingsChange]);

  const handleSwitchChange = useCallback(
    (checked: boolean, setting: keyof UserSettings) => {
      setSettings({
        ...settings,
        [setting]: checked,
      });
    },
    [settings, setSettings]
  );

  const handleSelectChange = useCallback(
    (value: string, setting: keyof UserSettings) => {
      setSettings({
        ...settings,
        [setting]:
          setting === "defaultPriority" && value === "none" ? undefined : value,
      });
    },
    [settings, setSettings]
  );

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
  }, []);

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange} modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2 border-0 hover:cursor-pointer shadow-none bg-transparent hover:bg-accent/30 hover:text-accent-foreground dark:text-neutral-400 dark:hover:text-foreground"
        >
          <Settings
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              isMobile && "hidden",
              isOpen && "rotate-90"
            )}
          />
          {/* <span className="text-xs">Settings</span> */}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px]" align="end" sideOffset={8}>
        <div className="space-y-4">
          <h4 className="font-medium text-base leading-none">Settings</h4>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="ai-input-default" className="text-xs">
                Input
              </Label>
              <p className="text-xs text-muted-foreground">
                Show input by default
              </p>
            </div>
            <Switch
              id="ai-input-default"
              checked={settings.defaultAIInputOpen}
              onCheckedChange={(checked) =>
                handleSwitchChange(checked, "defaultAIInputOpen")
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="auto-remove-completed" className="text-xs">
                Auto Remove
              </Label>
              <p className="text-xs text-muted-foreground">
                Automatically remove completed tasks
              </p>
            </div>
            <Switch
              id="auto-remove-completed"
              checked={settings.autoRemoveCompleted}
              onCheckedChange={(checked) =>
                handleSwitchChange(checked, "autoRemoveCompleted")
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="default-priority" className="text-xs">
                Default Priority
              </Label>
              <p className="text-xs text-muted-foreground">
                Default priority for new tasks
              </p>
            </div>
            <Select
              value={settings.defaultPriority || "none"}
              onValueChange={(value) =>
                handleSelectChange(value, "defaultPriority")
              }
            >
              <SelectTrigger className="max-w-[95px] w-full cursor-pointer h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem
                  value="none"
                  className="cursor-pointer hover:bg-accent/30"
                >
                  None
                </SelectItem>
                <SelectItem
                  value="high"
                  className="cursor-pointer hover:bg-accent/30"
                >
                  High
                </SelectItem>
                <SelectItem
                  value="medium"
                  className="cursor-pointer hover:bg-accent/30"
                >
                  Medium
                </SelectItem>
                <SelectItem
                  value="low"
                  className="cursor-pointer hover:bg-accent/30"
                >
                  Low
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="default-sort" className="text-xs">
                Default Sort
              </Label>
              <p className="text-xs text-muted-foreground">
                Preferred task sorting order
              </p>
            </div>
            <Select
              value={settings.defaultSortBy}
              onValueChange={(value) =>
                handleSelectChange(value, "defaultSortBy")
              }
            >
              <SelectTrigger className="max-w-[95px] w-full cursor-pointer h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem
                  value="newest"
                  className="cursor-pointer hover:bg-accent/30"
                >
                  Newest
                </SelectItem>
                <SelectItem
                  value="oldest"
                  className="cursor-pointer hover:bg-accent/30"
                >
                  Oldest
                </SelectItem>
                <SelectItem
                  value="priority"
                  className="cursor-pointer hover:bg-accent/30"
                >
                  Priority
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
