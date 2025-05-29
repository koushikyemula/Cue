import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SortOption } from "@/types";

export interface UserSettings {
  aiEnabled: boolean;
  autoRemoveCompleted: boolean;
  pendingEnabled: boolean;
  defaultViewMode: "month" | "day" | "all";
  defaultPriority: "high" | "medium" | "low" | undefined;
  defaultSortBy: SortOption;
  syncWithGoogleCalendar: boolean;
}

export const defaultSettings: UserSettings = {
  aiEnabled: true,
  autoRemoveCompleted: false,
  pendingEnabled: true,
  defaultViewMode: "all",
  defaultPriority: undefined,
  defaultSortBy: "newest",
  syncWithGoogleCalendar: true,
};

interface SettingsState {
  settings: UserSettings;
}

interface SettingsActions {
  updateSettings: (updates: Partial<UserSettings>) => void;
  resetSettings: () => void;
}

type SettingsStore = SettingsState & SettingsActions;

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,

      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }));
      },

      resetSettings: () => {
        set({ settings: defaultSettings });
      },
    }),
    {
      name: "user-settings",
      version: 1,
    }
  )
);
