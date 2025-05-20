"use client";

import { determineAction } from "@/app/actions";
import {
  SettingsPopover,
  type UserSettings,
  defaultSettings,
} from "@/components/settings-popover";
import Task from "@/components/task";
import AiInput from "@/components/ui/ai-input";
import { Button } from "@/components/ui/button";
import { FileInput } from "@/components/ui/file-input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useIndexedDB, useMediaQuery, useGoogleCalendar } from "@/hooks";
import { cn } from "@/lib/utils";
import { serializeTask } from "@/lib/utils/task";
import type { SortOption, TaskItem } from "@/types";
import {
  ArrowsClockwise,
  FileArrowDown,
  FileArrowUp,
} from "@phosphor-icons/react";
import { format } from "date-fns";
import { AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "sonner";
import Link from "next/link";
import GoogleCalendarSync from "@/components/google-calendar-sync";

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
  const [userSettings, setUserSettings] =
    useState<UserSettings>(defaultSettings);
  const [currentSelectedDate, setCurrentSelectedDate] = useState(new Date());
  const {
    isSignedIn,
    hasGoogleConnected,
    createEvent,
    updateEvent,
    deleteEvent,
  } = useGoogleCalendar();

  useEffect(() => {
    if (userSettings.defaultAIInputOpen) {
      setIsInputVisible(true);
    } else if (!isMobile) {
      setIsInputVisible(false);
    }
  }, [userSettings.defaultAIInputOpen, isMobile]);

  useEffect(() => {
    setSortBy(userSettings.defaultSortBy);
  }, [userSettings.defaultSortBy]);

  useHotkeys("meta+k, ctrl+k", (e) => {
    e.preventDefault();
    setIsInputVisible((prev) => !prev);
  });

  const handleClose = useCallback(() => setIsInputVisible(false), []);

  const handleSettingsChange = useCallback((settings: UserSettings) => {
    setUserSettings(settings);
  }, []);

  const handleExport = useCallback(async () => {
    try {
      const result = await exportData();
      toast.success(result.message);
    } catch (error) {
      toast.error("Failed to export data", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
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
        toast.error("Failed to import data", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setSyncOpen(false);
      }
    },
    [importData]
  );

  const processActions = useCallback(
    async (actions: any[], text: string, selectedDate: Date) => {
      let newTasks = [...tasks];

      await Promise.all(
        actions.map(async (action) => {
          switch (action.action) {
            case "add": {
              let taskDate = selectedDate;
              if (action.targetDate) {
                taskDate = new Date(action.targetDate);
              }
              const newTask = serializeTask({
                id: Math.random().toString(36).substring(7),
                text: action.text || text,
                completed: false,
                date: taskDate,
                scheduled_time: action.scheduled_time,
                priority: action.priority || userSettings.defaultPriority,
              });

              // Sync with Google Calendar if enabled
              if (
                userSettings.syncWithGoogleCalendar &&
                isSignedIn &&
                hasGoogleConnected()
              ) {
                const eventId = await createEvent(newTask);
                if (eventId) {
                  newTask.gcalEventId = eventId;
                  newTask.syncedWithGCal = true;
                }
              }

              newTasks.push(newTask);
              break;
            }

            case "delete":
              if (action.taskId) {
                const taskToDelete = newTasks.find(
                  (task) => task.id === action.taskId
                );
                if (
                  taskToDelete &&
                  taskToDelete.gcalEventId &&
                  userSettings.syncWithGoogleCalendar
                ) {
                  await deleteEvent(taskToDelete.gcalEventId);
                }
                newTasks = newTasks.filter((task) => task.id !== action.taskId);
              }
              break;

            case "mark":
              if (action.taskId) {
                newTasks = newTasks.map((task) => {
                  if (task.id === action.taskId) {
                    const completed =
                      action.status === "complete"
                        ? true
                        : action.status === "incomplete"
                        ? false
                        : !task.completed;

                    return { ...task, completed };
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
                    const updatedTask = serializeTask({
                      ...task,
                      text: action.text || task.text,
                      date: action.targetDate
                        ? new Date(action.targetDate)
                        : task.date,
                      scheduled_time:
                        action.scheduled_time || task.scheduled_time,
                      // Only update priority if explicitly provided in the action
                      priority:
                        action.priority !== undefined
                          ? action.priority
                          : task.priority,
                    });

                    // Update task in Google Calendar if synced
                    if (
                      task.gcalEventId &&
                      userSettings.syncWithGoogleCalendar
                    ) {
                      updateEvent(updatedTask, task.gcalEventId);
                    }

                    return updatedTask;
                  }
                  return task;
                });
              }
              break;

            case "clear":
              if (action.listToClear) {
                const dateStr = format(selectedDate, "yyyy-MM-dd");
                let tasksToRemove: TaskItem[] = [];

                switch (action.listToClear) {
                  case "all":
                    tasksToRemove = tasks.filter(
                      (task) => format(task.date, "yyyy-MM-dd") === dateStr
                    );
                    newTasks = tasks.filter(
                      (task) => format(task.date, "yyyy-MM-dd") !== dateStr
                    );
                    break;
                  case "completed":
                    tasksToRemove = tasks.filter(
                      (task) =>
                        task.completed &&
                        format(task.date, "yyyy-MM-dd") === dateStr
                    );
                    newTasks = tasks.filter(
                      (task) =>
                        !(
                          task.completed &&
                          format(task.date, "yyyy-MM-dd") === dateStr
                        )
                    );
                    break;
                  case "incomplete":
                    tasksToRemove = tasks.filter(
                      (task) =>
                        !task.completed &&
                        format(task.date, "yyyy-MM-dd") === dateStr
                    );
                    newTasks = tasks.filter(
                      (task) =>
                        !(
                          !task.completed &&
                          format(task.date, "yyyy-MM-dd") === dateStr
                        )
                    );
                    break;
                }

                // Delete Google Calendar events for removed tasks
                if (userSettings.syncWithGoogleCalendar) {
                  for (const task of tasksToRemove) {
                    if (task.gcalEventId) {
                      await deleteEvent(task.gcalEventId);
                    }
                  }
                }
              }
              break;

            case "export":
              handleExport();
              break;
          }
        })
      );

      return newTasks;
    },
    [
      tasks,
      handleExport,
      userSettings.defaultPriority,
      isSignedIn,
      hasGoogleConnected,
      createEvent,
      updateEvent,
      deleteEvent,
      userSettings,
    ]
  );

  const handleSubmit = useCallback(
    async (text: string, onComplete?: () => void) => {
      if (!text.trim()) return;

      try {
        if (!userSettings.aiEnabled) {
          const newTask = serializeTask({
            id: Math.random().toString(36).substring(7),
            text,
            completed: false,
            date: currentSelectedDate,
            priority: userSettings.defaultPriority,
          });

          // Sync with Google Calendar if enabled
          if (
            userSettings.syncWithGoogleCalendar &&
            isSignedIn &&
            hasGoogleConnected()
          ) {
            const eventId = await createEvent(newTask);
            if (eventId) {
              newTask.gcalEventId = eventId;
              newTask.syncedWithGCal = true;
            }
          }

          setTasks([...tasks, newTask]);

          toast.success("Task created", {
            duration: 2000,
          });

          onComplete?.();
          return;
        }

        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const { actions } = await determineAction(
          text,
          tasks,
          "llama-3.3",
          timezone
        );
        const newTasks = await processActions(
          actions,
          text,
          currentSelectedDate
        );
        setTasks(newTasks);

        if (actions.length > 0) {
          actions.forEach((action) => {
            if (action.action === "add") {
              toast.success("Task created", {
                description: action.text || text,
                duration: 2000,
              });
            }
          });
        }
        onComplete?.();
      } catch (error) {
        console.error("AI Action failed:", error);
        const newTask = serializeTask({
          id: Math.random().toString(36).substring(7),
          text,
          completed: false,
          date: currentSelectedDate,
          priority: userSettings.defaultPriority,
        });

        // Sync with Google Calendar if enabled
        if (
          userSettings.syncWithGoogleCalendar &&
          isSignedIn &&
          hasGoogleConnected()
        ) {
          const eventId = await createEvent(newTask);
          if (eventId) {
            newTask.gcalEventId = eventId;
            newTask.syncedWithGCal = true;
          }
        }

        setTasks([...tasks, newTask]);

        toast.success("Task created", {
          duration: 2000,
        });
        onComplete?.();
      }
    },
    [
      tasks,
      processActions,
      setTasks,
      userSettings.defaultPriority,
      userSettings.aiEnabled,
      userSettings.syncWithGoogleCalendar,
      isSignedIn,
      hasGoogleConnected,
      createEvent,
      currentSelectedDate,
    ]
  );

  return (
    <main className="flex flex-col w-full h-full mx-auto bg-neutral-900">
      <div className="fixed z-40 flex gap-2 top-5 right-5">
        <Popover open={syncOpen} onOpenChange={setSyncOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              data-sync-trigger
              className="px-2 bg-transparent border-0 shadow-none h-9 hover:cursor-pointer hover:bg-accent/30 hover:text-accent-foreground dark:text-neutral-400 dark:hover:text-foreground"
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
            className="w-[240px] p-0 border-border/40 bg-neutral-800/90 dark:bg-neutral-800/90 shadow-md"
            align="end"
            sideOffset={8}
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
        <SettingsPopover
          onSettingsChange={handleSettingsChange}
          isMobile={isMobile}
        />
      </div>
      <div
        className={`flex-1 w-full max-w-md mx-auto px-4 pt-3 ${
          isInputVisible ? "pb-[130px]" : "pb-6"
        } bg-neutral-900 overflow-hidden`}
      >
        <Task
          initialTasks={tasks}
          setTasks={(updatedTasks) => {
            // If it's a function update, apply autoRemoveCompleted to the result
            if (typeof updatedTasks === "function") {
              setTasks((prevTasks) => {
                const newTasks = updatedTasks(prevTasks);

                // Auto-remove completed tasks if the setting is enabled
                if (userSettings.autoRemoveCompleted) {
                  const tasksToRemove = newTasks.filter(
                    (task) => task.completed
                  );

                  // Delete associated Google Calendar events
                  if (userSettings.syncWithGoogleCalendar) {
                    tasksToRemove.forEach((task) => {
                      if (task.gcalEventId) {
                        deleteEvent(task.gcalEventId);
                      }
                    });
                  }

                  return newTasks.filter((task) => !task.completed);
                } else {
                  return newTasks;
                }
              });
            } else {
              // If it's a direct value update, apply autoRemoveCompleted directly
              if (userSettings.autoRemoveCompleted) {
                const tasksToRemove = updatedTasks.filter(
                  (task) => task.completed
                );

                // Delete associated Google Calendar events
                if (userSettings.syncWithGoogleCalendar) {
                  tasksToRemove.forEach((task) => {
                    if (task.gcalEventId) {
                      deleteEvent(task.gcalEventId);
                    }
                  });
                }

                setTasks(updatedTasks.filter((task) => !task.completed));
              } else {
                setTasks(updatedTasks);
              }
            }
          }}
          sortBy={sortBy}
          defaultViewMode={userSettings.defaultViewMode}
          isMobile={isMobile}
          pendingIndicator={userSettings.pendingEnabled}
          onDateChange={setCurrentSelectedDate}
        />
      </div>
      <AnimatePresence>
        {(isInputVisible || isMobile) && (
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 shadow-lg bg-neutral-900"
            ref={inputRef}
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <div className="max-w-md pb-6 mx-auto">
              <AiInput
                placeholder={"What's next?"}
                minHeight={50}
                onClose={handleClose}
                onSubmit={handleSubmit}
                isMobile={isMobile}
                aiDisabled={!userSettings.aiEnabled}
                className={userSettings.aiEnabled ? "" : "ai-disabled"}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <footer className="w-full py-3 mt-auto text-xs text-center text-neutral-500 dark:text-neutral-600">
        <Link
          href="/privacy-policy"
          className="transition-colors hover:text-neutral-400"
        >
          Privacy Policy
        </Link>
      </footer>
    </main>
  );
}
export default HomePage;
