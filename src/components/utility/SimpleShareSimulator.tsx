import { useState, useEffect } from "react";
import { NICHE_DATA, getSeasonalityFactor } from "../../data/NicheData";
import {
  calculateSimpleShare,
  SimpleShareParams,
} from "../../services/simpleShareAlgo";
import { IconInfoCircle } from "@tabler/icons-react";

export default function SimpleShareSimulator() {
  const [viewsCreator, setViewsCreator] = useState(100000);
  const [viewsReactor, setViewsReactor] = useState(50000);

  const [price, setPrice] = useState(0);
  const [sharePercent, setSharePercent] = useState(0);

  useEffect(() => {
    // 1. Get RPM - Use a default for the simulator or first niche
    const niche = NICHE_DATA[0]; // Entertainment or similar as baseline
    const rpm = niche.rpm * getSeasonalityFactor();

    // 2. SimpleShare calculation
    const params: SimpleShareParams = {
      viewsReactor: viewsReactor,
      viewsCreator: viewsCreator,
      durationReactorSeconds: 600, // 10 min
      durationCreatorSeconds: 600, // 10 min
      percentShown: 0.5, // 50% used
      daysSinceUpload: 15, // Normal Timeframe
    };

    const share = calculateSimpleShare(params);
    setSharePercent(share);

    // 3. Price Calculation (Buyout)
    const calcPrice = Math.max((viewsCreator * share * rpm) / 1000, 0.5);
    setPrice(calcPrice);
  }, [viewsCreator, viewsReactor]);

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-md shadow-2xl max-w-2xl mx-auto">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="text-center">
          <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-simple-purple to-simple-teal">
            Preiskalkulator
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            Spiele mit den Werten, um zu sehen, wie sich der Lizenzpreis
            zusammensetzt.
          </p>
        </div>

        {/* Sliders */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-semibold flex items-center gap-1">
                Ø Views (Original-Video)
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
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-semibold flex items-center gap-1">
                Ø Views (Dein Kanal)
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
