"use server";

import { generateObject } from "ai";
import { z } from "zod";
import { llm } from "@/lib/models";
import { DetermineActionFn } from "@/types/actions";

export const determineAction: DetermineActionFn = async (
  text,
  tasks,
  model = "qwen-2.5",
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

# TASK PROCESSING INSTRUCTIONS

## CORE PRINCIPLES:
1. ALWAYS check the task list first to understand context
2. Process multiple actions in a single request when needed
3. NEVER add duplicates of existing tasks
4. Maintain task text in natural language format
5. Process ALL requested changes in a single response

## CRITICAL RULES:
- When the user references an existing task AND mentions time/priority/date, this is ALWAYS an edit request
- Each action MUST include the complete set of fields being modified (time, priority, etc.)
- For edit actions, use taskId to identify tasks (NEVER use text to identify tasks)
- When the user wants to change time for a task, update BOTH the scheduled_time field AND the targetDate field when applicable
- DO NOT modify the original task text during edits unless explicitly requested

${
  tasks
    ? `## CURRENT TASK LIST:
${tasks
  ?.map(
    (task) =>
      `- ${task.id}: ${task.text}${
        task.scheduled_time ? ` (Time: ${task.scheduled_time})` : ""
      }${task.priority ? ` (Priority: ${task.priority})` : ""}`
  )
  .join("\n")}
`
    : "## CURRENT TASK LIST: Empty"
}

## SUPPORTED ACTIONS:
1. add: Create a new task
2. delete: Remove an existing task
3. mark: Set task status as complete/incomplete
4. sort: Reorder tasks by specified criteria
5. edit: Modify task details (text, time, date, priority)
6. clear: Remove all tasks or a subset
7. export: Export tasks to file

## TIME PROCESSING:
- Always convert scheduled_time to 24-hour format (HH:mm)
- "2pm" → "14:00"
- "2:30pm" → "14:30"
- "8am" → "08:00"
- "9" → "09:00"
- "12" → "12:00"

## DATE PROCESSING:
- "today" → "${todayStr}"
- "tomorrow" → "${tomorrowStr}"
- Day names (Monday, Tuesday) → next occurrence
- "next week" → date of next week
- "in X days" → calculated date

## PRIORITY LEVELS:
- high: urgent, important, critical, top, asap
- medium: normal, moderate
- low: minor, minimal, lowest

## COMMAND PATTERNS:
- ADD: "add [task text] [at scheduled_time] [on date] [priority]"
- EDIT: "[task reference] [is at scheduled_time] [is on date] [priority]"
- MARK: "[task reference] [is done/completed/finished]"
- DELETE: "[delete/remove] [task reference]"
- SORT: "[sort/order] by [criteria]"
- CLEAR: "[clear/remove] [all/completed/incomplete] tasks"
- EXPORT: "[export/download/save] tasks"

## RESPONSE FORMAT:
Return an array of action objects. Each action must have the complete set of fields needed:
- For add: action, text, targetDate (when specified), scheduled_time (when specified), priority (when specified)
- For edit: action, taskId, plus ANY fields being modified (text, scheduled_time, targetDate, priority)
- For mark: action, taskId, status
- For delete: action, taskId
- For sort: action, sortBy
- For clear: action, listToClear
- For export: action

## EXAMPLES:

### ADD TASKS:
- "add get coffee today" → {action: "add", text: "get coffee", targetDate: "${todayStr}"}
- "add team meeting tomorrow at 3pm" → {action: "add", text: "team meeting", targetDate: "${tomorrowStr}", scheduled_time: "15:00"}
- "add high priority dentist appointment next friday at 10am" → {action: "add", text: "dentist appointment", targetDate: "[next friday date]", scheduled_time: "10:00", priority: "high"}

### EDIT TASKS:
- For task with id "123abc" and text "bbq at ross's house":
  "ross's bbq is at 9pm and high priority" → {action: "edit", taskId: "123abc", scheduled_time: "21:00", priority: "high"}

- For task with id "456def" and text "team meeting":
  "meeting is tomorrow at 2pm" → {action: "edit", taskId: "456def", targetDate: "${tomorrowStr}", scheduled_time: "14:00"}

- For task with id "789ghi" and text "get coffee":
  "i meant get tea" → {action: "edit", taskId: "789ghi", text: "get tea"}

### MARK TASKS:
- For task with id "123abc" and text "call mom":
  "i called mom" → {action: "mark", taskId: "123abc", status: "complete"}

- For task with id "456def" and text "dentist appointment":
  "unmark dentist" → {action: "mark", taskId: "456def", status: "incomplete"}

### MULTIPLE ACTIONS:
- "add buy groceries today and mark dentist as complete" 
  → [{action: "add", text: "buy groceries", targetDate: "${todayStr}"}, 
     {action: "mark", taskId: "[dentist task id]", status: "complete"}]

## IMPORTANT REMINDERS:
- For EDIT actions, include ALL fields being modified in a single action
- NEVER create a new task when modifying an existing one
- Always use taskId for edit/mark/delete actions
- Return all requested changes in one response
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
          scheduled_time: z
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
