import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/services/supabaseCollum/client";
import { ReactionContract } from "@/services/supabaseCollum/reactionContract";

interface AnalyticsData {
  totalRevenue: number;
  activeContracts: number;
  totalContracts: number;
  totalReactors: number;
  licensedVideoCount: number;
  revenueByModel: { model: string; amount: number; count: number }[];
  revenueByMonth: { month: string; amount: number; count: number }[];
  recentContracts: {
    id: string;
    title: string;
    licensee_name: string;
    pricing_value: number;
    pricing_currency: string;
    pricing_model_type: number;
    status: string;
    created_at: string;
  }[];
  allLicensorContracts: ReactionContract[];
  totalSpent: number;
  purchasedLicenses: number;
  activeSubs: number;
}

export const useAnalytics = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["analytics", userId],
    queryFn: async (): Promise<AnalyticsData> => {
      if (!userId) throw new Error("User ID is required");

      const PRICING_MODEL_LABELS: Record<number, string> = {
        1: "One-Time",
        2: "Per 1000 Views",
        3: "Per 1000 Views (CPM)",
      };

      const [
        { data: licensorContracts },
        { data: licenseeContracts },
        { data: licensedVideos },
      ] = await Promise.all([
        supabase
          .from("reaction_contracts")
          .select("*")
          .eq("licensor_id", userId),
        supabase
          .from("reaction_contracts")
          .select("*")
          .eq("licensee_id", userId),
        supabase
          .from("videos")
          .select("id")
          .eq("creator_id", userId)
          .eq("is_licensed", true),
      ]);

      const allLicensor = (licensorContracts || []) as ReactionContract[];
      const allLicensee = (licenseeContracts || []) as ReactionContract[];

      // Calc stats for Licensor
      const totalRevenue = allLicensor
        .filter((c) => c.status === "PAID" || c.status === "ACTIVE")
        .reduce((sum, c) => sum + (c.pricing_value || 0), 0);

      const activeContracts = allLicensor.filter(
        (c) => c.status === "ACTIVE" || c.status === "PAID",
      ).length;

      const reactors = new Set(allLicensor.map((c) => c.licensee_id)).size;

      // Revenue by Model
      const modelMap = new Map<string, { amount: number; count: number }>();
      allLicensor
        .filter((c) => c.status === "PAID" || c.status === "ACTIVE")
        .forEach((c) => {
          const label = PRICING_MODEL_LABELS[c.pricing_model_type] || "Other";
          const current = modelMap.get(label) || { amount: 0, count: 0 };
          modelMap.set(label, {
            amount: current.amount + (c.pricing_value || 0),
            count: current.count + 1,
          });
        });

      // Revenue by Month (last 6 months)
      const monthMap = new Map<string, { amount: number; count: number }>();
      allLicensor
        .filter((c) => c.status === "PAID" || c.status === "ACTIVE")
        .forEach((c) => {
          const d = new Date(c.created_at);
          const key = d.toLocaleString("default", {
            month: "short",
            year: "2-digit",
          });
          const current = monthMap.get(key) || { amount: 0, count: 0 };
          monthMap.set(key, {
            amount: current.amount + (c.pricing_value || 0),
            count: current.count + 1,
          });
        });

      // Calc stats for Licensee (Spent)
      const totalSpent = allLicensee
        .filter((c) => c.status === "PAID" || c.status === "ACTIVE")
        .reduce((sum, c) => sum + (c.pricing_value || 0), 0);

      const activeSubs = allLicensee.filter(
        (c) =>
          (c.status === "ACTIVE" || c.status === "PAID") &&
          c.pricing_model_type !== 1,
      ).length;

      // Recent contracts (last 5)
      const recentContracts = [...allLicensor]
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .slice(0, 5)
        .map((c) => ({
          id: c.id,
          title: c.original_video_title || "Unknown Video",
          licensee_name: c.licensee_name || "Unknown Reactor",
          pricing_value: c.pricing_value,
          pricing_currency: c.pricing_currency,
          pricing_model_type: c.pricing_model_type,
          status: c.status || "PENDING",
          created_at: c.created_at,
        }));

      return {
        totalRevenue,
        activeContracts,
        totalContracts: allLicensor.length,
        totalReactors: reactors,
        licensedVideoCount: licensedVideos?.length || 0,
        revenueByModel: Array.from(modelMap.entries()).map(([model, data]) => ({
          model,
          ...data,
        })),
        revenueByMonth: Array.from(monthMap.entries()).map(([month, data]) => ({
          month,
          ...data,
        })),
        recentContracts,
        allLicensorContracts: allLicensor,
        totalSpent,
        purchasedLicenses: allLicensee.length,
        activeSubs,
      };
    },
    enabled: !!userId,
  });
};
