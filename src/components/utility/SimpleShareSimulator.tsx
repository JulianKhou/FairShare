import { useState, useEffect } from "react";
import { NICHE_DATA, getSeasonalityFactor } from "../../data/NicheData";
import {
  calculateSimpleShare,
  SimpleShareParams,
} from "../../services/simpleShareAlgo";
import { IconInfoCircle, IconSettings } from "@tabler/icons-react";

export default function SimpleShareSimulator() {
  const [viewsCreator, setViewsCreator] = useState(100000);
  const [viewsReactor, setViewsReactor] = useState(50000);

  const [price, setPrice] = useState(0);
  const [sharePercent, setSharePercent] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  // Default RPM based on NICHE_DATA
  const defaultRpm = NICHE_DATA[0].rpm * getSeasonalityFactor();

  const [customRpm, setCustomRpm] = useState(defaultRpm);
  const [daysSinceUpload, setDaysSinceUpload] = useState(15);

  const creatorRevenue = (viewsCreator * customRpm) / 1000;
  const reactorRevenue = (viewsReactor * customRpm) / 1000;

  useEffect(() => {
    // 2. SimpleShare calculation
    const params: SimpleShareParams = {
      viewsReactor: viewsReactor,
      viewsCreator: viewsCreator,
      durationReactorSeconds: 600, // 10 min
      durationCreatorSeconds: 600, // 10 min
      percentShown: 0.5, // 50% used
      daysSinceUpload: daysSinceUpload,
    };

    const share = calculateSimpleShare(params);
    setSharePercent(share);

    // 3. Price Calculation (Buyout)
    const calcPrice = Math.max((viewsReactor * share * customRpm) / 1000, 0.5);
    setPrice(calcPrice);
  }, [viewsCreator, viewsReactor, customRpm, daysSinceUpload]);

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-md shadow-2xl max-w-2xl mx-auto">
      <div className="flex flex-col gap-6">
        {/* Header */}
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
            Dies ist ein fiktives Beispiel. Spiele mit den Werten, um zu sehen,
            wie sich der Lizenzpreis zusammensetzen könnte.
          </p>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-background/80 border border-white/10 rounded-2xl p-4 animate-in fade-in slide-in-from-top-2">
            <h4 className="text-sm font-semibold mb-4 text-foreground">
              Erweiterte Einstellungen
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold flex justify-between">
                  <span>Ø RPM / CPM (€)</span>
                  <span className="text-simple-teal">
                    {customRpm.toFixed(2)} €
                  </span>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="15"
                  step="0.5"
                  value={customRpm}
                  onChange={(e) => setCustomRpm(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-simple-teal"
                />
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
          </div>
        )}

        {/* Sliders */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-semibold flex items-center gap-1">
                Ø Views Kanal A (Original)
                <div className="group relative">
                  <IconInfoCircle
                    size={14}
                    className="text-muted-foreground cursor-help"
                  />
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block w-48 p-2 bg-popover text-popover-foreground text-xs rounded shadow-lg">
                    Wie viele Aufrufe das Video des Creators im Durchschnitt
                    macht.
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
                Ø Views Kanal B (Reaction)
                <div className="group relative">
                  <IconInfoCircle
                    size={14}
                    className="text-muted-foreground cursor-help"
                  />
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block w-48 p-2 bg-popover text-popover-foreground text-xs rounded shadow-lg">
                    Wie viele Aufrufe dein Kanal bei Reactions durchschnittlich
                    erzielt.
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

        {/* Results */}
        <div className="mt-6 p-6 rounded-2xl bg-linear-to-br from-white/5 to-white/10 border border-white/5 flex flex-col md:flex-row gap-6 items-center justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-r from-simple-purple/10 to-simple-teal/10 blur-xl z-0"></div>

          <div className="relative z-10 flex flex-col gap-1 w-full md:w-1/2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Geschätzter Preis
            </span>
            <span className="text-4xl font-bold bg-clip-text text-transparent bg-linear-to-r from-simple-purple to-simple-teal">
              {price.toLocaleString("de-DE", {
                style: "currency",
                currency: "EUR",
              })}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              Für eine unbefristete Nutzungslizenz (Buyout).
            </span>
          </div>

          <div className="relative z-10 w-full md:w-1/2 flex flex-col gap-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-simple-teal">Creator Share</span>
              <span className="text-muted-foreground">Basis Abzug</span>
            </div>
            {/* Progress Bar */}
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
      </div>
    </div>
  );
}
