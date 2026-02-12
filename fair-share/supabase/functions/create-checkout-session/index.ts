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
      }
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
        throw new Error(`Contract Fetch Failed: ${JSON.stringify(contractError)}`);
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

    // 3. Calculate Amounts
    // Assuming pricing_value is in EUR currency unit (e.g. 50.00)
    // Stripe expects amounts in cents.
    const amount = Math.round(contract.pricing_value * 100); 
    const APP_FEE_PERCENTAGE = 0.10; // 10%
    const applicationFeeAmount = Math.round(amount * APP_FEE_PERCENTAGE);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      httpClient: Stripe.createFetchHttpClient(),
    });

    // 4. Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"], // add other methods explicitly if needed like 'paypal', 'sofort', 'sepa_debit'
      line_items: [
        {
          price_data: {
            currency: contract.pricing_currency || "eur",
            product_data: {
              name: `License: ${contract.original_video_title}`,
              description: `License for using video: ${contract.original_video_title}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      payment_intent_data: {
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination: stripeConnectId,
        },
      },
      metadata: {
        contractId: contract.id,
      },
      success_url: `${req.headers.get("origin")}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/dashboard?canceled=true`,
    });

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
