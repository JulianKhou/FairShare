import { supabase } from "./client";

export interface Profile {
    id: string;
    auto_accept_reactions?: boolean;
    full_name?: string;
    address_street?: string;
    address_number?: string;
    address_city?: string;
    address_zip?: string;
    youtube_channel_id?: string;

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
