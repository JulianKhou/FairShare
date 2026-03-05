import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.14.0";
import { getCorsHeaders, isOriginAllowed } from "../_shared/cors.ts";
import {
  createAdminClient,
  getUserFromRequest,
  hasServiceRoleToken,
  isAdminUser,
} from "../_shared/auth.ts";

console.log("Cancel Subscription Function Invoked");

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
      throw new Error("contractId is required");
    }

    const isInternalCall = hasServiceRoleToken(req);
    const callerUser = isInternalCall ? null : await getUserFromRequest(req);

    if (!isInternalCall && !callerUser) {
      throw new Error("UNAUTHORIZED: Missing or invalid user session");
    }

    const supabaseClient = createAdminClient();

    // Fetch contract to check permission + get Stripe subscription ID
    const { data: contract, error: fetchError } = await supabaseClient
      .from("reaction_contracts")
      .select("id, licensor_id, licensee_id, stripe_subscription_id")
      .eq("id", contractId)
      .single();

    if (fetchError || !contract) {
      throw new Error("Contract not found");
    }

    if (!isInternalCall) {
      const isParticipant =
        callerUser!.id === contract.licensor_id ||
        callerUser!.id === contract.licensee_id;
      const admin = await isAdminUser(callerUser!.id);

      if (!isParticipant && !admin) {
        throw new Error("FORBIDDEN: You are not allowed to cancel this subscription");
      }
    }

    if (!contract.stripe_subscription_id) {
      return new Response(
        JSON.stringify({
          status: "skipped",
          message: "No subscription to cancel",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      httpClient: Stripe.createFetchHttpClient(),
    });

    const deletedSubscription = await stripe.subscriptions.cancel(
      contract.stripe_subscription_id,
    );

    return new Response(
      JSON.stringify({ status: "cancelled", id: deletedSubscription.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error: any) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const normalizedMessage = message.replace(/^(UNAUTHORIZED|FORBIDDEN):\s*/, "");
    const status = message.startsWith("UNAUTHORIZED:")
      ? 401
      : message.startsWith("FORBIDDEN:")
        ? 403
        : 400;

    if (
      error?.code === "resource_missing" ||
      error?.message?.includes("No such subscription")
    ) {
      return new Response(
        JSON.stringify({
          status: "skipped",
          message: "Subscription not found in Stripe",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    console.error("Error in cancel-subscription:", error);
    return new Response(JSON.stringify({ error: normalizedMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status,
    });
  }
});

