import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/services/supabaseCollum/client";
import { getProfile } from "@/services/supabaseCollum/profiles";

interface DashboardStats {
  totalEarnings: number;
  totalSpent: number;
  activeContracts: number;
  pendingRequests: number;
}

export const useDashboardStats = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["dashboardStats", userId],
    queryFn: async () => {
      if (!userId) return null;

      const [
        profileData,
        contractsLicensor,
        contractsLicensee,
        revLicensorData,
        revLicenseeData,
        activeData,
        pendingData,
      ] = await Promise.allSettled([
        getProfile(userId),
        supabase
          .from("reaction_contracts")
          .select("id, pricing_value, pricing_model_type")
          .eq("licensor_id", userId)
          .in("status", ["PAID", "ACTIVE"]),
        supabase
          .from("reaction_contracts")
          .select("id, pricing_value, pricing_model_type")
          .eq("licensee_id", userId)
          .in("status", ["PAID", "ACTIVE"]),
        supabase
          .from("revenue_events")
          .select("contract_id, amount_cents")
          .eq("licensor_id", userId),
        supabase
          .from("revenue_events")
          .select("contract_id, amount_cents")
          .eq("licensee_id", userId),
        supabase
          .from("reaction_contracts")
          .select("id", { count: "exact", head: true })
          .or(`licensor_id.eq.${userId},licensee_id.eq.${userId}`)
          .in("status", ["PAID", "ACTIVE"]),
        supabase
          .from("reaction_contracts")
          .select("id", { count: "exact", head: true })
          .eq("licensor_id", userId)
          .eq("accepted_by_licensor", false)
          .neq("status", "REJECTED"),
      ]);

      const profile =
        profileData.status === "fulfilled" ? profileData.value : null;

      const revenuesLicensor: Record<string, number> = {};
      if (
        revLicensorData.status === "fulfilled" &&
        revLicensorData.value.data
      ) {
        revLicensorData.value.data.forEach((r: any) => {
          if (!revenuesLicensor[r.contract_id])
            revenuesLicensor[r.contract_id] = 0;
          revenuesLicensor[r.contract_id] += r.amount_cents / 100;
        });
      }

      const revenuesLicensee: Record<string, number> = {};
      if (
        revLicenseeData.status === "fulfilled" &&
        revLicenseeData.value.data
      ) {
        revLicenseeData.value.data.forEach((r: any) => {
          if (!revenuesLicensee[r.contract_id])
            revenuesLicensee[r.contract_id] = 0;
          revenuesLicensee[r.contract_id] += r.amount_cents / 100;
        });
      }

      let earnings = 0;
      if (
        contractsLicensor.status === "fulfilled" &&
        contractsLicensor.value.data
      ) {
        contractsLicensor.value.data.forEach((c: any) => {
          if (
            revenuesLicensor[c.id] !== undefined &&
            revenuesLicensor[c.id] > 0
          ) {
            earnings += revenuesLicensor[c.id];
          } else if (c.pricing_model_type === 1) {
            earnings += c.pricing_value || 0;
          }
        });
      }

      let spent = 0;
      if (
        contractsLicensee.status === "fulfilled" &&
        contractsLicensee.value.data
      ) {
        contractsLicensee.value.data.forEach((c: any) => {
          if (
            revenuesLicensee[c.id] !== undefined &&
            revenuesLicensee[c.id] > 0
          ) {
            spent += revenuesLicensee[c.id];
          } else if (c.pricing_model_type === 1) {
            spent += c.pricing_value || 0;
          }
        });
      }

      const active =
        activeData.status === "fulfilled" ? activeData.value.count || 0 : 0;
      const pending =
        pendingData.status === "fulfilled" ? pendingData.value.count || 0 : 0;

      const stats: DashboardStats = {
        totalEarnings: earnings,
        totalSpent: spent,
        activeContracts: active,
        pendingRequests: pending,
      };

      return { profile, stats };
    },
    enabled: !!userId,
  });
};
