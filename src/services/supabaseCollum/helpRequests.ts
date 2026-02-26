import { supabase } from "./client";

export interface HelpRequest {
  id: string;
  created_at: string;
  user_id: string;
  subject: string;
  message: string;
  status: "OPEN" | "IN_PROGRESS" | "CLOSED";
  // Join fields from profiles
  user_full_name?: string;
  user_email?: string; // If exists in profiles or auth
}

export const createHelpRequest = async (subject: string, message: string) => {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("help_requests")
    .insert([{ user_id: userData.user.id, user_email: userData.user.email, subject, message }])
    .select()
    .single();

  if (error) {
    console.error("Error creating help request:", error);
    throw error;
  }
  return data as HelpRequest;
};

// Admin Functions
export const getAllHelpRequests = async () => {
  // Try to join with profiles to get user names for the admin view
  const { data, error } = await supabase
    .from("help_requests")
    .select(`
      *,
      profiles:user_id (full_name)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching all help requests:", error);
    throw error;
  }

  // Map the joined profile data to flat fields for easier use in Datatables
  return (data || []).map((req: any) => ({
    ...req,
    user_full_name: req.profiles?.full_name || "Unknown User",
  })) as HelpRequest[];
};

export const updateHelpRequestStatus = async (
  requestId: string,
  newStatus: "OPEN" | "IN_PROGRESS" | "CLOSED"
) => {
  const { data, error } = await supabase
    .from("help_requests")
    .update({ status: newStatus })
    .eq("id", requestId)
    .select()
    .single();

  if (error) {
    console.error("Error updating help request status:", error);
    throw error;
  }
  return data as HelpRequest;
};

export const getUserHelpRequests = async () => {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("help_requests")
    .select("*")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching user help requests:", error);
    throw error;
  }
  return data as HelpRequest[];
};
