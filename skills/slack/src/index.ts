/**
 * Slack Integration Skill
 */

import { WebClient } from '@slack/web-api';
import { SkillBase } from '../../../packages/sdk/src/index.js';

export interface SlackConfig {
  botToken: string;
  signingSecret: string;
  [key: string]: unknown; // Index signature for SkillBase compatibility
}

export interface SlackInput {
  action: 'sendMessage' | 'createChannel' | 'listChannels';
  params: Record<string, any>;
  [key: string]: unknown; // Index signature for SkillBase compatibility
}

export interface SlackOutput {
  success: boolean;
  data?: any;
  error?: string;
  [key: string]: unknown; // Index signature for SkillBase compatibility
}

export class SlackSkill extends SkillBase<SlackInput, SlackOutput> {
  readonly id = 'slack';
  readonly name = 'Slack Integration';
  readonly version = '1.0.0';
  readonly description = 'Send messages and manage Slack channels';
  
  private client: WebClient;

  constructor(config: SlackConfig) {
    super();
    this.client = new WebClient(config.botToken);
  }

  async execute(input: SlackInput): Promise<SlackOutput> {
    try {
      switch (input.action) {
        case 'sendMessage':
          const msgResult = await this.client.chat.postMessage({
            channel: input.params.channel,
            text: input.params.text,
            ...(input.params.threadTs && { thread_ts: input.params.threadTs })
          });
          return { success: true, data: msgResult };
          
        case 'createChannel':
          const channelResult = await this.client.conversations.create({
            name: input.params.name,
            is_private: input.params.isPrivate || false
          });
          return { success: true, data: channelResult };
          
        case 'listChannels':
          const listResult = await this.client.conversations.list();
          return { success: true, data: listResult.channels };
          
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

  async validate(input: SlackInput): Promise<boolean> {
    return !!input?.action && !!input?.params;
  }
}

export function createSlackSkill(config: SlackConfig): SlackSkill {
  return new SlackSkill(config);
}
