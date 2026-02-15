/**
 * OS Modes - System-level agent team configurations
 * Steps 82-88: OS Modes Implementation
 */

export { ModeStacker } from "./stacker";
export {
  SharedMemoryManager,
  type MemoryEntry,
  type MemoryQuery,
} from "./shared-memory";
export { ModeLoader, modeLoader } from "./loader";

// Re-export shared types
export type {
  OSMode,
  OSModeAgent,
  OSModeAutomation,
  OSModeAutomationTrigger,
  OSModeDashboardWidget,
  OSModeType,
  ActiveModeStack,
  OfficialModeId,
} from "@agentik-os/shared";

export { OFFICIAL_MODE_IDS } from "@agentik-os/shared";
