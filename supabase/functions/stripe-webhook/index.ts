import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.14.0";

console.log("Stripe Webhook Function Invoked");

serve(async (req) => {
  console.log("🔔 Stripe Webhook Request received");

  const signature = req.headers.get("Stripe-Signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");

  if (!webhookSecret || !stripeKey) {
    console.error("❌ Missing Secrets:", {
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
  } catch (err: any) {
    console.error(`⚠️  Webhook signature verification failed:`, err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log(`ℹ️  Event Type: ${event.type}`);

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  switch (event.type) {
    // ─── CHECKOUT COMPLETED (One-Time + Subscription Start) ────────────
    case "checkout.session.completed": {
      const session = event.data.object;
      const contractId = session.metadata?.contractId;

      console.log(`📦 Session Data:`, {
        id: session.id,
        mode: session.mode,
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
          updatePayload.status = "ACTIVE";
          if (typeof session.subscription === "string") {
            updatePayload.stripe_subscription_id = session.subscription;

            // SCHEDULING 1-YEAR AUTO-CANCELLATION
            try {
              // Get current date, add exactly 1 year, and convert to unix timestamp (seconds).
              const oneYearFromNow = new Date();
              oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
              const cancelAtUnixTimestamp = Math.floor(oneYearFromNow.getTime() / 1000);

              await stripe.subscriptions.update(session.subscription, {
                cancel_at: cancelAtUnixTimestamp,
              });
              console.log(`⏱️ Scheduled subscription ${session.subscription} to auto-cancel on ${oneYearFromNow.toISOString()}`);
            } catch (err: any) {
              console.error("❌ Failed to set cancel_at for subscription:", err);
            }
          }
          if (typeof session.customer === "string") {
            updatePayload.stripe_customer_id = session.customer;
          }
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

        // Record Revenue for One-Time Payments
        if (updateData && updateData.length > 0 && session.mode === "payment" && session.payment_status === "paid") {
          const contract = updateData[0];
          const amountCents = session.amount_total || 0;
          if (amountCents > 0) {
            const { error: revenueError } = await supabaseClient.from("revenue_events").insert({
              contract_id: contract.id,
              licensor_id: contract.licensor_id,
              licensee_id: contract.licensee_id,
              amount_cents: amountCents,
              currency: session.currency || "eur",
              stripe_session_id: session.id,
              payment_type: "ONE_TIME"
            });
            if (revenueError) {
              console.error("❌ Failed to insert revenue event:", revenueError);
            } else {
              console.log(`✅ Revenue event recorded for ONE_TIME payment (${amountCents} cents)`);
            }
          }
        }

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
            "✅ generate-license-pdf triggered successfully:",
            funcData,
          );
        }
      } else {
        console.warn("⚠️  No contractId found in session metadata");
      }
      break;
    }

    // ─── INVOICE PAID (Recurring quarterly payment succeeded) ──────────
    case "invoice.paid": {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;

      if (!subscriptionId) {
        console.log("ℹ️  invoice.paid without subscription — likely one-time, skipping.");
        break;
      }

      console.log(`💰 Invoice paid for subscription: ${subscriptionId}`);
      console.log(`   Amount: ${invoice.amount_paid / 100} ${invoice.currency?.toUpperCase()}`);
      console.log(`   Period: ${new Date((invoice.period_start || 0) * 1000).toISOString()} - ${new Date((invoice.period_end || 0) * 1000).toISOString()}`);

      // Ensure contract status stays ACTIVE after successful payment
      const { data: contractData, error: invoicePaidError } = await supabaseClient
        .from("reaction_contracts")
        .update({
          status: "ACTIVE",
        })
        .eq("stripe_subscription_id", subscriptionId)
        .select();

      if (invoicePaidError) {
        console.error("❌ Failed to update contract after invoice.paid:", invoicePaidError);
      } else {
        console.log("✅ Contract confirmed ACTIVE after successful payment");

        if (contractData && contractData.length > 0) {
          const contract = contractData[0];
          const amountCents = invoice.amount_paid || 0;
          if (amountCents > 0) {
            const { error: revenueError } = await supabaseClient.from("revenue_events").insert({
              contract_id: contract.id,
              licensor_id: contract.licensor_id,
              licensee_id: contract.licensee_id,
              amount_cents: amountCents,
              currency: invoice.currency || "eur",
              stripe_invoice_id: invoice.id,
              payment_type: "SUBSCRIPTION"
            });
            if (revenueError) {
              console.error("❌ Failed to insert revenue event:", revenueError);
            } else {
              console.log(`✅ Revenue event recorded for SUBSCRIPTION payment (${amountCents} cents)`);
            }
          }
        }
      }
      break;
    }

    // ─── INVOICE PAYMENT FAILED (Quarterly payment failed) ─────────────
    case "invoice.payment_failed": {
      const failedInvoice = event.data.object;
      const failedSubId = failedInvoice.subscription;

      if (!failedSubId) {
        console.log("ℹ️  invoice.payment_failed without subscription — skipping.");
        break;
      }

      console.error(`❌ Payment FAILED for subscription: ${failedSubId}`);
      console.error(`   Attempt: ${failedInvoice.attempt_count}`);

      // Mark contract as payment failed
      const { error: failedError } = await supabaseClient
        .from("reaction_contracts")
        .update({ status: "PAYMENT_FAILED" })
        .eq("stripe_subscription_id", failedSubId);

      if (failedError) {
        console.error("❌ Failed to update contract status to PAYMENT_FAILED:", failedError);
      } else {
        console.log("⚠️  Contract marked as PAYMENT_FAILED — user needs to update payment method");
      }
      break;
    }

    // ─── SUBSCRIPTION DELETED (Cancelled or fully churned) ─────────────
    case "customer.subscription.deleted": {
      const deletedSub = event.data.object;
      const deletedSubId = deletedSub.id;

      console.log(`🚫 Subscription deleted/cancelled: ${deletedSubId}`);

      const { error: cancelError } = await supabaseClient
        .from("reaction_contracts")
        .update({ status: "CANCELLED" })
        .eq("stripe_subscription_id", deletedSubId);

      if (cancelError) {
        console.error("❌ Failed to update contract status to CANCELLED:", cancelError);
      } else {
        console.log("✅ Contract marked as CANCELLED");
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
