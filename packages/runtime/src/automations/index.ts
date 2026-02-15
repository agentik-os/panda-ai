/**
 * Automations Module
 * Step-094 & Step-095: Natural Language Automation Parser & Execution Engine
 *
 * Exports all automation-related modules
 */

// Intent Classifier
export {
  IntentClassifier,
  type AutomationIntent,
  type ClassifiedIntent,
} from "./intent-classifier";

// Parser
export { AutomationParser, type ParseConfig, type ParseResult } from "./parser";

// Cron Utilities
export {
  validateCronExpression,
  parseCronSchedule,
  getNextRuns,
  timeToCron,
  cronToHuman,
  getTimeUntilNextRun,
  shouldRunNow,
  matchesCron,
  getPresetDescription,
  CRON_PRESETS,
  type CronSchedule,
} from "./cron";

// Executor
export {
  AutomationExecutor,
  defaultExecutor,
  type ExecutionContext,
  type ExecutionResult,
  type ActionHandler,
} from "./executor";

// Scheduler
export {
  AutomationScheduler,
  defaultScheduler,
  type SchedulerConfig,
  type ScheduledAutomation,
} from "./scheduler";
