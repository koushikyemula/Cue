"use server";

import { generateObject } from "ai";
import { z } from "zod";
import { llm } from "@/lib/models";
import { DetermineActionFn } from "@/types/actions";

export const determineAction: DetermineActionFn = async (
  text,
  tasks,
  model = "llama-3.3",
  timezone = "UTC"
) => {
  function getDateInTimezone(timezone: string) {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    };

    const dateTimeString = new Intl.DateTimeFormat("en-US", options).format(
      now
    );

    const [datePart] = dateTimeString.split(", ");
    const [month, day, year] = datePart
      .split("/")
      .map((num) => parseInt(num, 10));

    return `${year}-${month.toString().padStart(2, "0")}-${day
      .toString()
      .padStart(2, "0")}`;
  }

  const todayStr = getDateInTimezone(timezone);

  const todayDate = new Date(todayStr);
  const tomorrowDate = new Date(todayDate);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().split("T")[0];

  const prompt = `
        Today's date is: ${todayStr} (Timezone: ${timezone})
        The user has entered the following text: ${text}
        
        Determine the action or multiple actions to take based on the given context.
        Return an array of actions.

        Don't make assumptions about the user's intent, the task list is very important to understand the user's intent.
        Go through the task list and make sure to understand the user's intent based on the task list.
        All the text should be in lowercase!!
        Never add existing tasks to the list, only add new tasks, but perform actions on existing tasks.
        Be very mindful of the user's intent, they may want to add a task, but they may also want to delete a task, mark a task as complete, or edit a task.
        Take some humor into account, the user may be joking around or being sarcastic.

        The user can specify dates in their commands like:
        - "add get coffee today" -> targetDate: ${todayStr}
        - "add gym workout tomorrow" -> targetDate: ${tomorrowStr}
        - "add team sync next wednesday"
        - "add doctor checkup on thursday"
        - "add project planning for next month"
        - "add report submission due in 2 days"
        
        Extract the date from these commands and set it accordingly. If no date is specified, use the currently selected date.
        Parse relative dates like "today", "tomorrow", "next week", "in 3 days", etc.
        For specific days like "monday", "tuesday", etc., use the next occurrence of that day.
        Always return dates in YYYY-MM-DD format.

        The user can specify time in their commands in various natural ways:
        Examples with time:
        - "team sync at 2pm tomorrow" -> text: "team sync", time: "14:00", targetDate: ${tomorrowStr}
        - "doctor checkup at 11:30" -> text: "doctor checkup", time: "11:30", targetDate: ${todayStr}
        - "call dad at 8am" -> text: "call dad", time: "08:00"
        - "lunch with Sarah at 1:15pm" -> text: "lunch with Sarah", time: "13:15"
        - "morning standup at 9" -> text: "morning standup", time: "09:00"
        - "yoga class 6am tomorrow" -> text: "yoga class", time: "06:00", targetDate: ${tomorrowStr}
        - "dinner plans at 7:30pm saturday" -> text: "dinner plans", time: "19:30"
        - "tea break 4:30" -> text: "tea break", time: "16:30"
        
        Extract time in 24-hour format (HH:mm). Support various time formats:
        - "2pm" -> "14:00"
        - "2:30pm" -> "14:30"
        - "14:00" -> "14:00"
        - "8" -> "08:00"
        - "8:15am" -> "08:15"
        - "12" -> "12:00"
        - "12:30pm" -> "12:30"
        
        If no time is specified, omit the time field.
        Always extract the actual task text separately from the time and date information.

        Priority can be specified in commands:
        - "urgent team sync tomorrow" -> text: "team sync", priority: "high"
        - "get coffee (low priority)" -> text: "get coffee", priority: "low"
        - "important: submit report" -> text: "submit report", priority: "high"
        - "medium priority: schedule meeting" -> text: "schedule meeting", priority: "medium"
        
        Priority should be one of: high, medium, low
        If no priority is specified, omit the priority field.
        Extract priority from various phrasings: "high priority", "low priority", "urgent", "important", etc.

${
  tasks
    ? `<task_list>
${tasks?.map((task) => `- ${task.id}: ${task.text}`).join("\n")}
</task_list>`
    : ""
}

        The action should be one of the following: ${[
          "add",
          "delete",
          "mark",
          "sort",
          "edit",
          "clear",
          "export",
        ].join(", ")}
        - If the action is "add", the text and targetDate should be included.
        - If the action is "delete", the taskId should be included.
        - If the action is "mark", the taskId should be included and the status should be "complete" or "incomplete".
        - If the action is "sort", the sortBy should be included.
        - If the action is "edit", both the taskId (to identify the task to edit) and the text (the new content) should be included.
        - If the action is "clear", the user wants to clear the list of tasks with the given listToClear(all, completed, incomplete).
        - If the action is "export", the user wants to export their tasks to a JSON file to save or share.
        
        For the add action, the text should be in the future tense. like "buy groceries", "make a post with @theo", "go for violin lesson"
        For the add action, priority can be specified and should be included when present.
        
        For the sort action, the sortBy can now include "priority" to sort items by their priority level.
     
        Some queries will be ambiguous stating the tense of the text, which will allow you to infer the correct action to take on the task list. 
        The add requests will mostly likey to be in the future tense, while the complete requests will be in the past tense.
        The task list is very important to understand the user's intent.
        
        IMPORTANT: You must always use the task's ID for the actions delete, mark, and edit. Do not use the text to identify tasks.
        Example: "task id: '123abc', task text: 'get coffee', user request: 'got coffee', action: 'mark', taskId: '123abc', status: 'complete'"
        Example: "task id: '456def', task text: 'team sync with @alex', user request: 'i had the team sync', action: 'mark', taskId: '456def', status: 'complete'"
        Example: "request: 'get coffee today', action: 'add', text: 'get coffee', targetDate: '${todayStr}'"
        Example: "request: 'gym workout tomorrow', action: 'add', text: 'gym workout', targetDate: '${tomorrowStr}'"
        Example: "request: 'urgent team sync tomorrow', action: 'add', text: 'team sync', targetDate: '${tomorrowStr}', priority: 'high'"
        Example: "request: 'critical: submit project report', action: 'add', text: 'submit project report', priority: 'high'"

        The edit request will mostly be ambiguous, so make the edit as close to the original as possible to maintain the user's context with the task to edit.
        Some word could be incomplete, like "sync" instead of "synchronization", make sure to edit the task based on the task list since the task already exists just needs a rewrite.
        You can also edit just the priority of a task without changing the text.

        Example edit requests:
        "task id: '789ghi', original text: 'team sync w/ John', user request: 'i meant sync with Sarah', action: 'edit', taskId: '789ghi', text: 'team sync w/ Sarah'"
        "task id: '012jkl', original text: 'get coffee', user request: 'i meant get tea', action: 'edit', taskId: '012jkl', text: 'get tea'"
        "task id: '345mno', original text: 'go for yoga class', user request: 'i meant go for a run', action: 'edit', taskId: '345mno', text: 'go for a run'"
        "task id: '678pqr', original text: 'prepare slides', user request: 'make that high priority', action: 'edit', taskId: '678pqr', priority: 'high'"

        Example clear requests:
        "user request: 'clear all tasks', action: 'clear', listToClear: 'all'"
        "user request: 'clear my completed tasks', action: 'clear', listToClear: 'completed'"
        "user request: 'remove all incomplete items', action: 'clear', listToClear: 'incomplete'"
        "user request: 'start fresh', action: 'clear', listToClear: 'all'"
        "user request: 'delete finished tasks', action: 'clear', listToClear: 'completed'"
        "user request: 'clean up my list', action: 'clear', listToClear: 'all'"
        
        Example export requests:
        "user request: 'export my tasks', action: 'export'"
        "user request: 'download my tasks', action: 'export'"
        "user request: 'save my data', action: 'export'"
        "user request: 'backup my tasks', action: 'export'"
        "user request: 'export data', action: 'export'"
    `;

  const { object: action, usage } = await generateObject({
    model: llm.languageModel(model),
    temperature: 0,
    providerOptions: {
      groq: {
        service_tier: "auto",
      },
    },
    prompt,
    schema: z.object({
      actions: z.array(
        z.object({
          action: z
            .enum(["add", "delete", "mark", "sort", "edit", "clear", "export"])
            .describe("The action to take"),
          text: z.string().describe("The text of the task item").optional(),
          taskId: z
            .string()
            .describe("The id of the task item to act upon")
            .optional(),
          targetDate: z
            .string()
            .describe("The target date for the task item in YYYY-MM-DD format")
            .optional(),
          time: z
            .string()
            .describe("The time for the task item in HH:mm format (24-hour)")
            .optional(),
          priority: z
            .enum(["high", "medium", "low"])
            .describe("The priority level of the task item")
            .optional(),
          sortBy: z
            .enum(["newest", "oldest", "alphabetical", "completed", "priority"])
            .describe("The sort order")
            .optional(),
          status: z
            .enum(["complete", "incomplete"])
            .describe(
              "The status of the task item. to be used for the mark action"
            )
            .optional(),
          listToClear: z
            .enum(["all", "completed", "incomplete"])
            .describe("The list to clear")
            .optional(),
        })
      ),
    }),
  });
  console.log({ usage });
  return action;
};
