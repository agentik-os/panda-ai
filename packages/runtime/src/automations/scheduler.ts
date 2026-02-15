/**
 * Automation Scheduler
 * Step-095: Automation Execution Engine
 *
 * Cron-based automation scheduler and executor
 */

import type { OSModeAutomation } from "@agentik-os/shared";
import cron from "node-cron";
import type { ScheduledTask } from "node-cron";
import { AutomationExecutor, type ExecutionContext, type ExecutionResult } from "./executor";
import { validateCronExpression, parseCronSchedule } from "./cron";

export interface SchedulerConfig {
  executor?: AutomationExecutor;
  timezone?: string; // e.g., "America/New_York"
  errorHandler?: (automation: OSModeAutomation, error: Error) => void;
  beforeExecution?: (automation: OSModeAutomation) => Promise<boolean>; // Return false to skip
  afterExecution?: (automation: OSModeAutomation, result: ExecutionResult) => void;
}

export interface ScheduledAutomation {
  automation: OSModeAutomation;
  task: ScheduledTask;
  lastRun?: Date;
  lastResult?: ExecutionResult;
  nextRun?: Date;
  runCount: number;
  errorCount: number;
}

/**
 * Automation Scheduler
 * Manages scheduled execution of cron-based automations
 */
export class AutomationScheduler {
  private executor: AutomationExecutor;
  private scheduled: Map<string, ScheduledAutomation>;
  private config: SchedulerConfig;
  private isRunning = false;

  constructor(config: SchedulerConfig = {}) {
    this.executor = config.executor || new AutomationExecutor();
    this.scheduled = new Map();
    this.config = config;
  }

  /**
   * Schedule an automation
   */
  schedule(automation: OSModeAutomation): boolean {
    // Only schedule cron-based automations
    if (automation.trigger.type !== "cron") {
      console.warn(`Cannot schedule non-cron automation: ${automation.id}`);
      return false;
    }

    // Validate cron expression
    if (!validateCronExpression(automation.trigger.schedule)) {
      console.error(`Invalid cron expression for automation ${automation.id}: ${automation.trigger.schedule}`);
      return false;
    }

    // Unschedule if already scheduled
    if (this.scheduled.has(automation.id)) {
      this.unschedule(automation.id);
    }

    try {
      // Create cron task
      const task = cron.schedule(
        automation.trigger.schedule,
        async () => {
          await this.executeScheduled(automation);
        },
        {
          timezone: this.config.timezone,
        }
      );

      // Get next run time
      const schedule = parseCronSchedule(automation.trigger.schedule, 1);

      // Store scheduled automation
      this.scheduled.set(automation.id, {
        automation,
        task,
        nextRun: schedule.nextRun,
        runCount: 0,
        errorCount: 0,
      });

      // Start task if scheduler is running
      if (this.isRunning && automation.enabled) {
        task.start();
      }

      console.log(
        `Scheduled automation: ${automation.name} (${automation.id}) - Next run: ${schedule.nextRun?.toISOString()}`
      );

      return true;
    } catch (error) {
      console.error(`Failed to schedule automation ${automation.id}:`, error);
      return false;
    }
  }

  /**
   * Unschedule an automation
   */
  unschedule(automationId: string): boolean {
    const scheduled = this.scheduled.get(automationId);

    if (!scheduled) {
      return false;
    }

    // Stop and destroy task
    scheduled.task.stop();

    // Remove from map
    this.scheduled.delete(automationId);

    console.log(`Unscheduled automation: ${automationId}`);

    return true;
  }

  /**
   * Schedule multiple automations
   */
  scheduleMany(automations: OSModeAutomation[]): number {
    let successCount = 0;

    for (const automation of automations) {
      if (this.schedule(automation)) {
        successCount++;
      }
    }

    return successCount;
  }

  /**
   * Unschedule multiple automations
   */
  unscheduleMany(automationIds: string[]): number {
    let successCount = 0;

    for (const id of automationIds) {
      if (this.unschedule(id)) {
        successCount++;
      }
    }

    return successCount;
  }

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.isRunning) {
      console.warn("Scheduler is already running");
      return;
    }

    this.isRunning = true;

    // Start all enabled tasks
    for (const scheduled of this.scheduled.values()) {
      if (scheduled.automation.enabled) {
        scheduled.task.start();
      }
    }

    console.log(`Scheduler started with ${this.scheduled.size} automations`);
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (!this.isRunning) {
      console.warn("Scheduler is not running");
      return;
    }

    this.isRunning = false;

    // Stop all tasks
    for (const scheduled of this.scheduled.values()) {
      scheduled.task.stop();
    }

    console.log("Scheduler stopped");
  }

  /**
   * Execute a scheduled automation
   */
  private async executeScheduled(automation: OSModeAutomation): Promise<void> {
    const scheduled = this.scheduled.get(automation.id);

    if (!scheduled) {
      console.warn(`Scheduled automation not found: ${automation.id}`);
      return;
    }

    // Check if automation is enabled
    if (!automation.enabled) {
      console.log(`Skipping disabled automation: ${automation.id}`);
      return;
    }

    try {
      // Call beforeExecution hook
      if (this.config.beforeExecution) {
        const shouldExecute = await this.config.beforeExecution(automation);
        if (!shouldExecute) {
          console.log(`Execution skipped by beforeExecution hook: ${automation.id}`);
          return;
        }
      }

      // Execute automation
      const context: ExecutionContext = {
        automation,
        triggeredAt: new Date(),
        triggerData: {
          type: "cron",
          schedule: automation.trigger.type === "cron" ? automation.trigger.schedule : undefined,
        },
      };

      const result = await this.executor.execute(context);

      // Update scheduled automation
      scheduled.lastRun = new Date();
      scheduled.lastResult = result;
      scheduled.runCount++;

      if (!result.success) {
        scheduled.errorCount++;
      }

      // Update next run time
      const schedule = parseCronSchedule(
        automation.trigger.type === "cron" ? automation.trigger.schedule : "* * * * *",
        1
      );
      scheduled.nextRun = schedule.nextRun;

      // Call afterExecution hook
      if (this.config.afterExecution) {
        this.config.afterExecution(automation, result);
      }
    } catch (error) {
      console.error(`Error executing scheduled automation ${automation.id}:`, error);

      // Update error count
      scheduled.errorCount++;

      // Call error handler
      if (this.config.errorHandler && error instanceof Error) {
        this.config.errorHandler(automation, error);
      }
    }
  }

  /**
   * Execute an automation immediately (bypass schedule)
   */
  async executeNow(automation: OSModeAutomation): Promise<ExecutionResult> {
    const context: ExecutionContext = {
      automation,
      triggeredAt: new Date(),
      triggerData: {
        type: "manual",
      },
    };

    const result = await this.executor.execute(context);

    // Update last run if scheduled
    const scheduled = this.scheduled.get(automation.id);
    if (scheduled) {
      scheduled.lastRun = new Date();
      scheduled.lastResult = result;
      scheduled.runCount++;
      if (!result.success) {
        scheduled.errorCount++;
      }
    }

    return result;
  }

  /**
   * Get scheduled automation info
   */
  getScheduled(automationId: string): ScheduledAutomation | undefined {
    return this.scheduled.get(automationId);
  }

  /**
   * Get all scheduled automations
   */
  getAllScheduled(): ScheduledAutomation[] {
    return Array.from(this.scheduled.values());
  }

  /**
   * Get scheduler status
   */
  getStatus(): {
    isRunning: boolean;
    totalScheduled: number;
    enabledCount: number;
    disabledCount: number;
  } {
    const scheduled = this.getAllScheduled();
    const enabled = scheduled.filter((s) => s.automation.enabled);

    return {
      isRunning: this.isRunning,
      totalScheduled: scheduled.length,
      enabledCount: enabled.length,
      disabledCount: scheduled.length - enabled.length,
    };
  }

  /**
   * Get execution statistics
   */
  getStats(): {
    totalRuns: number;
    totalErrors: number;
    successRate: number;
    averageRunsPerAutomation: number;
  } {
    const scheduled = this.getAllScheduled();

    const totalRuns = scheduled.reduce((sum, s) => sum + s.runCount, 0);
    const totalErrors = scheduled.reduce((sum, s) => sum + s.errorCount, 0);

    return {
      totalRuns,
      totalErrors,
      successRate: totalRuns > 0 ? ((totalRuns - totalErrors) / totalRuns) * 100 : 0,
      averageRunsPerAutomation: scheduled.length > 0 ? totalRuns / scheduled.length : 0,
    };
  }

  /**
   * Enable/disable an automation
   */
  setEnabled(automationId: string, enabled: boolean): boolean {
    const scheduled = this.scheduled.get(automationId);

    if (!scheduled) {
      return false;
    }

    // Update automation enabled status
    scheduled.automation.enabled = enabled;

    // Start/stop task based on enabled status and scheduler state
    if (this.isRunning) {
      if (enabled) {
        scheduled.task.start();
      } else {
        scheduled.task.stop();
      }
    }

    console.log(`Automation ${automationId} ${enabled ? "enabled" : "disabled"}`);

    return true;
  }

  /**
   * Unschedule all automations
   */
  clear(): void {
    const automationIds = Array.from(this.scheduled.keys());
    this.unscheduleMany(automationIds);
    console.log("Cleared all scheduled automations");
  }

  /**
   * Destroy scheduler and clean up resources
   */
  destroy(): void {
    this.stop();
    this.clear();
    console.log("Scheduler destroyed");
  }
}

/**
 * Default scheduler instance
 */
export const defaultScheduler = new AutomationScheduler();
