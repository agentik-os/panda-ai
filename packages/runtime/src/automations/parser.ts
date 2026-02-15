/**
 * Automation Parser
 * Step-094: Natural Language Automation Parser
 *
 * LLM-based parser to convert plain English to automation config
 */

import type { OSModeAutomation, OSModeAutomationTrigger } from "@agentik-os/shared";
import { IntentClassifier, type ClassifiedIntent } from "./intent-classifier";
import { AnthropicProvider } from "../router/providers/anthropic";

export interface ParseConfig {
  apiKey: string; // Anthropic API key
  model?: string; // Default: claude-sonnet-4-5-20250929
  temperature?: number; // Default: 0.3
}

export interface ParseResult {
  automation: OSModeAutomation;
  confidence: number; // 0-1
  reasoning: string; // LLM's reasoning
  suggestions?: string[]; // Suggestions to improve the automation
}

export class AutomationParser {
  private classifier: IntentClassifier;
  private provider: AnthropicProvider;
  private model: string;
  private temperature: number;

  constructor(config: ParseConfig) {
    this.classifier = new IntentClassifier();
    this.provider = new AnthropicProvider({ apiKey: config.apiKey });
    this.model = config.model || "claude-sonnet-4-5-20250929";
    this.temperature = config.temperature ?? 0.3;
  }

  /**
   * Parse natural language into automation config
   */
  async parse(text: string): Promise<ParseResult> {
    // Step 1: Classify intent using rule-based classifier
    const classification = this.classifier.classify(text);

    // Step 2: Use LLM to extract detailed entities and validate
    const llmResult = await this.llmParse(text, classification);

    // Step 3: Build automation config
    const automation = this.buildAutomation(classification, llmResult);

    return {
      automation,
      confidence: this.calculateConfidence(classification, llmResult),
      reasoning: llmResult.reasoning,
      suggestions: llmResult.suggestions,
    };
  }

  /**
   * Use LLM to parse automation details
   */
  private async llmParse(
    text: string,
    classification: ClassifiedIntent
  ): Promise<{
    trigger: OSModeAutomationTrigger;
    action: string;
    name: string;
    description: string;
    reasoning: string;
    suggestions: string[];
  }> {
    const prompt = this.buildPrompt(text, classification);

    const response = await this.provider.chat(
      [{ role: "user", content: prompt }],
      this.model,
      undefined,
      this.temperature
    );

    // Parse JSON response
    const parsed = this.parseResponse(response.content);

    return parsed;
  }

  /**
   * Build LLM prompt
   */
  private buildPrompt(text: string, classification: ClassifiedIntent): string {
    let prompt = `You are an automation parser. Convert the following natural language automation request into structured JSON.

Input: "${text}"

Initial Classification:
- Intent: ${classification.intent}
- Confidence: ${classification.confidence}
- Entities: ${JSON.stringify(classification.entities, null, 2)}

Your task:
1. Determine the trigger type and details
2. Determine the action to perform
3. Generate a clear name (max 50 chars)
4. Generate a detailed description (max 200 chars)
5. Provide reasoning for your choices
6. Suggest improvements if needed

Return ONLY valid JSON in this exact format:
{
  "trigger": {
    "type": "cron" | "event" | "webhook",
    "schedule"?: "cron expression",
    "event"?: "event name",
    "path"?: "webhook path"
  },
  "action": "description of action to perform",
  "name": "automation name",
  "description": "automation description",
  "reasoning": "why you chose these values",
  "suggestions": ["suggestion 1", "suggestion 2"]
}

Examples:

Input: "Every day at 9am, send me a summary email"
Output: {
  "trigger": { "type": "cron", "schedule": "0 9 * * *" },
  "action": "send_email",
  "name": "Daily Summary Email",
  "description": "Send summary email every day at 9am",
  "reasoning": "Cron trigger for daily schedule, email action",
  "suggestions": ["Specify email template", "Add recipients"]
}

Input: "When a new user signs up, send welcome email"
Output: {
  "trigger": { "type": "event", "event": "user.created" },
  "action": "send_welcome_email",
  "name": "Welcome New Users",
  "description": "Send welcome email when new user signs up",
  "reasoning": "Event trigger for user creation, welcome email action",
  "suggestions": ["Customize email template", "Add onboarding sequence"]
}

Input: "Listen for GitHub webhooks at /api/github and create tasks"
Output: {
  "trigger": { "type": "webhook", "path": "/api/github" },
  "action": "create_task_from_webhook",
  "name": "GitHub Webhook Handler",
  "description": "Create tasks from GitHub webhook events",
  "reasoning": "Webhook trigger for GitHub events, task creation action",
  "suggestions": ["Filter specific events", "Add validation"]
}

Now parse: "${text}"`;

    return prompt;
  }

  /**
   * Parse LLM response
   */
  private parseResponse(content: string): {
    trigger: OSModeAutomationTrigger;
    action: string;
    name: string;
    description: string;
    reasoning: string;
    suggestions: string[];
  } {
    try {
      // Extract JSON from markdown code blocks if present
      let jsonStr = content.trim();
      const codeBlockMatch = jsonStr.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1]!;
      }

      const parsed = JSON.parse(jsonStr);

      // Validate required fields
      if (!parsed.trigger || !parsed.action || !parsed.name || !parsed.description) {
        throw new Error("Missing required fields in LLM response");
      }

      // Validate trigger type
      if (!["cron", "event", "webhook"].includes(parsed.trigger.type)) {
        throw new Error(`Invalid trigger type: ${parsed.trigger.type}`);
      }

      // Validate trigger has required field
      if (parsed.trigger.type === "cron" && !parsed.trigger.schedule) {
        throw new Error("Cron trigger missing schedule");
      }
      if (parsed.trigger.type === "event" && !parsed.trigger.event) {
        throw new Error("Event trigger missing event");
      }
      if (parsed.trigger.type === "webhook" && !parsed.trigger.path) {
        throw new Error("Webhook trigger missing path");
      }

      return {
        trigger: parsed.trigger as OSModeAutomationTrigger,
        action: parsed.action,
        name: parsed.name,
        description: parsed.description,
        reasoning: parsed.reasoning || "No reasoning provided",
        suggestions: parsed.suggestions || [],
      };
    } catch (error) {
      throw new Error(
        `Failed to parse LLM response: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Build automation config from classification and LLM result
   */
  private buildAutomation(
    _classification: ClassifiedIntent,
    llmResult: {
      trigger: OSModeAutomationTrigger;
      action: string;
      name: string;
      description: string;
    }
  ): OSModeAutomation {
    return {
      id: this.generateId(),
      name: llmResult.name,
      description: llmResult.description,
      trigger: llmResult.trigger,
      action: llmResult.action,
      enabled: true,
    };
  }

  /**
   * Calculate overall confidence
   */
  private calculateConfidence(
    classification: ClassifiedIntent,
    llmResult: { reasoning: string }
  ): number {
    // Base confidence from classifier
    let confidence = classification.confidence;

    // Boost if LLM reasoning is detailed
    if (llmResult.reasoning.length > 100) {
      confidence = Math.min(1, confidence + 0.1);
    }

    // Penalize if intent was unknown
    if (classification.intent === "unknown") {
      confidence = Math.max(0, confidence - 0.3);
    }

    return confidence;
  }

  /**
   * Generate unique automation ID
   */
  private generateId(): string {
    return `auto_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  /**
   * Validate automation config
   */
  validateAutomation(automation: OSModeAutomation): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!automation.id || automation.id.length === 0) {
      errors.push("Automation ID is required");
    }

    if (!automation.name || automation.name.length === 0) {
      errors.push("Automation name is required");
    }

    if (automation.name && automation.name.length > 50) {
      errors.push("Automation name must be <= 50 characters");
    }

    if (!automation.description || automation.description.length === 0) {
      errors.push("Automation description is required");
    }

    if (automation.description && automation.description.length > 200) {
      errors.push("Automation description must be <= 200 characters");
    }

    if (!automation.action || automation.action.length === 0) {
      errors.push("Automation action is required");
    }

    // Validate trigger
    if (!automation.trigger) {
      errors.push("Automation trigger is required");
    } else {
      if (automation.trigger.type === "cron") {
        if (!automation.trigger.schedule) {
          errors.push("Cron trigger requires schedule");
        } else if (!this.isValidCron(automation.trigger.schedule)) {
          errors.push("Invalid cron expression");
        }
      } else if (automation.trigger.type === "event") {
        if (!automation.trigger.event) {
          errors.push("Event trigger requires event name");
        }
      } else if (automation.trigger.type === "webhook") {
        if (!automation.trigger.path) {
          errors.push("Webhook trigger requires path");
        } else if (!automation.trigger.path.startsWith("/")) {
          errors.push("Webhook path must start with /");
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate cron expression (basic check)
   */
  private isValidCron(expression: string): boolean {
    const parts = expression.split(" ");
    return parts.length === 5;
  }

  /**
   * Parse multiple automations from a list
   */
  async parseMultiple(texts: string[]): Promise<ParseResult[]> {
    const results: ParseResult[] = [];

    for (const text of texts) {
      try {
        const result = await this.parse(text);
        results.push(result);
      } catch (error) {
        console.error(`Failed to parse automation: ${text}`, error);
        // Continue with other automations
      }
    }

    return results;
  }

  /**
   * Convert automation back to natural language (for display)
   */
  automationToText(automation: OSModeAutomation): string {
    let text = "";

    // Trigger
    if (automation.trigger.type === "cron") {
      text += this.cronToText(automation.trigger.schedule);
    } else if (automation.trigger.type === "event") {
      text += `When ${automation.trigger.event} event occurs`;
    } else if (automation.trigger.type === "webhook") {
      text += `When webhook ${automation.trigger.path} is called`;
    }

    // Action
    text += `, ${automation.action}`;

    return text;
  }

  /**
   * Convert cron to human-readable text
   */
  private cronToText(schedule: string): string {
    const parts = schedule.split(" ");
    if (parts.length !== 5) return schedule;

    const [minute, hour, _dayOfMonth, _month, dayOfWeek] = parts;

    // Common patterns
    if (schedule === "0 * * * *") return "Every hour";
    if (schedule === "0 0 * * *") return "Every day at midnight";
    if (schedule.match(/^\d+ \d+ \* \* \*$/)) return `Every day at ${hour}:${minute?.padStart(2, "0")}`;
    if (schedule.match(/^\d+ \d+ \* \* \d+$/)) {
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      return `Every ${days[parseInt(dayOfWeek!)]} at ${hour}:${minute?.padStart(2, "0")}`;
    }

    return schedule; // Fallback to raw cron
  }
}
