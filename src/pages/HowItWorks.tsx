import { useEffect } from "react";
import SimpleShareSimulator from "../components/utility/SimpleShareSimulator";
import {
  IconChartLine,
  IconScale,
  IconHeartHandshake,
  IconRepeat,
  IconInfoCircle,
  IconVideo,
  IconBrandYoutube,
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

      {/* Step-by-Step Section */}
      <section className="px-4 py-16 max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-extrabold text-center mb-16 tracking-tight">
          So einfach geht's
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          {/* Käufer (Reaction-Kanäle) */}
          <div className="bg-simple-purple/5 p-8 rounded-[32px] border border-simple-purple/10">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 bg-simple-purple/15 text-simple-purple rounded-2xl">
                <IconVideo size={32} />
              </div>
              <h3 className="text-2xl font-bold text-simple-purple">
                Für Reaction-Kanäle
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex gap-4 p-5 rounded-2xl bg-card border border-border/50 hover:border-simple-purple/30 transition-colors group">
                <div className="w-10 h-10 rounded-full bg-simple-purple/15 text-simple-purple flex items-center justify-center font-bold shrink-0 group-hover:bg-simple-purple group-hover:text-white transition-colors">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-foreground mb-1">
                    Videos auswählen
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Gib die URL des Original-Videos ein, auf das du reagieren
                    möchtest, und füge dein geplantes Video hinzu.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 p-5 rounded-2xl bg-card border border-border/50 hover:border-simple-purple/30 transition-colors group">
                <div className="w-10 h-10 rounded-full bg-simple-purple/15 text-simple-purple flex items-center justify-center font-bold shrink-0 group-hover:bg-simple-purple group-hover:text-white transition-colors">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-foreground mb-1">
                    Fairen Preis berechnen
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Unser Algorithmus ermittelt einen fairen Preis basierend auf
                    der Reichweite beider Kanäle.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 p-5 rounded-2xl bg-card border border-border/50 hover:border-simple-purple/30 transition-colors group">
                <div className="w-10 h-10 rounded-full bg-simple-purple/15 text-simple-purple flex items-center justify-center font-bold shrink-0 group-hover:bg-simple-purple group-hover:text-white transition-colors">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-foreground mb-1">
                    Lizenz kaufen
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Bezahle sicher und transparent über Stripe oder schließe ein
                    praktisches Abo ab.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 p-5 rounded-2xl bg-card border border-border/50 hover:border-simple-purple/30 transition-colors group">
                <div className="w-10 h-10 rounded-full bg-simple-purple/15 text-simple-purple flex items-center justify-center font-bold shrink-0 group-hover:bg-simple-purple group-hover:text-white transition-colors">
                  4
                </div>
                <div>
                  <h4 className="font-bold text-foreground mb-1">
                    Rechtlich sicher hochladen
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Du erhältst eine offiziell dokumentierte Lizenz. Kein Stress
                    mehr mit Copyright-Strikes.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Verkäufer (Original-Creatoren) */}
          <div className="bg-simple-teal/5 p-8 rounded-[32px] border border-simple-teal/10">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 bg-simple-teal/15 text-simple-teal rounded-2xl">
                <IconBrandYoutube size={32} />
              </div>
              <h3 className="text-2xl font-bold text-simple-teal">
                Für Original-Creatoren
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex gap-4 p-5 rounded-2xl bg-card border border-border/50 hover:border-simple-teal/30 transition-colors group">
                <div className="w-10 h-10 rounded-full bg-simple-teal/15 text-simple-teal flex items-center justify-center font-bold shrink-0 group-hover:bg-simple-teal group-hover:text-white transition-colors">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-foreground mb-1">
                    Kanal verknüpfen
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Registriere dich kostenlos bei SimpleShare und verknüpfe
                    deinen YouTube-Account.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 p-5 rounded-2xl bg-card border border-border/50 hover:border-simple-teal/30 transition-colors group">
                <div className="w-10 h-10 rounded-full bg-simple-teal/15 text-simple-teal flex items-center justify-center font-bold shrink-0 group-hover:bg-simple-teal group-hover:text-white transition-colors">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-foreground mb-1">
                    Lizenzierung aktivieren
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Schalte deine Videos für Lizenzierungen frei. Du kannst
                    Anfragen auch automatisch akzeptieren lassen.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 p-5 rounded-2xl bg-card border border-border/50 hover:border-simple-teal/30 transition-colors group">
                <div className="w-10 h-10 rounded-full bg-simple-teal/15 text-simple-teal flex items-center justify-center font-bold shrink-0 group-hover:bg-simple-teal group-hover:text-white transition-colors">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-foreground mb-1">
                    Automatisch verdienen
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Lass Reaction-Kanäle faire Preise zahlen und generiere
                    mühelos Zusatzeinnahmen mit deinem Content.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 p-5 rounded-2xl bg-card border border-border/50 hover:border-simple-teal/30 transition-colors group">
                <div className="w-10 h-10 rounded-full bg-simple-teal/15 text-simple-teal flex items-center justify-center font-bold shrink-0 group-hover:bg-simple-teal group-hover:text-white transition-colors">
                  4
                </div>
                <div>
                  <h4 className="font-bold text-foreground mb-1">
                    Alles im Blick behalten
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Verfolge alle verkauften Lizenzen und deine Einnahmen
                    transparent direkt in deinem SimpleShare-Dashboard.
                  </p>
                </div>
              </div>
            </div>
          </div>
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

      {/* Subscription Pricing Section */}
      <section className="px-4 py-8 max-w-4xl mx-auto">
        <div className="bg-linear-to-br from-simple-purple/10 to-simple-teal/10 p-10 rounded-[40px] border border-white/10 relative overflow-hidden text-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-simple-teal/20 blur-[100px] pointer-events-none"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-foreground/10 text-foreground rounded-2xl flex items-center justify-center mb-6">
              <IconRepeat size={32} />
            </div>
            <h2 className="text-3xl font-bold mb-4">
              Abo-Alternative für Power-User
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl">
              Anstatt jedes Video einzeln zu lizenzieren, bieten wir für
              Reaction-Kanäle auch Pakete an. Ein Beispiel: **0,50 € pro 1.000
              generierte Klicks** im Monat.
            </p>
            <div className="inline-flex items-center gap-2 px-6 py-2 bg-foreground/5 rounded-full text-sm font-medium border border-foreground/10">
              <IconInfoCircle size={16} />
              <span>Ideal für Kanäle mit hohem Upload-Volumen</span>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer Section */}
      <section className="px-4 py-8 max-w-3xl mx-auto">
        <div className="flex gap-4 p-6 bg-muted/30 rounded-2xl border border-border/50 italic text-sm text-muted-foreground">
          <IconInfoCircle size={24} className="shrink-0 opacity-50" />
          <p>
            **Wichtiger Hinweis:** Die Preisberechnung basiert nicht
            ausschließlich auf Klicks. Unser Algorithmus berücksichtigt weitere
            Faktoren wie die **Content-Nische (RPM-Potenzial)**, die
            **Produktionsqualität**, **Engagement-Raten** und den
            **strategischen Mehrwert** des Original-Contents. Die im Simulator
            angezeigten Werte sind Richtwerte.
          </p>
        </div>
      </section>
    </div>
  );
}
