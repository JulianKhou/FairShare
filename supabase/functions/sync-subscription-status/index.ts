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

        // Fetch contracts with subscription IDs
        const { data: subContracts, error: subError } = await supabaseClient
            .from("reaction_contracts")
            .select("id, stripe_subscription_id, stripe_session_id, status")
            .not("stripe_subscription_id", "is", null)
            .in("status", ["ACTIVE", "PAID", "PENDING"]);

        if (subError) throw subError;

        // Fetch contracts stuck in PENDING with a session ID but NO subscription ID
        const { data: sessionContracts, error: sessionError } = await supabaseClient
            .from("reaction_contracts")
            .select("id, stripe_subscription_id, stripe_session_id, status")
            .is("stripe_subscription_id", null)
            .not("stripe_session_id", "is", null)
            .eq("status", "PENDING");

        if (sessionError) throw sessionError;

        const allContracts = [...(subContracts || []), ...(sessionContracts || [])];
        console.log(`📊 Found ${allContracts.length} contracts to inspect (${subContracts?.length} with sub, ${sessionContracts?.length} with session only)`);

        const results: any[] = [];

        for (const contract of allContracts) {
            try {
                let stripeStatus: string | null = null;
                let newDbStatus: string | null = null;
                let debugInfo = "";
                let updatedSubId: string | null = null;

                // Case 1: Contract already knows its subscription ID
                if (contract.stripe_subscription_id) {
                    const subscription = await stripe.subscriptions.retrieve(contract.stripe_subscription_id);
                    stripeStatus = subscription.status;
                    debugInfo = `[Sub Sync] Stripe status: ${stripeStatus}`;

                    if (stripeStatus === "active" || stripeStatus === "trialing") {
                        newDbStatus = "ACTIVE";
                    } else if (stripeStatus === "canceled") {
                        newDbStatus = "CANCELLED";
                    } else if (stripeStatus === "unpaid" || stripeStatus === "incomplete_expired" || stripeStatus === "past_due") {
                        newDbStatus = "PAYMENT_FAILED";
                    } else if (stripeStatus === "incomplete") {
                        newDbStatus = "PENDING";
                    }
                }
                // Case 2: Contract only has a session ID (webhook missed)
                else if (contract.stripe_session_id) {
                    const session = await stripe.checkout.sessions.retrieve(contract.stripe_session_id);
                    stripeStatus = session.status;
                    debugInfo = `[Session Recovery] Session status: ${stripeStatus}, Payment status: ${session.payment_status}`;

                    if (session.status === "complete") {
                        if (session.subscription) {
                            // It's a completed subscription! Save the ID and mark ACTIVE
                            updatedSubId = session.subscription as string;
                            newDbStatus = "ACTIVE";
                            debugInfo += ` -> Recovered subscription ID: ${updatedSubId}`;
                        } else if (session.payment_status === "paid") {
                            // One-time payment completed
                            newDbStatus = "PAID";
                        }
                    } else if (session.status === "expired") {
                        newDbStatus = "CANCELLED";
                    }
                }

                // If we found a new status or a newly discovered subscription ID, update the DB
                if ((newDbStatus && newDbStatus !== contract.status) || updatedSubId) {
                    const updates: any = {};
                    if (newDbStatus) updates.status = newDbStatus;
                    if (updatedSubId) updates.stripe_subscription_id = updatedSubId;

                    await supabaseClient
                        .from("reaction_contracts")
                        .update(updates)
                        .eq("id", contract.id);

                    const finalStatus = newDbStatus || contract.status;
                    results.push({
                        id: contract.id,
                        action: "updated",
                        from: contract.status,
                        to: finalStatus,
                        stripeStatus,
                        debugInfo,
                    });
                    console.log(`✅ Contract ${contract.id} updated -> ${finalStatus} (Stripe: ${stripeStatus})`);
                } else {
                    results.push({
                        id: contract.id,
                        action: "unchanged",
                        status: contract.status,
                        stripeStatus,
                        debugInfo,
                        reason: "No actionable status change found in Stripe",
                    });
                }
            } catch (stripeErr: any) {
                results.push({
                    id: contract.id,
                    action: "error",
                    error: stripeErr.message,
                });
                console.error(`❌ Error syncing contract ${contract.id}:`, stripeErr.message);
            }
        }

        const updated = results.filter((r) => r.action === "updated").length;
        const unchanged = results.filter((r) => r.action === "unchanged").length;
        const errors = results.filter((r) => r.action === "error").length;

        console.log(`📋 Sync complete: ${updated} updated, ${unchanged} unchanged, ${errors} errors`);

        return new Response(
            JSON.stringify({
                total: allContracts.length,
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
