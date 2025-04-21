import { useState, useEffect, useCallback } from "react";
import { TodoItem } from "@/types";
import { serializeTodo } from "@/lib/utils/todo";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    try {
      const item = localStorage.getItem(key);
      if (!item) return;

      const parsed = JSON.parse(item, (key, value) => {
        if (key === "date") return new Date(value);
        return value;
      });

      if (Array.isArray(parsed) && key === "todos") {
        setStoredValue(
          parsed.map((item: any) => serializeTodo(item as TodoItem)) as T,
        );
      } else {
        setStoredValue(parsed as T);
      }
    } catch (error) {
      console.error("Failed to parse localStorage:", error);
    }
  }, [key]);

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        if (isMounted) {
          localStorage.setItem(
            key,
            JSON.stringify(valueToStore, (key, value) => {
              if (key === "date" && value instanceof Date) {
                return value.toISOString();
              }
              return value;
            }),
          );
        }
      } catch (error) {
        console.error("Failed to save to localStorage:", error);
      }
    },
    [key, storedValue, isMounted],
  );

  return [storedValue, setValue] as const;
}
