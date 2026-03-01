import { useQuery } from "@tanstack/react-query";
import { getAllProfiles, Profile } from "@/services/supabaseCollum/profiles";

export const useAllProfiles = () => {
  return useQuery({
    queryKey: ["allProfiles"],
    queryFn: async (): Promise<Profile[]> => {
      const data = await getAllProfiles();
      return data || [];
    },
  });
};
