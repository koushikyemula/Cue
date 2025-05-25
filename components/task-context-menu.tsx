"use client";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { TaskItem } from "@/types";
import { Check, Pencil, Trash, X } from "lucide-react";
import { ReactNode } from "react";

interface TaskContextMenuProps {
  task: TaskItem;
  children: ReactNode;
  onEdit: () => void;
  onDelete: () => void;
  onToggleComplete: () => void;
}

export function TaskContextMenu({
  task,
  children,
  onEdit,
  onDelete,
  onToggleComplete,
}: TaskContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48 bg-neutral-800/95 border-neutral-700/50 backdrop-blur-md">
        <ContextMenuItem
          onClick={onToggleComplete}
          className="flex items-center gap-2 cursor-pointer hover:bg-neutral-700/50 transition-colors"
        >
          {task.completed ? (
            <>
              <X size={16} className="text-neutral-400" />
              <span>Mark Incomplete</span>
            </>
          ) : (
            <>
              <Check size={16} className="text-green-400" />
              <span>Mark Complete</span>
            </>
          )}
        </ContextMenuItem>

        <ContextMenuSeparator className="bg-neutral-700/50" />

        <ContextMenuItem
          onClick={onEdit}
          className="flex items-center gap-2 cursor-pointer hover:bg-neutral-700/50 transition-colors"
        >
          <Pencil size={16} className="text-blue-400" />
          <span>Edit Task</span>
        </ContextMenuItem>

        <ContextMenuSeparator className="bg-neutral-700/50" />

        <ContextMenuItem
          onClick={onDelete}
          variant="destructive"
          className="flex items-center gap-2 cursor-pointer transition-colors"
        >
          <Trash size={16} />
          <span>Delete Task</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
