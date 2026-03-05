import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.14.0";
import { getCorsHeaders, isOriginAllowed } from "../_shared/cors.ts";
import {
  createAdminClient,
  getUserFromRequest,
  hasServiceRoleToken,
} from "../_shared/auth.ts";

console.log("Create Checkout Session Function Invoked");

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    if (!isOriginAllowed(req.headers.get("origin"))) {
      return new Response("Origin not allowed", {
        status: 403,
        headers: corsHeaders,
      });
    }
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { contractId } = await req.json();
    if (!contractId) {
      throw new Error("Missing contractId");
    }

    const isInternalCall = hasServiceRoleToken(req);
    const callerUser = isInternalCall ? null : await getUserFromRequest(req);

    if (!isInternalCall && !callerUser) {
      throw new Error("UNAUTHORIZED: Missing or invalid user session");
    }

    const supabaseClient = createAdminClient();

    // 1) Fetch contract details
    const { data: contract, error: contractError } = await supabaseClient
      .from("reaction_contracts")
      .select("*")
      .eq("id", contractId)
      .single();

    if (contractError || !contract) {
      throw new Error(`Contract not found (ID: ${contractId})`);
    }

    // 2) Authorization: only the licensee may start checkout (unless internal service call)
    if (!isInternalCall && callerUser!.id !== contract.licensee_id) {
      throw new Error("FORBIDDEN: You are not allowed to pay this contract");
    }

    // 3) Contract state validation
    if (!contract.accepted_by_licensor || contract.status !== "PENDING") {
      throw new Error(
        "Contract is not ready for checkout. It must be accepted and pending.",
      );
    }

    // 4) Fetch licensor's Stripe Connect ID
    const { data: licensorProfile, error: licensorError } = await supabaseClient
      .from("profiles")
      .select("stripe_connect_id")
      .eq("id", contract.licensor_id)
      .single();

    if (licensorError || !licensorProfile?.stripe_connect_id) {
      throw new Error("Licensor has not connected Stripe account");
    }

    const stripeConnectId = licensorProfile.stripe_connect_id;

    // Resolve app URL
    const origin = req.headers.get("origin");
    const appBaseUrl =
      Deno.env.get("PUBLIC_APP_URL") || origin || "https://simpleshare.eu";

    // 5) Calculate amounts & determine mode
    const amount = Math.round(contract.pricing_value * 100);
    const APP_FEE_PERCENTAGE = 0.1;

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      httpClient: Stripe.createFetchHttpClient(),
    });

    const sessionParams: any = {
      payment_method_types: ["card"],
      line_items: [],
      mode: "payment",
      metadata: {
        contractId: contract.id,
      },
      success_url: `${appBaseUrl}/dashboard?success=true&contractId=${contract.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appBaseUrl}/dashboard?canceled=true&contractId=${contract.id}`,
      allow_promotion_codes: true,
    };

    if (contract.pricing_model_type === 1) {
      // Fixed one-time payment
      const applicationFeeAmount = Math.round(amount * APP_FEE_PERCENTAGE);
      sessionParams.line_items = [
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
      ];
      sessionParams.payment_intent_data = {
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination: stripeConnectId,
        },
      };
    } else if (contract.pricing_model_type === 2) {
      // Usage-based subscription (quarterly billing)
      sessionParams.mode = "subscription";

      const { data: licenseeProfile } = await supabaseClient
        .from("profiles")
        .select("stripe_customer_id")
        .eq("id", contract.licensee_id)
        .single();

      let customerId = licenseeProfile?.stripe_customer_id;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: `user-${contract.licensee_id}@example.com`,
          name: contract.licensee_name || "SimpleShare User",
          metadata: {
            supabase_id: contract.licensee_id,
          },
        });
        customerId = customer.id;

        await supabaseClient
          .from("profiles")
          .update({ stripe_customer_id: customerId })
          .eq("id", contract.licensee_id);
      }

      sessionParams.customer = customerId;

      const USAGE_PRODUCT_ID =
        Deno.env.get("STRIPE_USAGE_PRODUCT_ID") || "prod_TyiT0TPODEVOFx";

      const price = await stripe.prices.create({
        currency: contract.pricing_currency || "eur",
        product: USAGE_PRODUCT_ID,
        unit_amount: amount,
        recurring: {
          interval: "month",
          interval_count: 3,
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
        application_fee_percent: APP_FEE_PERCENTAGE * 100,
        transfer_data: {
          destination: stripeConnectId,
        },
        metadata: {
          contractId: contract.id,
        },
      };
    }

    // 6) Create checkout session
    const session = await stripe.checkout.sessions.create(sessionParams);

    // 7) Persist session ID
    const { error: updateError } = await supabaseClient
      .from("reaction_contracts")
      .update({ stripe_session_id: session.id })
      .eq("id", contractId);

    if (updateError) {
      console.error("Failed to update contract with session ID", updateError);
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const normalizedMessage = message.replace(/^(UNAUTHORIZED|FORBIDDEN):\s*/, "");
    const status = message.startsWith("UNAUTHORIZED:")
      ? 401
      : message.startsWith("FORBIDDEN:")
        ? 403
        : 400;

    console.error("Error in create-checkout-session:", error);
    return new Response(JSON.stringify({ error: normalizedMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status,
    });
  }
});

