import { createClient } from "@supabase/supabase-js";

const supabaseUrl= import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey= import.meta.env.VITE_SUPABASE_KEY as string;

if(!supabaseUrl || !supabaseKey){
    throw new Error("Supabase URL or key not found");
}

export const supabase = createClient(supabaseUrl, supabaseKey,
    {
        auth:{
            autoRefreshToken:true,
            persistSession:true,
            detectSessionInUrl:true,
        }
    }
);