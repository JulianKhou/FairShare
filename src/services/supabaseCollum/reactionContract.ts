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
    status?: "PENDING" | "PAID" | "FAILED" | "ACTIVE" | "REJECTED"; // Added REJECTED for rejected requests

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

export const getAllReactionContracts = async () => {
    const { data, error } = await supabase
        .from("reaction_contracts")
        .select("*")
        .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data as ReactionContract[];
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

// Spezielle Funktion für Admins (Ohne RLS/Business Logic Restriktionen im Code)
export const adminDeleteReactionContract = async (id: string) => {
    // 1. Delete
    const { data, error } = await supabase.from("reaction_contracts").delete()
        .eq("id", id);
    if (error) throw error;
    
    // 2. Check if really deleted (RLS might absorb the delete without error)
    const { data: checkData, error: checkError } = await supabase.from("reaction_contracts").select("id").eq("id", id).maybeSingle();
    
    if (checkData) {
        throw new Error("Missing Permission: Supabase Row Level Security (RLS) prevented the deletion. Please ensure the admin role has delete access on reaction_contracts.");
    }
    
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
        .select("id, status, accepted_by_licensor")
        .eq("licensee_id", licenseeId)
        .eq("original_video_id", originalVideoId)
        .eq("reaction_video_id", reactionVideoId)
        .maybeSingle();

    if (error) {
        console.error("Error checking existing license:", error);
        return null;
    }

    // Return the status and id
    return data ? { status: data.status, id: data.id, accepted_by_licensor: data.accepted_by_licensor } : null;
};

export const checkAnyExistingLicense = async (
    licenseeId: string,
    originalVideoId: string,
) => {
    // Check if there is ANY PAID or ACTIVE contract for this base video
    const { data, error } = await supabase
        .from("reaction_contracts")
        .select("id")
        .eq("licensee_id", licenseeId)
        .eq("original_video_id", originalVideoId)
        .in("status", ["PAID", "ACTIVE"])
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error("Error checking any existing license:", error);
        return false;
    }

    return !!data;
};

export const withdrawReactionContract = async (contractId: string) => {
    const { error } = await supabase
        .from("reaction_contracts")
        .delete()
        .eq("id", contractId)
        .eq("accepted_by_licensor", false); // Security: only delete if not accepted yet
    
    if (error) throw error;
    return true;
};
