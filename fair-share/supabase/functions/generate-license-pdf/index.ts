import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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

    console.log(`Triggering N8n webhook for contract: ${contractId}`);

    // N8n Webhook URL from user conversation
    const n8nUrl = `https://n8n.srv1356974.hstgr.cloud/webhook/generate-license-pdf?id=${contractId}`;

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
