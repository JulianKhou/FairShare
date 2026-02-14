import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.14.0";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Create Checkout Session Function Invoked");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { contractId } = await req.json();
    console.log("Received contractId:", contractId);

    if (!contractId) {
      throw new Error("Missing contractId");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    // 1. Fetch Contract Details
    console.log("Fetching contract with ID:", contractId);
    const { data: contract, error: contractError } = await supabaseClient
      .from("reaction_contracts")
      .select("*")
      .eq("id", contractId)
      .single();

    if (contractError) {
      console.error("Contract Fetch Error:", contractError);
      throw new Error(
        `Contract Fetch Failed: ${JSON.stringify(contractError)}`,
      );
    }

    if (!contract) {
      console.error("No contract returned for ID:", contractId);
      throw new Error(`Contract not found (ID: ${contractId})`);
    }

    console.log("Contract found:", contract.id);
    console.log("Licensor ID:", contract.licensor_id);

    // 2. Fetch Licensor's Connect ID
    const { data: licensorProfile, error: licensorError } = await supabaseClient
      .from("profiles")
      .select("stripe_connect_id")
      .eq("id", contract.licensor_id)
      .single();

    if (licensorError) {
      console.error("Licensor Fetch Error:", licensorError);
    }

    if (!licensorProfile?.stripe_connect_id) {
      console.error("Licensor has no Stripe Connect ID");
      throw new Error("Licensor has not connected Stripe account");
    }

    const stripeConnectId = licensorProfile.stripe_connect_id;

    // 3. Calculate Amounts & Determine Mode
    // Assuming pricing_value is in EUR currency unit (e.g. 50.00)
    // Stripe expects amounts in cents.
    const amount = Math.round(contract.pricing_value * 100);
    const APP_FEE_PERCENTAGE = 0.10; // 10%
    // Application fee is per-transaction. For subscriptions, it applies to invoices?
    // Stripe Connect subscriptions fees are handled differently (on the subscription object or invoice).
    // For now, we will set it on the session context if possible, or application_fee_percent.

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      httpClient: Stripe.createFetchHttpClient(),
    });

    let sessionParams: any = {
      payment_method_types: ["card"],
      line_items: [],
      mode: "payment",
      metadata: {
        contractId: contract.id,
      },
      success_url: `${
        req.headers.get("origin")
      }/explore?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${
        req.headers.get("origin")
      }/explore?canceled=true&contractId=${contract.id}`,
    };

    if (contract.pricing_model_type === 1) {
      // --- FIXED PRICE (One-Time) ---
      const applicationFeeAmount = Math.round(amount * APP_FEE_PERCENTAGE);
      sessionParams.line_items = [
        {
          price_data: {
            currency: contract.pricing_currency || "eur",
            product_data: {
              name: `License: ${contract.original_video_title}`,
              description:
                `License for using video: ${contract.original_video_title}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ];
      sessionParams.payment_intent_data = {
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination: stripeConnectId,
        },
      };
    } else {
      // --- USAGE BASED (Subscription) ---
      // Models 2 (Views) & 3 (CPM)
      sessionParams.mode = "subscription";

      // We MUST create/get a Customer for subscriptions
      // 1. Check if we already have a customer_id in profile (ideal) or search by email
      const { data: licenseeProfile } = await supabaseClient
        .from("profiles")
        .select("stripe_customer_id, email, full_name") // Assuming profile has these
        .eq("id", contract.licensee_id)
        .single();

      let customerId = licenseeProfile?.stripe_customer_id;

      if (!customerId) {
        // Create new Customer
        // Note: In production, save this ID back to profile!
        const customer = await stripe.customers.create({
          email: `user-${contract.licensee_id}@example.com`, // Fallback if no email
          name: contract.licensee_name || "FairShare User",
          metadata: {
            supabase_id: contract.licensee_id,
          },
        });
        customerId = customer.id;

        // Optionally save back to profile here (skipped for brevity/permissions)
      }

      sessionParams.customer = customerId;

      const USAGE_PRODUCT_ID = "prod_TyiT0TPODEVOFx";

      // Create a Price for this specific contract/amount because price_data
      // in Checkout does not support 'usage_type' or 'aggregate_usage'
      const price = await stripe.prices.create({
        currency: contract.pricing_currency || "eur",
        product: USAGE_PRODUCT_ID,
        unit_amount: amount,
        recurring: {
          interval: "month",
          interval_count: 3, // Quarterly
          usage_type: "metered",
          aggregate_usage: "sum",
        },
      });

      sessionParams.line_items = [
        {
          price: price.id,
        },
      ];

      sessionParams.subscription_data = {
        application_fee_percent: APP_FEE_PERCENTAGE * 100, // 10%
        transfer_data: {
          destination: stripeConnectId,
        },
        metadata: {
          contractId: contract.id,
        },
      };
    }

    // 4. Create Checkout Session
    const session = await stripe.checkout.sessions.create(sessionParams);

    // 5. Update Contract with Session ID
    const { error: updateError } = await supabaseClient
      .from("reaction_contracts")
      .update({ stripe_session_id: session.id })
      .eq("id", contractId);

    if (updateError) {
      console.error("Failed to update contract with session ID", updateError);
      // We don't throw here to avoid blocking the user redirect, but it is bad.
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in create-checkout-session:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
