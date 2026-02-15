/**
 * SendGrid Email Skill
 */

import sgMail from '@sendgrid/mail';
import { SkillBase } from '../../../packages/sdk/src/index.js';

export interface SendGridConfig extends Record<string, unknown> {
  apiKey: string;
  fromEmail?: string;
  fromName?: string;
}

export interface SendGridInput extends Record<string, unknown> {
  action: 'send' | 'sendBulk' | 'sendTemplate';
  params: Record<string, any>;
}

export interface SendGridOutput {
  success: boolean;
  data?: any;
  error?: string;
  [key: string]: unknown; // Index signature for SkillBase compatibility
}

export class SendGridSkill extends SkillBase<SendGridInput, SendGridOutput> {
  readonly id = 'sendgrid';
  readonly name = 'SendGrid Email';
  readonly version = '1.0.0';
  readonly description = 'Send transactional emails via SendGrid';

  protected config: SendGridConfig;

  constructor(config: SendGridConfig) {
    super();
    this.config = config;
    sgMail.setApiKey(config.apiKey);
  }

  async execute(input: SendGridInput): Promise<SendGridOutput> {
    try {
      switch (input.action) {
        case 'send':
          const result = await sgMail.send({
            to: input.params.to,
            from: input.params.from || this.config.fromEmail || '',
            subject: input.params.subject,
            text: input.params.text,
            html: input.params.html
          });
          return { success: true, data: result };
          
        case 'sendBulk':
          const bulkResult = await sgMail.sendMultiple({
            to: input.params.to,
            from: input.params.from || this.config.fromEmail || '',
            subject: input.params.subject,
            text: input.params.text,
            html: input.params.html
          });
          return { success: true, data: bulkResult };
          
        case 'sendTemplate':
          const templateResult = await sgMail.send({
            to: input.params.to,
            from: input.params.from || this.config.fromEmail || '',
            templateId: input.params.templateId,
            dynamicTemplateData: input.params.data
          });
          return { success: true, data: templateResult };
          
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

  async validate(input: SendGridInput): Promise<boolean> {
    return !!input?.action && !!input?.params;
  }
}

export function createSendGridSkill(config: SendGridConfig): SendGridSkill {
  return new SendGridSkill(config);
}
