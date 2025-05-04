"use client";

import { determineAction } from "@/app/actions";
import Task from "@/components/task";
import { AIInput } from "@/components/ui/ai-input";
import { Button } from "@/components/ui/button";
import { FileInput } from "@/components/ui/file-input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useIndexedDB } from "@/hooks";
import { serializeTask } from "@/lib/utils/task";
import { SortOption, TaskItem } from "@/types";
import { CloudArrowDown, CloudArrowUp } from "@phosphor-icons/react";
import { format } from "date-fns";
import { AnimatePresence } from "framer-motion";
import { CloudFog } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/use-media-query";

function HomePage() {
  const [isInputVisible, setIsInputVisible] = useState(false);
  const [tasks, setTasks, exportData, importData] = useIndexedDB<TaskItem[]>(
    "tasks",
    []
  );
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const inputRef = useRef<HTMLDivElement>(null);
  const [syncOpen, setSyncOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  useHotkeys("meta+k, ctrl+k", (e) => {
    e.preventDefault();
    setIsInputVisible((prev) => !prev);
  });

  const handleClose = useCallback(() => setIsInputVisible(false), []);

  const handleExport = useCallback(async () => {
    try {
      const result = await exportData();
      toast.success(result.message);
    } catch (error) {
      toast.error("Failed to export data");
    } finally {
      setSyncOpen(false);
    }
  }, [exportData]);

  const handleImport = useCallback(
    async (file: File) => {
      try {
        const result = await importData(file);
        toast.success(result.message);
      } catch (error) {
        toast.error("Failed to import data");
      } finally {
        setSyncOpen(false);
      }
    },
    [importData]
  );

  const processActions = useCallback(
    (actions: any[], text: string, selectedDate: Date) => {
      let newTasks = [...tasks];

      actions.forEach((action) => {
        switch (action.action) {
          case "add": {
            let taskDate = selectedDate;
            if (action.targetDate) {
              taskDate = new Date(action.targetDate);
            }
            newTasks.push(
              serializeTask({
                id: Math.random().toString(36).substring(7),
                text: action.text || text,
                completed: false,
                date: taskDate,
                scheduled_time: action.time,
                priority: action.priority,
              })
            );
            break;
          }

          case "delete":
            if (action.taskId) {
              newTasks = newTasks.filter((task) => task.id !== action.taskId);
            }
            break;

          case "mark":
            if (action.taskId) {
              newTasks = newTasks.map((task) => {
                if (task.id === action.taskId) {
                  if (action.status === "complete") {
                    return { ...task, completed: true };
                  } else if (action.status === "incomplete") {
                    return { ...task, completed: false };
                  } else {
                    return { ...task, completed: !task.completed };
                  }
                }
                return task;
              });
            }
            break;

          case "sort":
            if (action.sortBy) {
              setSortBy(action.sortBy);
            }
            break;

          case "edit":
            if (action.taskId) {
              newTasks = newTasks.map((task) => {
                if (task.id === action.taskId) {
                  const updatedTask = {
                    ...task,
                    text: action.text || task.text,
                    date: action.targetDate
                      ? new Date(action.targetDate)
                      : task.date,
                  };

                  // Only update priority if explicitly provided in the action
                  if (action.priority !== undefined) {
                    updatedTask.priority = action.priority;
                  }

                  return serializeTask(updatedTask);
                }
                return task;
              });
            }
            break;

          case "clear":
            if (action.listToClear) {
              const dateStr = format(selectedDate, "yyyy-MM-dd");
              switch (action.listToClear) {
                case "all":
                  newTasks = tasks.filter(
                    (task) => format(task.date, "yyyy-MM-dd") !== dateStr
                  );
                  break;
                case "completed":
                  newTasks = tasks.filter(
                    (task) =>
                      !(
                        task.completed &&
                        format(task.date, "yyyy-MM-dd") === dateStr
                      )
                  );
                  break;
                case "incomplete":
                  newTasks = tasks.filter(
                    (task) =>
                      !(
                        !task.completed &&
                        format(task.date, "yyyy-MM-dd") === dateStr
                      )
                  );
                  break;
              }
            }
            break;

          case "export":
            handleExport();
            break;
        }
      });

      return newTasks;
    },
    [tasks, handleExport]
  );

  const handleSubmit = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      try {
        const selectedDate = new Date();
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const { actions } = await determineAction(
          text,
          tasks,
          "llama-3.3",
          timezone
        );

        const newTasks = processActions(actions, text, selectedDate);
        setTasks(newTasks);

        // Add toast notifications based on actions performed
        if (actions.length > 0) {
          actions.forEach((action) => {
            switch (action.action) {
              case "add":
                toast.success("Task created", {
                  description: action.text || text,
                  duration: 2000,
                });
                break;
              case "delete":
                toast.success("Task deleted", {
                  duration: 2000,
                });
                break;
              case "mark":
                toast.success(
                  `Task marked ${
                    action.status === "complete" ? "complete" : "incomplete"
                  }`,
                  {
                    duration: 2000,
                  }
                );
                break;
              case "edit":
                toast.success("Task updated", {
                  duration: 2000,
                });
                break;
              case "clear":
                toast.success(`Cleared ${action.listToClear} tasks`, {
                  duration: 2000,
                });
                break;
              case "sort":
                toast.success(`Sorted by ${action.sortBy}`, {
                  duration: 2000,
                });
                break;
            }
          });
        }
      } catch (error) {
        console.error("AI Action failed:", error);
        setTasks([
          ...tasks,
          serializeTask({
            id: Math.random().toString(36).substring(7),
            text,
            completed: false,
            date: new Date(),
          }),
        ]);

        toast.success("Task created", {
          description: text,
          duration: 2000,
        });
      }
    },
    [tasks, processActions, setTasks]
  );

  return (
    <main className="h-full w-full flex flex-col mx-auto">
      <div className="fixed top-5 right-5 z-40">
        <Popover open={syncOpen} onOpenChange={setSyncOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 border-0 hover:cursor-pointer shadow-none bg-transparent hover:bg-accent/30 hover:text-accent-foreground dark:text-neutral-400 dark:hover:text-foreground"
            >
              <CloudFog className="h-4 w-4" />
              <span className="text-xs">Sync</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[220px] p-0 border-border/40 bg-neutral-900 dark:bg-neutral-900/90 shadow-md"
            align="end"
            sideOffset={8}
          >
            <div className="flex flex-col">
              <div className="px-3 pt-3 pb-2">
                <h3 className="text-sm font-medium">Data Sync</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Backup or restore your tasks
                </p>
              </div>
              <div className="border-t px-1 py-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExport}
                  className="w-full justify-start text-xs hover:cursor-pointer h-8 gap-2 px-2 font-normal text-neutral-300 hover:text-white hover:bg-neutral-800/60"
                >
                  <CloudArrowDown weight="light" className="h-3.5 w-3.5" />
                  Export tasks as JSON
                </Button>
                <FileInput onFileSelect={handleImport} accept=".json">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start hover:cursor-pointer text-xs h-8 gap-2 px-2 font-normal text-neutral-300 hover:text-white hover:bg-neutral-800/60"
                  >
                    <CloudArrowUp weight="light" className="h-3.5 w-3.5" />
                    Import from JSON file
                  </Button>
                </FileInput>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex-1 w-full max-w-md mx-auto px-4 pt-5">
        <Task
          initialTasks={tasks}
          setTasks={setTasks}
          sortBy={sortBy}
          isInputVisible={isInputVisible}
          onInputClose={handleClose}
          onInputSubmit={handleSubmit}
        />
      </div>
      <div className="fixed bottom-0 left-0 right-0" ref={inputRef}>
        <div className="max-w-md mx-auto pb-12">
          <AnimatePresence>
            {isInputVisible && !isMobile && (
              <AIInput
                placeholder="Enter your task here..."
                minHeight={50}
                onClose={handleClose}
                onSubmit={handleSubmit}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
export default HomePage;
