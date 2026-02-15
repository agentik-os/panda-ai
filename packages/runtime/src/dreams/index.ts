/**
 * Agent Dreams - Autonomous Night Mode
 *
 * Agents process conversations overnight, detect patterns, generate insights,
 * and deliver morning reports.
 *
 * @module dreams
 */

export { DreamProcessor, type DreamSession, type DreamProcessorOptions } from "./dream-processor";
export {
  DreamScheduler,
  createDefaultSchedule,
  parseTimeString,
  type ScheduleConfig,
  type SchedulerOptions,
} from "./scheduler";
export { PatternDetector, type Pattern, type PatternDetectionOptions } from "./pattern-detector";
export {
  InsightGenerator,
  type Insight,
  type InsightGenerationOptions,
} from "./insight-generator";
