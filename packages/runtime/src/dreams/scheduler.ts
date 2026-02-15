/**
 * Dream Scheduler - Manages nightly dream processing schedule
 *
 * Triggers dream sessions based on:
 * - Scheduled time (configurable per agent)
 * - Manual triggers
 * - Event-driven triggers
 */

import { DreamProcessor, type DreamSession } from "./dream-processor";

export interface ScheduleConfig {
  agentId: string;
  enabled: boolean;
  scheduledTime: string; // HH:MM format (e.g., "03:00" for 3 AM)
  timezone?: string; // Timezone (default: UTC)
  daysOfWeek?: number[]; // 0-6 (Sunday-Saturday), default: all days
}

export interface SchedulerOptions {
  dreamProcessor: DreamProcessor;
}

/**
 * Manages dream session scheduling
 */
export class DreamScheduler {
  private readonly processor: DreamProcessor;
  private schedules: Map<string, ScheduleConfig> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  constructor(options: SchedulerOptions) {
    this.processor = options.dreamProcessor;
  }

  /**
   * Add or update a schedule for an agent
   */
  setSchedule(config: ScheduleConfig): void {
    // Validate time format
    if (!/^\d{2}:\d{2}$/.test(config.scheduledTime)) {
      throw new Error(`Invalid time format: ${config.scheduledTime}. Use HH:MM format.`);
    }

    // Clear existing timer if any
    this.clearSchedule(config.agentId);

    // Save schedule
    this.schedules.set(config.agentId, config);

    // Start timer if enabled
    if (config.enabled) {
      this.startSchedule(config);
    }
  }

  /**
   * Remove a schedule for an agent
   */
  clearSchedule(agentId: string): void {
    const timer = this.timers.get(agentId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(agentId);
    }
    this.schedules.delete(agentId);
  }

  /**
   * Get schedule for an agent
   */
  getSchedule(agentId: string): ScheduleConfig | null {
    return this.schedules.get(agentId) ?? null;
  }

  /**
   * Get all schedules
   */
  getAllSchedules(): ScheduleConfig[] {
    return Array.from(this.schedules.values());
  }

  /**
   * Manually trigger a dream session (bypass schedule)
   */
  async triggerNow(agentId: string): Promise<DreamSession> {
    return await this.processor.processDream(agentId);
  }

  /**
   * Start a scheduled timer
   */
  private startSchedule(config: ScheduleConfig): void {
    const nextRunTime = this.calculateNextRunTime(config);
    const delay = nextRunTime - Date.now();

    const timer = setTimeout(async () => {
      await this.executeScheduledDream(config);
    }, delay);

    this.timers.set(config.agentId, timer);
  }

  /**
   * Execute a scheduled dream session
   */
  private async executeScheduledDream(config: ScheduleConfig): Promise<void> {
    try {
      // Check if today is a scheduled day
      const today = new Date().getDay();
      if (config.daysOfWeek && !config.daysOfWeek.includes(today)) {
        // Skip today, schedule next run
        this.startSchedule(config);
        return;
      }

      // Process dream
      await this.processor.processDream(config.agentId);

      // Schedule next run
      this.startSchedule(config);
    } catch (error) {
      console.error(`[DreamScheduler] Failed to process dream for ${config.agentId}:`, error);

      // Still schedule next run even if this one failed
      this.startSchedule(config);
    }
  }

  /**
   * Calculate next run time based on schedule config
   */
  private calculateNextRunTime(config: ScheduleConfig): number {
    const parts = config.scheduledTime.split(":").map(Number);
    const hours = parts[0];
    const minutes = parts[1];

    if (hours === undefined || minutes === undefined) {
      throw new Error(`Invalid time format: ${config.scheduledTime}`);
    }

    const now = new Date();
    const next = new Date();
    next.setHours(hours, minutes, 0, 0);

    // If the time has already passed today, schedule for tomorrow
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }

    // If daysOfWeek is set, find next valid day
    if (config.daysOfWeek && config.daysOfWeek.length > 0) {
      while (!config.daysOfWeek.includes(next.getDay())) {
        next.setDate(next.getDate() + 1);
      }
    }

    return next.getTime();
  }

  /**
   * Enable all schedules
   */
  startAll(): void {
    for (const config of this.schedules.values()) {
      if (config.enabled && !this.timers.has(config.agentId)) {
        this.startSchedule(config);
      }
    }
  }

  /**
   * Disable all schedules
   */
  stopAll(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }

  /**
   * Get next run time for an agent
   */
  getNextRunTime(agentId: string): number | null {
    const config = this.schedules.get(agentId);
    if (!config || !config.enabled) return null;

    return this.calculateNextRunTime(config);
  }

  /**
   * Get time until next run for an agent (in milliseconds)
   */
  getTimeUntilNextRun(agentId: string): number | null {
    const nextRun = this.getNextRunTime(agentId);
    if (!nextRun) return null;

    return Math.max(0, nextRun - Date.now());
  }

  /**
   * Batch trigger for multiple agents
   */
  async triggerBatch(agentIds: string[]): Promise<Map<string, DreamSession | Error>> {
    return await this.processor.processBatch(agentIds);
  }
}

/**
 * Helper to create a default schedule config
 */
export function createDefaultSchedule(agentId: string): ScheduleConfig {
  return {
    agentId,
    enabled: true,
    scheduledTime: "03:00", // 3 AM UTC by default
    timezone: "UTC",
    daysOfWeek: undefined, // All days
  };
}

/**
 * Helper to parse cron-like time strings (for compatibility)
 */
export function parseTimeString(timeString: string): { hours: number; minutes: number } {
  const parts = timeString.split(":").map(Number);
  const hours = parts[0] ?? NaN;
  const minutes = parts[1] ?? NaN;

  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error(`Invalid time string: ${timeString}`);
  }

  return { hours, minutes };
}
