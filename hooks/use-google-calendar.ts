import { useAuth, useUser } from "@clerk/nextjs";
import { useCallback, useState } from "react";
import { TaskItem } from "@/types";
import { toast } from "sonner";

interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
}

export function useGoogleCalendar() {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const [isSyncing, setIsSyncing] = useState(false);

  // Check if user has Google connected
  const hasGoogleConnected = useCallback(() => {
    if (!isSignedIn || !user) return false;

    return user.externalAccounts.some(
      (account) =>
        account.provider === "google" &&
        account.verification?.status === "verified"
    );
  }, [isSignedIn, user]);

  // Convert task to Google Calendar event
  const taskToEvent = useCallback((task: TaskItem): GoogleCalendarEvent => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Set start time based on scheduled_time or default to noon
    let startDateTime = new Date(task.date);
    if (task.scheduled_time) {
      const [hours, minutes] = task.scheduled_time.split(":").map(Number);
      startDateTime.setHours(hours, minutes, 0, 0);
    } else {
      startDateTime.setHours(12, 0, 0, 0);
    }

    // Set end time 1 hour after start time
    const endDateTime = new Date(startDateTime);
    endDateTime.setHours(endDateTime.getHours() + 1);

    // Create description with task priority
    let description = task.text;
    if (task.priority) {
      description += `\nPriority: ${task.priority}`;
    }

    return {
      summary: task.text,
      description,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: timezone,
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: timezone,
      },
    };
  }, []);

  // Create event in Google Calendar
  const createEvent = useCallback(
    async (task: TaskItem): Promise<string | null> => {
      if (!isSignedIn || !hasGoogleConnected()) {
        return null;
      }

      try {
        setIsSyncing(true);

        const token = await getToken({ template: "google_calendar" });
        if (!token) {
          throw new Error("Failed to get Google Calendar token");
        }

        const event = taskToEvent(task);
        const response = await fetch(
          "https://www.googleapis.com/calendar/v3/calendars/primary/events",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(event),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || "Failed to create event");
        }

        const result = await response.json();
        return result.id;
      } catch (error) {
        console.error("Error creating Google Calendar event:", error);
        toast.error("Failed to sync with Google Calendar", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
        return null;
      } finally {
        setIsSyncing(false);
      }
    },
    [isSignedIn, hasGoogleConnected, getToken, taskToEvent]
  );

  // Update event in Google Calendar
  const updateEvent = useCallback(
    async (task: TaskItem, eventId: string): Promise<boolean> => {
      if (!isSignedIn || !hasGoogleConnected() || !eventId) {
        return false;
      }

      try {
        setIsSyncing(true);

        const token = await getToken({ template: "google_calendar" });
        if (!token) {
          throw new Error("Failed to get Google Calendar token");
        }

        const event = taskToEvent(task);
        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(event),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || "Failed to update event");
        }

        return true;
      } catch (error) {
        console.error("Error updating Google Calendar event:", error);
        toast.error("Failed to update Google Calendar event", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
        return false;
      } finally {
        setIsSyncing(false);
      }
    },
    [isSignedIn, hasGoogleConnected, getToken, taskToEvent]
  );

  // Delete event from Google Calendar
  const deleteEvent = useCallback(
    async (eventId: string): Promise<boolean> => {
      if (!isSignedIn || !hasGoogleConnected() || !eventId) {
        return false;
      }

      try {
        setIsSyncing(true);

        const token = await getToken({ template: "google_calendar" });
        if (!token) {
          throw new Error("Failed to get Google Calendar token");
        }

        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok && response.status !== 410) {
          // 410 Gone means already deleted
          const error = await response.json();
          throw new Error(error.error?.message || "Failed to delete event");
        }

        return true;
      } catch (error) {
        console.error("Error deleting Google Calendar event:", error);
        toast.error("Failed to delete Google Calendar event", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
        return false;
      } finally {
        setIsSyncing(false);
      }
    },
    [isSignedIn, hasGoogleConnected, getToken]
  );

  return {
    isSignedIn,
    hasGoogleConnected,
    isSyncing,
    createEvent,
    updateEvent,
    deleteEvent,
  };
}
