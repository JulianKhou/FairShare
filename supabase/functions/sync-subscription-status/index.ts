import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.14.0";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Sync Subscription Status Function Invoked");

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        );

        const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
            httpClient: Stripe.createFetchHttpClient(),
        });

        // Fetch all contracts with a stripe_subscription_id that are currently ACTIVE, PAID, or PENDING
        const { data: contracts, error: fetchError } = await supabaseClient
            .from("reaction_contracts")
            .select("id, stripe_subscription_id, status")
            .not("stripe_subscription_id", "is", null)
            .in("status", ["ACTIVE", "PAID", "PENDING"]);

        if (fetchError) throw fetchError;

        console.log(`📊 Found ${contracts?.length || 0} subscription contracts to sync`);

        const results: any[] = [];

        for (const contract of contracts || []) {
            try {
                const subscription = await stripe.subscriptions.retrieve(
                    contract.stripe_subscription_id,
                );

                const stripeStatus = subscription.status;
                let newDbStatus: string | null = null;
                let debugInfo = `Raw status from Stripe: ${stripeStatus}, current DB status: ${contract.status}`;

                // Map Stripe subscription status to our DB status
                if (stripeStatus === "active" || stripeStatus === "trialing") {
                    newDbStatus = "ACTIVE";
                } else if (stripeStatus === "canceled") {
                    newDbStatus = "CANCELLED";
                } else if (stripeStatus === "unpaid" || stripeStatus === "incomplete_expired") {
                    newDbStatus = "PAYMENT_FAILED";
                } else if (stripeStatus === "past_due") {
                    newDbStatus = "PAYMENT_FAILED";
                } else if (stripeStatus === "incomplete") {
                    newDbStatus = "PENDING";
                }

                if (newDbStatus && newDbStatus !== contract.status) {
                    await supabaseClient
                        .from("reaction_contracts")
                        .update({ status: newDbStatus })
                        .eq("id", contract.id);

                    results.push({
                        id: contract.id,
                        action: "updated",
                        from: contract.status,
                        to: newDbStatus,
                        stripeStatus,
                        debugInfo,
                    });

                    console.log(
                        `✅ Contract ${contract.id}: ${contract.status} → ${newDbStatus} (Stripe: ${stripeStatus})`,
                    );
                } else {
                    results.push({
                        id: contract.id,
                        action: "unchanged",
                        status: contract.status,
                        stripeStatus,
                        debugInfo,
                        reason: newDbStatus ? "DB status already matches Stripe status" : `Stripe status '${stripeStatus}' not mapped to a new DB status`,
                    });
                }
            } catch (stripeErr: any) {
                // If the subscription doesn't exist in Stripe, mark as CANCELLED
                if (stripeErr.statusCode === 404 || stripeErr.code === "resource_missing") {
                    await supabaseClient
                        .from("reaction_contracts")
                        .update({ status: "CANCELLED" })
                        .eq("id", contract.id);

                    results.push({
                        id: contract.id,
                        action: "cancelled_missing",
                        error: "Subscription not found in Stripe",
                    });

                    console.warn(`⚠️ Contract ${contract.id}: Subscription not found in Stripe → CANCELLED`);
                } else {
                    results.push({
                        id: contract.id,
                        action: "error",
                        error: stripeErr.message,
                    });
                    console.error(`❌ Error syncing contract ${contract.id}:`, stripeErr.message);
                }
            }
        }

        const updated = results.filter((r) => r.action === "updated").length;
        const unchanged = results.filter((r) => r.action === "unchanged").length;
        const errors = results.filter((r) => r.action === "error").length;

        console.log(`📋 Sync complete: ${updated} updated, ${unchanged} unchanged, ${errors} errors`);

        return new Response(
            JSON.stringify({
                total: contracts?.length || 0,
                updated,
                unchanged,
                errors,
                details: results,
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            },
        );
    } catch (error: any) {
        console.error("Sync failed:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
