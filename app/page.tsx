"use client";

import { determineAction } from "@/app/actions";
import Task from "@/components/task";
import { AIInput } from "@/components/ui/ai-input";
import { useIndexedDB } from "@/hooks";
import { serializeTask } from "@/lib/utils/task";
import { SortOption, TaskItem } from "@/types";
import { format } from "date-fns";
import { AnimatePresence } from "framer-motion";
import { useCallback, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

export default function Home() {
  const [isInputVisible, setIsInputVisible] = useState(false);
  const [tasks, setTasks] = useIndexedDB<TaskItem[]>("tasks", []);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const inputRef = useRef<HTMLDivElement>(null);

  useHotkeys("meta+k, ctrl+k", (e) => {
    e.preventDefault();
    setIsInputVisible((prev) => !prev);
  });

  const handleClose = useCallback(() => setIsInputVisible(false), []);

  const processActions = useCallback(
    (actions: any[], text: string, selectedDate: Date) => {
      let newTasks = [...tasks];

      actions.forEach((action) => {
        switch (action.action) {
          case "add": {
            let taskDate = selectedDate;
            if (action.targetDate) {
              taskDate = new Date(action.targetDate);
            }
            newTasks.push(
              serializeTask({
                id: Math.random().toString(36).substring(7),
                text: action.text || text,
                completed: false,
                date: taskDate,
                scheduled_time: action.time,
                priority: action.priority,
              })
            );
            break;
          }

          case "delete":
            if (action.taskId) {
              newTasks = newTasks.filter((task) => task.id !== action.taskId);
            }
            break;

          case "mark":
            if (action.taskId) {
              newTasks = newTasks.map((task) => {
                if (task.id === action.taskId) {
                  if (action.status === "complete") {
                    return { ...task, completed: true };
                  } else if (action.status === "incomplete") {
                    return { ...task, completed: false };
                  } else {
                    return { ...task, completed: !task.completed };
                  }
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
                  const updatedTask = {
                    ...task,
                    text: action.text || task.text,
                    date: action.targetDate
                      ? new Date(action.targetDate)
                      : task.date,
                  };

                  // Only update priority if explicitly provided in the action
                  if (action.priority !== undefined) {
                    updatedTask.priority = action.priority;
                  }

                  return serializeTask(updatedTask);
                }
                return task;
              });
            }
            break;

          case "clear":
            if (action.listToClear) {
              const dateStr = format(selectedDate, "yyyy-MM-dd");
              switch (action.listToClear) {
                case "all":
                  newTasks = tasks.filter(
                    (task) => format(task.date, "yyyy-MM-dd") !== dateStr
                  );
                  break;
                case "completed":
                  newTasks = tasks.filter(
                    (task) =>
                      !(
                        task.completed &&
                        format(task.date, "yyyy-MM-dd") === dateStr
                      )
                  );
                  break;
                case "incomplete":
                  newTasks = tasks.filter(
                    (task) =>
                      !(
                        !task.completed &&
                        format(task.date, "yyyy-MM-dd") === dateStr
                      )
                  );
                  break;
              }
            }
            break;
        }
      });

      return newTasks;
    },
    [tasks]
  );

  const handleSubmit = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      try {
        const selectedDate = new Date();
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const { actions } = await determineAction(
          text,
          tasks,
          "llama-3.3",
          timezone
        );

        const newTasks = processActions(actions, text, selectedDate);
        setTasks(newTasks);
      } catch (error) {
        console.error("AI Action failed:", error);
        setTasks([
          ...tasks,
          serializeTask({
            id: Math.random().toString(36).substring(7),
            text,
            completed: false,
            date: new Date(),
          }),
        ]);
      }
    },
    [tasks, processActions, setTasks]
  );

  return (
    <main className="h-full w-full flex flex-col mx-auto">
      <div className="flex-1 w-full max-w-md mx-auto px-4 pt-8">
        <Task initialTasks={tasks} setTasks={setTasks} sortBy={sortBy} />
      </div>

      <div className="fixed bottom-0 left-0 right-0" ref={inputRef}>
        <div className="max-w-xl mx-auto pb-12">
          <AnimatePresence>
            {isInputVisible && (
              <AIInput
                placeholder="Enter your task here..."
                minHeight={50}
                onClose={handleClose}
                onSubmit={handleSubmit}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
