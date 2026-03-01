import { useQuery } from "@tanstack/react-query";
import { getAllProfiles } from "@/services/supabaseCollum/profiles";
import {
  getAllReactionContracts,
  ReactionContract,
} from "@/services/supabaseCollum/reactionContract";
import { getAllHelpRequests } from "@/services/supabaseCollum/helpRequests";

interface AdminDashboardStatsData {
  stats: {
    totalUsers: number;
    activeLicenses: number;
    pendingLicenses: number;
    totalRevenue: number;
    openSupportTickets: number;
  };
  rawContracts: ReactionContract[];
}

export const useAdminDashboardStats = () => {
  return useQuery({
    queryKey: ["adminDashboardStats"],
    queryFn: async (): Promise<AdminDashboardStatsData> => {
      const [profiles, contracts, helpRequests] = await Promise.all([
        getAllProfiles(),
        getAllReactionContracts(),
        getAllHelpRequests(),
      ]);

      const totalUsers = (profiles || []).length;

      let activeLicenses = 0;
      let pendingLicenses = 0;
      let totalRevenue = 0;

      (contracts || []).forEach((c) => {
        if (c.status === "ACTIVE" || c.status === "PAID") {
          activeLicenses++;
          totalRevenue += c.pricing_value;
        } else if (c.status === "PENDING" || !c.accepted_by_licensor) {
          pendingLicenses++;
        }
      });

      // Berechne 10% Plattformgebühr (Beispielhaft)
      const platformRevenue = totalRevenue * 0.1;

      // Support Tickets berechnen
      const openSupportTickets = (helpRequests || []).filter(
        (req) => req.status === "OPEN",
      ).length;

      return {
        stats: {
          totalUsers,
          activeLicenses,
          pendingLicenses,
          totalRevenue: platformRevenue,
          openSupportTickets,
        },
        rawContracts: contracts || [],
      };
    },
  });
};
