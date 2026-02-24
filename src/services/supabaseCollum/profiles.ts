import { supabase } from "./client";

export interface Profile {
    id: string;
    is_admin?: boolean;
    auto_accept_reactions?: boolean;
    auto_license_videos?: "none" | "public_only" | "all";
    auto_license_since?: string; // ISO date — only videos after this date get auto-licensed
    full_name?: string;
    address_street?: string;
    address_number?: string;
    address_city?: string;
    address_zip?: string;
    youtube_channel_id?: string;
    youtube_channel_title?: string;
    youtube_channel_avatar?: string;
    subscriber_count?: number;
    stripe_connect_id?: string;
    stripe_customer_id?: string;
    min_license_price?: number;
    use_auto_pricing?: boolean;
}

export const getProfile = async (userId: string) => {
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

    if (error) {
        console.error("Error fetching profile:", error);
        return null;
    }
    return data as Profile;
};

export const getAllProfiles = async () => {
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("id", { ascending: true }); // Simple ordering

    if (error) {
        console.error("Error fetching all profiles:", error);
        throw error;
    }
    return data as Profile[];
};

export const updateProfile = async (userId: string, updates: Partial<Profile>) => {
    const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId)
        .select()
        .single();

    if (error) {
        console.error("Error updating profile:", error);
        throw error;
    }
    return data as Profile;
};

export const getProfilesByIds = async (userIds: string[]) => {
    if (!userIds || userIds.length === 0) return [];

    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);

    if (error) {
        console.error("Error fetching profiles by ids:", error);
        return [];
    }
    return data as Profile[];
};

export const isProfileComplete = (profile: Profile): boolean => {
    return !!(
        profile.full_name &&
        profile.address_street &&
        profile.address_number &&
        profile.address_city &&
        profile.address_zip &&
        profile.youtube_channel_id
    );
};
