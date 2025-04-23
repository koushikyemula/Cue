export interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
  date: Date;
  time?: string;
  priority?: "high" | "medium" | "low";
}

export type SortOption =
  | "newest"
  | "oldest"
  | "alphabetical"
  | "completed"
  | "priority";

export interface TaskListProps {
  tasks: TaskItem[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string, emoji?: string) => void;
  editingTaskId: string | null;
  editText: string;
  setEditText: (text: string) => void;
  handleEditTask: (task: TaskItem) => void;
  cancelEditing: () => void;
}

export interface CircleCheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
}
