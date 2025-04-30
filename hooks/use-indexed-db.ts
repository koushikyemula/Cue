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

  return [storedValue, setValue] as const;
}
