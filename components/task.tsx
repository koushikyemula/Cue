"use client";

import { Button } from "@/components/ui/button";
import {
  filterTasksByDate,
  formatDate,
  serializeTask,
  sortTasks,
} from "@/lib/utils/task";
import { SortOption, TaskItem } from "@/types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Progress } from "./progress";
import { TaskList } from "./task-list";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { useMediaQuery } from "@/hooks/use-media-query";
import { AIInput } from "./ui/ai-input";

const EmptyState = ({ isMobile }: { isMobile: boolean }) => (
  <div className="flex flex-col items-center justify-center text-center min-h-[50vh] p-8 space-y-2">
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

export const calculateProgress = (todos: TaskItem[]) => {
  const completedCount = todos.filter((todo) => todo.completed).length;
  return todos.length > 0
    ? Math.round((completedCount / todos.length) * 100)
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
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    setIsClientLoaded(true);
  }, []);

  const filteredTasks = useMemo(
    () => (isClientLoaded ? filterTasksByDate(initialTasks, selectedDate) : []),
    [initialTasks, selectedDate, isClientLoaded]
  );

  const sortedTasks = useMemo(
    () => (isClientLoaded ? sortTasks(filteredTasks, sortBy) : []),
    [filteredTasks, sortBy, isClientLoaded]
  );

  const taskCounts = useMemo(() => {
    if (!isClientLoaded) return { completed: 0, remaining: 0, progress: 0 };

    return {
      completed: filteredTasks.filter((task) => task.completed).length,
      remaining: filteredTasks.filter((task) => !task.completed).length,
      progress: isClientLoaded ? calculateProgress(filteredTasks) : 0,
    };
  }, [filteredTasks, isClientLoaded]);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && editingTaskId) {
        cancelEditing();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingTaskId, cancelEditing]);

  return (
    <div className="w-full space-y-5">
      <div className="flex items-center justify-between">
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="group h-9 px-4 py-2 hover:cursor-pointer   bg-neutral-900 dark:bg-neutral-900/80 border border-border/40 hover:bg-background/70 dark:hover:bg-neutral-800 transition-all duration-200 flex items-center gap-3"
              aria-label={`Select date: currently ${formatDate(selectedDate)}`}
              data-calendar-trigger="true"
            >
              <span className="font-medium text-foreground dark:text-zinc-200">
                {formatDate(selectedDate)}
              </span>
              <span className="text-xs font-normal text-muted-foreground dark:text-neutral-400">
                {taskCounts.remaining} to do
                {taskCounts.completed > 0 && (
                  <>
                    <span className="mx-1 text-muted-foreground/50">•</span>
                    <span className="text-muted-foreground/60 dark:text-neutral-500">
                      {taskCounts.completed} completed
                    </span>
                  </>
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
              className=" "
            />
          </PopoverContent>
        </Popover>
        {filteredTasks.length > 0 && (
          <div className="hidden sm:flex items-center animate-in fade-in duration-300">
            <Progress progress={taskCounts.progress} size={24} />
          </div>
        )}
      </div>

      <div className="mt-1.5   h-full" aria-live="polite">
        {!isClientLoaded ? (
          <TaskSkeleton />
        ) : sortedTasks.length === 0 ? (
          <EmptyState isMobile={isMobile} />
        ) : (
          <TaskList
            tasks={sortedTasks}
            onToggle={toggleTask}
            onDelete={deleteTask}
            onEdit={startEditing}
            editingTaskId={editingTaskId}
            editText={editText}
            setEditText={setEditText}
            handleEditTask={handleEditTask}
            cancelEditing={cancelEditing}
          />
        )}
      </div>

      {isMobile && !isInputVisible && (
        <AIInput
          placeholder="Enter your task here..."
          minHeight={50}
          onClose={onInputClose}
          onSubmit={onInputSubmit}
        />
      )}
    </div>
  );
}
