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
            .eq("pricing_model_type", 2) // Views-based billing only
            .not("stripe_subscription_id", "is", null);

        if (error) throw error;

        console.log(`📊 Found ${contracts?.length || 0} active subscription contracts`);

        const reportResults = [];

        for (const contract of contracts || []) {
            try {
                // 2. Fetch Current Views from YouTube
                const currentViews = await fetchYouTubeViews(
                    contract.reaction_video_id,
                );

                if (currentViews === null) {
                    console.warn(`⚠️  Could not fetch views for video ${contract.reaction_video_id}`);
                    reportResults.push({
                        id: contract.id,
                        status: "skipped",
                        reason: "YouTube API failed",
                    });
                    continue;
                }

                const lastReported = contract.last_reported_view_count || 0;
                const delta = currentViews - lastReported;

                console.log(`📹 Contract ${contract.id}: current=${currentViews}, last=${lastReported}, delta=${delta}`);

                if (delta > 0) {
                    // 3. Report to Stripe
                    const subscription = await stripe.subscriptions.retrieve(
                        contract.stripe_subscription_id,
                    );
                    const itemId = subscription.items.data[0].id;

                    // Report units: 1 unit = 1000 views (matches pricing from getPrices.ts)
                    // Use Math.floor to only bill full units; remainder carries over to next report
                    const unitsToReport = Math.floor(delta / 1000);
                    // Track actual views consumed (in multiples of 1000)
                    const viewsConsumed = unitsToReport * 1000;

                    if (unitsToReport > 0) {
                        await stripe.subscriptionItems.createUsageRecord(
                            itemId,
                            {
                                quantity: unitsToReport,
                                timestamp: Math.floor(Date.now() / 1000),
                                action: "increment",
                            },
                        );

                        // 4. Update Database — only add the views we actually billed
                        // Remaining views (delta % 1000) carry over to next report
                        await supabaseClient
                            .from("reaction_contracts")
                            .update({ last_reported_view_count: lastReported + viewsConsumed })
                            .eq("id", contract.id);

                        reportResults.push({
                            id: contract.id,
                            status: "reported",
                            units: unitsToReport,
                            viewsDelta: delta,
                            carriedOver: delta - viewsConsumed,
                        });

                        console.log(`✅ Reported ${unitsToReport} units for contract ${contract.id} (${viewsConsumed} views, ${delta - viewsConsumed} carried over)`);
                    } else {
                        console.log(`ℹ️  Delta ${delta} < 1000 views — carrying over for contract ${contract.id}`);
                        reportResults.push({
                            id: contract.id,
                            status: "carried_over",
                            viewsDelta: delta,
                        });
                    }
                } else {
                    reportResults.push({
                        id: contract.id,
                        status: "no_change",
                    });
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

/**
 * Fetches the current view count for a YouTube video using the YouTube Data API v3.
 * Returns null if the API call fails (to allow graceful skipping).
 *
 * Requires YOUTUBE_API_KEY to be set in Supabase Edge Function secrets.
 */
async function fetchYouTubeViews(videoId: string): Promise<number | null> {
    const apiKey = Deno.env.get("YOUTUBE_API_KEY");

    if (!apiKey) {
        console.error("❌ YOUTUBE_API_KEY not set! Cannot fetch real view counts.");
        // Fallback: Try to get views from our own DB
        return null;
    }

    try {
        const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${apiKey}`;
        const response = await fetch(url);

        if (!response.ok) {
            console.error(`❌ YouTube API error: ${response.status} ${response.statusText}`);
            const errorBody = await response.text();
            console.error("Response:", errorBody);
            return null;
        }

        const data = await response.json();

        if (!data.items || data.items.length === 0) {
            console.warn(`⚠️  No YouTube video found for ID: ${videoId}`);
            return null;
        }

        const viewCount = parseInt(data.items[0].statistics.viewCount, 10);
        console.log(`📊 YouTube views for ${videoId}: ${viewCount}`);
        return viewCount;
    } catch (error) {
        console.error(`❌ Failed to fetch YouTube views for ${videoId}:`, error);
        return null;
    }
}
