import { useMemo, useState } from "react";
import { IconInfoCircle, IconSettings } from "@tabler/icons-react";

import {
  DEFAULT_NICHE_DATA,
  NICHE_DATA,
  getSeasonalityFactor,
} from "@/data/NicheData";
import { useAlgorithmSettings } from "@/hooks/queries/useAlgorithmSettings";
import { getPrices } from "@/hooks/videoDetails/getPrices";

const STRIPE_PERCENT = 0.029;
const STRIPE_FIXED = 0.25;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

export default function SimpleShareSimulator() {
  const { data: algorithmSettings } = useAlgorithmSettings();

  const [viewsCreator, setViewsCreator] = useState(100000);
  const [viewsReactor, setViewsReactor] = useState(50000);
  const [daysSinceUpload, setDaysSinceUpload] = useState(15);
  const [selectedNicheId, setSelectedNicheId] = useState(
    NICHE_DATA[0]?.id ?? "default",
  );
  const [showSettings, setShowSettings] = useState(false);

  const selectedNiche = useMemo(
    () =>
      NICHE_DATA.find((niche) => niche.id === selectedNicheId) ??
      DEFAULT_NICHE_DATA,
    [selectedNicheId],
  );

  const publishedAt = useMemo(
    () => new Date(Date.now() - daysSinceUpload * MS_PER_DAY).toISOString(),
    [daysSinceUpload],
  );

  const categoryId = selectedNiche.youtubeCategoryIds[0] ?? -1;

  const videoCreator = useMemo(
    () => ({
      averageViewsPerCategory: viewsCreator,
      last_view_count: viewsCreator,
      duration_seconds: 600,
      category_id: categoryId,
      published_at: publishedAt,
    }),
    [viewsCreator, categoryId, publishedAt],
  );

  const videoReactor = useMemo(
    () => ({
      averageViewsPerCategory: viewsReactor,
      last_view_count: viewsReactor,
      duration_seconds: 600,
      category_id: categoryId,
    }),
    [viewsReactor, categoryId],
  );

  const prices = useMemo(
    () => getPrices(videoReactor, videoCreator, algorithmSettings),
    [videoReactor, videoCreator, algorithmSettings],
  );

  const platformFeePercent =
    algorithmSettings?.pricingConfig.platform_fee_percent ?? 0.1;
  const overriddenRpm = algorithmSettings?.nicheRpmOverrides?.[selectedNiche.id];
  const baseRpm =
    typeof overriddenRpm === "number" && Number.isFinite(overriddenRpm)
      ? Math.max(0, overriddenRpm)
      : selectedNiche.rpm;
  const effectiveRpm = baseRpm * getSeasonalityFactor();

  const creatorRevenue = (viewsCreator * effectiveRpm) / 1000;
  const reactorRevenue = (viewsReactor * effectiveRpm) / 1000;

  const price = prices.oneTime;
  const sharePercent = Math.max(0, Math.min(1, prices.fairshareScore / 100));
  const stripeFee = price * STRIPE_PERCENT + STRIPE_FIXED;
  const platformFee = price * platformFeePercent;
  const creatorNet = Math.max(price - stripeFee - platformFee, 0);

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-md shadow-2xl max-w-2xl mx-auto">
      <div className="flex flex-col gap-6">
        <div className="relative text-center">
          <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-simple-purple to-simple-teal pr-8">
            Preiskalkulator (Beispiel)
          </h3>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="absolute right-0 top-0 p-2 rounded-full hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
            title="Einstellungen"
          >
            <IconSettings size={20} />
          </button>
          <p className="text-sm text-muted-foreground mt-2">
            Dieses Beispiel nutzt dieselbe Preislogik wie Checkout und
            Video-Details.
          </p>
        </div>

        {showSettings && (
          <div className="bg-background/80 border border-white/10 rounded-2xl p-4 animate-in fade-in slide-in-from-top-2">
            <h4 className="text-sm font-semibold mb-4 text-foreground">
              Erweiterte Einstellungen
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold flex justify-between">
                  <span>Branche</span>
                  <span className="text-simple-teal">{selectedNiche.name_de}</span>
                </label>
                <select
                  value={selectedNicheId}
                  onChange={(e) => setSelectedNicheId(e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm"
                >
                  {NICHE_DATA.map((niche) => (
                    <option key={niche.id} value={niche.id}>
                      {niche.name_de}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold flex justify-between">
                  <span>Alter des Original-Videos</span>
                  <span className="text-simple-purple">
                    {daysSinceUpload} {daysSinceUpload === 1 ? "Tag" : "Tage"}
                  </span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="1"
                  value={daysSinceUpload}
                  onChange={(e) => setDaysSinceUpload(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-simple-purple"
                />
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Aktiver RPM für diese Branche:{" "}
              <strong className="text-foreground">
                {effectiveRpm.toLocaleString("de-DE", {
                  style: "currency",
                  currency: "EUR",
                })}
              </strong>{" "}
              (inkl. Saisonfaktor)
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-semibold flex items-center gap-1">
                O Views Kanal A (Original)
                <div className="group relative">
                  <IconInfoCircle
                    size={14}
                    className="text-muted-foreground cursor-help"
                  />
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block w-48 p-2 bg-popover text-popover-foreground text-xs rounded shadow-lg">
                    Durchschnittliche Aufrufe des Creator-Videos.
                  </div>
                </div>
              </label>
              <span className="text-sm font-mono text-simple-teal">
                {viewsCreator.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min="1000"
              max="5000000"
              step="1000"
              value={viewsCreator}
              onChange={(e) => setViewsCreator(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-simple-teal"
            />
            <div className="text-xs text-muted-foreground text-right mt-1">
              Geschätzte AdSense-Einnahmen: ~
              {creatorRevenue.toLocaleString("de-DE", {
                style: "currency",
                currency: "EUR",
              })}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-semibold flex items-center gap-1">
                O Views Kanal B (Reaction)
                <div className="group relative">
                  <IconInfoCircle
                    size={14}
                    className="text-muted-foreground cursor-help"
                  />
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block w-48 p-2 bg-popover text-popover-foreground text-xs rounded shadow-lg">
                    Durchschnittliche Aufrufe des Reaction-Kanals.
                  </div>
                </div>
              </label>
              <span className="text-sm font-mono text-simple-purple">
                {viewsReactor.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="5000000"
              step="1000"
              value={viewsReactor}
              onChange={(e) => setViewsReactor(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-simple-purple"
            />
            <div className="text-xs text-muted-foreground text-right mt-1">
              Geschätzte AdSense-Einnahmen: ~
              {reactorRevenue.toLocaleString("de-DE", {
                style: "currency",
                currency: "EUR",
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 p-6 rounded-2xl bg-linear-to-br from-white/5 to-white/10 border border-white/5 flex flex-col gap-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-r from-simple-purple/10 to-simple-teal/10 blur-xl z-0"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col gap-1 w-full md:w-1/2">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Geschätzter Preis (Total)
              </span>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-4xl font-bold bg-clip-text text-transparent bg-linear-to-r from-simple-purple to-simple-teal">
                  {price.toLocaleString("de-DE", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </span>
                {viewsReactor > 0 && (
                  <span className="text-sm font-semibold text-muted-foreground px-2 py-1 bg-white/5 rounded-md border border-white/10">
                    ~{" "}
                    {((price / viewsReactor) * 1000).toLocaleString("de-DE", {
                      style: "currency",
                      currency: "EUR",
                    })}{" "}
                    CPM
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground mt-2">
                Pauschalpreis für{" "}
                <strong className="text-foreground">1 Jahr Nutzung</strong>.
              </span>
            </div>

            <div className="w-full md:w-1/2 flex flex-col gap-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-simple-teal">Creator Share</span>
                <span className="text-muted-foreground">Basis Abzug</span>
              </div>
              <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-simple-teal transition-all duration-500 ease-out"
                  style={{ width: `${sharePercent * 100}%` }}
                ></div>
                <div
                  className="h-full bg-gray-600 transition-all duration-500 ease-out"
                  style={{ width: `${(1 - sharePercent) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{(sharePercent * 100).toFixed(1)}% berechnet</span>
                <span>Für Fremd-Nutzung</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-6 border-t border-white/10 space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Transparente Gebühren-Aufteilung
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="text-[10px] text-muted-foreground uppercase font-bold mb-1">
                  Creator (Netto)
                </div>
                <div className="text-lg font-bold text-simple-teal">
                  {creatorNet.toLocaleString("de-DE", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="text-[10px] text-muted-foreground uppercase font-bold mb-1 flex items-center gap-1">
                  Stripe Gebühren
                  <div className="group/stripe relative">
                    <IconInfoCircle
                      size={12}
                      className="text-muted-foreground cursor-help"
                    />
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover/stripe:block w-48 p-2 bg-popover text-popover-foreground text-[10px] rounded shadow-lg font-normal normal-case">
                      Als Richtwert nutzen wir 2.9% + 0.25 EUR pro Zahlung.
                    </div>
                  </div>
                </div>
                <div className="text-lg font-bold text-muted-foreground">
                  {stripeFee.toLocaleString("de-DE", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="text-[10px] text-muted-foreground uppercase font-bold mb-1">
                  Plattform ({(platformFeePercent * 100).toFixed(1)}%)
                </div>
                <div className="text-lg font-bold text-simple-purple">
                  {platformFee.toLocaleString("de-DE", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
