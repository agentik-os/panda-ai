/**
 * Budget Alert Notifications
 *
 * Sends budget alerts via multiple channels:
 * - Email (Resend API)
 * - Webhook (HTTP POST)
 * - Telegram (Bot API)
 * - In-app (Convex mutation)
 */

import type { Id } from "../../../../convex/_generated/dataModel";
import type { BudgetStatus, BudgetConfig } from "./budget-checker";

/**
 * Notification channel types
 */
export type NotificationChannel = "email" | "webhook" | "telegram" | "in-app";

/**
 * Notification payload
 */
export interface NotificationPayload {
  agentId: Id<"agents">;
  agentName?: string;
  threshold: number;
  currentSpend: number;
  limitAmount: number;
  percentUsed: number;
  period: "daily" | "weekly" | "monthly" | "per-conversation";
  resetTime: number;
  isPaused: boolean;
  enforcementAction: "warn" | "pause" | "block";
}

/**
 * Send budget alert notification
 *
 * @param budget - Budget configuration
 * @param status - Current budget status
 * @param threshold - Alert threshold that was triggered
 */
export async function sendAlert(
  budget: BudgetConfig,
  status: BudgetStatus,
): Promise<void> {
  if (!status.shouldAlert || !status.threshold) {
    return; // No alert needed
  }

  const payload: NotificationPayload = {
    agentId: budget.agentId,
    threshold: status.threshold,
    currentSpend: status.currentSpend ?? 0,
    limitAmount: status.limitAmount ?? 0,
    percentUsed: status.percentUsed ?? 0,
    period: budget.period,
    resetTime: budget.resetTime,
    isPaused: status.isPaused ?? false,
    enforcementAction: budget.enforcementAction,
  };

  // Send to all configured channels
  const promises = budget.notificationChannels.map((channel) => {
    switch (channel) {
      case "email":
        return sendEmailAlert(payload, budget);
      case "webhook":
        return sendWebhookAlert(payload, budget);
      case "telegram":
        return sendTelegramAlert(payload, budget);
      case "in-app":
        return sendInAppAlert(payload, budget);
      default:
        return Promise.resolve();
    }
  });

  await Promise.allSettled(promises);
}

/**
 * Send email alert via Resend
 */
async function sendEmailAlert(
  payload: NotificationPayload,
  budget: BudgetConfig,
): Promise<boolean> {
  if (!budget.emailAddress) {
    console.warn("[Notifications] No email address configured for budget");
    return false;
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.warn("[Notifications] RESEND_API_KEY not configured");
    return false;
  }

  const subject = getEmailSubject(payload);
  const html = getEmailHtml(payload);

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: process.env.BUDGET_ALERT_FROM_EMAIL ?? "alerts@agentik-os.com",
        to: budget.emailAddress,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[Notifications] Email failed:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[Notifications] Email error:", error);
    return false;
  }
}

/**
 * Send webhook alert via HTTP POST
 */
async function sendWebhookAlert(
  payload: NotificationPayload,
  budget: BudgetConfig,
): Promise<boolean> {
  if (!budget.webhookUrl) {
    console.warn("[Notifications] No webhook URL configured for budget");
    return false;
  }

  try {
    const response = await fetch(budget.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Agentik-OS-Budget-Alerts/1.0",
      },
      body: JSON.stringify({
        event: "budget.alert",
        timestamp: Date.now(),
        data: payload,
      }),
    });

    if (!response.ok) {
      console.error(
        `[Notifications] Webhook failed: ${response.status} ${response.statusText}`,
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error("[Notifications] Webhook error:", error);
    return false;
  }
}

/**
 * Send Telegram alert via Bot API
 */
async function sendTelegramAlert(
  payload: NotificationPayload,
  budget: BudgetConfig,
): Promise<boolean> {
  if (!budget.telegramChatId) {
    console.warn("[Notifications] No Telegram chat ID configured for budget");
    return false;
  }

  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!telegramBotToken) {
    console.warn("[Notifications] TELEGRAM_BOT_TOKEN not configured");
    return false;
  }

  const message = getTelegramMessage(payload);

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: budget.telegramChatId,
          text: message,
          parse_mode: "Markdown",
        }),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("[Notifications] Telegram failed:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[Notifications] Telegram error:", error);
    return false;
  }
}

/**
 * Send in-app alert (store in Convex for dashboard display)
 */
async function sendInAppAlert(
  payload: NotificationPayload,
  _budget: BudgetConfig,
): Promise<boolean> {
  // In-app alerts are handled by the dashboard
  // We just log here; the dashboard subscribes to budget status
  console.log(
    `[Notifications] In-app alert: Agent ${payload.agentId} at ${payload.percentUsed.toFixed(1)}% of budget`,
  );
  return true;
}

/**
 * Generate email subject line
 */
function getEmailSubject(payload: NotificationPayload): string {
  const severity = payload.threshold >= 100 ? "🚨 CRITICAL" : "⚠️ WARNING";
  return `${severity}: Agent Budget Alert (${payload.percentUsed.toFixed(0)}%)`;
}

/**
 * Generate email HTML body
 */
function getEmailHtml(payload: NotificationPayload): string {
  const emoji = payload.threshold >= 100 ? "🚨" : "⚠️";
  const color = payload.threshold >= 100 ? "#dc2626" : "#ea580c";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Budget Alert</title>
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: ${color}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">${emoji} Budget Alert</h1>
  </div>

  <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="margin-top: 0;">Your agent has reached <strong>${payload.percentUsed.toFixed(1)}%</strong> of its budget limit.</p>

    <div style="background: white; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Agent ID:</td>
          <td style="padding: 8px 0; font-weight: 600; text-align: right;">${payload.agentId}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Current Spend:</td>
          <td style="padding: 8px 0; font-weight: 600; text-align: right;">$${payload.currentSpend.toFixed(4)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Budget Limit:</td>
          <td style="padding: 8px 0; font-weight: 600; text-align: right;">$${payload.limitAmount.toFixed(4)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Usage:</td>
          <td style="padding: 8px 0; font-weight: 600; text-align: right; color: ${color};">${payload.percentUsed.toFixed(1)}%</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Period:</td>
          <td style="padding: 8px 0; font-weight: 600; text-align: right;">${payload.period}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Reset:</td>
          <td style="padding: 8px 0; font-weight: 600; text-align: right;">${new Date(payload.resetTime).toLocaleDateString()}</td>
        </tr>
      </table>
    </div>

    ${
      payload.isPaused
        ? `
    <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 12px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #991b1b; font-weight: 600;">⚠️ Agent Paused</p>
      <p style="margin: 8px 0 0 0; color: #7f1d1d; font-size: 14px;">
        The agent has been automatically paused due to budget limit. No further requests will be processed until the budget is reset or increased.
      </p>
    </div>
    `
        : ""
    }

    <p style="margin-bottom: 0; font-size: 14px; color: #6b7280;">
      To manage budget settings, visit your Agentik OS dashboard.
    </p>
  </div>

  <div style="margin-top: 20px; padding: 15px; background: #f9fafb; border-radius: 6px; font-size: 12px; color: #6b7280;">
    <p style="margin: 0;">This is an automated alert from Agentik OS Budget Monitoring.</p>
    <p style="margin: 8px 0 0 0;">© ${new Date().getFullYear()} Agentik OS</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate Telegram message
 */
function getTelegramMessage(payload: NotificationPayload): string {
  const emoji = payload.threshold >= 100 ? "🚨" : "⚠️";
  const status = payload.isPaused ? "\n\n⚠️ *Agent Paused*" : "";

  return `
${emoji} *Budget Alert*

Agent \`${payload.agentId}\` has reached *${payload.percentUsed.toFixed(1)}%* of its budget limit.

*Current Spend:* $${payload.currentSpend.toFixed(4)}
*Budget Limit:* $${payload.limitAmount.toFixed(4)}
*Period:* ${payload.period}
*Reset:* ${new Date(payload.resetTime).toLocaleDateString()}${status}
  `.trim();
}

/**
 * Test notification channels
 *
 * @param budget - Budget configuration
 * @returns Test results for each channel
 */
export async function testNotifications(
  budget: BudgetConfig,
): Promise<Record<NotificationChannel, boolean>> {
  const testPayload: NotificationPayload = {
    agentId: budget.agentId,
    threshold: 50,
    currentSpend: 5.0,
    limitAmount: 10.0,
    percentUsed: 50,
    period: budget.period,
    resetTime: budget.resetTime,
    isPaused: false,
    enforcementAction: "warn",
  };

  const results: Partial<Record<NotificationChannel, boolean>> = {};

  for (const channel of budget.notificationChannels) {
    switch (channel) {
      case "email":
        results.email = await sendEmailAlert(testPayload, budget);
        break;
      case "webhook":
        results.webhook = await sendWebhookAlert(testPayload, budget);
        break;
      case "telegram":
        results.telegram = await sendTelegramAlert(testPayload, budget);
        break;
      case "in-app":
        results["in-app"] = await sendInAppAlert(testPayload, budget);
        break;
    }
  }

  return results as Record<NotificationChannel, boolean>;
}
