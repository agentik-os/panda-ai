import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@clerk/nextjs/server";

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
 * Create Stripe Checkout Session for Marketplace Purchase
 *
 * Query params:
 * - itemType: "agent" | "skill"
 * - itemId: Convex document ID
 */
export async function GET(request: NextRequest) {
  const stripe = getStripeClient();

  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const itemType = searchParams.get("itemType");
    const itemId = searchParams.get("itemId");

    if (!itemType || !itemId) {
      return NextResponse.json(
        { error: "Missing itemType or itemId" },
        { status: 400 }
      );
    }

    // TODO: Fetch item details from Convex to get price and name
    // For now using placeholder
    const itemName = "Marketplace Item";
    const itemPrice = 2999; // $29.99 in cents

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: undefined, // TODO: Get from Clerk user
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: itemName,
              description: `${itemType} from Agentik OS Marketplace`,
            },
            unit_amount: itemPrice,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        itemType,
        itemId,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/marketplace/${itemId}?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/marketplace/${itemId}?payment=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

/**
 * Alternative POST endpoint for programmatic checkout creation
 */
export async function POST(request: NextRequest) {
  const stripe = getStripeClient();

  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { itemType, itemId, price, name } = body;

    if (!itemType || !itemId || !price || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name,
              description: `${itemType} from Agentik OS Marketplace`,
            },
            unit_amount: Math.round(price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        itemType,
        itemId,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/marketplace/${itemId}?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/marketplace/${itemId}?payment=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
