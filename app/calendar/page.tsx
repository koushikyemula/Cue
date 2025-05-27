"use client";

import { SettingsPopover } from "@/components/settings-button";
import { SyncPopover } from "@/components/sync-button";
import { TaskContextMenu } from "@/components/task-context-menu";
import { TaskDialog } from "@/components/task-dialog";
import AiInput from "@/components/ui/ai-input";
import { Button } from "@/components/ui/button";
import { formatTimeDisplay } from "@/components/ui/time-picker";
import { useGoogleCalendar, useMediaQuery } from "@/hooks";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/settings-store";
import { useTaskStoreWithPersistence } from "@/stores/task-store";
import type { TaskItem } from "@/types";
import { CaretLeft, CaretRight, Plus } from "@phosphor-icons/react";
import {
  add,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isEqual,
  isSameDay,
  isSameMonth,
  isToday,
  parse,
  startOfToday,
  startOfWeek,
} from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

interface CalendarEvent {
  id: string;
  name: string;
  time: string;
  datetime: string;
  priority?: "high" | "medium" | "low";
}

interface CalendarData {
  day: Date;
  events: CalendarEvent[];
}

const colStartClasses = [
  "",
  "col-start-2",
  "col-start-3",
  "col-start-4",
  "col-start-5",
  "col-start-6",
  "col-start-7",
];

export const getPriorityColor = (priority?: string) => {
  switch (priority) {
    case "high":
      return "bg-red-500/20 border-red-500/30";
    case "medium":
      return "bg-yellow-500/20 border-yellow-500/30";
    case "low":
      return "bg-green-500/20 border-green-500/30";
    default:
      return "bg-neutral-700/50 border-neutral-600/50";
  }
};

function CalendarPage() {
  const [isInputVisible, setIsInputVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState(startOfToday());
  const [currentMonth, setCurrentMonth] = useState(
    format(startOfToday(), "MMM-yyyy")
  );
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  const isMobile = useMediaQuery("(max-width: 768px)");
  const { tasks, updateTask, deleteTask, toggleTask, processAIActions } =
    useTaskStoreWithPersistence();
  const { settings } = useSettingsStore();
  const {
    isSignedIn,
    hasGoogleConnected,
    createEvent,
    updateEvent,
    deleteEvent,
  } = useGoogleCalendar();

  const today = startOfToday();
  const firstDayCurrentMonth = parse(currentMonth, "MMM-yyyy", new Date());

  const days = eachDayOfInterval({
    start: startOfWeek(firstDayCurrentMonth),
    end: endOfWeek(endOfMonth(firstDayCurrentMonth)),
  });

  const calendarData: CalendarData[] = days.map((day) => ({
    day,
    events: tasks
      .filter((task) => isSameDay(task.date, day))
      .map((task) => ({
        id: task.id,
        name: task.text,
        time: task.scheduled_time
          ? formatTimeDisplay(task.scheduled_time)
          : "All day",
        datetime: format(task.date, "yyyy-MM-dd"),
        priority: task.priority,
      })),
  }));

  useHotkeys("meta+k, ctrl+k", (e) => {
    e.preventDefault();
    setIsInputVisible((prev) => !prev);
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        if (e.key === "[" || e.code === "BracketLeft") {
          e.preventDefault();
          setCurrentMonth(
            format(addMonths(firstDayCurrentMonth, -1), "MMM-yyyy")
          );
        }

        if (e.key === "]" || e.code === "BracketRight") {
          e.preventDefault();
          setCurrentMonth(
            format(addMonths(firstDayCurrentMonth, 1), "MMM-yyyy")
          );
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [firstDayCurrentMonth]);

  const handleClose = () => setIsInputVisible(false);

  const handleSubmit = async (text: string, onComplete?: () => void) => {
    if (!text.trim()) return;

    try {
      await processAIActions(text, selectedDay, settings, {
        isSignedIn,
        hasGoogleConnected,
        createEvent,
        updateEvent,
        deleteEvent,
      });
      onComplete?.();
    } catch (error) {
      console.error("Failed to process task input:", error);
      onComplete?.();
    }
  };

  function previousMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: -1 });
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"));
  }

  function nextMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: 1 });
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"));
  }

  function goToToday() {
    setCurrentMonth(format(today, "MMM-yyyy"));
    setSelectedDay(today);
  }

  const handleTaskClick = useCallback(
    (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        setSelectedTask(task);
        setTaskDialogOpen(true);
      }
    },
    [tasks]
  );

  const handleTaskSave = useCallback(
    async (updatedTask: TaskItem) => {
      await updateTask(updatedTask.id, {
        ...updatedTask,
        updated_at: new Date(),
      });
    },
    [updateTask]
  );

  const handleTaskDelete = useCallback(
    async (taskId: string) => {
      const taskToDelete = tasks.find((task) => task.id === taskId);

      // Delete from Google Calendar if synced
      if (
        taskToDelete?.gcalEventId &&
        settings.syncWithGoogleCalendar &&
        isSignedIn &&
        hasGoogleConnected()
      ) {
        await deleteEvent(taskToDelete.gcalEventId);
      }

      await deleteTask(taskId);
    },
    [
      tasks,
      settings.syncWithGoogleCalendar,
      isSignedIn,
      hasGoogleConnected,
      deleteEvent,
      deleteTask,
    ]
  );

  const handleTaskToggleComplete = useCallback(
    async (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      if (settings.autoRemoveCompleted && !task.completed) {
        await handleTaskDelete(taskId);
      } else {
        const updatedTask = {
          ...task,
          completed: !task.completed,
          updated_at: new Date(),
        };

        // Update Google Calendar if synced
        if (
          task.gcalEventId &&
          settings.syncWithGoogleCalendar &&
          isSignedIn &&
          hasGoogleConnected()
        ) {
          updateEvent(updatedTask, task.gcalEventId);
        }

        await toggleTask(taskId);
      }
    },
    [
      tasks,
      settings.autoRemoveCompleted,
      settings.syncWithGoogleCalendar,
      isSignedIn,
      hasGoogleConnected,
      updateEvent,
      toggleTask,
      handleTaskDelete,
    ]
  );

  return (
    <main className="flex flex-col w-full h-full mx-auto bg-neutral-900">
      <div className="flex flex-col space-y-4 p-4 md:flex-row md:items-center md:justify-between md:space-y-0 border-b border-neutral-800/40">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h2 className="text-lg font-medium text-foreground">
              {format(firstDayCurrentMonth, "MMMM yyyy")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {format(firstDayCurrentMonth, "MMM d")} -{" "}
              {format(endOfMonth(firstDayCurrentMonth), "MMM d, yyyy")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="inline-flex -space-x-px rounded-md border border-neutral-800">
            <Button
              onClick={previousMonth}
              className="rounded-none cursor-pointer shadow-none first:rounded-l-md last:rounded-r-md focus-visible:z-10 bg-transparent border-0 hover:bg-neutral-800"
              variant="outline"
              size="icon"
              aria-label="Previous month"
            >
              <CaretLeft size={16} />
            </Button>
            <Button
              onClick={goToToday}
              className="rounded-none cursor-pointer shadow-none first:rounded-l-md last:rounded-r-md focus-visible:z-10 bg-transparent border-0 hover:bg-neutral-800 px-4"
              variant="outline"
            >
              Today
            </Button>
            <Button
              onClick={nextMonth}
              className="rounded-none cursor-pointer shadow-none first:rounded-l-md last:rounded-r-md focus-visible:z-10 bg-transparent border-0 hover:bg-neutral-800"
              variant="outline"
              size="icon"
              aria-label="Next month"
            >
              <CaretRight size={16} />
            </Button>
          </div>
          <Button
            onClick={() => setIsInputVisible(true)}
            variant="outline"
            className="gap-2 cursor-pointer bg-neutral-800/50 hover:bg-neutral-700/50 border-neutral-700/50 text-neutral-200 transition-colors"
          >
            <Plus size={16} weight="bold" className="text-neutral-300" />
            <span className="flex items-center gap-1.5 -mr-1">
              New Task
              <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400 bg-neutral-900/50 border border-neutral-700/50 rounded">
                ⌘K
              </kbd>
            </span>
          </Button>
          <div className="flex gap-2">
            <SyncPopover />
            <SettingsPopover isMobile={isMobile} />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="grid grid-cols-7 border-b border-neutral-800/40 text-center text-xs font-medium leading-6">
          <div className="border-r border-neutral-800/40 py-3 text-neutral-400">
            Sun
          </div>
          <div className="border-r border-neutral-800/40 py-3 text-neutral-400">
            Mon
          </div>
          <div className="border-r border-neutral-800/40 py-3 text-neutral-400">
            Tue
          </div>
          <div className="border-r border-neutral-800/40 py-3 text-neutral-400">
            Wed
          </div>
          <div className="border-r border-neutral-800/40 py-3 text-neutral-400">
            Thu
          </div>
          <div className="border-r border-neutral-800/40 py-3 text-neutral-400">
            Fri
          </div>
          <div className="py-3 text-neutral-400">Sat</div>
        </div>
        <div className="flex-1 grid grid-cols-7 grid-rows-5">
          {days.map((day, dayIdx) => {
            const dayEvents =
              calendarData.find((d) => isSameDay(d.day, day))?.events || [];
            return (
              <div
                key={dayIdx}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  dayIdx === 0 && colStartClasses[getDay(day)],
                  !isSameMonth(day, firstDayCurrentMonth) &&
                    "bg-neutral-900/50 text-neutral-600",
                  "relative flex flex-col border-b border-r border-neutral-800/40 hover:bg-neutral-800/30 cursor-pointer transition-colors h-full max-h-[160px] overflow-hidden",
                  isEqual(day, selectedDay) &&
                    "bg-neutral-800/50 ring-1 ring-neutral-700"
                )}
              >
                <header className="flex items-center justify-between p-2 pb-1">
                  <button
                    type="button"
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs transition-colors",
                      isEqual(day, selectedDay) &&
                        isToday(day) &&
                        "bg-white text-black",
                      isEqual(day, selectedDay) &&
                        !isToday(day) &&
                        "bg-neutral-700 text-white",
                      !isEqual(day, selectedDay) &&
                        isToday(day) &&
                        "bg-neutral-700 text-white",
                      !isEqual(day, selectedDay) &&
                        !isToday(day) &&
                        "hover:bg-neutral-800",
                      !isSameMonth(day, firstDayCurrentMonth) &&
                        "text-neutral-600"
                    )}
                  >
                    <time dateTime={format(day, "yyyy-MM-dd")}>
                      {format(day, "d")}
                    </time>
                  </button>
                </header>

                <div className="flex-1 px-2 pt-0 space-y-1">
                  {dayEvents.slice(0, 3).map((event) => {
                    const task = tasks.find((t) => t.id === event.id);
                    if (!task) return null;

                    return (
                      <TaskContextMenu
                        key={event.id}
                        task={task}
                        onEdit={() => handleTaskClick(event.id)}
                        onDelete={() => handleTaskDelete(event.id)}
                        onToggleComplete={() =>
                          handleTaskToggleComplete(event.id)
                        }
                      >
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTaskClick(event.id);
                          }}
                          className={cn(
                            "text-xs p-1.5 border truncate cursor-pointer hover:opacity-80 transition-all duration-200 hover:scale-[1.02]",
                            getPriorityColor(event.priority),
                            task.completed && "opacity-60 line-through"
                          )}
                        >
                          <p className="font-medium text-white truncate">
                            {event.name}
                          </p>
                          {event.time !== "All day" && (
                            <p className="text-neutral-300 text-[10px]">
                              {event.time}
                            </p>
                          )}
                        </div>
                      </TaskContextMenu>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-neutral-400 px-1.5">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Input Overlay */}
      <AnimatePresence>
        {isInputVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center backdrop-blur-sm"
            onClick={handleClose}
          >
            <div
              className="w-full max-w-lg mb-8"
              onClick={(e) => e.stopPropagation()}
            >
              <AiInput
                placeholder={`Add task for ${format(
                  selectedDay,
                  "MMM d, yyyy"
                )}...`}
                minHeight={48}
                onSubmit={(text) =>
                  handleSubmit(text, () => setIsInputVisible(false))
                }
                onClose={handleClose}
                isMobile={isMobile}
                aiDisabled={!settings.aiEnabled}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <TaskDialog
        task={selectedTask}
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        onSave={handleTaskSave}
        onDelete={handleTaskDelete}
        onToggleComplete={handleTaskToggleComplete}
      />
    </main>
  );
}

export default CalendarPage;
