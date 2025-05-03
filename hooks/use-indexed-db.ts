import { useState, useEffect, useCallback } from "react";
import Dexie from "dexie";
import { TaskItem } from "@/types";
import { serializeTask } from "@/lib/utils/task";

class AppDatabase extends Dexie {
  tasks: Dexie.Table<TaskItem, string>;

  constructor() {
    super("xlr8-db");
    this.version(1).stores({
      tasks:
        "id, text, completed, date, created_at, updated_at, scheduled_time, priority",
    });
    this.tasks = this.table("tasks");
  }
}

const db = new AppDatabase();

export function useIndexedDB<T>(storeName: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const loadData = async () => {
      try {
        if (storeName === "tasks") {
          const items = await db.tasks.toArray();
          if (items && items.length > 0) {
            setStoredValue(
              items.map((item) => serializeTask(item)) as unknown as T
            );
          }
        } else {
          // For other data types, we could add additional tables
          console.warn("Only 'tasks' store is currently supported");
        }
      } catch (error) {
        console.error("Failed to load from IndexedDB:", error);
      }
    };

    loadData();
  }, [storeName]);

  const setValue = useCallback(
    async (value: T | ((val: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        if (isMounted && storeName === "tasks") {
          const tasks = valueToStore as unknown as TaskItem[];

          // Clear and bulk add to ensure consistency
          await db.transaction("rw", db.tasks, async () => {
            await db.tasks.clear();
            if (tasks.length > 0) {
              await db.tasks.bulkAdd(tasks);
            }
          });
        }
      } catch (error) {
        console.error("Failed to save to IndexedDB:", error);
      }
    },
    [storeName, storedValue, isMounted]
  );

  const exportData = useCallback(async () => {
    try {
      if (storeName === "tasks") {
        const items = await db.tasks.toArray();
        const tasksJson = JSON.stringify(items, null, 2);

        // Create blob and download link
        const blob = new Blob([tasksJson], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        // Set filename with date for versioning
        const date = new Date().toISOString().split("T")[0];
        link.download = `xlr8-tasks-${date}.json`;
        link.href = url;
        link.click();

        // Clean up
        URL.revokeObjectURL(url);

        return { success: true, message: "Data exported successfully" };
      } else {
        return { success: false, message: "Only tasks export is supported" };
      }
    } catch (error) {
      console.error("Failed to export data:", error);
      return { success: false, message: "Failed to export data" };
    }
  }, [storeName]);

  const importData = useCallback(
    async (file: File) => {
      try {
        if (storeName !== "tasks") {
          return { success: false, message: "Only tasks import is supported" };
        }

        return new Promise<{ success: boolean; message: string }>((resolve) => {
          const reader = new FileReader();

          reader.onload = async (e) => {
            try {
              const content = e.target?.result as string;
              const importedTasks = JSON.parse(content) as TaskItem[];

              // Validate the imported data structure
              if (!Array.isArray(importedTasks)) {
                resolve({ success: false, message: "Invalid data format" });
                return;
              }

              // Update IndexedDB and state
              await db.transaction("rw", db.tasks, async () => {
                await db.tasks.clear();
                if (importedTasks.length > 0) {
                  await db.tasks.bulkAdd(importedTasks);
                }
              });

              // Update state with imported tasks
              setStoredValue(
                importedTasks.map((item) => serializeTask(item)) as unknown as T
              );

              resolve({
                success: true,
                message: `Imported ${importedTasks.length} tasks successfully`,
              });
            } catch (error) {
              console.error("Failed to parse imported data:", error);
              resolve({
                success: false,
                message: "Failed to parse imported data",
              });
            }
          };

          reader.onerror = () => {
            resolve({ success: false, message: "Failed to read file" });
          };

          reader.readAsText(file);
        });
      } catch (error) {
        console.error("Failed to import data:", error);
        return { success: false, message: "Failed to import data" };
      }
    },
    [storeName, setStoredValue]
  );

  return [storedValue, setValue, exportData, importData] as const;
}
