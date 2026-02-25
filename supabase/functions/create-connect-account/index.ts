import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.14.0";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Create Connect Account Function Invoked");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  console.log("Request Headers:", Object.fromEntries(req.headers.entries()));

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      },
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError) {
      console.error("Auth Error:", authError);
    }

    if (!user) {
      console.error("No user found in auth.getUser()");
      throw new Error("User not found");
    }

    console.log("User authenticated:", user.id);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      httpClient: Stripe.createFetchHttpClient(),
    });

    // 1. Check if user already has a Stripe Connect ID
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("stripe_connect_id")
      .eq("id", user.id)
      .single();

    if (profileError) throw profileError;

    let stripeConnectId = profile?.stripe_connect_id;

    // 2. If not, create a new Stripe Express account
    if (!stripeConnectId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      stripeConnectId = account.id;

      // 3. Save the ID to the database
      const { error: updateError } = await supabaseClient
        .from("profiles")
        .update({ stripe_connect_id: stripeConnectId })
        .eq("id", user.id);

      if (updateError) throw updateError;
    }

    // Resolve Origin safely
    let origin = req.headers.get("origin");
    if (!origin) {
      origin = Deno.env.get("PUBLIC_APP_URL") || "https://simpleshare.eu";
      console.warn("Origin header missing, falling back to:", origin);
    }

    try {
      // 4. Create an Account Link for onboarding
      const accountLink = await stripe.accountLinks.create({
        account: stripeConnectId,
        refresh_url: `${origin}/settings?refresh=true`, // Redirect back to settings on refresh/cancel
        return_url: `${origin}/settings?success=true`, // Redirect back on success
        type: "account_onboarding",
      });

      return new Response(JSON.stringify({ url: accountLink.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } catch (stripeError: any) {
      console.error("Stripe accountLink creation failed:", stripeError);

      // If the account doesn't exist (e.g. deleted in test mode), clear it from DB
      if (stripeError.code === "resource_missing") {
        console.log("Stripe account is missing, clearing from DB.");
        await supabaseClient
          .from("profiles")
          .update({ stripe_connect_id: null })
          .eq("id", user.id);
        throw new Error("Stripe Account wurde nicht gefunden (evtl. gelöscht). Bitte versuche es erneut, um einen neuen Account zu erstellen.");
      }

      throw stripeError;
    }
  } catch (error: any) {
    console.error("Edge Function Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Unknown error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
