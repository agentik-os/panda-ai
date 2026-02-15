/**
 * Automation Executor
 * Step-095: Automation Execution Engine
 *
 * Executes automation actions when triggered
 */

import type { OSModeAutomation } from "@agentik-os/shared";

export interface ExecutionContext {
  automation: OSModeAutomation;
  triggeredAt: Date;
  triggerData?: Record<string, unknown>; // Data from trigger (e.g., webhook payload, event data)
}

export interface ExecutionResult {
  success: boolean;
  output?: unknown;
  error?: string;
  duration: number; // milliseconds
  executedAt: Date;
}

export type ActionHandler = (context: ExecutionContext) => Promise<ExecutionResult>;

/**
 * Automation Executor
 * Executes automation actions with error handling and logging
 */
export class AutomationExecutor {
  private actionHandlers: Map<string, ActionHandler>;

  constructor() {
    this.actionHandlers = new Map();
    this.registerBuiltInHandlers();
  }

  /**
   * Register an action handler
   */
  registerHandler(actionType: string, handler: ActionHandler): void {
    this.actionHandlers.set(actionType, handler);
  }

  /**
   * Unregister an action handler
   */
  unregisterHandler(actionType: string): void {
    this.actionHandlers.delete(actionType);
  }

  /**
   * Execute an automation
   */
  async execute(context: ExecutionContext): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      // Get handler for action
      const handler = this.getHandler(context.automation.action);

      if (!handler) {
        return {
          success: false,
          error: `No handler registered for action: ${context.automation.action}`,
          duration: Date.now() - startTime,
          executedAt: new Date(),
        };
      }

      // Execute action
      console.log(`Executing automation: ${context.automation.name} (${context.automation.id})`);
      const result = await handler(context);

      console.log(
        `Automation ${context.automation.id} ${result.success ? "succeeded" : "failed"} in ${result.duration}ms`
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      console.error(`Automation ${context.automation.id} failed:`, errorMessage);

      return {
        success: false,
        error: errorMessage,
        duration,
        executedAt: new Date(),
      };
    }
  }

  /**
   * Get handler for an action
   */
  private getHandler(action: string): ActionHandler | undefined {
    // Try exact match first
    if (this.actionHandlers.has(action)) {
      return this.actionHandlers.get(action);
    }

    // Try to find handler by prefix (e.g., "send_email" matches "send_*")
    for (const [key, handler] of this.actionHandlers.entries()) {
      if (key.includes("*")) {
        const pattern = key.replace(/\*/g, ".*");
        const regex = new RegExp(`^${pattern}$`);
        if (regex.test(action)) {
          return handler;
        }
      }
    }

    return undefined;
  }

  /**
   * Register built-in action handlers
   */
  private registerBuiltInHandlers(): void {
    // Log action - for testing and debugging
    this.registerHandler("log", async (context) => {
      const startTime = Date.now();
      console.log("Automation log:", context.automation.name, context.triggerData);
      return {
        success: true,
        output: { message: "Logged" },
        duration: Date.now() - startTime,
        executedAt: new Date(),
      };
    });

    // Noop action - does nothing (for testing)
    this.registerHandler("noop", async () => {
      const startTime = Date.now();
      return {
        success: true,
        output: { message: "No operation" },
        duration: Date.now() - startTime,
        executedAt: new Date(),
      };
    });

    // Echo action - returns trigger data
    this.registerHandler("echo", async (context) => {
      const startTime = Date.now();
      return {
        success: true,
        output: context.triggerData,
        duration: Date.now() - startTime,
        executedAt: new Date(),
      };
    });

    // Send notification (placeholder - would integrate with notification service)
    this.registerHandler("send_notification", async (context) => {
      const startTime = Date.now();
      console.log("Sending notification:", context.automation.name);
      // TODO: Integrate with notification service
      return {
        success: true,
        output: { notificationSent: true },
        duration: Date.now() - startTime,
        executedAt: new Date(),
      };
    });

    // Send email (placeholder - would integrate with email service)
    this.registerHandler("send_email", async (context) => {
      const startTime = Date.now();
      console.log("Sending email:", context.automation.name);
      // TODO: Integrate with email service (e.g., SendGrid, Resend)
      return {
        success: true,
        output: { emailSent: true },
        duration: Date.now() - startTime,
        executedAt: new Date(),
      };
    });

    // Create task (placeholder - would integrate with task service)
    this.registerHandler("create_task", async (context) => {
      const startTime = Date.now();
      console.log("Creating task:", context.automation.name);
      // TODO: Integrate with task management system
      return {
        success: true,
        output: { taskId: `task_${Date.now()}` },
        duration: Date.now() - startTime,
        executedAt: new Date(),
      };
    });

    // HTTP request (placeholder - would make actual HTTP calls)
    this.registerHandler("http_request", async (context) => {
      const startTime = Date.now();
      console.log("Making HTTP request:", context.automation.name);
      // TODO: Make actual HTTP request with fetch
      return {
        success: true,
        output: { requestMade: true },
        duration: Date.now() - startTime,
        executedAt: new Date(),
      };
    });

    // Run agent (placeholder - would spawn an agent)
    this.registerHandler("run_agent", async (context) => {
      const startTime = Date.now();
      console.log("Running agent:", context.automation.name);
      // TODO: Spawn and run AI agent
      return {
        success: true,
        output: { agentRun: true },
        duration: Date.now() - startTime,
        executedAt: new Date(),
      };
    });
  }

  /**
   * Get list of registered action types
   */
  getRegisteredActions(): string[] {
    return Array.from(this.actionHandlers.keys());
  }

  /**
   * Check if an action is supported
   */
  supportsAction(action: string): boolean {
    return this.getHandler(action) !== undefined;
  }

  /**
   * Execute multiple automations in parallel
   */
  async executeMany(contexts: ExecutionContext[]): Promise<ExecutionResult[]> {
    const results = await Promise.allSettled(contexts.map((ctx) => this.execute(ctx)));

    return results.map((result, _index) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        return {
          success: false,
          error: result.reason instanceof Error ? result.reason.message : "Unknown error",
          duration: 0,
          executedAt: new Date(),
        };
      }
    });
  }

  /**
   * Execute with retry logic
   */
  async executeWithRetry(
    context: ExecutionContext,
    maxRetries = 3,
    retryDelay = 1000
  ): Promise<ExecutionResult> {
    let lastError: string | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const result = await this.execute(context);

      if (result.success) {
        return result;
      }

      lastError = result.error;

      if (attempt < maxRetries) {
        console.log(
          `Automation ${context.automation.id} failed (attempt ${attempt}/${maxRetries}), retrying in ${retryDelay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }

    return {
      success: false,
      error: `Failed after ${maxRetries} attempts. Last error: ${lastError}`,
      duration: 0,
      executedAt: new Date(),
    };
  }

  /**
   * Execute with timeout
   */
  async executeWithTimeout(context: ExecutionContext, timeout: number): Promise<ExecutionResult> {
    return Promise.race([
      this.execute(context),
      new Promise<ExecutionResult>((resolve) =>
        setTimeout(
          () =>
            resolve({
              success: false,
              error: `Execution timeout after ${timeout}ms`,
              duration: timeout,
              executedAt: new Date(),
            }),
          timeout
        )
      ),
    ]);
  }
}

/**
 * Default executor instance
 */
export const defaultExecutor = new AutomationExecutor();
