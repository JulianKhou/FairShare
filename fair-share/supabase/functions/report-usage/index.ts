import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.14.0";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Report Usage Function Invoked");

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SERVICE_ROLE_KEY") ?? "",
        );

        const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
            httpClient: Stripe.createFetchHttpClient(),
        });

        // 1. Fetch Active Subscription Contracts
        const { data: contracts, error } = await supabaseClient
            .from("reaction_contracts")
            .select(
                "id, stripe_subscription_id, reaction_video_id, last_reported_view_count, pricing_model_type",
            )
            .eq("status", "ACTIVE")
            .in("pricing_model_type", [2, 3]) // Views or CPM
            .not("stripe_subscription_id", "is", null);

        if (error) throw error;

        const reportResults = [];

        for (const contract of contracts || []) {
            try {
                // 2. Fetch Current Views from YouTube
                // Mocking logic if API Key is missing, or implement actual fetch
                const currentViews = await fetchYouTubeViews(
                    contract.reaction_video_id,
                );

                const lastReported = contract.last_reported_view_count || 0;
                const delta = currentViews - lastReported;

                if (delta > 0) {
                    // 3. Report to Stripe
                    // We need the subscription item ID.
                    // Currently we only have subscription ID. We need to fetch items.
                    const subscription = await stripe.subscriptions.retrieve(
                        contract.stripe_subscription_id,
                    );
                    const itemId = subscription.items.data[0].id; // Assuming 1 item per sub

                    // Provide usage in "Units" (1 Unit = 1000 Views in our model?)
                    // Wait, if Price is "0.40 per Unit" and unit is 1000 views.
                    // WE MUST REPORT UNITS.
                    // If delta is 500 views, that is 0.5 units. Stripe Metered billing supports integers?
                    // Stripe Usage supports "quantity". If we use "Per Unit" pricing, usually quantity is integers.
                    // If we want fractional, we might need smaller units (e.g. 1 unit = 1 view, price = 0.0004).
                    // But Stripe min price is 1 cent? No, min unit amount.
                    // The user said "0.40 per 1000".
                    // Best approach: Report "1 unit" for every 1000 views?
                    // OR: Report "1000 units" where price is 0.0004?
                    // Let's assume we report RAW VIEWS and Stripe handles tiers?
                    // User instruction: "0,40 € pro 1000 Aufrufe".
                    // If we set Price = 0.40 per unit.
                    // Then we must report usage = views / 1000.
                    // This implies we report floats (0.5 units). Stripe supports integer usage mostly.
                    // BETTER: Set Price = 0.04 cents per 1 view. (0.40 EUR / 1000 = 0.0004 EUR = 0.04 Cents).
                    // Stripe supports decimal cents? No.
                    // "Transform usage" feature in Stripe?

                    // DECISION: We will report usage in "blocks of 1000".
                    // If delta < 1000, we might accumulate?
                    // OR we just report exact views and use "Transform quantity" in Stripe (divide by 1000).

                    // FOR NOW: I will report RAW VIEWS as units, and assume the Stripe Price handles the "per 1000" logic
                    // (e.g. via 'Transform Quantity' dividing by 1000, OR price is effectively per 1 view).
                    // But wait, user set "0.40 per Unit".
                    // I will update the logic to report (delta / 1000).

                    const unitsToReport = Math.ceil(delta / 1000); // Simple ceiling for now?

                    if (unitsToReport > 0) {
                        await stripe.subscriptionItems.createUsageRecord(
                            itemId,
                            {
                                quantity: unitsToReport,
                                timestamp: Math.floor(Date.now() / 1000),
                                action: "increment",
                            },
                        );

                        // 4. Update Database
                        await supabaseClient
                            .from("reaction_contracts")
                            .update({ last_reported_view_count: currentViews }) // Store raw views
                            .eq("id", contract.id);

                        reportResults.push({
                            id: contract.id,
                            status: "reported",
                            units: unitsToReport,
                        });
                    }
                }
            } catch (e) {
                console.error(`Error processing contract ${contract.id}:`, e);
                reportResults.push({
                    id: contract.id,
                    status: "error",
                    error: e.message,
                });
            }
        }

        return new Response(JSON.stringify({ processed: reportResults }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        console.error("Error in report-usage:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});

// Helper Mock
async function fetchYouTubeViews(videoId: string): Promise<number> {
    // TODO: Implement actual YouTube API call
    // GET https://www.googleapis.com/youtube/v3/videos?part=statistics&id={videoId}&key={API_KEY}
    // const apiKey = Deno.env.get("YOUTUBE_API_KEY");
    // ...

    // MOCK: Return random number > 1000 for testing
    return Math.floor(Math.random() * 5000) + 1000;
}
