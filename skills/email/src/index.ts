/**
 * Email Skill (Gmail/Outlook)
 */

import { google } from "googleapis";
import { Client } from "@microsoft/microsoft-graph-client";
import { SkillBase } from "../../../packages/sdk/src/index.js";

export interface EmailConfig extends Record<string, unknown> {
  gmail?: {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
  };
  outlook?: {
    clientId: string;
    clientSecret: string;
    accessToken: string;
  };
}

export interface EmailInput {
  action: "sendEmail" | "readEmails" | "searchEmails";
  params: {
    provider: "gmail" | "outlook";
    to?: string;
    subject?: string;
    body?: string;
    cc?: string;
    bcc?: string;
    html?: boolean;
    maxResults?: number;
    query?: string;
  };
  [key: string]: unknown;
}

export interface EmailOutput {
  success: boolean;
  data?: any;
  error?: string;
  [key: string]: unknown;
}

export class EmailSkill extends SkillBase<EmailInput, EmailOutput> {
  readonly id = "email";
  readonly name = "Email (Gmail/Outlook)";
  readonly version = "1.0.0";
  readonly description =
    "Read, send, and search emails via Gmail and Outlook APIs";

  protected config: EmailConfig;

  constructor(config: EmailConfig) {
    super();
    this.config = config;
  }

  private getGmailClient() {
    if (!this.config.gmail) {
      throw new Error("Gmail configuration not provided");
    }

    const oauth2Client = new google.auth.OAuth2(
      this.config.gmail.clientId,
      this.config.gmail.clientSecret
    );

    oauth2Client.setCredentials({
      refresh_token: this.config.gmail.refreshToken,
    });

    return google.gmail({ version: "v1", auth: oauth2Client });
  }

  private getOutlookClient() {
    if (!this.config.outlook) {
      throw new Error("Outlook configuration not provided");
    }

    return Client.init({
      authProvider: (done: (error: any, token: string | null) => void) => {
        done(null, this.config.outlook!.accessToken);
      },
    });
  }

  async execute(input: EmailInput): Promise<EmailOutput> {
    try {
      switch (input.action) {
        case "sendEmail": {
          if (input.params.provider === "gmail") {
            return await this.sendGmail(input.params);
          } else if (input.params.provider === "outlook") {
            return await this.sendOutlook(input.params);
          } else {
            throw new Error("Invalid provider. Use 'gmail' or 'outlook'");
          }
        }

        case "readEmails": {
          if (input.params.provider === "gmail") {
            return await this.readGmail(input.params);
          } else if (input.params.provider === "outlook") {
            return await this.readOutlook(input.params);
          } else {
            throw new Error("Invalid provider. Use 'gmail' or 'outlook'");
          }
        }

        case "searchEmails": {
          if (input.params.provider === "gmail") {
            return await this.searchGmail(input.params);
          } else if (input.params.provider === "outlook") {
            return await this.searchOutlook(input.params);
          } else {
            throw new Error("Invalid provider. Use 'gmail' or 'outlook'");
          }
        }

        default:
          throw new Error(`Unknown action: ${input.action}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private async sendGmail(params: EmailInput["params"]): Promise<EmailOutput> {
    const gmail = this.getGmailClient();

    const emailLines = [
      `To: ${params.to}`,
      params.cc ? `Cc: ${params.cc}` : "",
      params.bcc ? `Bcc: ${params.bcc}` : "",
      `Subject: ${params.subject}`,
      params.html ? "Content-Type: text/html; charset=utf-8" : "",
      "",
      params.body,
    ].filter((line) => line !== "");

    const email = emailLines.join("\r\n");
    const encodedEmail = Buffer.from(email)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedEmail,
      },
    });

    return {
      success: true,
      data: {
        id: response.data.id,
        threadId: response.data.threadId,
        labelIds: response.data.labelIds,
      },
    };
  }

  private async sendOutlook(
    params: EmailInput["params"]
  ): Promise<EmailOutput> {
    const client = this.getOutlookClient();

    const message = {
      subject: params.subject,
      body: {
        contentType: params.html ? "HTML" : "Text",
        content: params.body,
      },
      toRecipients: params.to
        ? [
            {
              emailAddress: {
                address: params.to,
              },
            },
          ]
        : [],
      ccRecipients: params.cc
        ? params.cc.split(",").map((email) => ({
            emailAddress: { address: email.trim() },
          }))
        : [],
      bccRecipients: params.bcc
        ? params.bcc.split(",").map((email) => ({
            emailAddress: { address: email.trim() },
          }))
        : [],
    };

    const response = await client.api("/me/sendMail").post({
      message,
      saveToSentItems: true,
    });

    return {
      success: true,
      data: response,
    };
  }

  private async readGmail(params: EmailInput["params"]): Promise<EmailOutput> {
    const gmail = this.getGmailClient();

    const response = await gmail.users.messages.list({
      userId: "me",
      maxResults: params.maxResults || 10,
      q: params.query || "",
    });

    const messages = response.data.messages || [];

    const emailDetails = await Promise.all(
      messages.map(async (message: { id?: string | null }) => {
        const details = await gmail.users.messages.get({
          userId: "me",
          id: message.id!,
        });
        return details.data;
      })
    );

    return {
      success: true,
      data: {
        emails: emailDetails,
        totalResults: messages.length,
      },
    };
  }

  private async readOutlook(
    params: EmailInput["params"]
  ): Promise<EmailOutput> {
    const client = this.getOutlookClient();

    const top = params.maxResults || 10;
    const filter = params.query ? `contains(subject,'${params.query}')` : "";

    let apiCall = client.api("/me/messages").top(top).select("subject,from,receivedDateTime,bodyPreview");

    if (filter) {
      apiCall = apiCall.filter(filter);
    }

    const response = await apiCall.get();

    return {
      success: true,
      data: {
        emails: response.value,
        totalResults: response.value.length,
      },
    };
  }

  private async searchGmail(
    params: EmailInput["params"]
  ): Promise<EmailOutput> {
    if (!params.query) {
      throw new Error("Query parameter is required for search");
    }

    return await this.readGmail({
      ...params,
      query: params.query,
    });
  }

  private async searchOutlook(
    params: EmailInput["params"]
  ): Promise<EmailOutput> {
    if (!params.query) {
      throw new Error("Query parameter is required for search");
    }

    return await this.readOutlook({
      ...params,
      query: params.query,
    });
  }

  async validate(input: EmailInput): Promise<boolean> {
    if (!input?.action || !input?.params) {
      return false;
    }

    if (!input.params.provider) {
      return false;
    }

    if (input.params.provider !== "gmail" && input.params.provider !== "outlook") {
      return false;
    }

    // Validate action-specific requirements
    if (input.action === "sendEmail") {
      return !!(
        input.params.to &&
        input.params.subject &&
        input.params.body
      );
    }

    if (input.action === "searchEmails") {
      return !!input.params.query;
    }

    return true;
  }
}

export function createEmailSkill(config: EmailConfig): EmailSkill {
  return new EmailSkill(config);
}
