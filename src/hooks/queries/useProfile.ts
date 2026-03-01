import { useQuery } from "@tanstack/react-query";
import { getProfile, Profile } from "@/services/supabaseCollum/profiles";

export const useProfile = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: async (): Promise<Profile | null> => {
      if (!userId) {
        return null;
      }
      return await getProfile(userId);
    },
    enabled: !!userId,
  });
};
