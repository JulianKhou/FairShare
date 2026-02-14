import { supabase } from "./client";

export interface ReactionContract {
    id: string; // Die Vertragsnummer (UUID) [cite: 256]
    created_at: string;

    // Beteiligte IDs
    licensor_id: string; // Original-Creator [cite: 262]
    licensee_id: string; // Reactor [cite: 267]
    licensor_name: string; // Name des Original-Creators
    licensee_name: string; // Name des Reactors
    reaction_video_id?: string; // ID des Videos, mit dem reagiert wird

    // Video-Details [cite: 278, 280, 281]
    original_video_title: string;
    original_video_url: string;
    original_video_id: string; // ID oder Hash [cite: 284]
    original_video_duration: string; // Länge [cite: 283]

    // Vergütungs-Logik [cite: 353]
    pricing_model_type: 1 | 2 | 3; // 1: Festpreis, 2: Views, 3: CPM [cite: 355, 359, 363]
    pricing_value: number; // Der Betrag/Satz [cite: 370]
    pricing_currency: string;

    // FairShare Metadaten [cite: 341]
    fairshare_score: number;
    fairshare_metadata: {
        marktmacht_score: number; // [cite: 342]
        schoepferische_leistung: number; // [cite: 343]
        parameter_dokumentation_url: string; // Link zur Algorithmus-Doku [cite: 345]
    };

    // Rechtsgültigkeit [cite: 481, 483, 485]
    accepted_by_licensor: boolean;
    accepted_by_licensee: boolean;
    licensor_accepted_at?: string;
    licensee_accepted_at?: string;

    contract_version: string; // Wichtig für die Textform-Referenz [cite: 483]

    // Stripe Payment
    stripe_session_id?: string;
    stripe_subscription_id?: string; // For recurring/usage billing
    stripe_customer_id?: string; // To link contract to Stripe Customer
    last_reported_view_count?: number; // Last count synced to Stripe (for delta reporting)
    billing_cycle_anchor?: string; // ISO Date of next billing cycle
    status?: "PENDING" | "PAID" | "FAILED" | "ACTIVE"; // Added ACTIVE for subscriptions

    // File handling
    pdf_storage_path?: string; // Full URL to the license file
}

import { getProfile } from "./profiles";

export const createReactionContract = async (contract: ReactionContract) => {
    // Check if licensor has auto-accept enabled
    try {
        const licensorProfile = await getProfile(contract.licensor_id);
        if (licensorProfile?.auto_accept_reactions) {
            contract.accepted_by_licensor = true;
            contract.licensor_accepted_at = new Date().toISOString();
        }
    } catch (e) {
        console.warn(
            "Could not fetch licensor profile for auto-accept check",
            e,
        );
    }

    const { data, error } = await supabase.from("reaction_contracts").insert([
        contract,
    ]).select().single();
    if (error) throw error;
    return data;
};

export const getReactionContracts = async () => {
    const { data, error } = await supabase.from("reaction_contracts").select(
        "*",
    );
    if (error) throw error;
    return data;
};

export const getReactionContractById = async (id: string) => {
    const { data, error } = await supabase.from("reaction_contracts").select(
        "*",
    ).eq("id", id);
    if (error) throw error;
    return data;
};

export const updateReactionContract = async (
    id: string,
    contract: Partial<ReactionContract>,
) => {
    const { data, error } = await supabase.from("reaction_contracts").update(
        contract,
    ).eq("id", id);
    if (error) throw error;
    return data;
};

export const deleteReactionContract = async (id: string) => {
    const { data, error } = await supabase.from("reaction_contracts").delete()
        .eq("id", id);
    if (error) throw error;
    return data;
};

export const getPendingReactionContracts = async (originalVideoId: string) => {
    const { data, error } = await supabase
        .from("reaction_contracts")
        .select("*")
        .eq("original_video_id", originalVideoId)
        .eq("accepted_by_licensor", false);

    if (error) throw error;
    return data;
};

export const getContractsForVideo = async (videoId: string) => {
    const { data, error } = await supabase
        .from("reaction_contracts")
        .select("*")
        .eq("original_video_id", videoId);
    if (error) throw error;
    return data;
};
export const getPurchasedContracts = async (userId: string) => {
    const { data, error } = await supabase
        .from("reaction_contracts")
        .select("*")
        .eq("licensee_id", userId)
        // .in("status", ["PAID"]) // DEBUG: Allow all statuses to see PENDING
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
};

export const checkExistingLicense = async (
    licenseeId: string,
    originalVideoId: string,
    reactionVideoId: string,
) => {
    // Check if there is already a PAID or PENDING contract for this combination
    const { data, error } = await supabase
        .from("reaction_contracts")
        .select("id, status")
        .eq("licensee_id", licenseeId)
        .eq("original_video_id", originalVideoId)
        .eq("reaction_video_id", reactionVideoId)
        .maybeSingle();

    if (error) {
        console.error("Error checking existing license:", error);
        return null;
    }

    // Return the status string (e.g. "PAID", "PENDING") or null
    return data?.status || null;
};
