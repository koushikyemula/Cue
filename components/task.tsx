"use client";

import { Button } from "@/components/ui/button";
import {
  filterTasksByDate,
  formatDate,
  serializeTask,
  sortTasks,
} from "@/lib/utils/task";
import { SortOption, TaskItem } from "@/types";
import { CaretDown } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { TaskList } from "./task-list";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center text-center min-h-[50vh] p-8 space-y-2">
    <p className="text-sm text-muted-foreground max-w-[280px]">
      Press <kbd className="bg-muted px-1 rounded">⌘K</kbd> to add a new task
    </p>
  </div>
);

const LoadingState = () => (
  <div className="flex items-center justify-center py-8">
    <div className="animate-pulse flex flex-col items-center space-y-4">
      <div className="w-5 h-5 rounded-full bg-muted-foreground/20" />
      <div className="h-2.5 w-24 rounded-full bg-muted-foreground/20" />
    </div>
  </div>
);

const TaskSkeleton = () => (
  <div className="space-y-1">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="px-4 py-2.5 flex items-center gap-3">
        <div className="w-5 h-5 rounded-full bg-muted-foreground/20 animate-pulse" />
        <div className="flex-1">
          <div className="h-2.5 w-32 rounded-full bg-muted-foreground/20 animate-pulse" />
        </div>
      </div>
    ))}
  </div>
);

interface TaskProps {
  initialTasks: TaskItem[];
  setTasks: (value: TaskItem[] | ((val: TaskItem[]) => TaskItem[])) => void;
  sortBy: SortOption;
}

export default function Task({ initialTasks, setTasks, sortBy }: TaskProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isClientLoaded, setIsClientLoaded] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    setIsClientLoaded(true);
  }, []);

  const filteredTasks = isClientLoaded
    ? filterTasksByDate(initialTasks, selectedDate)
    : [];
  const sortedTasks = isClientLoaded ? sortTasks(filteredTasks, sortBy) : [];

  const completedCount = isClientLoaded
    ? filteredTasks.filter((task) => task.completed).length
    : 0;
  const remainingCount = isClientLoaded
    ? filteredTasks.filter((task) => !task.completed).length
    : 0;

  const toggleTask = (id: string) => {
    setTasks(
      initialTasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const deleteTask = (id: string) => {
    setTasks(initialTasks.filter((task) => task.id !== id));
  };

  const startEditing = (id: string, text: string) => {
    setEditingTaskId(id);
    setEditText(text);
  };

  const cancelEditing = () => {
    setEditingTaskId(null);
    setEditText("");
  };

  const handleEditTask = (updatedTask: TaskItem) => {
    if (updatedTask.text.trim()) {
      setTasks(
        initialTasks.map((task) => {
          if (task.id === updatedTask.id) {
            const updated = serializeTask({
              ...task,
              text: updatedTask.text,
              time: updatedTask.time,
              priority: updatedTask.priority,
            });
            return updated;
          }
          return task;
        })
      );
    }
    setEditingTaskId(null);
    setEditText("");
  };

  return (
    <div className="w-full space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="!p-1 font-semibold text-2xl hover:no-underline flex items-center gap-1"
              >
                {formatDate(selectedDate)}
                <CaretDown className="w-4 h-4 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <div className="!ml-1.5 text-sm text-muted-foreground flex items-center gap-1">
            <span>{remainingCount} To Dos</span>
            {completedCount > 0 && (
              <>
                <span className="text-muted-foreground/50">•</span>
                <span className="text-muted-foreground/50">
                  {completedCount} Completed
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-1.5 -mx-4 rounded-xl h-full">
        {!isClientLoaded ? (
          <TaskSkeleton />
        ) : sortedTasks.length === 0 && isLoading ? (
          <LoadingState />
        ) : sortedTasks.length === 0 && !isLoading ? (
          <EmptyState />
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
    </div>
  );
}
