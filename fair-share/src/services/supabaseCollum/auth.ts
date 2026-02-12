import { supabase } from "./client";

const YOUTUBE_SCOPE = "https://www.googleapis.com/auth/youtube.readonly";

export const signInWithGoogle = async () => {
  console.log("DEBUG: Redirecting to:", window.location.origin);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      scopes: YOUTUBE_SCOPE,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
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
    // If the session is missing or invalid (403), we still want to clear the local state.
    // Usually, the library clears it locally when signOut is called, even if the server request fails.
    // To be safe, we treat "Auth session missing" as a success (already logged out).
    if (
      error.message.includes("Auth session missing") ||
      error.name === "AuthSessionMissingError"
    ) {
      console.warn(
        "Logout warning: Session was already missing on server. Clearing local state...",
      );

      // Force local cleanup manually
      const supabaseKeys = Object.keys(localStorage).filter((key) =>
        key.startsWith("sb-"),
      );
      supabaseKeys.forEach((key) => localStorage.removeItem(key));

      // Optional: try client signout too, ignoring errors
      await supabase.auth.signOut({ scope: "local" }).catch(() => {});

      return true;
    }
    console.error("Error signing out:", error);
    return null;
  }

  return true;
};

export const getCurrentSession = async () => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) return null;
  return session;
};
