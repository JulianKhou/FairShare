import { useQuery } from "@tanstack/react-query";
import { getProfile } from "@/services/supabaseCollum/profiles";

export const useCreatorMinPrice = (creatorId: string | undefined) => {
  return useQuery({
    queryKey: ["creatorMinPrice", creatorId],
    queryFn: async () => {
      if (!creatorId) return 0;
      try {
        const creatorProfile = await getProfile(creatorId);
        if (
          creatorProfile?.use_auto_pricing === false &&
          creatorProfile?.min_license_price
        ) {
          return creatorProfile.min_license_price;
        }
        return 0;
      } catch {
        return 0;
      }
    },
    enabled: !!creatorId,
  });
};
