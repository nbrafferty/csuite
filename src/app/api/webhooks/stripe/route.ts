import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/server/lib/stripe";
import { applyPayment } from "@/server/lib/apply-payment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // Signature verification requires the raw request body
  const payload = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe-webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const intent = event.data.object as Stripe.PaymentIntent;
        const invoiceId = intent.metadata?.invoiceId;
        if (!invoiceId) {
          console.warn(
            `[stripe-webhook] payment_intent.succeeded ${intent.id} has no invoiceId metadata; skipping`
          );
          break;
        }

        await applyPayment({
          invoiceId,
          amount: intent.amount_received / 100,
          method: "STRIPE",
          reference: intent.id,
          stripePaymentIntentId: intent.id,
          notes: "Paid online via Stripe",
        });
        break;
      }

      case "payment_intent.payment_failed": {
        const intent = event.data.object as Stripe.PaymentIntent;
        console.warn(
          `[stripe-webhook] Payment failed for intent ${intent.id} (invoice ${intent.metadata?.invoiceId ?? "unknown"}): ${intent.last_payment_error?.message ?? "no error detail"}`
        );
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error(`[stripe-webhook] Error handling ${event.type}:`, err);
    // Return 500 so Stripe retries the event
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
