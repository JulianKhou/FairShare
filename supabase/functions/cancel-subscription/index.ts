import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.14.0";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Cancel Subscription Function Invoked");

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { contractId } = await req.json();

        if (!contractId) {
            throw new Error("contractId is required");
        }

        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SERVICE_ROLE_KEY") ?? "",
        );

        // Fetch contract to get Stripe Subscription ID
        const { data: contract, error: fetchError } = await supabaseClient
            .from("reaction_contracts")
            .select("stripe_subscription_id")
            .eq("id", contractId)
            .single();

        if (fetchError) {
            console.error("Failed to fetch contract:", fetchError);
            throw fetchError;
        }

        if (!contract?.stripe_subscription_id) {
            console.log(`No Stripe Subscription found for contract ${contractId}. Nothing to cancel.`);
            return new Response(JSON.stringify({ status: "skipped", message: "No subscription to cancel" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        console.log(`Cancelling Stripe Subscription: ${contract.stripe_subscription_id}`);

        const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
            httpClient: Stripe.createFetchHttpClient(),
        });

        // Cancel the subscription in Stripe
        const deletedSubscription = await stripe.subscriptions.cancel(contract.stripe_subscription_id);

        console.log(`✅ Successfully cancelled subscription ${deletedSubscription.id}`);

        return new Response(JSON.stringify({ status: "cancelled", id: deletedSubscription.id }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error: any) {
        console.error("Error in cancel-subscription:", error);

        // If the subscription is already cancelled in Stripe, we can safely ignore the error
        // Or if the resource is missing.
        if (error.code === "resource_missing" || error.message?.includes("No such subscription")) {
            console.log("Stripe subscription already missing. Can proceed with deletion safely.");
            return new Response(JSON.stringify({ status: "skipped", message: "Subscription not found in Stripe" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
