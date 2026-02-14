import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.14.0";

console.log("Stripe Webhook Function Invoked");

serve(async (req) => {
  // Debug Log 1: Request received
  console.log("🔔 Stripe Webhook Request received");

  const signature = req.headers.get("Stripe-Signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");

  // Debug Log 2: Secrets check
  if (!webhookSecret || !stripeKey) {
    console.error("❌ Missing Secrets during execution:", {
      hasWebhookSecret: !!webhookSecret,
      hasStripeKey: !!stripeKey,
    });
    return new Response("Missing secrets", { status: 500 });
  }

  if (!signature) {
    console.error("❌ Missing Stripe-Signature header");
    return new Response("Missing signature", { status: 400 });
  }

  const stripe = new Stripe(stripeKey, {
    httpClient: Stripe.createFetchHttpClient(),
  });

  let event;
  try {
    const body = await req.text();
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
    );
  } catch (err) {
    console.error(`⚠️  Webhook signature verification failed:`, err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log(`ℹ️  Event Type: ${event.type}`);

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const contractId = session.metadata?.contractId;

      console.log(`📦 Session Data:`, {
        id: session.id,
        metadata: session.metadata,
        contractId: contractId,
      });

      if (contractId) {
        console.log(
          `✅ Payment successful for contract: ${contractId}. Attempting DB update...`,
        );

        const updatePayload: any = { status: "PAID" };

        // Handle Subscription Mode
        if (session.mode === "subscription") {
          updatePayload.status = "ACTIVE"; // Subscriptions are ACTIVE not just PAID
          if (typeof session.subscription === "string") {
            updatePayload.stripe_subscription_id = session.subscription;
          }
          if (typeof session.customer === "string") {
            updatePayload.stripe_customer_id = session.customer;
          }
          // Initialize billing anchor? Usually we get this from the Subscription object,
          // but for now we can rely on Stripe managing the cycle.
        }

        // 1. Update Contract Status
        const { data: updateData, error: updateError } = await supabaseClient
          .from("reaction_contracts")
          .update(updatePayload)
          .eq("id", contractId)
          .select();

        if (updateError) {
          console.error("❌ Failed to update contract status:", updateError);
          return new Response("Database Update Failed", { status: 500 });
        }

        console.log("✅ DB Update successful:", updateData);

        // 2. Trigger License Generation
        console.log("🚀 Triggering generate-license-pdf...");
        const { data: funcData, error: functionError } = await supabaseClient
          .functions.invoke("generate-license-pdf", {
            body: { contractId },
          });

        if (functionError) {
          console.error(
            "❌ Failed to trigger license PDF generation:",
            functionError,
          );
        } else {
          console.log(
            "✅ generator-license-pdf triggered successfully:",
            funcData,
          );
        }
      } else {
        console.warn("⚠️  No contractId found in session metadata");
      }
      break;
    }
    default:
      console.log(`ℹ️  Unhandled event type: ${event.type}`);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
