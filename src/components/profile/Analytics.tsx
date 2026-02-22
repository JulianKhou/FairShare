import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { supabase } from "@/services/supabaseCollum/client";
import {
  Loader2,
  TrendingUp,
  DollarSign,
  Activity,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReactionContract } from "@/services/supabaseCollum/reactionContract";
import { ReactorsModal } from "./ReactorsModal";

interface AnalyticsData {
  // As Licensor (Creator)
  totalRevenue: number;
  activeContracts: number;
  totalContracts: number;
  totalReactors: number;
  licensedVideoCount: number;
  revenueByModel: { model: string; amount: number; count: number }[];
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
  revenueByMonth: { month: string; amount: number; count: number }[];
  allLicensorContracts: ReactionContract[]; // For Modal

  // As Licensee (Reactor)
  totalSpent: number;
  purchasedLicenses: number;
  activeSubs: number;
}

const PRICING_MODEL_LABELS: Record<number, string> = {
  1: "One-Time",
  2: "Per 1000 Views",
  3: "Per 1000 Views (CPM)",
};

type ViewMode = "revenue" | "activity";

export const Analytics = () => {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<ViewMode>("revenue");
  const [showReactorsModal, setShowReactorsModal] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        // Fetch all contracts where user is licensor (earning money)
        const { data: licensorContracts, error: lcError } = await supabase
          .from("reaction_contracts")
          .select("*")
          .eq("licensor_id", user.id)
          .order("created_at", { ascending: true }); // Order by date for chart

        if (lcError) throw lcError;

        // Fetch all contracts where user is licensee (spending money)
        const { data: licenseeContracts, error: leError } = await supabase
          .from("reaction_contracts")
          .select("*")
          .eq("licensee_id", user.id)
          .order("created_at", { ascending: false });

        if (leError) throw leError;

        // Fetch licensed videos count
        const { count: licensedCount } = await supabase
          .from("videos")
          .select("*", { count: "exact", head: true })
          .eq("creator_id", user.id)
          .eq("islicensed", true);

        const contracts = licensorContracts || [];
        const purchases = licenseeContracts || [];

        // --- As Licensor ---
        const paidContracts = contracts.filter(
          (c) => c.status === "PAID" || c.status === "ACTIVE",
        );

        const totalRevenue = contracts.reduce(
          (sum, c) => sum + (c.pricing_value || 0),
          0,
        );

        const activeContracts = contracts.filter(
          (c) => c.status === "ACTIVE",
        ).length;

        // Unique reactors
        const uniqueReactors = new Set(contracts.map((c) => c.licensee_id));

        // Revenue by pricing model
        const modelMap = new Map<number, { amount: number; count: number }>();
        for (const c of contracts) {
          const existing = modelMap.get(c.pricing_model_type) || {
            amount: 0,
            count: 0,
          };
          existing.amount += c.pricing_value || 0;
          existing.count += 1;
          modelMap.set(c.pricing_model_type, existing);
        }

        const revenueByModel = Array.from(modelMap.entries()).map(
          ([model, { amount, count }]) => ({
            model: PRICING_MODEL_LABELS[model] || `Model ${model}`,
            amount,
            count,
          }),
        );

        // Revenue by Month (for Chart)
        const monthMap = new Map<string, { amount: number; count: number }>();
        // Initialize last 6 months with 0
        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const key = d.toISOString().slice(0, 7); // YYYY-MM
          monthMap.set(key, { amount: 0, count: 0 });
        }

        for (const c of contracts) {
          const key = c.created_at.slice(0, 7);
          const existing = monthMap.get(key) || { amount: 0, count: 0 };
          existing.amount += c.pricing_value || 0;
          existing.count += 1;
          if (!monthMap.has(key)) monthMap.set(key, existing);
          else monthMap.set(key, existing);
        }

        // Convert to array and format month label
        const revenueByMonth = Array.from(monthMap.entries()).map(
          ([monthIso, val]) => {
            const date = new Date(monthIso + "-01");
            return {
              month: date.toLocaleDateString("de-DE", {
                month: "short",
                year: "2-digit",
              }),
              amount: val.amount,
              count: val.count,
            };
          },
        );

        // Recent contracts (last 5 - need to reverse sort first as we sorted ascending for chart)
        const sortedDescending = [...contracts].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        const recentContracts = sortedDescending.slice(0, 5).map((c) => ({
          id: c.id,
          title: c.original_video_title,
          licensee_name: c.licensee_name,
          pricing_value: c.pricing_value,
          pricing_currency: c.pricing_currency,
          pricing_model_type: c.pricing_model_type,
          status: c.status || "PENDING",
          created_at: c.created_at,
        }));

        // --- As Licensee ---
        const paidPurchases = purchases.filter(
          (c) => c.status === "PAID" || c.status === "ACTIVE",
        );

        const totalSpent = paidPurchases.reduce(
          (sum, c) => sum + (c.pricing_value || 0),
          0,
        );

        const activeSubs = purchases.filter(
          (c) => c.status === "ACTIVE",
        ).length;

        setData({
          totalRevenue,
          activeContracts,
          totalContracts: contracts.length,
          totalReactors: uniqueReactors.size,
          licensedVideoCount: licensedCount || 0,
          revenueByModel,
          recentContracts,
          revenueByMonth,
          allLicensorContracts: contracts, // Store for Modal
          totalSpent,
          purchasedLicenses: paidPurchases.length,
          activeSubs,
        });
      } catch (err: any) {
        console.error("Analytics fetch error:", err);
        setError("Analytics konnten nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive p-4">{error}</div>;
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* === CREATOR / LICENSOR SECTION === */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Einnahmen & Aktivität
        </h2>

        {/* Clickable Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <StatCard
            icon={<DollarSign className="h-4 w-4" />}
            label="Gesamteinnahmen"
            value={`€${data.totalRevenue.toFixed(2)}`}
            accent={selectedView === "revenue"}
            onClick={() => setSelectedView("revenue")}
            subtext="Klicken für Verlauf"
          />
          <StatCard
            icon={<Activity className="h-4 w-4" />}
            label="Aktivität (Verträge & Abos)"
            value={`${data.totalContracts}`}
            accent={selectedView === "activity"}
            onClick={() => setSelectedView("activity")}
            subtext={`${data.activeContracts} Aktive Abos · ${data.totalReactors} Reactors`}
          />
        </div>

        {/* Main Content Area based on Selection */}
        <Card className="min-h-[300px] mb-8">
          <CardHeader>
            <CardTitle className="flex justify-between items-center text-base">
              {selectedView === "revenue"
                ? "Einnahmen Verlauf (letzte 6 Monate)"
                : "Aktivitäts-Details"}
              {selectedView === "revenue" && data.totalRevenue > 0 && (
                <div className="flex items-center gap-1 text-xs text-green-500 font-normal bg-green-500/10 px-2 py-1 rounded-full">
                  <ArrowUpRight className="h-3 w-3" /> +
                  {data.revenueByMonth[
                    data.revenueByMonth.length - 1
                  ].amount.toFixed(2)}
                  € diesen Monat
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedView === "revenue" ? (
              <div className="h-[250px] w-full flex items-end justify-between gap-2 pt-4 pl-4 pr-4">
                {data.revenueByMonth.length > 0 ? (
                  <SimpleBarChart data={data.revenueByMonth} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    Keine Daten verfügbar
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Contract Stats Breakdown */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold">
                      {data.totalContracts}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                      Verträge Gesamt
                    </div>
                  </div>
                  <div
                    className="p-4 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ring-1 ring-transparent hover:ring-primary/20 relative group"
                    onClick={() => setShowReactorsModal(true)}
                  >
                    <div className="text-2xl font-bold text-primary group-hover:scale-110 transition-transform">
                      {data.totalReactors}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                      Unique Reactors
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowUpRight className="h-3 w-3 text-primary" />
                    </div>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold">
                      {data.activeContracts}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                      Aktive Abos
                    </div>
                  </div>
                </div>

                {/* Revenue by Model List */}
                <div>
                  <h4 className="text-sm font-medium mb-3">
                    Verteilung nach Preis-Modell
                  </h4>
                  <div className="space-y-3">
                    {data.revenueByModel.map((item) => {
                      const percentage =
                        data.totalRevenue > 0
                          ? (item.amount / data.totalRevenue) * 100
                          : 0;
                      return (
                        <div key={item.model}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium">{item.model}</span>
                            <span className="text-muted-foreground">
                              €{item.amount.toFixed(2)} · {item.count} Verträge
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all duration-500"
                              style={{ width: `${Math.max(percentage, 2)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {data.revenueByModel.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Keine Daten.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Contracts */}
        {data.recentContracts.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Letzte Verträge
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.recentContracts.map((contract) => (
                  <div
                    key={contract.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {contract.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {contract.licensee_name} ·{" "}
                        {new Date(contract.created_at).toLocaleDateString(
                          "de-DE",
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          contract.status === "PAID" ||
                          contract.status === "ACTIVE"
                            ? "bg-green-500/10 text-green-500"
                            : contract.status === "PENDING"
                              ? "bg-yellow-500/10 text-yellow-500"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {contract.status}
                      </span>
                      <span className="text-sm font-semibold whitespace-nowrap">
                        €{contract.pricing_value.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <ReactorsModal
        isOpen={showReactorsModal}
        onClose={() => setShowReactorsModal(false)}
        contracts={data.allLicensorContracts}
      />
    </div>
  );
};

// ─── Sub-Components ───────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  accent = false,
  onClick,
  subtext,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
  onClick?: () => void;
  subtext?: string;
}) {
  return (
    <Card
      onClick={onClick}
      className={`cursor-pointer transition-all hover:shadow-md ${
        accent
          ? "border-primary ring-1 ring-primary/20 bg-primary/5 shadow-sm"
          : "hover:border-primary/50"
      }`}
    >
      <CardContent className="pt-6 pb-6">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          {icon}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <p className={`text-3xl font-bold ${accent ? "text-primary" : ""}`}>
          {value}
        </p>
        {subtext && (
          <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
        )}
      </CardContent>
    </Card>
  );
}

// Simple SVG Bar Chart
function SimpleBarChart({
  data,
}: {
  data: { month: string; amount: number }[];
}) {
  const maxVal = Math.max(...data.map((d) => d.amount), 1); // Avoid div by zero

  return (
    <div className="w-full h-full flex items-end justify-between gap-2">
      {data.map((item, i) => {
        const heightPercent = (item.amount / maxVal) * 100;
        return (
          <div
            key={i}
            className="flex-1 h-full flex flex-col items-center gap-2 group"
          >
            <div className="relative w-full bg-muted/30 rounded-t-sm hover:bg-muted/50 transition-colors flex items-end justify-center group-hover:bg-primary/10 h-full">
              {/* Bar */}
              <div
                className="w-2/3 bg-primary rounded-t-sm transition-all duration-500 relative group-hover:bg-primary/80"
                style={{ height: `${Math.max(heightPercent, 2)}%` }}
              >
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 border">
                  {item.amount.toFixed(2)}€
                </div>
              </div>
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {item.month}
            </span>
          </div>
        );
      })}
    </div>
  );
}
