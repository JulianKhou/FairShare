import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Generate License PDF (N8n) Function Invoked");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { contractId } = await req.json();

    if (!contractId) {
      throw new Error("Missing contractId");
    }

    // Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Fetch contract to get user IDs
    const { data: contract, error: contractError } = await supabaseAdmin
      .from("reaction_contracts")
      .select("licensor_id, licensee_id")
      .eq("id", contractId)
      .single();

    if (contractError || !contract) {
      throw new Error(`Contract not found: ${contractError?.message}`);
    }

    // Fetch emails for both users
    const [licensorResponse, licenseeResponse] = await Promise.all([
      supabaseAdmin.auth.admin.getUserById(contract.licensor_id),
      supabaseAdmin.auth.admin.getUserById(contract.licensee_id),
    ]);

    if (licensorResponse.error || !licensorResponse.data.user) {
      throw new Error(`Could not fetch licensor user: ${licensorResponse.error?.message}`);
    }
    if (licenseeResponse.error || !licenseeResponse.data.user) {
      throw new Error(`Could not fetch licensee user: ${licenseeResponse.error?.message}`);
    }

    const licensorEmail = licensorResponse.data.user.email;
    const licenseeEmail = licenseeResponse.data.user.email;

    console.log(`Triggering N8n for contract: ${contractId}. Emails: ${licensorEmail}, ${licenseeEmail}`);

    // N8n Webhook URL with extra params
    const n8nUrl = `https://n8n.srv1356974.hstgr.cloud/webhook/generate-license-pdf?id=${contractId}&licensor_email=${encodeURIComponent(licensorEmail ?? "")}&licensee_email=${encodeURIComponent(licenseeEmail ?? "")}`;

    // Call N8n
    const response = await fetch(n8nUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`N8n Webhook failed: ${response.status} ${response.statusText}`);
      // Try to read error body if json
      try {
          const errorJson = await response.json();
          console.error("N8n Error JSON:", errorJson);
      } catch (e) {
          const text = await response.text();
          console.error(`N8n Response Text: ${text}`);
      }
      
      throw new Error(`N8n Webhook failed: ${response.status}`);
    }

    console.log("✅ N8n Webhook triggered successfully");

    return new Response(
      JSON.stringify({ success: true, message: "License generation triggered via N8n" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Function failed:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
