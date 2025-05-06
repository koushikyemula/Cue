"use client";

import { Button } from "@/components/ui/button";
import {
  filterTasksByDate,
  formatDate,
  serializeTask,
  sortTasks,
} from "@/lib/utils/task";
import { SortOption, TaskItem } from "@/types";
import { useCallback, useEffect, useMemo, useState, useReducer } from "react";
import { Progress } from "./progress";
import { TaskList } from "./task-list";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ViewIcon, CalendarIcon } from "lucide-react";
import { addDays } from "date-fns";
import AiInput from "./ui/ai-input";
import { useSwipeable } from "react-swipeable";

const EmptyState = ({ isMobile }: { isMobile: boolean }) => (
  <div className="flex flex-col items-center justify-center text-center min-h-[60dvh] p-8 space-y-2">
    {!isMobile && (
      <p className="text-sm text-muted-foreground max-w-[280px]">
        Press <kbd className="bg-muted px-1 rounded">⌘K</kbd> to add a new task
      </p>
    )}
    {isMobile && (
      <p className="text-sm text-muted-foreground max-w-[280px]">
        Use the input box below to add a new task
      </p>
    )}
  </div>
);

export const calculateProgress = (tasks: TaskItem[]) => {
  const completedCount = tasks.filter((task) => task.completed).length;
  return tasks.length > 0
    ? Math.round((completedCount / tasks.length) * 100)
    : 0;
};

const TaskSkeleton = () => (
  <div className="space-y-1" aria-label="Loading task items">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="px-4 py-2.5 flex items-center gap-3">
        <div className="w-5 h-5   bg-muted-foreground/20 animate-pulse" />
        <div className="flex-1">
          <div className="h-2.5 w-32   bg-muted-foreground/20 animate-pulse" />
        </div>
      </div>
    ))}
  </div>
);

interface TaskProps {
  initialTasks: TaskItem[];
  setTasks: (value: TaskItem[] | ((val: TaskItem[]) => TaskItem[])) => void;
  sortBy: SortOption;
  isInputVisible?: boolean;
  onInputClose?: () => void;
  onInputSubmit?: (text: string) => void;
}

export default function Task({
  initialTasks,
  setTasks,
  sortBy,
  isInputVisible = false,
  onInputClose = () => {},
  onInputSubmit = () => {},
}: TaskProps) {
  const [isClientLoaded, setIsClientLoaded] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);

  const [viewState, dispatch] = useReducer(
    (
      state: { mode: "date" | "all"; key: number },
      action: { type: string; payload?: any }
    ) => {
      switch (action.type) {
        case "SET_DATE_MODE":
          return { mode: "date" as const, key: state.key + 1 };
        case "SET_ALL_MODE":
          return { mode: "all" as const, key: state.key + 1 };
        default:
          return state;
      }
    },
    { mode: "date", key: 0 }
  );

  const viewMode = viewState.mode;
  const viewModeKey = viewState.key;

  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    setIsClientLoaded(true);
  }, []);

  const dateFilteredTasks = useMemo(
    () => (isClientLoaded ? filterTasksByDate(initialTasks, selectedDate) : []),
    [initialTasks, selectedDate, isClientLoaded]
  );

  const allTasks = useMemo(
    () => (isClientLoaded ? initialTasks : []),
    [initialTasks, isClientLoaded]
  );

  const filteredTasks = useMemo(() => {
    if (!isClientLoaded) return [];
    if (viewMode === "date") {
      return [...dateFilteredTasks];
    } else {
      return [...allTasks];
    }
  }, [viewMode, dateFilteredTasks, allTasks, isClientLoaded, viewModeKey]);

  const sortedTasks = useMemo(() => {
    if (!isClientLoaded) return [];
    return sortTasks([...filteredTasks], sortBy);
  }, [filteredTasks, sortBy, isClientLoaded]);

  const taskCounts = useMemo(() => {
    if (!isClientLoaded) return { completed: 0, remaining: 0, progress: 0 };

    const tasks = viewMode === "date" ? [...dateFilteredTasks] : [...allTasks];
    const completed = tasks.filter((task) => task.completed).length;
    const remaining = tasks.filter((task) => !task.completed).length;
    const progress =
      tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

    return { completed, remaining, progress };
  }, [dateFilteredTasks, allTasks, viewMode, isClientLoaded, viewModeKey]);

  const toggleTask = useCallback(
    (id: string) => {
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === id ? { ...task, completed: !task.completed } : task
        )
      );
    },
    [setTasks]
  );

  const deleteTask = useCallback(
    (id: string) => {
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));
    },
    [setTasks]
  );

  const startEditing = useCallback((id: string, text: string) => {
    setEditingTaskId(id);
    setEditText(text);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingTaskId(null);
    setEditText("");
  }, []);

  const handleEditTask = useCallback(
    (updatedTask: TaskItem) => {
      if (!updatedTask.text.trim()) {
        cancelEditing();
        return;
      }

      try {
        setTasks((prevTasks) =>
          prevTasks.map((task) => {
            if (task.id === updatedTask.id) {
              return serializeTask({
                ...task,
                text: updatedTask.text,
                scheduled_time: updatedTask.scheduled_time,
                priority: updatedTask.priority,
              });
            }
            return task;
          })
        );
        cancelEditing();
      } catch (error) {
        console.error("Failed to update task:", error);
      }
    },
    [setTasks, cancelEditing]
  );

  const handleDateSelect = useCallback((date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setCalendarOpen(false);
      setTimeout(() => {
        const trigger = document.querySelector(
          '[data-calendar-trigger="true"]'
        );
        if (trigger instanceof HTMLElement) {
          trigger.focus();
        }
      }, 100);
    }
  }, []);

  const handleViewModeChange = useCallback(
    (mode: "date" | "all") => {
      if (mode === viewMode) return;

      if (mode === "date") {
        dispatch({ type: "SET_DATE_MODE" });
      } else {
        dispatch({ type: "SET_ALL_MODE" });
      }
    },
    [viewMode]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && editingTaskId) {
        cancelEditing();
      }

      if (e.key === "Tab" && e.shiftKey) {
        e.preventDefault();
        if (viewMode === "date") {
          handleViewModeChange("all");
        } else {
          handleViewModeChange("date");
        }
      }

      if (e.altKey) {
        if (e.key === "[" || e.code === "BracketLeft") {
          e.preventDefault();
          if (viewMode === "date") {
            setSelectedDate((prev) => {
              const newDate = addDays(prev, -1);
              return newDate;
            });
          }
        }

        if (e.key === "]" || e.code === "BracketRight") {
          e.preventDefault();
          if (viewMode === "date") {
            setSelectedDate((prev) => {
              const newDate = addDays(prev, 1);
              return newDate;
            });
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    viewMode,
    setSelectedDate,
    editingTaskId,
    cancelEditing,
    handleViewModeChange,
  ]);

  // Handle swipe gestures for mobile
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (viewMode === "date" && isMobile) {
        handleViewModeChange("all");
      }
    },
    onSwipedRight: () => {
      if (viewMode === "all" && isMobile) {
        handleViewModeChange("date");
      }
    },
    trackMouse: false,
    trackTouch: true,
    delta: 50,
    preventScrollOnSwipe: false,
    rotationAngle: 0,
  });

  return (
    <div className="w-full flex flex-col h-full bg-neutral-900">
      <div className="flex items-center justify-between sticky bg-neutral-900 top-0 z-30 py-2 border-b border-neutral-800/40">
        <div className="flex items-center gap-2">
          <div className="flex h-9 overflow-hidden border-input rounded-md border bg-neutral-900 dark:bg-neutral-900/80 relative">
            <div
              className="absolute h-full bg-neutral-800 z-0 w-1/2 transition-transform duration-300 ease-out"
              style={{
                transform:
                  viewMode === "date" ? "translateX(0)" : "translateX(100%)",
              }}
            />
            <button
              type="button"
              onClick={() => {
                if (viewMode !== "date") {
                  handleViewModeChange("date");
                }
              }}
              className={`px-3 py-2 text-xs cursor-pointer font-medium flex items-center gap-1.5 transition-colors relative z-10 w-1/2 justify-center ${
                viewMode === "date"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground/80"
              }`}
              aria-label="Switch to date view"
              aria-pressed={viewMode === "date"}
              title="View tasks by date"
            >
              <CalendarIcon size={14} />
            </button>
            <button
              type="button"
              onClick={() => {
                if (viewMode !== "all") {
                  handleViewModeChange("all");
                }
              }}
              className={`px-3 py-2 text-xs cursor-pointer font-medium flex items-center gap-1.5 transition-colors relative z-10 w-1/2 justify-center ${
                viewMode === "all"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground/80"
              }`}
              aria-label="Switch to all tasks view"
              aria-pressed={viewMode === "all"}
              title="View all tasks"
            >
              <ViewIcon size={14} />
            </button>
          </div>
          {viewMode === "date" && (
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="group h-9 px-4 py-2 hover:cursor-pointer bg-neutral-900 dark:bg-neutral-900/80 border border-border hover:bg-background/70 dark:hover:bg-neutral-800 transition-all duration-200 flex items-center gap-3"
                  aria-label={`Select date: currently ${formatDate(
                    selectedDate
                  )}`}
                  data-calendar-trigger="true"
                >
                  <span className="font-medium text-foreground dark:text-zinc-200">
                    {formatDate(selectedDate)}
                  </span>
                  <span className="flex items-center text-xs font-normal text-muted-foreground dark:text-neutral-400">
                    <span>{taskCounts.remaining}</span>
                    <span className="ml-1">
                      {taskCounts.remaining === 1 ? "task" : "tasks"}
                    </span>
                    {taskCounts.completed > 0 && (
                      <span className="flex items-center ml-1">
                        <span className="h-1 w-1 rounded-full bg-muted-foreground/30 mx-1.5" />
                        <span className="text-muted-foreground/70 dark:text-neutral-500">
                          {taskCounts.completed}
                        </span>
                        <span className="ml-1 text-muted-foreground/60 dark:text-neutral-500">
                          done
                        </span>
                      </span>
                    )}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0 border-border/40 bg-neutral-900 dark:bg-neutral-900 shadow-md"
                align="start"
              >
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  initialFocus
                  disabled={(date) => date < new Date("1900-01-01")}
                />
              </PopoverContent>
            </Popover>
          )}
          {viewMode === "all" && (
            <div className="h-9 px-4 py-2 bg-neutral-900 dark:bg-neutral-900/80 border border-border/40 rounded-md flex items-center dark:border-input gap-2">
              <span className="flex items-center text-xs font-normal text-muted-foreground dark:text-neutral-400">
                <span>{initialTasks.filter((t) => !t.completed).length}</span>
                <span className="ml-1">active</span>
                {initialTasks.filter((t) => t.completed).length > 0 && (
                  <span className="flex items-center ml-1">
                    <span className="h-1 w-1 rounded-full bg-muted-foreground/30 mx-1.5" />
                    <span className="text-muted-foreground/70 dark:text-neutral-500">
                      {initialTasks.filter((t) => t.completed).length}
                    </span>
                    <span className="ml-1 text-muted-foreground/60 dark:text-neutral-500">
                      done
                    </span>
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
        {filteredTasks.length > 0 && (
          <div className="hidden sm:flex items-center animate-in fade-in duration-300">
            <Progress progress={taskCounts.progress} size={24} />
          </div>
        )}
      </div>
      <div className="pt-2 bg-neutral-900/90 relative z-10"></div>

      <div
        className="flex-1 overflow-hidden relative"
        {...(isMobile ? swipeHandlers : {})}
      >
        {!isClientLoaded ? (
          <div className="overflow-y-auto h-full">
            <TaskSkeleton />
          </div>
        ) : sortedTasks.length === 0 ? (
          <div className="overflow-y-auto h-full">
            <EmptyState isMobile={isMobile} />
          </div>
        ) : (
          <div className="relative h-full overflow-hidden">
            <div
              className="absolute inset-0 transition-all duration-300 ease-in-out"
              style={{
                transform: `translateX(${
                  viewMode === "date" ? "0%" : "-100%"
                })`,
                opacity: viewMode === "date" ? 1 : 0,
                zIndex: viewMode === "date" ? 20 : 10,
              }}
            >
              <div className="h-full overflow-y-auto">
                <TaskList
                  tasks={sortTasks([...dateFilteredTasks], sortBy)}
                  onToggle={toggleTask}
                  onDelete={deleteTask}
                  onEdit={startEditing}
                  editingTaskId={editingTaskId}
                  editText={editText}
                  setEditText={setEditText}
                  handleEditTask={handleEditTask}
                  cancelEditing={cancelEditing}
                  viewMode="date"
                />
              </div>
            </div>

            <div
              className="absolute inset-0 transition-all duration-300 ease-in-out"
              style={{
                transform: `translateX(${viewMode === "all" ? "0%" : "100%"})`,
                opacity: viewMode === "all" ? 1 : 0,
                zIndex: viewMode === "all" ? 20 : 10,
              }}
            >
              <div className="h-full overflow-y-auto">
                <TaskList
                  tasks={sortTasks([...allTasks], sortBy)}
                  onToggle={toggleTask}
                  onDelete={deleteTask}
                  onEdit={startEditing}
                  editingTaskId={editingTaskId}
                  editText={editText}
                  setEditText={setEditText}
                  handleEditTask={handleEditTask}
                  cancelEditing={cancelEditing}
                  viewMode="all"
                />
              </div>
            </div>
          </div>
        )}
      </div>
      {isMobile && !isInputVisible && (
        <div className="mt-4">
          <AiInput
            placeholder="Enter your task here..."
            minHeight={50}
            isMobile={isMobile}
            onClose={onInputClose}
            onSubmit={onInputSubmit}
          />
        </div>
      )}
    </div>
  );
}
