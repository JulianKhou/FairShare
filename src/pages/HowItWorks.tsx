import { useEffect } from "react";
import SimpleShareSimulator from "../components/utility/SimpleShareSimulator";
import {
  IconChartLine,
  IconScale,
  IconHeartHandshake,
} from "@tabler/icons-react";

export default function HowItWorks() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Hero Section */}
      <section className="relative pt-20 pb-8 px-4 text-center overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-simple-purple/20 blur-[120px] rounded-full pointer-events-none"></div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
          Wie{" "}
          <span className="bg-clip-text text-transparent bg-linear-to-r from-simple-purple to-simple-teal">
            SimpleShare
          </span>{" "}
          funktioniert
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Wir glauben, dass fairer Umsatz-Share keine Hexerei sein muss. Unser
          Algorithmus berechnet dynamische Preise basierend auf Reichweite und
          Nische – transparent für beide Seiten.
        </p>
      </section>

      {/* Simulator Section */}
      <section className="px-4 py-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <SimpleShareSimulator />
        </div>
      </section>

      {/* Features/Explanation Section */}
      <section className="px-4 py-10 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-simple-purple/5 p-8 rounded-3xl border border-simple-purple/10 flex flex-col items-start gap-4 hover:bg-simple-purple/10 hover:border-simple-purple/40 transition-all group">
          <div className="p-4 bg-simple-purple/10 text-simple-purple rounded-2xl group-hover:scale-110 transition-transform">
            <IconScale size={32} />
          </div>
          <h3 className="text-2xl font-bold text-simple-purple">
            Faire Bewertung
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Der Preis richtet sich nach der Reichweite beider Parteien. Große
            Kanäle zahlen mehr für einen Clip, kleinere Kanäle profitieren von
            Einstiegspreisen. Das "Reichweiten-Balancing" schützt große Creator
            vor Überbezahlung.
          </p>
        </div>

        <div className="bg-simple-teal/5 p-8 rounded-3xl border border-simple-teal/10 flex flex-col items-start gap-4 hover:bg-simple-teal/10 hover:border-simple-teal/40 transition-all group">
          <div className="p-4 bg-simple-teal/10 text-simple-teal rounded-2xl group-hover:scale-110 transition-transform">
            <IconChartLine size={32} />
          </div>
          <h3 className="text-2xl font-bold text-simple-teal">
            Performance & RPM
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Unterschiedliche Nischen (Gaming vs. Finance) haben unterschiedliche
            Einnahme-Potenziale (RPM). SimpleShare bezieht diese Daten aus dem
            echten YouTube-Markt mit ein.
          </p>
        </div>

        <div className="bg-orange-500/5 p-8 rounded-3xl border border-orange-500/10 flex flex-col items-start gap-4 hover:bg-orange-500/10 hover:border-orange-500/40 transition-all group">
          <div className="p-4 bg-orange-500/10 text-orange-500 rounded-2xl group-hover:scale-110 transition-transform">
            <IconHeartHandshake size={32} />
          </div>
          <h3 className="text-2xl font-bold text-orange-500">
            Volle Transparenz
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Keine versteckten Gebühren. Creator wissen, dass ihr Content
            wertgeschätzt wird. React-Kanäle wissen, dass sie rechtlich sicher
            sind. Eine Win-Win-Situation.
          </p>
        </div>
      </section>
    </div>
  );
}
