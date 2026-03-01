import { useState } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useAnalytics } from "@/hooks/queries/useAnalytics";
import {
  Loader2,
  TrendingUp,
  DollarSign,
  Activity,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactorsModal } from "./ReactorsModal";

export const Analytics = () => {
  const { user } = useAuth();
  const { data: analytics, isLoading: loading, error } = useAnalytics(user?.id);
  const [showReactorsModal, setShowReactorsModal] = useState(false);
  const [selectedView, setSelectedView] = useState<"revenue" | "activity">(
    "revenue",
  );

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-destructive/30 bg-destructive/5">
        <p className="text-destructive font-medium">
          Analytics konnten nicht geladen werden.
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Bitte versuche es später erneut.
        </p>
      </div>
    );
  }

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
            value={`€${analytics.totalRevenue.toFixed(2)}`}
            accent={selectedView === "revenue"}
            onClick={() => setSelectedView("revenue")}
            subtext="Klicken für Verlauf"
          />
          <StatCard
            icon={<Activity className="h-4 w-4" />}
            label="Aktivität (Verträge & Abos)"
            value={`${analytics.totalContracts}`}
            accent={selectedView === "activity"}
            onClick={() => setSelectedView("activity")}
            subtext={`${analytics.activeContracts} Aktive Abos · ${analytics.totalReactors} Reactors`}
          />
        </div>

        {/* Main Content Area based on Selection */}
        <Card className="min-h-[300px] mb-8">
          <CardHeader>
            <CardTitle className="flex justify-between items-center text-base">
              {selectedView === "revenue"
                ? "Einnahmen Verlauf (letzte 6 Monate)"
                : "Aktivitäts-Details"}
              {selectedView === "revenue" &&
                analytics.totalRevenue > 0 &&
                analytics.revenueByMonth.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-green-500 font-normal bg-green-500/10 px-2 py-1 rounded-full">
                    <ArrowUpRight className="h-3 w-3" /> +
                    {analytics.revenueByMonth[
                      analytics.revenueByMonth.length - 1
                    ].amount.toFixed(2)}
                    € diesen Monat
                  </div>
                )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedView === "revenue" ? (
              <div className="h-[250px] w-full flex items-end justify-between gap-2 pt-4 pl-4 pr-4">
                {analytics.revenueByMonth.length > 0 ? (
                  <SimpleBarChart data={analytics.revenueByMonth} />
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
                      {analytics.totalContracts}
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
                      {analytics.totalReactors}
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
                      {analytics.activeContracts}
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
                    {analytics.revenueByModel.map((item) => {
                      const percentage =
                        analytics.totalRevenue > 0
                          ? (item.amount / analytics.totalRevenue) * 100
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
                    {analytics.revenueByModel.length === 0 && (
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
        {analytics.recentContracts.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Letzte Verträge
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.recentContracts.map((contract) => (
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
        contracts={analytics.allLicensorContracts}
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

function SimpleBarChart({
  data,
}: {
  data: { month: string; amount: number }[];
}) {
  const maxVal = Math.max(...data.map((d) => d.amount), 1);

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
              <div
                className="w-2/3 bg-primary rounded-t-sm transition-all duration-500 relative group-hover:bg-primary/80"
                style={{ height: `${Math.max(heightPercent, 2)}%` }}
              >
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
