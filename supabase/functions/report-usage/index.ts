import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.14.0";
import { getCorsHeaders, isOriginAllowed } from "../_shared/cors.ts";
import {
  createAdminClient,
  getUserFromRequest,
  hasServiceRoleToken,
  isAdminUser,
} from "../_shared/auth.ts";

console.log("Report Usage Function Invoked");

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
    const { contractId, mockViews } = await req.json().catch(() => ({}));

    const isInternalCall = hasServiceRoleToken(req);
    const callerUser = isInternalCall ? null : await getUserFromRequest(req);

    if (!isInternalCall && !callerUser) {
      throw new Error("UNAUTHORIZED: Missing or invalid user session");
    }

    if (!isInternalCall) {
      const admin = await isAdminUser(callerUser!.id);
      if (!admin) {
        throw new Error("FORBIDDEN: Admin access required");
      }
    }

    const supabaseClient = createAdminClient();
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      httpClient: Stripe.createFetchHttpClient(),
    });

    let query = supabaseClient
      .from("reaction_contracts")
      .select(
        "id, stripe_subscription_id, reaction_video_id, last_reported_view_count, pricing_model_type",
      )
      .eq("status", "ACTIVE")
      .eq("pricing_model_type", 2)
      .not("stripe_subscription_id", "is", null);

    if (contractId) {
      query = query.eq("id", contractId);
    }

    const { data: contracts, error } = await query;
    if (error) throw error;

    const reportResults = [];

    for (const contract of contracts || []) {
      try {
        let currentViews: number | null = null;

        if (contractId === contract.id && typeof mockViews === "number") {
          currentViews = mockViews;
        } else {
          currentViews = await fetchYouTubeViews(contract.reaction_video_id);
        }

        if (currentViews === null) {
          reportResults.push({
            id: contract.id,
            status: "skipped",
            reason: "YouTube API failed",
          });
          continue;
        }

        const lastReported = contract.last_reported_view_count || 0;
        const delta = currentViews - lastReported;

        if (delta > 0) {
          const subscription = await stripe.subscriptions.retrieve(
            contract.stripe_subscription_id,
          );
          const itemId = subscription.items.data[0].id;

          const unitsToReport = Math.floor(delta / 1000);
          const viewsConsumed = unitsToReport * 1000;

          if (unitsToReport > 0) {
            await stripe.subscriptionItems.createUsageRecord(itemId, {
              quantity: unitsToReport,
              timestamp: Math.floor(Date.now() / 1000),
              action: "increment",
            });

            await supabaseClient
              .from("reaction_contracts")
              .update({
                last_reported_view_count: lastReported + viewsConsumed,
              })
              .eq("id", contract.id);

            reportResults.push({
              id: contract.id,
              status: "reported",
              units: unitsToReport,
              viewsDelta: delta,
              carriedOver: delta - viewsConsumed,
            });
          } else {
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
      } catch (e: any) {
        reportResults.push({
          id: contract.id,
          status: "error",
          error: (e as Error).message,
        });
      }
    }

    return new Response(JSON.stringify({ processed: reportResults }), {
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

    console.error("Error in report-usage:", error);
    return new Response(JSON.stringify({ error: normalizedMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status,
    });
  }
});

async function fetchYouTubeViews(videoId: string): Promise<number | null> {
  const apiKey = Deno.env.get("YOUTUBE_API_KEY");
  if (!apiKey) return null;

  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (!data.items || data.items.length === 0) {
      return null;
    }

    return parseInt(data.items[0].statistics.viewCount, 10);
  } catch {
    return null;
  }
}

