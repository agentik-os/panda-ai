/**
 * Cron Utilities
 * Step-095: Automation Execution Engine
 *
 * Utilities for parsing and validating cron expressions
 */

import cron from "node-cron";

export interface CronSchedule {
  expression: string;
  isValid: boolean;
  nextRun?: Date;
  nextRuns?: Date[]; // Next N runs
}

/**
 * Validate cron expression
 */
export function validateCronExpression(expression: string): boolean {
  return cron.validate(expression);
}

/**
 * Parse cron expression and get next run times
 */
export function parseCronSchedule(expression: string, count = 5): CronSchedule {
  const isValid = validateCronExpression(expression);

  if (!isValid) {
    return {
      expression,
      isValid: false,
    };
  }

  // Get next run times
  const nextRuns = getNextRuns(expression, count);

  return {
    expression,
    isValid: true,
    nextRun: nextRuns[0],
    nextRuns,
  };
}

/**
 * Get next N run times for a cron expression
 */
export function getNextRuns(expression: string, count: number): Date[] {
  if (!validateCronExpression(expression)) {
    return [];
  }

  const runs: Date[] = [];
  const now = new Date();

  // Use node-cron to calculate next runs
  // This is a simplified implementation - production would use a library like cron-parser
  const task = cron.schedule(expression, () => {});

  // Simulate next runs (simplified - actual implementation would use cron-parser)
  let current = new Date(now);
  for (let i = 0; i < count; i++) {
    current = getNextRun(expression, current);
    runs.push(new Date(current));
  }

  task.stop();

  return runs;
}

/**
 * Get the next run time after a given date
 * Simplified implementation - production would use cron-parser
 */
function getNextRun(expression: string, after: Date): Date {
  const parts = expression.split(" ");
  if (parts.length !== 5) {
    throw new Error("Invalid cron expression");
  }

  const [minute, hour, _dayOfMonth, _month, dayOfWeek] = parts;

  const next = new Date(after);
  next.setSeconds(0);
  next.setMilliseconds(0);

  // Increment by 1 minute and find next match
  next.setMinutes(next.getMinutes() + 1);

  // Simple heuristic for common patterns
  // Production would use proper cron parsing

  // Every hour pattern
  if (expression === "0 * * * *") {
    next.setMinutes(0);
    next.setHours(next.getHours() + 1);
    return next;
  }

  // Daily pattern
  if (expression.match(/^\d+ \d+ \* \* \*$/)) {
    const targetMinute = parseInt(minute!);
    const targetHour = parseInt(hour!);
    next.setMinutes(targetMinute);
    next.setHours(targetHour);
    if (next <= after) {
      next.setDate(next.getDate() + 1);
    }
    return next;
  }

  // Weekly pattern
  if (expression.match(/^\d+ \d+ \* \* \d+$/)) {
    const targetMinute = parseInt(minute!);
    const targetHour = parseInt(hour!);
    const targetDay = parseInt(dayOfWeek!);
    next.setMinutes(targetMinute);
    next.setHours(targetHour);

    // Find next occurrence of target day
    while (next.getDay() !== targetDay || next <= after) {
      next.setDate(next.getDate() + 1);
    }
    return next;
  }

  // Fallback: increment by 1 minute
  return next;
}

/**
 * Convert human-readable time to cron expression
 */
export function timeToCron(time: {
  minute?: number;
  hour?: number;
  dayOfMonth?: number;
  month?: number;
  dayOfWeek?: number;
}): string {
  const minute = time.minute !== undefined ? time.minute.toString() : "*";
  const hour = time.hour !== undefined ? time.hour.toString() : "*";
  const dayOfMonth = time.dayOfMonth !== undefined ? time.dayOfMonth.toString() : "*";
  const month = time.month !== undefined ? time.month.toString() : "*";
  const dayOfWeek = time.dayOfWeek !== undefined ? time.dayOfWeek.toString() : "*";

  return `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
}

/**
 * Parse cron expression to human-readable format
 */
export function cronToHuman(expression: string): string {
  const parts = expression.split(" ");
  if (parts.length !== 5) {
    return expression;
  }

  const [minute, hour, dayOfMonth, _month, dayOfWeek] = parts;

  // Common patterns
  if (expression === "* * * * *") return "Every minute";
  if (expression === "0 * * * *") return "Every hour";
  if (expression === "0 0 * * *") return "Every day at midnight";
  if (expression === "0 12 * * *") return "Every day at noon";

  if (expression.match(/^\d+ \d+ \* \* \*$/)) {
    return `Every day at ${hour}:${minute?.padStart(2, "0")}`;
  }

  if (expression.match(/^\d+ \d+ \* \* \d+$/)) {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return `Every ${days[parseInt(dayOfWeek!)]} at ${hour}:${minute?.padStart(2, "0")}`;
  }

  if (expression.match(/^\d+ \d+ \d+ \* \*$/)) {
    return `Every month on day ${dayOfMonth} at ${hour}:${minute?.padStart(2, "0")}`;
  }

  // Interval patterns
  if (expression.match(/^\*\/\d+ \* \* \* \*$/)) {
    const interval = minute!.split("/")[1];
    return `Every ${interval} minutes`;
  }

  if (expression.match(/^0 \*\/\d+ \* \* \*$/)) {
    const interval = hour!.split("/")[1];
    return `Every ${interval} hours`;
  }

  return expression; // Fallback to raw expression
}

/**
 * Get time until next run
 */
export function getTimeUntilNextRun(expression: string): number | null {
  const schedule = parseCronSchedule(expression, 1);

  if (!schedule.isValid || !schedule.nextRun) {
    return null;
  }

  const now = new Date();
  return schedule.nextRun.getTime() - now.getTime();
}

/**
 * Check if it's time to run a cron job
 */
export function shouldRunNow(expression: string, lastRun: Date | null): boolean {
  if (!validateCronExpression(expression)) {
    return false;
  }

  const now = new Date();

  // If never run, check if current time matches
  if (!lastRun) {
    return matchesCron(expression, now);
  }

  // Check if we've passed a scheduled run since last execution
  const nextRun = getNextRuns(expression, 1)[0];
  if (!nextRun) {
    return false;
  }

  return nextRun <= now && nextRun > lastRun;
}

/**
 * Check if a date matches a cron expression
 */
export function matchesCron(expression: string, date: Date): boolean {
  const parts = expression.split(" ");
  if (parts.length !== 5) {
    return false;
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  // Check minute
  if (minute !== "*" && parseInt(minute!) !== date.getMinutes()) {
    return false;
  }

  // Check hour
  if (hour !== "*" && parseInt(hour!) !== date.getHours()) {
    return false;
  }

  // Check day of month
  if (dayOfMonth !== "*" && parseInt(dayOfMonth!) !== date.getDate()) {
    return false;
  }

  // Check month (0-indexed in Date, 1-indexed in cron)
  if (month !== "*" && parseInt(month!) !== date.getMonth() + 1) {
    return false;
  }

  // Check day of week
  if (dayOfWeek !== "*" && parseInt(dayOfWeek!) !== date.getDay()) {
    return false;
  }

  return true;
}

/**
 * Common cron presets
 */
export const CRON_PRESETS = {
  EVERY_MINUTE: "* * * * *",
  EVERY_5_MINUTES: "*/5 * * * *",
  EVERY_15_MINUTES: "*/15 * * * *",
  EVERY_30_MINUTES: "*/30 * * * *",
  EVERY_HOUR: "0 * * * *",
  EVERY_2_HOURS: "0 */2 * * *",
  EVERY_6_HOURS: "0 */6 * * *",
  EVERY_12_HOURS: "0 */12 * * *",
  DAILY_AT_MIDNIGHT: "0 0 * * *",
  DAILY_AT_NOON: "0 12 * * *",
  WEEKLY_MONDAY: "0 0 * * 1",
  WEEKLY_SUNDAY: "0 0 * * 0",
  MONTHLY_FIRST: "0 0 1 * *",
  YEARLY: "0 0 1 1 *",
} as const;

/**
 * Get preset description
 */
export function getPresetDescription(preset: string): string | null {
  const descriptions: Record<string, string> = {
    "* * * * *": "Every minute",
    "*/5 * * * *": "Every 5 minutes",
    "*/15 * * * *": "Every 15 minutes",
    "*/30 * * * *": "Every 30 minutes",
    "0 * * * *": "Every hour",
    "0 */2 * * *": "Every 2 hours",
    "0 */6 * * *": "Every 6 hours",
    "0 */12 * * *": "Every 12 hours",
    "0 0 * * *": "Daily at midnight",
    "0 12 * * *": "Daily at noon",
    "0 0 * * 1": "Every Monday at midnight",
    "0 0 * * 0": "Every Sunday at midnight",
    "0 0 1 * *": "First day of every month",
    "0 0 1 1 *": "First day of every year",
  };

  return descriptions[preset] || null;
}
