import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type AuthUser = { id: string };

const getSupabaseUrl = () => Deno.env.get("SUPABASE_URL") ?? "";

const getAnonKey = () => Deno.env.get("SUPABASE_ANON_KEY") ?? "";

export const getServiceRoleKey = () =>
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  Deno.env.get("SERVICE_ROLE_KEY") ??
  "";

export const createAdminClient = () =>
  createClient(getSupabaseUrl(), getServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

export const hasServiceRoleToken = (req: Request) => {
  const authHeader = req.headers.get("Authorization");
  const serviceRoleKey = getServiceRoleKey();
  if (!authHeader || !serviceRoleKey) return false;
  return authHeader === `Bearer ${serviceRoleKey}`;
};

export const getUserFromRequest = async (
  req: Request,
): Promise<AuthUser | null> => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;

  const anonKey = getAnonKey();
  if (!anonKey) return null;

  const authClient = createClient(getSupabaseUrl(), anonKey, {
    global: {
      headers: { Authorization: authHeader },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();

  if (error || !user) return null;
  return { id: user.id };
};

export const isAdminUser = async (userId: string): Promise<boolean> => {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .single();

  if (error || !data) return false;
  return data.is_admin === true;
};
