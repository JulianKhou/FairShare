import { signOut, signInWithGoogle } from "../../services/supabase/auth";

export const handleLogout = async () => {
  await signOut();
  console.log("User logged out");
};

export const handleLogin = async () => {
  await signInWithGoogle();
  console.log("User logged in");
};
