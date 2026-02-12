import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.14.0";


console.log("Stripe Webhook Function Invoked");

serve(async (req) => {
  const signature = req.headers.get("Stripe-Signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");

  if (!signature || !webhookSecret || !stripeKey) {
     return new Response("Missing signature or secrets", { status: 400 });
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
    console.error(`⚠️  Webhook signature verification failed.`, err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const contractId = session.metadata?.contractId;

      if (contractId) {
        console.log(`Payment successful for contract: ${contractId}`);

        // 1. Update Contract Status to PAID
        const { error: updateError } = await supabaseClient
          .from("reaction_contracts")
          .update({ status: "PAID" })
          .eq("id", contractId);

        if (updateError) {
          console.error("Failed to update contract status", updateError);
          return new Response("Database Update Failed", { status: 500 });
        }

        // 2. Trigger License Generation
        // We call the existing generate-license-pdf function
        const { error: functionError } = await supabaseClient.functions.invoke("generate-license-pdf", {
            body: { contractId }
        });

        if (functionError) {
             console.error("Failed to trigger license PDF generation", functionError);
             // We don't fail the webhook for this, as payment logic is done. 
             // Ideally we would want a retry mechanism, but for now we log it.
        }

      } else {
        console.warn("No contractId in metadata");
      }
      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
