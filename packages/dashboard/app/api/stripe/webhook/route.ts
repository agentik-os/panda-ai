import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";

/**
 * Get Stripe client (lazy initialization to avoid build-time errors)
 */
function getStripeClient() {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(apiKey, {
    apiVersion: "2026-01-28.clover",
  });
}

/**
 * Stripe Webhook Handler
 *
 * Handles:
 * - checkout.session.completed: Record purchase, install item for user
 * - payment_intent.succeeded: Confirm payment
 * - payment_intent.payment_failed: Handle failed payment
 */
export async function POST(request: NextRequest) {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not configured" },
      { status: 500 }
    );
  }
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("Payment succeeded:", paymentIntent.id);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.error("Payment failed:", paymentIntent.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

/**
 * Handle successful checkout completion
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { userId, itemType, itemId } = session.metadata || {};

  if (!userId || !itemType || !itemId) {
    console.error("Missing metadata in checkout session:", session.id);
    return;
  }

  console.log("Checkout completed:", {
    sessionId: session.id,
    userId,
    itemType,
    itemId,
    amountTotal: session.amount_total,
  });

  // TODO: Call Convex mutation to:
  // 1. Create marketplace_purchases record
  // 2. Install the agent/skill for the user
  // 3. Update installCount on the item
  // 4. Calculate and create marketplace_payouts record (70/30 split)

  // Example Convex mutation call (to be implemented):
  /*
  await convex.mutation(api.mutations.marketplace.recordPurchase, {
    userId,
    itemType,
    itemId,
    sessionId: session.id,
    amount: session.amount_total! / 100, // Convert from cents
    currency: session.currency || "usd",
  });
  */

  // For now, just log
  console.log("Purchase recorded successfully");
}

/**
 * Disable body parser for Stripe webhooks
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
