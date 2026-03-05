import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, isOriginAllowed } from "../_shared/cors.ts";
import {
  createAdminClient,
  getUserFromRequest,
  hasServiceRoleToken,
  isAdminUser,
} from "../_shared/auth.ts";

console.log("Generate License PDF (N8n) Function Invoked");

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
    const { contractId } = await req.json();

    if (!contractId) {
      throw new Error("Missing contractId");
    }

    const isInternalCall = hasServiceRoleToken(req);
    const callerUser = isInternalCall ? null : await getUserFromRequest(req);

    if (!isInternalCall && !callerUser) {
      throw new Error("UNAUTHORIZED: Missing or invalid user session");
    }

    const supabaseAdmin = createAdminClient();

    const { data: contract, error: contractError } = await supabaseAdmin
      .from("reaction_contracts")
      .select("licensor_id, licensee_id")
      .eq("id", contractId)
      .single();

    if (contractError || !contract) {
      throw new Error(`Contract not found: ${contractError?.message || "unknown"}`);
    }

    if (!isInternalCall) {
      const isParticipant =
        callerUser!.id === contract.licensor_id ||
        callerUser!.id === contract.licensee_id;
      const admin = await isAdminUser(callerUser!.id);

      if (!isParticipant && !admin) {
        throw new Error("FORBIDDEN: You are not allowed to generate this license");
      }
    }

    const [licensorResponse, licenseeResponse] = await Promise.all([
      supabaseAdmin.auth.admin.getUserById(contract.licensor_id),
      supabaseAdmin.auth.admin.getUserById(contract.licensee_id),
    ]);

    if (licensorResponse.error || !licensorResponse.data.user) {
      throw new Error(
        `Could not fetch licensor user: ${licensorResponse.error?.message}`,
      );
    }
    if (licenseeResponse.error || !licenseeResponse.data.user) {
      throw new Error(
        `Could not fetch licensee user: ${licenseeResponse.error?.message}`,
      );
    }

    const licensorEmail = licensorResponse.data.user.email;
    const licenseeEmail = licenseeResponse.data.user.email;

    const n8nUrl = `https://n8n.srv1356974.hstgr.cloud/webhook/generate-license-pdf?id=${contractId}&licensor_email=${encodeURIComponent(licensorEmail ?? "")}&licensee_email=${encodeURIComponent(licenseeEmail ?? "")}`;

    const response = await fetch(n8nUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`N8n Webhook failed: ${response.status}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "License generation triggered via N8n",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const normalizedMessage = message.replace(/^(UNAUTHORIZED|FORBIDDEN):\s*/, "");
    const status = message.startsWith("UNAUTHORIZED:")
      ? 401
      : message.startsWith("FORBIDDEN:")
        ? 403
        : 500;

    console.error("Function failed:", error);
    return new Response(JSON.stringify({ error: normalizedMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status,
    });
  }
});

