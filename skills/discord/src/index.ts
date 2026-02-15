/**
 * Discord Bot Skill
 */

import { Client, GatewayIntentBits } from 'discord.js';
import { SkillBase } from '../../../packages/sdk/src/index.js';

export interface DiscordConfig {
  botToken: string;
  applicationId: string;
  [key: string]: unknown; // Index signature for SkillBase compatibility
}

export interface DiscordInput {
  action: 'sendMessage' | 'createChannel' | 'getGuild';
  params: Record<string, any>;
  [key: string]: unknown; // Index signature for SkillBase compatibility
}

export interface DiscordOutput {
  success: boolean;
  data?: any;
  error?: string;
  [key: string]: unknown; // Index signature for SkillBase compatibility
}

export class DiscordSkill extends SkillBase<DiscordInput, DiscordOutput> {
  readonly id = 'discord';
  readonly name = 'Discord Bot';
  readonly version = '1.0.0';
  readonly description = 'Manage Discord servers and send messages';
  
  private client: Client;
  private ready: boolean = false;

  constructor(config: DiscordConfig) {
    super();
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
      ]
    });
    
    this.client.on('ready', () => {
      this.ready = true;
    });
    
    this.client.login(config.botToken);
  }

  async execute(input: DiscordInput): Promise<DiscordOutput> {
    try {
      if (!this.ready) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      switch (input.action) {
        case 'sendMessage':
          const channel = await this.client.channels.fetch(input.params.channelId);
          if (channel && 'send' in channel && typeof channel.send === 'function') {
            const message = await channel.send(input.params.text);
            return { success: true, data: { id: message.id, content: message.content } };
          }
          throw new Error('Channel not found or not text-based');
          
        case 'getGuild':
          const guild = await this.client.guilds.fetch(input.params.guildId);
          return { success: true, data: { id: guild.id, name: guild.name } };
          
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

  async validate(input: DiscordInput): Promise<boolean> {
    return !!input?.action && !!input?.params;
  }
}

export function createDiscordSkill(config: DiscordConfig): DiscordSkill {
  return new DiscordSkill(config);
}
