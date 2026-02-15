/**
 * Audit Logger - Immutable Audit Trail
 *
 * Records all user and agent actions for compliance and security
 */

import type { ConvexAdapter } from "../storage/convex-adapter";

/**
 * Audit event types
 */
export enum AuditEventType {
  // Authentication
  USER_LOGIN = "user.login",
  USER_LOGOUT = "user.logout",
  USER_LOGIN_FAILED = "user.login-failed",

  // User Management
  USER_CREATED = "user.created",
  USER_UPDATED = "user.updated",
  USER_DELETED = "user.deleted",
  USER_ROLE_CHANGED = "user.role-changed",

  // Agent Management
  AGENT_CREATED = "agent.created",
  AGENT_UPDATED = "agent.updated",
  AGENT_DELETED = "agent.deleted",
  AGENT_EXECUTED = "agent.executed",

  // Conversation
  CONVERSATION_DELETED = "conversation.deleted",
  SESSION_DELETED = "session.deleted",

  // Dream Management
  DREAM_TRIGGERED = "dream.triggered",
  DREAM_DELETED = "dream.deleted",

  // Time Travel
  TIME_TRAVEL_REPLAY = "time-travel.replay",

  // Skill Management
  SKILL_INSTALLED = "skill.installed",
  SKILL_UNINSTALLED = "skill.uninstalled",
  SKILL_PUBLISHED = "skill.published",

  // Marketplace
  MARKETPLACE_PUBLISHED = "marketplace.published",
  MARKETPLACE_APPROVED = "marketplace.approved",
  MARKETPLACE_REJECTED = "marketplace.rejected",

  // Cost Management
  COST_LIMIT_SET = "cost.limit-set",
  COST_ALERT_TRIGGERED = "cost.alert-triggered",

  // System Configuration
  CONFIG_UPDATED = "config.updated",

  // Security
  PERMISSION_DENIED = "security.permission-denied",
  UNAUTHORIZED_ACCESS = "security.unauthorized-access",

  // Data Export
  DATA_EXPORTED = "data.exported",
}

/**
 * Audit event severity
 */
export enum AuditSeverity {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  CRITICAL = "critical",
}

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  id?: string;
  timestamp: number;
  userId: string;
  userEmail?: string;
  eventType: AuditEventType;
  severity: AuditSeverity;
  resource: string; // e.g., "agent/agent-123"
  action: string; // e.g., "create", "update", "delete"
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  organizationId?: string;
  success: boolean;
  errorMessage?: string;
}

/**
 * Audit query filters
 */
export interface AuditQueryFilters {
  userId?: string;
  eventType?: AuditEventType;
  resource?: string;
  startDate?: number;
  endDate?: number;
  severity?: AuditSeverity;
  organizationId?: string;
  limit?: number;
  offset?: number;
}

/**
 * Audit logger options
 */
export interface AuditLoggerOptions {
  convexAdapter?: ConvexAdapter;
  enabled?: boolean;
}

/**
 * Audit Logger
 */
export class AuditLogger {
  private adapter?: ConvexAdapter;
  private enabled: boolean;
  private buffer: AuditLogEntry[] = [];
  private readonly MAX_BUFFER_SIZE = 100;

  constructor(options: AuditLoggerOptions = {}) {
    this.adapter = options.convexAdapter;
    this.enabled = options.enabled ?? true;
  }

  /**
   * Log an audit event
   */
  async log(entry: Omit<AuditLogEntry, "id" | "timestamp">): Promise<void> {
    if (!this.enabled) return;

    const fullEntry: AuditLogEntry = {
      ...entry,
      timestamp: Date.now(),
    };

    // Add to buffer
    this.buffer.push(fullEntry);

    // Flush if buffer is full
    if (this.buffer.length >= this.MAX_BUFFER_SIZE) {
      await this.flush();
    }

    // Also log to console (for development)
    if (process.env.NODE_ENV === "development") {
      console.log("[AUDIT]", fullEntry);
    }
  }

  /**
   * Log successful operation
   */
  async logSuccess(params: {
    userId: string;
    userEmail?: string;
    eventType: AuditEventType;
    resource: string;
    action: string;
    details?: Record<string, unknown>;
    severity?: AuditSeverity;
    ipAddress?: string;
    userAgent?: string;
    organizationId?: string;
  }): Promise<void> {
    await this.log({
      ...params,
      severity: params.severity ?? AuditSeverity.INFO,
      details: params.details ?? {},
      success: true,
    });
  }

  /**
   * Log failed operation
   */
  async logFailure(params: {
    userId: string;
    userEmail?: string;
    eventType: AuditEventType;
    resource: string;
    action: string;
    errorMessage: string;
    details?: Record<string, unknown>;
    severity?: AuditSeverity;
    ipAddress?: string;
    userAgent?: string;
    organizationId?: string;
  }): Promise<void> {
    await this.log({
      ...params,
      severity: params.severity ?? AuditSeverity.ERROR,
      details: params.details ?? {},
      success: false,
      errorMessage: params.errorMessage,
    });
  }

  /**
   * Log authentication event
   */
  async logAuth(params: {
    userId: string;
    userEmail: string;
    eventType: AuditEventType.USER_LOGIN | AuditEventType.USER_LOGOUT | AuditEventType.USER_LOGIN_FAILED;
    success: boolean;
    errorMessage?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.log({
      ...params,
      resource: `user/${params.userId}`,
      action: params.eventType.split(".")[1] ?? "auth",
      severity: params.success ? AuditSeverity.INFO : AuditSeverity.WARNING,
      details: {},
    });
  }

  /**
   * Log permission denied
   */
  async logPermissionDenied(params: {
    userId: string;
    userEmail?: string;
    resource: string;
    action: string;
    requiredPermission: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.log({
      ...params,
      eventType: AuditEventType.PERMISSION_DENIED,
      severity: AuditSeverity.WARNING,
      details: { requiredPermission: params.requiredPermission },
      success: false,
      errorMessage: `Permission denied: ${params.requiredPermission}`,
    });
  }

  /**
   * Flush buffer to storage
   */
  async flush(): Promise<void> {
    if (!this.adapter || this.buffer.length === 0) return;

    try {
      // In production, would batch insert to Convex
      // For now, store in memory or use console
      // TODO: Implement Convex batch insert when schema is ready

      // Clear buffer
      this.buffer = [];
    } catch (error) {
      console.error("[AuditLogger] Failed to flush logs:", error);
    }
  }

  /**
   * Query audit logs
   */
  async query(filters: AuditQueryFilters): Promise<AuditLogEntry[]> {
    if (!this.adapter) {
      // Return from buffer for testing
      return this.buffer.filter((entry) => {
        if (filters.userId && entry.userId !== filters.userId) return false;
        if (filters.eventType && entry.eventType !== filters.eventType) return false;
        if (filters.resource && !entry.resource.startsWith(filters.resource)) return false;
        if (filters.severity && entry.severity !== filters.severity) return false;
        if (filters.startDate && entry.timestamp < filters.startDate) return false;
        if (filters.endDate && entry.timestamp > filters.endDate) return false;
        if (filters.organizationId && entry.organizationId !== filters.organizationId) return false;
        return true;
      });
    }

    // TODO: Query from Convex when schema is ready
    return [];
  }

  /**
   * Export audit logs (for compliance)
   */
  async export(filters: AuditQueryFilters): Promise<string> {
    const logs = await this.query(filters);

    // Export as CSV
    const headers = [
      "timestamp",
      "userId",
      "userEmail",
      "eventType",
      "severity",
      "resource",
      "action",
      "success",
      "errorMessage",
    ];

    const rows = logs.map((log) => [
      new Date(log.timestamp).toISOString(),
      log.userId,
      log.userEmail ?? "",
      log.eventType,
      log.severity,
      log.resource,
      log.action,
      log.success ? "true" : "false",
      log.errorMessage ?? "",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");

    return csv;
  }

  /**
   * Get audit statistics
   */
  async getStats(filters: Omit<AuditQueryFilters, "limit" | "offset">): Promise<{
    total: number;
    bySeverity: Record<AuditSeverity, number>;
    byEventType: Record<string, number>;
    failureRate: number;
  }> {
    const logs = await this.query(filters);

    const bySeverity: Record<AuditSeverity, number> = {
      [AuditSeverity.INFO]: 0,
      [AuditSeverity.WARNING]: 0,
      [AuditSeverity.ERROR]: 0,
      [AuditSeverity.CRITICAL]: 0,
    };

    const byEventType: Record<string, number> = {};
    let failures = 0;

    for (const log of logs) {
      bySeverity[log.severity]++;

      byEventType[log.eventType] = (byEventType[log.eventType] ?? 0) + 1;

      if (!log.success) {
        failures++;
      }
    }

    return {
      total: logs.length,
      bySeverity,
      byEventType,
      failureRate: logs.length > 0 ? failures / logs.length : 0,
    };
  }

  /**
   * Enable/disable audit logging
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

/**
 * Global audit logger instance
 */
let globalAuditLogger: AuditLogger | null = null;

/**
 * Get global audit logger
 */
export function getAuditLogger(): AuditLogger {
  if (!globalAuditLogger) {
    globalAuditLogger = new AuditLogger();
  }
  return globalAuditLogger;
}

/**
 * Initialize global audit logger
 */
export function initializeAuditLogger(options: AuditLoggerOptions): void {
  globalAuditLogger = new AuditLogger(options);
}

/**
 * Quick log function (uses global logger)
 */
export async function auditLog(entry: Omit<AuditLogEntry, "id" | "timestamp">): Promise<void> {
  await getAuditLogger().log(entry);
}
