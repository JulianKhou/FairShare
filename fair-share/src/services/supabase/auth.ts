import { supabase } from "./client";


const YOUTUBE_SCOPE = "https://www.googleapis.com/auth/youtube.readonly";

export const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            scopes: YOUTUBE_SCOPE,
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
            },
            redirectTo: window.location.origin,
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

export const getCurrentSession = async () =>{
  const {data :{session},error} =await supabase.auth.getSession();
  if(error) return null;
  return session;
};