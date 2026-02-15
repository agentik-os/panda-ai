/**
 * Intent Classifier
 * Step-094: Natural Language Automation Parser
 *
 * Classifies automation intents from natural language
 */

export type AutomationIntent =
  | "schedule_task" // Run something on a schedule
  | "event_trigger" // Trigger on an event
  | "webhook_listener" // Listen for webhook
  | "condition_check" // Check a condition
  | "data_sync" // Sync data between systems
  | "notification" // Send notifications
  | "unknown";

export interface ClassifiedIntent {
  intent: AutomationIntent;
  confidence: number; // 0-1
  entities: {
    trigger?: {
      type: "cron" | "event" | "webhook";
      value: string;
    };
    action?: {
      type: string;
      target?: string;
      params?: Record<string, unknown>;
    };
    schedule?: string; // Cron expression or human-readable schedule
    event?: string; // Event name
    webhook?: string; // Webhook path
  };
  suggestions?: string[]; // Suggestions to improve the automation
}

export class IntentClassifier {
  /**
   * Classify automation intent from natural language
   */
  classify(text: string): ClassifiedIntent {
    const normalizedText = text.toLowerCase().trim();

    // Check for schedule-based automations
    if (this.isScheduleIntent(normalizedText)) {
      return this.classifySchedule(normalizedText);
    }

    // Check for event-based automations
    if (this.isEventIntent(normalizedText)) {
      return this.classifyEvent(normalizedText);
    }

    // Check for webhook-based automations
    if (this.isWebhookIntent(normalizedText)) {
      return this.classifyWebhook(normalizedText);
    }

    // Check for notification intents
    if (this.isNotificationIntent(normalizedText)) {
      return this.classifyNotification(normalizedText);
    }

    return {
      intent: "unknown",
      confidence: 0,
      entities: {},
      suggestions: [
        "Try starting with: 'Every day at 9am...'",
        "Or: 'When a new user signs up...'",
        "Or: 'Listen for webhook at /api/github...'",
      ],
    };
  }

  /**
   * Check if text indicates a schedule intent
   */
  private isScheduleIntent(text: string): boolean {
    const scheduleKeywords = [
      "every",
      "daily",
      "weekly",
      "monthly",
      "hourly",
      "at",
      "schedule",
      "cron",
      "run",
    ];

    return scheduleKeywords.some((keyword) => text.includes(keyword));
  }

  /**
   * Check if text indicates an event intent
   */
  private isEventIntent(text: string): boolean {
    const eventKeywords = ["when", "if", "on", "after", "trigger", "event"];

    return eventKeywords.some((keyword) => text.includes(keyword));
  }

  /**
   * Check if text indicates a webhook intent
   */
  private isWebhookIntent(text: string): boolean {
    const webhookKeywords = ["webhook", "http", "post", "api", "endpoint", "listen"];

    return webhookKeywords.some((keyword) => text.includes(keyword));
  }

  /**
   * Check if text indicates a notification intent
   */
  private isNotificationIntent(text: string): boolean {
    const notificationKeywords = ["send", "notify", "alert", "email", "message", "slack", "telegram"];

    return notificationKeywords.some((keyword) => text.includes(keyword));
  }

  /**
   * Classify schedule-based automation
   */
  private classifySchedule(text: string): ClassifiedIntent {
    const schedule = this.extractSchedule(text);
    const action = this.extractAction(text);

    return {
      intent: "schedule_task",
      confidence: schedule ? 0.8 : 0.5,
      entities: {
        trigger: schedule
          ? {
              type: "cron",
              value: schedule,
            }
          : undefined,
        action,
        schedule: schedule || "Unknown schedule",
      },
    };
  }

  /**
   * Classify event-based automation
   */
  private classifyEvent(text: string): ClassifiedIntent {
    const event = this.extractEvent(text);
    const action = this.extractAction(text);

    return {
      intent: "event_trigger",
      confidence: event ? 0.8 : 0.6,
      entities: {
        trigger: event
          ? {
              type: "event",
              value: event,
            }
          : undefined,
        action,
        event: event || "Unknown event",
      },
    };
  }

  /**
   * Classify webhook-based automation
   */
  private classifyWebhook(text: string): ClassifiedIntent {
    const webhookPath = this.extractWebhookPath(text);
    const action = this.extractAction(text);

    return {
      intent: "webhook_listener",
      confidence: webhookPath ? 0.9 : 0.5,
      entities: {
        trigger: webhookPath
          ? {
              type: "webhook",
              value: webhookPath,
            }
          : undefined,
        action,
        webhook: webhookPath || "/api/webhook",
      },
    };
  }

  /**
   * Classify notification automation
   */
  private classifyNotification(text: string): ClassifiedIntent {
    const target = this.extractNotificationTarget(text);

    return {
      intent: "notification",
      confidence: 0.7,
      entities: {
        action: {
          type: "notification",
          target,
        },
      },
    };
  }

  /**
   * Extract schedule from text
   */
  private extractSchedule(text: string): string | null {
    // Pattern: "every day at 9am" → "0 9 * * *"
    const dailyMatch = text.match(/every\s+day\s+at\s+(\d+)(:(\d+))?\s*(am|pm)?/i);
    if (dailyMatch) {
      let hour = parseInt(dailyMatch[1]!);
      const minute = dailyMatch[3] ? parseInt(dailyMatch[3]) : 0;
      const period = dailyMatch[4]?.toLowerCase();

      if (period === "pm" && hour < 12) hour += 12;
      if (period === "am" && hour === 12) hour = 0;

      return `${minute} ${hour} * * *`;
    }

    // Pattern: "every hour" → "0 * * * *"
    if (text.includes("every hour")) {
      return "0 * * * *";
    }

    // Pattern: "every monday at 10am" → "0 10 * * 1"
    const weeklyMatch = text.match(/every\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+at\s+(\d+)(:(\d+))?\s*(am|pm)?/i);
    if (weeklyMatch) {
      const days = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0 };
      const day = days[weeklyMatch[1]!.toLowerCase() as keyof typeof days];
      let hour = parseInt(weeklyMatch[2]!);
      const minute = weeklyMatch[4] ? parseInt(weeklyMatch[4]) : 0;
      const period = weeklyMatch[5]?.toLowerCase();

      if (period === "pm" && hour < 12) hour += 12;
      if (period === "am" && hour === 12) hour = 0;

      return `${minute} ${hour} * * ${day}`;
    }

    return null;
  }

  /**
   * Extract event from text
   */
  private extractEvent(text: string): string | null {
    // Pattern: "when a new user signs up"
    if (text.includes("user") && (text.includes("sign") || text.includes("register"))) {
      return "user.created";
    }

    // Pattern: "when payment received"
    if (text.includes("payment") && text.includes("receive")) {
      return "payment.received";
    }

    // Pattern: "when file uploaded"
    if (text.includes("file") && text.includes("upload")) {
      return "file.uploaded";
    }

    return null;
  }

  /**
   * Extract webhook path from text
   */
  private extractWebhookPath(text: string): string | null {
    // Pattern: "listen for webhook at /api/github"
    const pathMatch = text.match(/(?:at|on)\s+(\/[a-zA-Z0-9/_-]+)/);
    if (pathMatch) {
      return pathMatch[1] ?? null;
    }

    // Default webhook path
    if (text.includes("webhook")) {
      return "/api/webhook";
    }

    return null;
  }

  /**
   * Extract action from text
   */
  private extractAction(text: string): ClassifiedIntent["entities"]["action"] {
    // Look for action verbs
    if (text.includes("send") || text.includes("notify")) {
      return {
        type: "send_notification",
        target: "email",
      };
    }

    if (text.includes("create") || text.includes("add")) {
      return {
        type: "create_record",
      };
    }

    if (text.includes("update")) {
      return {
        type: "update_record",
      };
    }

    if (text.includes("delete") || text.includes("remove")) {
      return {
        type: "delete_record",
      };
    }

    return {
      type: "custom_action",
    };
  }

  /**
   * Extract notification target from text
   */
  private extractNotificationTarget(text: string): string {
    if (text.includes("email")) return "email";
    if (text.includes("slack")) return "slack";
    if (text.includes("telegram")) return "telegram";
    if (text.includes("discord")) return "discord";

    return "email"; // Default
  }
}
