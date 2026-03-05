import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.14.0";
import { getCorsHeaders, isOriginAllowed } from "../_shared/cors.ts";
import {
  createAdminClient,
  getUserFromRequest,
  hasServiceRoleToken,
  isAdminUser,
} from "../_shared/auth.ts";

console.log("Sync Subscription Status Function Invoked");

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

    const { data: subContracts, error: subError } = await supabaseClient
      .from("reaction_contracts")
      .select("id, stripe_subscription_id, stripe_session_id, status")
      .not("stripe_subscription_id", "is", null)
      .in("status", ["ACTIVE", "PAID", "PENDING"]);

    if (subError) throw subError;

    const { data: sessionContracts, error: sessionError } = await supabaseClient
      .from("reaction_contracts")
      .select("id, stripe_subscription_id, stripe_session_id, status")
      .is("stripe_subscription_id", null)
      .not("stripe_session_id", "is", null)
      .eq("status", "PENDING");

    if (sessionError) throw sessionError;

    const allContracts = [...(subContracts || []), ...(sessionContracts || [])];

    const results: any[] = [];

    for (const contract of allContracts) {
      try {
        let stripeStatus: string | null = null;
        let newDbStatus: string | null = null;
        let debugInfo = "";
        let updatedSubId: string | null = null;

        if (contract.stripe_subscription_id) {
          const subscription = await stripe.subscriptions.retrieve(
            contract.stripe_subscription_id,
          );
          stripeStatus = subscription.status;
          debugInfo = `[Sub Sync] Stripe status: ${stripeStatus}`;

          if (stripeStatus === "active" || stripeStatus === "trialing") {
            newDbStatus = "ACTIVE";
          } else if (stripeStatus === "canceled") {
            newDbStatus = "CANCELLED";
          } else if (
            stripeStatus === "unpaid" ||
            stripeStatus === "incomplete_expired" ||
            stripeStatus === "past_due"
          ) {
            newDbStatus = "PAYMENT_FAILED";
          } else if (stripeStatus === "incomplete") {
            newDbStatus = "PENDING";
          }
        } else if (contract.stripe_session_id) {
          const session = await stripe.checkout.sessions.retrieve(
            contract.stripe_session_id,
          );
          stripeStatus = session.status;
          debugInfo = `[Session Recovery] Session status: ${stripeStatus}, Payment status: ${session.payment_status}`;

          if (session.status === "complete") {
            if (session.subscription) {
              updatedSubId = session.subscription as string;
              newDbStatus = "ACTIVE";
              debugInfo += ` -> Recovered subscription ID: ${updatedSubId}`;
            } else if (session.payment_status === "paid") {
              newDbStatus = "PAID";
            }
          } else if (session.status === "expired") {
            newDbStatus = "CANCELLED";
          }
        }

        if ((newDbStatus && newDbStatus !== contract.status) || updatedSubId) {
          const updates: any = {};
          if (newDbStatus) updates.status = newDbStatus;
          if (updatedSubId) updates.stripe_subscription_id = updatedSubId;

          await supabaseClient
            .from("reaction_contracts")
            .update(updates)
            .eq("id", contract.id);

          results.push({
            id: contract.id,
            action: "updated",
            from: contract.status,
            to: newDbStatus || contract.status,
            stripeStatus,
            debugInfo,
          });
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
      }
    }

    const updated = results.filter((r) => r.action === "updated").length;
    const unchanged = results.filter((r) => r.action === "unchanged").length;
    const errors = results.filter((r) => r.action === "error").length;

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
    const message = error instanceof Error ? error.message : "Unknown error";
    const normalizedMessage = message.replace(/^(UNAUTHORIZED|FORBIDDEN):\s*/, "");
    const status = message.startsWith("UNAUTHORIZED:")
      ? 401
      : message.startsWith("FORBIDDEN:")
        ? 403
        : 500;

    console.error("Sync failed:", error);
    return new Response(JSON.stringify({ error: normalizedMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status,
    });
  }
});

