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
      <section className="relative pt-20 pb-16 px-4 text-center overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-simple-purple/20 blur-[120px] rounded-full pointer-events-none"></div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
          Wie{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-simple-purple to-simple-teal">
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
      <section className="px-4 py-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          <SimpleShareSimulator />
        </div>
      </section>

      {/* Features/Explanation Section */}
      <section className="px-4 py-20 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-card p-6 rounded-2xl border border-border flex flex-col items-start gap-4 hover:border-simple-purple/50 transition-colors">
          <div className="p-3 bg-simple-purple/10 text-simple-purple rounded-xl">
            <IconScale size={28} />
          </div>
          <h3 className="text-xl font-bold">Faire Bewertung</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Der Preis richtet sich nach der Reichweite beider Parteien. Große
            Kanäle zahlen mehr für einen Clip, kleinere Kanäle profitieren von
            Einstiegspreisen. Der "Ratio-Rabatt" schützt große Creator vor
            Überbezahlung.
          </p>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border flex flex-col items-start gap-4 hover:border-simple-teal/50 transition-colors">
          <div className="p-3 bg-simple-teal/10 text-simple-teal rounded-xl">
            <IconChartLine size={28} />
          </div>
          <h3 className="text-xl font-bold">Performance & RPM</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Unterschiedliche Nischen (Gaming vs. Finance) haben unterschiedliche
            Einnahme-Potenziale (RPM). SimpleShare bezieht diese Daten aus dem
            echten YouTube-Markt mit ein.
          </p>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border flex flex-col items-start gap-4 hover:border-orange-500/50 transition-colors">
          <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl">
            <IconHeartHandshake size={28} />
          </div>
          <h3 className="text-xl font-bold">Volle Transparenz</h3>
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
