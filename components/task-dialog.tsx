"use client";

import { Button } from "@/components/ui/button";
import { CircleCheckbox } from "@/components/ui/circle-checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TimePicker } from "@/components/ui/time-picker";
import { cn } from "@/lib/utils";
import { TaskItem } from "@/types";
import { ChatCircle, Clock, Flag, Trash } from "@phosphor-icons/react";
import { format } from "date-fns";
import { useEffect, useState } from "react";

interface TaskDialogProps {
  task: TaskItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedTask: TaskItem) => void;
  onDelete: (taskId: string) => void;
  onToggleComplete: (taskId: string) => void;
}

export function TaskDialog({
  task,
  open,
  onOpenChange,
  onSave,
  onDelete,
  onToggleComplete,
}: TaskDialogProps) {
  const [editedTask, setEditedTask] = useState<TaskItem | null>(null);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (task) {
      setEditedTask({ ...task });
      setComment(task.comment || "");
    }
  }, [task]);

  if (!task || !editedTask) return null;

  const handleSave = () => {
    if (!editedTask) return;

    onSave({
      ...editedTask,
      comment: comment.trim() || undefined,
    });
    onOpenChange(false);
  };

  const handleDelete = () => {
    onDelete(task.id);
    onOpenChange(false);
  };

  const handleToggleComplete = () => {
    onToggleComplete(task.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] bg-neutral-900 border-neutral-800/50 shadow-2xl">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-xl font-medium text-white flex items-center gap-3">
            <CircleCheckbox
              checked={task.completed}
              onCheckedChange={handleToggleComplete}
              className={cn(
                "hover:cursor-pointer transition-all duration-200",
                task.completed
                  ? "border-green-500/50 bg-green-500/20"
                  : "border-neutral-600 hover:border-neutral-500"
              )}
            />
            <span
              className={cn(
                "transition-colors duration-200",
                task.completed && "text-neutral-400 line-through"
              )}
            >
              {task.completed ? "Completed Task" : "Edit Task"}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label
              htmlFor="task-text"
              className="text-sm font-medium text-neutral-300"
            >
              Task Description
            </Label>
            <Textarea
              id="task-text"
              value={editedTask.text}
              onChange={(e) =>
                setEditedTask({ ...editedTask, text: e.target.value })
              }
              className="bg-neutral-800/50 border-neutral-700/50 text-white placeholder:text-neutral-500 resize-none focus:border-neutral-600 transition-colors"
              placeholder="What needs to be done?"
              rows={2}
            />
          </div>

          <div className="space-y-3">
            <Label
              htmlFor="task-comment"
              className="text-sm font-medium text-neutral-300 flex items-center gap-2"
            >
              <ChatCircle size={16} className="text-neutral-400" />
              Notes
            </Label>
            <Textarea
              id="task-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="bg-neutral-800/50 border-neutral-700/50 text-white placeholder:text-neutral-500 resize-none focus:border-neutral-600 transition-colors"
              placeholder="Add additional notes or context..."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label
                htmlFor="task-date"
                className="text-sm font-medium text-neutral-300"
              >
                Due Date
              </Label>
              <Input
                id="task-date"
                type="date"
                value={format(editedTask.date, "yyyy-MM-dd")}
                onChange={(e) =>
                  setEditedTask({
                    ...editedTask,
                    date: new Date(e.target.value),
                  })
                }
                className="bg-neutral-800/50 border-neutral-700/50 text-white focus:border-neutral-600 transition-colors"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                <Clock size={16} className="text-neutral-400" />
                Time
              </Label>
              <TimePicker
                time={editedTask.scheduled_time || ""}
                onChange={(time) =>
                  setEditedTask({
                    ...editedTask,
                    scheduled_time: time || undefined,
                  })
                }
                className="bg-neutral-800/50 border-neutral-700/50 hover:bg-neutral-700/50 focus:border-neutral-600 transition-all"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
              <Flag size={16} className="text-neutral-400" />
              Priority
            </Label>
            <Select
              value={editedTask.priority || "none"}
              onValueChange={(value) =>
                setEditedTask({
                  ...editedTask,
                  priority:
                    value === "none"
                      ? undefined
                      : (value as "high" | "medium" | "low"),
                })
              }
            >
              <SelectTrigger className="bg-neutral-800/50 border-neutral-700/50 text-white hover:bg-neutral-700/50 focus:border-neutral-600 transition-all">
                <SelectValue>
                  <span className="flex items-center gap-2">
                    {editedTask.priority ? (
                      <>
                        <span
                          className={cn(
                            "h-2 w-2",
                            editedTask.priority === "high" && "bg-red-500",
                            editedTask.priority === "medium" && "bg-orange-500",
                            editedTask.priority === "low" && "bg-blue-500"
                          )}
                        />
                        <span
                          className={cn(
                            editedTask.priority === "high" && "text-red-400",
                            editedTask.priority === "medium" &&
                              "text-orange-400",
                            editedTask.priority === "low" && "text-blue-400"
                          )}
                        >
                          {editedTask.priority.charAt(0).toUpperCase() +
                            editedTask.priority.slice(1)}{" "}
                        </span>
                      </>
                    ) : (
                      <span className="text-neutral-400">No Priority</span>
                    )}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-neutral-800/90 border-neutral-700/50 backdrop-blur-md">
                <SelectItem
                  value="none"
                  className="text-neutral-400 hover:bg-neutral-700/50"
                >
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-neutral-600" />
                    None
                  </span>
                </SelectItem>
                <SelectItem
                  value="low"
                  className="text-blue-400 hover:bg-blue-500/10"
                >
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    Low
                  </span>
                </SelectItem>
                <SelectItem
                  value="medium"
                  className="text-orange-400 hover:bg-orange-500/10"
                >
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                    Medium
                  </span>
                </SelectItem>
                <SelectItem
                  value="high"
                  className="text-red-400 hover:bg-red-500/10"
                >
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    High
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-8 mt-8 border-t border-neutral-800/50">
          <Button
            onClick={handleDelete}
            variant="ghost"
            size="sm"
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-2 transition-all duration-200"
          >
            <Trash size={16} />
            Delete Task
          </Button>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => onOpenChange(false)}
              variant="ghost"
              size="sm"
              className="text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 transition-all duration-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              size="sm"
              className="bg-white text-black hover:bg-neutral-200 transition-all duration-200 font-medium px-6"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
