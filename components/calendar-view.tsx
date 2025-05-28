"use client";

import { SettingsPopover } from "@/components/settings-button";
import { SyncPopover } from "@/components/sync-button";
import { TaskDetailPopover } from "@/components/task-detail-popover";
import { TaskEditDialog } from "@/components/task-edit-dialog";
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
  addDays,
  addWeeks,
  eachDayOfInterval,
  eachHourOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isEqual,
  isSameDay,
  isSameMonth,
  isToday,
  parse,
  startOfDay,
  startOfToday,
  startOfWeek,
} from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Calendar,
  CalendarDays,
  CalendarRange,
} from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";

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

type ViewMode = "month" | "week" | "day";

interface CalendarViewProps {
  onDateChange?: (date: Date) => void;
}

const colStartClasses = [
  "",
  "col-start-2",
  "col-start-3",
  "col-start-4",
  "col-start-5",
  "col-start-6",
  "col-start-7",
] as const;

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const getPriorityColor = (priority?: string): string => {
  switch (priority) {
    case "high":
      return "bg-red-500/20 border-red-500/50 text-red-400";
    case "medium":
      return "bg-orange-500/20 border-orange-500/50 text-orange-400";
    case "low":
      return "bg-blue-500/20 border-blue-500/50 text-blue-400";
    default:
      return "bg-neutral-500/20 border-neutral-500/50 text-neutral-400";
  }
};

const TaskEvent = memo<{
  event: CalendarEvent;
  task: TaskItem;
  index: number;
  isPastDue: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleComplete: () => void;
}>(({ event, task, index, isPastDue, onEdit, onDelete, onToggleComplete }) => (
  <TaskDetailPopover
    task={task}
    onEdit={onEdit}
    onDelete={onDelete}
    onToggleComplete={onToggleComplete}
  >
    <motion.div
      initial={{ opacity: 0, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.15,
        delay: index * 0.03,
        ease: "easeOut",
      }}
      className={cn(
        "text-xs p-2 border truncate cursor-pointer hover:opacity-90 transition-all duration-200 hover:scale-[1.01] rounded-md shadow-sm backdrop-blur-sm",
        getPriorityColor(event.priority),
        task.completed && "opacity-60 line-through"
      )}
    >
      <p className="font-medium text-white truncate leading-tight text-[11px]">
        {event.name}
      </p>
      {(event.time !== "All day" || isPastDue) && (
        <div className="flex items-center gap-1.5 mt-1">
          {event.time !== "All day" && (
            <span className="text-neutral-300 text-[9px] font-medium bg-neutral-900/40 px-1 py-0.5 rounded">
              {event.time}
            </span>
          )}
          {isPastDue && (
            <div className="flex items-center gap-1">
              <AlertCircle className="w-2.5 h-2.5 text-yellow-500" />
              <span className="text-yellow-500 text-[9px] font-medium">
                Pending
              </span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  </TaskDetailPopover>
));

TaskEvent.displayName = "TaskEvent";

function CalendarView({ onDateChange }: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [isInputVisible, setIsInputVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState(startOfToday());
  const [currentMonth, setCurrentMonth] = useState(
    format(startOfToday(), "MMM-yyyy")
  );
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const isMobile = useMediaQuery("(max-width: 768px)");
  const { tasks, updateTask, deleteTask, toggleTask, processAIActions } =
    useTaskStoreWithPersistence();
  const { settings } = useSettingsStore();
  const googleCalendar = useGoogleCalendar();

  const today = useMemo(() => startOfToday(), []);
  const firstDayCurrentMonth = useMemo(
    () => parse(currentMonth, "MMM-yyyy", new Date()),
    [currentMonth]
  );

  const calendarDays = useMemo(() => {
    return eachDayOfInterval({
      start: startOfWeek(firstDayCurrentMonth),
      end: endOfWeek(endOfMonth(firstDayCurrentMonth)),
    });
  }, [firstDayCurrentMonth]);

  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(selectedDay);
    return eachDayOfInterval({
      start: weekStart,
      end: addDays(weekStart, 6),
    });
  }, [selectedDay]);

  const dayHours = useMemo(() => {
    return eachHourOfInterval({
      start: startOfDay(selectedDay),
      end: endOfDay(selectedDay),
    });
  }, [selectedDay]);

  const calendarData = useMemo((): CalendarData[] => {
    const daysToProcess = viewMode === "month" ? calendarDays : weekDays;

    return daysToProcess.map((day) => ({
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
  }, [tasks, calendarDays, weekDays, viewMode]);

  const dayTasks = useMemo(() => {
    return tasks.filter((task) => isSameDay(task.date, selectedDay));
  }, [tasks, selectedDay]);

  const periodTitles = useMemo(() => {
    const monthTitle = format(firstDayCurrentMonth, "MMMM yyyy");
    const weekStart = startOfWeek(selectedDay);
    const weekEnd = addDays(weekStart, 6);
    const weekTitle = `${format(weekStart, "MMM d")} - ${format(
      weekEnd,
      "MMM d, yyyy"
    )}`;
    const dayTitle = format(selectedDay, "EEEE, MMMM d, yyyy");

    const monthSubtitle = `${format(firstDayCurrentMonth, "MMM d")} - ${format(
      endOfMonth(firstDayCurrentMonth),
      "MMM d, yyyy"
    )}`;

    return {
      month: { title: monthTitle, subtitle: monthSubtitle },
      week: { title: weekTitle, subtitle: "Week view" },
      day: { title: dayTitle, subtitle: "Day view" },
    };
  }, [firstDayCurrentMonth, selectedDay]);

  const isDateBeforeToday = useCallback((dateInput?: string | Date) => {
    if (!dateInput) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const taskDate =
      typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    taskDate.setHours(0, 0, 0, 0);

    return taskDate < today;
  }, []);

  const handleClose = useCallback(() => setIsInputVisible(false), []);

  const handleSubmit = useCallback(
    async (text: string, onComplete?: () => void): Promise<void> => {
      if (!text.trim()) return;

      const dateContext = format(selectedDay, "EEEE, MMMM d, yyyy");
      const enhancedText = `${text} (for ${dateContext})`;

      try {
        const result = await processAIActions(
          enhancedText,
          selectedDay,
          settings,
          googleCalendar
        );

        // Auto-close input on successful task creation
        if (result.success) {
          setIsInputVisible(false);
        }

        onComplete?.();
      } catch (error) {
        console.error("Failed to process task input:", error);
        onComplete?.();
      }
    },
    [processAIActions, selectedDay, settings, googleCalendar]
  );

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  const previousPeriod = useCallback(() => {
    if (viewMode === "month") {
      const firstDayNextMonth = add(firstDayCurrentMonth, { months: -1 });
      setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"));
    } else if (viewMode === "week") {
      setSelectedDay(addWeeks(selectedDay, -1));
    } else {
      setSelectedDay(addDays(selectedDay, -1));
    }
  }, [viewMode, firstDayCurrentMonth, selectedDay]);

  const nextPeriod = useCallback(() => {
    if (viewMode === "month") {
      const firstDayNextMonth = add(firstDayCurrentMonth, { months: 1 });
      setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"));
    } else if (viewMode === "week") {
      setSelectedDay(addWeeks(selectedDay, 1));
    } else {
      setSelectedDay(addDays(selectedDay, 1));
    }
  }, [viewMode, firstDayCurrentMonth, selectedDay]);

  const goToToday = useCallback(() => {
    setSelectedDay(today);
    setCurrentMonth(format(today, "MMM-yyyy"));
  }, [today]);

  const handleTaskEdit = useCallback(
    (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        setEditingTask(task);
        setEditDialogOpen(true);
      }
    },
    [tasks]
  );

  const handleTaskSave = useCallback(
    async (updatedTask: TaskItem) => {
      const task = tasks.find((t) => t.id === updatedTask.id);
      if (!task) return;

      if (
        settings.syncWithGoogleCalendar &&
        googleCalendar.isSignedIn &&
        googleCalendar.hasGoogleConnected() &&
        task.gcalEventId &&
        (task.text !== updatedTask.text ||
          task.scheduled_time !== updatedTask.scheduled_time ||
          task.priority !== updatedTask.priority)
      ) {
        await googleCalendar.updateEvent(updatedTask, task.gcalEventId);
      }

      await updateTask(updatedTask.id, {
        ...updatedTask,
        updated_at: new Date(),
      });
    },
    [updateTask, tasks, settings.syncWithGoogleCalendar, googleCalendar]
  );

  const handleTaskDelete = useCallback(
    async (taskId: string) => {
      const taskToDelete = tasks.find((task) => task.id === taskId);

      if (
        taskToDelete?.gcalEventId &&
        settings.syncWithGoogleCalendar &&
        googleCalendar.isSignedIn &&
        googleCalendar.hasGoogleConnected()
      ) {
        await googleCalendar.deleteEvent(taskToDelete.gcalEventId);
      }

      await deleteTask(taskId);
    },
    [tasks, settings.syncWithGoogleCalendar, googleCalendar, deleteTask]
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

        if (
          task.gcalEventId &&
          settings.syncWithGoogleCalendar &&
          googleCalendar.isSignedIn &&
          googleCalendar.hasGoogleConnected()
        ) {
          googleCalendar.updateEvent(updatedTask, task.gcalEventId);
        }

        await toggleTask(taskId);
      }
    },
    [
      tasks,
      settings.autoRemoveCompleted,
      settings.syncWithGoogleCalendar,
      googleCalendar,
      toggleTask,
      handleTaskDelete,
    ]
  );

  const handleDayClick = useCallback((day: Date) => {
    setSelectedDay(day);
  }, []);

  const handleDayDoubleClick = useCallback((day: Date) => {
    setSelectedDay(day);
    setIsInputVisible(true);
  }, []);

  useEffect(() => {
    onDateChange?.(selectedDay);
  }, [selectedDay, onDateChange]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        e.stopPropagation();
        setIsInputVisible((prev) => !prev);
      }

      if (e.altKey) {
        if (e.key === "[" || e.code === "BracketLeft") {
          e.preventDefault();
          previousPeriod();
        }

        if (e.key === "]" || e.code === "BracketRight") {
          e.preventDefault();
          nextPeriod();
        }
      }
      if (e.key === "Tab" && e.shiftKey) {
        e.preventDefault();
        if (viewMode === "month") {
          handleViewModeChange("week");
        } else if (viewMode === "week") {
          handleViewModeChange("day");
        } else {
          handleViewModeChange("month");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, previousPeriod, nextPeriod, handleViewModeChange]);

  const renderMonthView = useCallback(() => {
    return (
      <>
        <div className="sticky top-0 z-10 grid grid-cols-7 border-b border-neutral-800/40 text-center text-sm font-medium leading-6 bg-neutral-900/95 backdrop-blur-sm">
          {WEEK_DAYS.map((day) => (
            <div
              key={day}
              className="border-r border-neutral-800/40 py-4 text-neutral-400 last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-7">
            {calendarDays.map((day, dayIdx) => {
              const dayEvents =
                calendarData.find((d) => isSameDay(d.day, day))?.events || [];

              return (
                <div
                  key={day.getTime()}
                  onClick={() => handleDayClick(day)}
                  onDoubleClick={() => handleDayDoubleClick(day)}
                  className={cn(
                    dayIdx === 0 && colStartClasses[getDay(day)],
                    !isSameMonth(day, firstDayCurrentMonth) &&
                      "bg-neutral-900/50 text-neutral-600",
                    "relative flex flex-col border-b border-r border-neutral-800/40 hover:bg-neutral-800/30 cursor-pointer transition-all duration-200 ease-in-out overflow-hidden group last:border-r-0",
                    "h-[190px] max-h-[190px]",
                    isEqual(day, selectedDay) &&
                      "bg-neutral-800/50 ring-2 ring-neutral-700/50 ring-inset"
                  )}
                >
                  <header className="flex items-center justify-between p-3 pb-2.5 flex-shrink-0">
                    <button
                      type="button"
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all duration-200 hover:scale-105",
                        isEqual(day, selectedDay) &&
                          isToday(day) &&
                          "bg-white text-black shadow-md",
                        isEqual(day, selectedDay) &&
                          !isToday(day) &&
                          "bg-neutral-700 text-white shadow-md",
                        !isEqual(day, selectedDay) &&
                          isToday(day) &&
                          "bg-gradient-to-br from-neutral-700 to-neutral-600 text-white shadow-md",
                        !isEqual(day, selectedDay) &&
                          !isToday(day) &&
                          "hover:bg-neutral-800 hover:text-white",
                        !isSameMonth(day, firstDayCurrentMonth) &&
                          "text-neutral-600"
                      )}
                    >
                      <time dateTime={format(day, "yyyy-MM-dd")}>
                        {format(day, "d")}
                      </time>
                    </button>
                  </header>
                  <div className="flex-1 px-3 -mt-1 space-y-1.5 relative min-h-0 pb-3 overflow-y-auto">
                    {dayEvents.slice(0, 3).map((event, index) => {
                      const task = tasks.find((t) => t.id === event.id);
                      if (!task) return null;

                      const isPastDue =
                        settings.pendingEnabled &&
                        task.date &&
                        isDateBeforeToday(task.date) &&
                        !task.completed;

                      return (
                        <TaskEvent
                          key={event.id}
                          event={event}
                          task={task}
                          index={index}
                          isPastDue={isPastDue}
                          onEdit={() => handleTaskEdit(event.id)}
                          onDelete={() => handleTaskDelete(event.id)}
                          onToggleComplete={() =>
                            handleTaskToggleComplete(event.id)
                          }
                        />
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDay(day);
                          setViewMode("day");
                        }}
                        className="text-[10px] text-neutral-500 font-medium cursor-pointer hover:text-neutral-400 transition-colors duration-200 px-1 py-0.5"
                      >
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </>
    );
  }, [
    calendarDays,
    calendarData,
    firstDayCurrentMonth,
    selectedDay,
    tasks,
    settings.pendingEnabled,
    isDateBeforeToday,
    handleDayClick,
    handleDayDoubleClick,
    handleTaskEdit,
    handleTaskDelete,
    handleTaskToggleComplete,
  ]);

  const renderWeekView = useCallback(() => {
    return (
      <>
        <div className="sticky top-0 z-10 grid grid-cols-7 border-b border-neutral-800/40 text-center text-xs font-medium leading-6 bg-neutral-900">
          {weekDays.map((day) => (
            <div
              key={day.getTime()}
              className={cn(
                "border-r border-neutral-800/40 py-3 text-neutral-400 last:border-r-0 flex flex-col items-center gap-1",
                isToday(day) && "text-white"
              )}
            >
              <span className="text-[10px] uppercase tracking-wider">
                {format(day, "EEE")}
              </span>
              <span
                className={cn(
                  "text-sm font-medium w-6 h-6 rounded-full flex items-center justify-center",
                  isToday(day) && "bg-white text-black",
                  isEqual(day, selectedDay) &&
                    !isToday(day) &&
                    "bg-neutral-700 text-white"
                )}
              >
                {format(day, "d")}
              </span>
            </div>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-7 gap-0">
            {weekDays.map((day) => {
              const dayTasksForWeek = dayTasks.filter((task) =>
                isSameDay(task.date, day)
              );

              return (
                <div
                  key={day.getTime()}
                  onClick={() => handleDayClick(day)}
                  onDoubleClick={() => handleDayDoubleClick(day)}
                  className={cn(
                    "border-r border-neutral-800/40 min-h-[400px] p-2 hover:bg-neutral-800/30 cursor-pointer transition-colors last:border-r-0",
                    isEqual(day, selectedDay) &&
                      "bg-neutral-800/50 ring-1 ring-neutral-700"
                  )}
                >
                  <div className="space-y-1">
                    {dayTasksForWeek.map((task) => {
                      const isPastDue =
                        settings.pendingEnabled &&
                        task.date &&
                        isDateBeforeToday(task.date) &&
                        !task.completed;

                      return (
                        <TaskDetailPopover
                          key={task.id}
                          task={task}
                          onEdit={() => handleTaskEdit(task.id)}
                          onDelete={() => handleTaskDelete(task.id)}
                          onToggleComplete={() =>
                            handleTaskToggleComplete(task.id)
                          }
                        >
                          <div
                            className={cn(
                              "text-xs p-2 border cursor-pointer hover:opacity-80 transition-all duration-200 hover:scale-[1.02] rounded-sm",
                              getPriorityColor(task.priority),
                              task.completed && "opacity-60 line-through"
                            )}
                          >
                            <p className="font-medium text-white line-clamp-2 mb-1">
                              {task.text}
                            </p>
                            <div className="flex items-center gap-1.5">
                              {task.scheduled_time && (
                                <span className="text-neutral-300 text-[10px]">
                                  {formatTimeDisplay(task.scheduled_time)}
                                </span>
                              )}
                              {isPastDue && (
                                <div className="flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3 text-yellow-500" />
                                  <span className="text-yellow-500 text-[10px] font-medium">
                                    Pending
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </TaskDetailPopover>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </>
    );
  }, [
    weekDays,
    dayTasks,
    selectedDay,
    settings.pendingEnabled,
    isDateBeforeToday,
    handleDayClick,
    handleDayDoubleClick,
    handleTaskEdit,
    handleTaskDelete,
    handleTaskToggleComplete,
  ]);

  const renderDayView = useCallback(() => {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-[60px_1fr] divide-x divide-neutral-800/40">
          <div className="sticky left-0 bg-neutral-900">
            {dayHours.map((hour) => (
              <div
                key={hour.getTime()}
                className="h-16 border-b border-neutral-800/40 flex items-start justify-end pr-3 pt-1"
              >
                <span className="text-xs text-neutral-400 font-medium">
                  {format(hour, "h a")}
                </span>
              </div>
            ))}
          </div>

          <div className="relative">
            {dayHours.map((hour) => (
              <div
                key={hour.getTime()}
                className="h-16 border-b border-neutral-800/40 relative hover:bg-neutral-800/20 transition-colors"
                onClick={() => setIsInputVisible(true)}
              />
            ))}

            {dayTasks
              .filter((task) => task.scheduled_time)
              .map((task) => {
                const [hours, minutes] = task
                  .scheduled_time!.split(":")
                  .map(Number);
                const topPosition = hours * 64 + (minutes * 64) / 60;

                const isPastDue =
                  settings.pendingEnabled &&
                  task.date &&
                  isDateBeforeToday(task.date) &&
                  !task.completed;

                return (
                  <TaskDetailPopover
                    key={task.id}
                    task={task}
                    onEdit={() => handleTaskEdit(task.id)}
                    onDelete={() => handleTaskDelete(task.id)}
                    onToggleComplete={() => handleTaskToggleComplete(task.id)}
                  >
                    <div
                      className={cn(
                        "absolute left-1 right-1 text-xs p-2 border cursor-pointer hover:opacity-80 transition-all duration-200 hover:scale-[1.02] rounded-sm z-10",
                        getPriorityColor(task.priority),
                        task.completed && "opacity-60 line-through"
                      )}
                      style={{ top: `${topPosition}px`, minHeight: "32px" }}
                    >
                      <p className="font-medium text-white line-clamp-2 mb-1">
                        {task.text}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-neutral-300 text-[10px]">
                          {formatTimeDisplay(task.scheduled_time!)}
                        </span>
                        {isPastDue && (
                          <div className="flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-yellow-500" />
                            <span className="text-yellow-500 text-[10px] font-medium">
                              Pending
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </TaskDetailPopover>
                );
              })}

            <div className="absolute top-0 left-1 right-1 z-20">
              <div className="bg-neutral-900/95 border-b border-neutral-800/40 p-2 space-y-1">
                {dayTasks
                  .filter((task) => !task.scheduled_time)
                  .map((task) => {
                    const isPastDue =
                      settings.pendingEnabled &&
                      task.date &&
                      isDateBeforeToday(task.date) &&
                      !task.completed;

                    return (
                      <TaskDetailPopover
                        key={task.id}
                        task={task}
                        onEdit={() => handleTaskEdit(task.id)}
                        onDelete={() => handleTaskDelete(task.id)}
                        onToggleComplete={() =>
                          handleTaskToggleComplete(task.id)
                        }
                      >
                        <div
                          className={cn(
                            "text-xs p-2 border cursor-pointer hover:opacity-80 transition-all duration-200 hover:scale-[1.02] rounded-sm",
                            getPriorityColor(task.priority),
                            task.completed && "opacity-60 line-through"
                          )}
                        >
                          <p className="font-medium text-white line-clamp-1 mb-1">
                            {task.text}
                          </p>
                          <div className="flex items-center gap-1.5">
                            <span className="text-neutral-300 text-[10px]">
                              All day
                            </span>
                            {isPastDue && (
                              <div className="flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 text-yellow-500" />
                                <span className="text-yellow-500 text-[10px] font-medium">
                                  Pending
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </TaskDetailPopover>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }, [
    dayHours,
    dayTasks,
    settings.pendingEnabled,
    isDateBeforeToday,
    handleTaskEdit,
    handleTaskDelete,
    handleTaskToggleComplete,
  ]);

  const currentPeriod = periodTitles[viewMode];

  return (
    <main className="flex flex-col w-full h-full mx-auto bg-neutral-900">
      <div className="flex flex-col space-y-4 p-4 md:flex-row md:items-center md:justify-between md:space-y-0 border-b border-neutral-800/40">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <h2 className="text-xl font-semibold text-foreground">
              {currentPeriod.title}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {currentPeriod.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-10 overflow-hidden border border-neutral-700 rounded-lg bg-neutral-900 dark:bg-neutral-900/80 relative shadow-sm">
            <div
              className="absolute h-full bg-neutral-800 z-0 transition-transform duration-300 ease-out rounded-md"
              style={{
                width: "calc(34.333%)",
                transform:
                  viewMode === "month"
                    ? "translateX(0px)"
                    : viewMode === "week"
                    ? "translateX(calc(100% + 0px))"
                    : "translateX(calc(200% + 0px))",
              }}
            />
            <button
              type="button"
              onClick={() => handleViewModeChange("month")}
              className={cn(
                "px-3 py-2 text-sm cursor-pointer font-medium flex items-center gap-1.5 transition-colors relative z-10 justify-center",
                "flex-1 min-w-0",
                viewMode === "month"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground/80"
              )}
              aria-label="Switch to month view"
              aria-pressed={viewMode === "month"}
              title="Month view (Shift+Tab to cycle)"
            >
              <Calendar size={14} className="shrink-0" />
              <span className="hidden sm:inline">Month</span>
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange("week")}
              className={cn(
                "px-3 py-2 text-sm cursor-pointer font-medium flex items-center gap-1.5 transition-colors relative z-10 justify-center",
                "flex-1 min-w-0",
                viewMode === "week"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground/80"
              )}
              aria-label="Switch to week view"
              aria-pressed={viewMode === "week"}
              title="Week view (Shift+Tab to cycle)"
            >
              <CalendarRange size={14} className="shrink-0" />
              <span className="hidden sm:inline">Week</span>
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange("day")}
              className={cn(
                "px-3 py-2 text-sm cursor-pointer font-medium flex items-center gap-1.5 transition-colors relative z-10 justify-center",
                "flex-1 min-w-0",
                viewMode === "day"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground/80"
              )}
              aria-label="Switch to day view"
              aria-pressed={viewMode === "day"}
              title="Day view (Shift+Tab to cycle)"
            >
              <CalendarDays size={14} className="shrink-0" />
              <span className="hidden sm:inline">Day</span>
            </button>
          </div>

          <div className="inline-flex -space-x-px rounded-lg border border-neutral-800 shadow-sm">
            <Button
              onClick={previousPeriod}
              className="rounded-none cursor-pointer shadow-none first:rounded-l-lg last:rounded-r-lg focus-visible:z-10 bg-transparent border-0 hover:bg-neutral-800/50 transition-colors duration-200"
              variant="outline"
              size="icon"
              aria-label={`Previous ${viewMode} (Alt+[)`}
            >
              <CaretLeft size={16} />
            </Button>
            <Button
              onClick={goToToday}
              className="rounded-none cursor-pointer shadow-none first:rounded-l-lg last:rounded-r-lg focus-visible:z-10 bg-transparent border-0 hover:bg-neutral-800/50 px-4 transition-colors duration-200"
              variant="outline"
            >
              Today
            </Button>
            <Button
              onClick={nextPeriod}
              className="rounded-none cursor-pointer shadow-none first:rounded-l-lg last:rounded-r-lg focus-visible:z-10 bg-transparent border-0 hover:bg-neutral-800/50 transition-colors duration-200"
              variant="outline"
              size="icon"
              aria-label={`Next ${viewMode} (Alt+])`}
            >
              <CaretRight size={16} />
            </Button>
          </div>

          <Button
            onClick={() => setIsInputVisible(true)}
            variant="outline"
            className="gap-2 cursor-pointer bg-neutral-800/50 hover:bg-neutral-700/50 border-neutral-700/50 text-neutral-200 transition-all duration-200 hover:shadow-md px-4 py-2 h-10"
          >
            <Plus size={16} weight="bold" className="text-neutral-300" />
            <span className="flex items-center gap-2">
              New Task
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-neutral-400 bg-neutral-900/50 border border-neutral-700/50 rounded-md">
                ⌘K
              </kbd>
            </span>
          </Button>

          <div className="flex gap-3">
            <SyncPopover />
            <SettingsPopover isMobile={isMobile} />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {viewMode === "month" && renderMonthView()}
        {viewMode === "week" && renderWeekView()}
        {viewMode === "day" && renderDayView()}
      </div>

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
                  "EEEE, MMM d"
                )}...`}
                minHeight={48}
                onSubmit={(text) =>
                  handleSubmit(text, () => setIsInputVisible(false))
                }
                onClose={handleClose}
                isMobile={false}
                aiDisabled={!settings.aiEnabled}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <TaskEditDialog
        task={editingTask}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleTaskSave}
        isMobile={isMobile}
      />
    </main>
  );
}

export default CalendarView;
