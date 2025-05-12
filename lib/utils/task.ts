import { TaskItem } from "@/types";
import { format } from "date-fns";

// Helper function to ensure Date objects are properly serialized
export const serializeTask = (task: TaskItem): TaskItem => {
  const now = new Date();
  const result: TaskItem = { ...task };

  if (!(task.date instanceof Date)) {
    result.date = new Date(task.date);
  }

  // Handle created_at
  if (!task.created_at) {
    result.created_at = now;
  } else if (!(task.created_at instanceof Date)) {
    result.created_at = new Date(task.created_at);
  }

  // Always update updated_at
  result.updated_at = now;

  return result;
};

// Format date for display
export const formatDate = (date: Date) => {
  const today = new Date();
  const tomorrow = new Date(today);
  const yesterday = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow`;
  } else if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday`;
  } else {
    return format(date, "EEE, d MMM");
  }
};

// Filter tasks by date
export const filterTasksByDate = (tasks: TaskItem[], selectedDate: Date) => {
  return tasks.filter(
    (task) =>
      format(task.date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
  );
};

// Sort tasks by criteria
export const sortTasks = (tasks: TaskItem[], sortBy: string) => {
  return [...tasks].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        if (a.created_at && b.created_at) {
          return b.created_at.getTime() - a.created_at.getTime();
        }
        return b.id.localeCompare(a.id);
      case "oldest":
        if (a.created_at && b.created_at) {
          return a.created_at.getTime() - b.created_at.getTime();
        }
        return a.id.localeCompare(b.id);
      case "alphabetical":
        return a.text.localeCompare(b.text);
      case "completed":
        return Number(b.completed) - Number(a.completed);
      case "priority":
        // Priority order: high > medium > low > undefined
        const priorityOrder = { high: 3, medium: 2, low: 1, undefined: 0 };
        const priorityA =
          priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
        const priorityB =
          priorityOrder[b.priority as keyof typeof priorityOrder] || 0;

        // Sort by priority (descending) first, then by completion status
        if (priorityA === priorityB) {
          return Number(a.completed) - Number(b.completed);
        }
        return priorityB - priorityA;
      default:
        return 0;
    }
  });
};

// Calculate progress
export const calculateProgress = (tasks: TaskItem[]) => {
  const completedCount = tasks.filter((task) => task.completed).length;
  return tasks.length > 0
    ? Math.round((completedCount / tasks.length) * 100)
    : 0;
};
