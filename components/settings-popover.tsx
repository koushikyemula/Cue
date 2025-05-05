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

export interface UserSettings {
  defaultAIInputOpen: boolean;
}

const defaultSettings: UserSettings = {
  defaultAIInputOpen: false,
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
    (checked: boolean) => {
      setSettings({
        ...settings,
        defaultAIInputOpen: checked,
      });
    },
    [settings, setSettings]
  );

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
  }, []);

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
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
      <PopoverContent className="w-[270px]" align="end" sideOffset={8}>
        <div className="space-y-4">
          <h4 className="font-medium text-base leading-none">Settings</h4>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="ai-input-default" className="text-xs">
                Default AI Input Open
              </Label>
              <p className="text-xs text-muted-foreground">
                Show AI input by default
              </p>
            </div>
            <Switch
              id="ai-input-default"
              checked={settings.defaultAIInputOpen}
              onCheckedChange={handleSwitchChange}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
