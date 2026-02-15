/**
 * Twilio SMS Skill
 */

import twilio from 'twilio';
import { SkillBase } from '../../../packages/sdk/src/index.js';

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
  [key: string]: unknown; // Index signature for SkillBase compatibility
}

export interface TwilioInput {
  action: 'sendSMS' | 'makeCall' | 'listMessages';
  params: Record<string, any>;
  [key: string]: unknown; // Index signature for SkillBase compatibility
}

export interface TwilioOutput {
  success: boolean;
  data?: any;
  error?: string;
  [key: string]: unknown; // Index signature for SkillBase compatibility
}

export class TwilioSkill extends SkillBase<TwilioInput, TwilioOutput> {
  readonly id = 'twilio';
  readonly name = 'Twilio SMS';
  readonly version = '1.0.0';
  readonly description = 'Send SMS messages and make calls with Twilio';
  
  private client: ReturnType<typeof twilio>;
  private fromNumber: string;

  constructor(config: TwilioConfig) {
    super();
    this.client = twilio(config.accountSid, config.authToken);
    this.fromNumber = config.phoneNumber;
  }

  async execute(input: TwilioInput): Promise<TwilioOutput> {
    try {
      switch (input.action) {
        case 'sendSMS':
          const message = await this.client.messages.create({
            body: input.params.message,
            from: this.fromNumber,
            to: input.params.to
          });
          return { success: true, data: { sid: message.sid, status: message.status } };
          
        case 'makeCall':
          const call = await this.client.calls.create({
            url: input.params.twimlUrl,
            from: this.fromNumber,
            to: input.params.to
          });
          return { success: true, data: { sid: call.sid, status: call.status } };
          
        case 'listMessages':
          const messages = await this.client.messages.list({
            limit: input.params.limit || 20
          });
          return { success: true, data: messages };
          
        default:
          throw new Error(`Unknown action: ${input.action}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async validate(input: TwilioInput): Promise<boolean> {
    return !!input?.action && !!input?.params;
  }
}

export function createTwilioSkill(config: TwilioConfig): TwilioSkill {
  return new TwilioSkill(config);
}
