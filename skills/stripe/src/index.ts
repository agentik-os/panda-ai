/**
 * Stripe Payments Skill
 */

import Stripe from 'stripe';
import { SkillBase } from '../../../packages/sdk/src/index.js';

export interface StripeConfig {
  secretKey: string;
  publishableKey?: string;
  [key: string]: unknown; // Index signature for SkillBase compatibility
}

export interface StripeInput {
  action: 'createCustomer' | 'createPaymentIntent' | 'createSubscription' | 'listCustomers';
  params: Record<string, any>;
  [key: string]: unknown; // Index signature for SkillBase compatibility
}

export interface StripeOutput {
  success: boolean;
  data?: any;
  error?: string;
  [key: string]: unknown; // Index signature for SkillBase compatibility
}

export class StripeSkill extends SkillBase<StripeInput, StripeOutput> {
  readonly id = 'stripe';
  readonly name = 'Stripe Payments';
  readonly version = '1.0.0';
  readonly description = 'Process payments and manage subscriptions with Stripe';
  
  private stripe: Stripe;

  constructor(config: StripeConfig) {
    super();
    this.stripe = new Stripe(config.secretKey);
  }

  async execute(input: StripeInput): Promise<StripeOutput> {
    try {
      switch (input.action) {
        case 'createCustomer':
          const customer = await this.stripe.customers.create({
            email: input.params.email,
            name: input.params.name,
            metadata: input.params.metadata
          });
          return { success: true, data: customer };
          
        case 'createPaymentIntent':
          const paymentIntent = await this.stripe.paymentIntents.create({
            amount: input.params.amount,
            currency: input.params.currency || 'usd',
            customer: input.params.customerId,
            metadata: input.params.metadata
          });
          return { success: true, data: paymentIntent };
          
        case 'createSubscription':
          const subscription = await this.stripe.subscriptions.create({
            customer: input.params.customerId,
            items: input.params.items
          });
          return { success: true, data: subscription };
          
        case 'listCustomers':
          const customers = await this.stripe.customers.list({
            limit: input.params.limit || 10
          });
          return { success: true, data: customers.data };
          
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

  async validate(input: StripeInput): Promise<boolean> {
    return !!input?.action && !!input?.params;
  }
}

export function createStripeSkill(config: StripeConfig): StripeSkill {
  return new StripeSkill(config);
}
