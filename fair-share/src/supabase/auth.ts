import { supabase } from "./client";


const YOUTUBE_SCOPE = "https://www.googleapis.com/auth/youtube.readonly";

export const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
           queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        },
    });

    if (error) {
        console.error("Error signing in with Google:", error);
        return null;
    }

    return data;
};


export const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
        console.error("Error signing out:", error);
        return null;
    }

    return true;
};