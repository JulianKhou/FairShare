import { useEffect } from "react";
import SimpleShareSimulator from "../components/utility/SimpleShareSimulator";
import {
  IconChartLine,
  IconScale,
  IconHeartHandshake,
  IconInfoCircle,
  IconVideo,
  IconBrandYoutube,
  IconChevronDown,
} from "@tabler/icons-react";

export default function HowItWorks() {
  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      const headerOffset = 80;
      const elementPosition = section.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-background text-foreground flex flex-col flex-1">
      {/* Hero Section */}
      <section className="relative px-4 text-center overflow-hidden min-h-[calc(100vh-5rem)] flex flex-col justify-center items-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-simple-purple/20 blur-[120px] rounded-full pointer-events-none"></div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
          Wie{" "}
          <span className="bg-clip-text text-transparent bg-linear-to-r from-simple-purple to-simple-teal">
            SimpleShare
          </span>{" "}
          funktioniert
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed z-10 relative">
          In unter 60 Sekunden zur rechtlich sicheren Lizenz. Wir machen Schluss
          mit komplizierten Verträgen – unser Algorithmus erledigt alles
          vollautomatisch für dich.
        </p>

        {/* Scroll Indicator */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer text-muted-foreground hover:text-simple-purple transition-colors z-20"
          onClick={() => scrollToSection("steps-section")}
        >
          <IconChevronDown size={40} />
        </div>
      </section>

      {/* Step-by-Step Section */}
      <section
        id="steps-section"
        className="relative px-4 py-16 w-full min-h-[calc(100vh-5rem)] flex flex-col justify-center items-center"
      >
        <div className="max-w-6xl w-full">
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
                <div className="flex gap-4 p-5 rounded-2xl bg-card border border-border/50 hover:border-simple-purple/30 transition-all group">
                  <div className="w-10 h-10 rounded-full bg-simple-purple/15 text-simple-purple flex items-center justify-center font-bold shrink-0 group-hover:bg-simple-purple group-hover:text-white transition-colors">
                    1
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-foreground">
                        Video wählen
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-simple-purple/10 text-simple-purple font-bold uppercase tracking-wider">
                        Sekundenschnell
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Einfach die YouTube-URL einfügen. Wir ziehen uns alle
                      notwendigen Daten automatisch.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 p-5 rounded-2xl bg-card border border-border/50 hover:border-simple-purple/30 transition-all group">
                  <div className="w-10 h-10 rounded-full bg-simple-purple/15 text-simple-purple flex items-center justify-center font-bold shrink-0 group-hover:bg-simple-purple group-hover:text-white transition-colors">
                    2
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-foreground">
                        Preis erhalten
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-simple-purple/10 text-simple-purple font-bold uppercase tracking-wider">
                        KI-Berechnet
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Unser fairer Algorithmus ermittelt sofort einen Preis, der
                      für beide Seiten passt. Kein Verhandeln nötig.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 p-5 rounded-2xl bg-card border border-border/50 hover:border-simple-purple/30 transition-all group">
                  <div className="w-10 h-10 rounded-full bg-simple-purple/15 text-simple-purple flex items-center justify-center font-bold shrink-0 group-hover:bg-simple-purple group-hover:text-white transition-colors">
                    3
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-foreground">
                        1-Click Kauf
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-simple-purple/10 text-simple-purple font-bold uppercase tracking-wider">
                        Stripe Safe
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Bezahle sicher und unkompliziert. Die Lizenz wird dir
                      sofort digital ausgestellt.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 p-5 rounded-2xl bg-card border border-border/50 hover:border-simple-purple/30 transition-all group">
                  <div className="w-10 h-10 rounded-full bg-simple-purple/15 text-simple-purple flex items-center justify-center font-bold shrink-0 group-hover:bg-simple-purple group-hover:text-white transition-colors">
                    4
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-foreground">
                        Sicher hochladen
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-simple-purple/10 text-simple-purple font-bold uppercase tracking-wider">
                        Copyright Schutz
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Deine Lizenz ist dein Schutzschild. Lade dein Video hoch,
                      ohne Angst vor Copyright-Claims oder Strikes.
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
                <div className="flex gap-4 p-5 rounded-2xl bg-card border border-border/50 hover:border-simple-teal/30 transition-all group">
                  <div className="w-10 h-10 rounded-full bg-simple-teal/15 text-simple-teal flex items-center justify-center font-bold shrink-0 group-hover:bg-simple-teal group-hover:text-white transition-colors">
                    1
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-foreground">Connect</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-simple-teal/10 text-simple-teal font-bold uppercase tracking-wider">
                        Einmalig
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Registriere dich kostenlos und verbinde deinen Kanal. Wir
                      erstellen automatisch dein Portfolio.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 p-5 rounded-2xl bg-card border border-border/50 hover:border-simple-teal/30 transition-all group">
                  <div className="w-10 h-10 rounded-full bg-simple-teal/15 text-simple-teal flex items-center justify-center font-bold shrink-0 group-hover:bg-simple-teal group-hover:text-white transition-colors">
                    2
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-foreground">Go Live</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-simple-teal/10 text-simple-teal font-bold uppercase tracking-wider">
                        Vollautomatisch
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Schalte die Lizenzierung frei. Ab jetzt können andere
                      deine Videos offiziell lizenzieren.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 p-5 rounded-2xl bg-card border border-border/50 hover:border-simple-teal/30 transition-all group">
                  <div className="w-10 h-10 rounded-full bg-simple-teal/15 text-simple-teal flex items-center justify-center font-bold shrink-0 group-hover:bg-simple-teal group-hover:text-white transition-colors">
                    3
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-foreground">
                        Passiv verdienen
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-simple-teal/10 text-simple-teal font-bold uppercase tracking-wider">
                        Ohne Aufwand
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Lass Reaction-Kanäle für dich arbeiten und generiere
                      mühelos zusätzliche Einnahmen.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 p-5 rounded-2xl bg-card border border-border/50 hover:border-simple-teal/30 transition-all group">
                  <div className="w-10 h-10 rounded-full bg-simple-teal/15 text-simple-teal flex items-center justify-center font-bold shrink-0 group-hover:bg-simple-teal group-hover:text-white transition-colors">
                    4
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-foreground">Auszahlung</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-simple-teal/10 text-simple-teal font-bold uppercase tracking-wider">
                        Direkt via Stripe
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Behalte alle Einnahmen transparent im Blick. Wir kümmern
                      uns um die Abrechnung.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer text-muted-foreground hover:text-simple-purple transition-colors"
          onClick={() => scrollToSection("simulator-section")}
        >
          <IconChevronDown size={40} />
        </div>
      </section>

      {/* Final Section (Simulator & Details) */}
      <section
        id="simulator-section"
        className="flex flex-col justify-center min-h-[calc(100vh-5rem)] w-full py-16 gap-8"
      >
        <div className="px-4 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column: Simulator Content */}
          <div className="relative z-10 w-full">
            <SimpleShareSimulator />
          </div>

          {/* Right Column: Features/Explanation Content */}
          <div className="flex flex-col gap-6 w-full">
            <div className="bg-simple-purple/5 p-6 rounded-3xl border border-simple-purple/10 flex items-start gap-4 hover:bg-simple-purple/10 hover:border-simple-purple/40 transition-all group">
              <div className="p-3 bg-simple-purple/10 text-simple-purple rounded-2xl group-hover:scale-110 transition-transform shrink-0">
                <IconScale size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-simple-purple mb-2">
                  Faire Bewertung
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Der Preis richtet sich nach der Reichweite beider Parteien.
                  Große Kanäle zahlen mehr für einen Clip, kleinere Kanäle
                  profitieren von Einstiegspreisen. Das "Reichweiten-Balancing"
                  schützt große Creator vor Überbezahlung.
                </p>
              </div>
            </div>

            <div className="bg-simple-teal/5 p-6 rounded-3xl border border-simple-teal/10 flex items-start gap-4 hover:bg-simple-teal/10 hover:border-simple-teal/40 transition-all group">
              <div className="p-3 bg-simple-teal/10 text-simple-teal rounded-2xl group-hover:scale-110 transition-transform shrink-0">
                <IconChartLine size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-simple-teal mb-2">
                  Performance & RPM
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Unterschiedliche Nischen (Gaming vs. Finance) haben
                  unterschiedliche Einnahme-Potenziale (RPM). SimpleShare
                  bezieht diese Daten aus dem echten YouTube-Markt mit ein.
                </p>
              </div>
            </div>

            <div className="bg-orange-500/5 p-6 rounded-3xl border border-orange-500/10 flex items-start gap-4 hover:bg-orange-500/10 hover:border-orange-500/40 transition-all group">
              <div className="p-3 bg-orange-500/10 text-orange-500 rounded-2xl group-hover:scale-110 transition-transform shrink-0">
                <IconHeartHandshake size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-orange-500 mb-2">
                  Volle Transparenz
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Keine versteckten Gebühren. Creator wissen, dass ihr Content
                  wertgeschätzt wird. React-Kanäle wissen, dass sie rechtlich
                  sicher sind. Eine Win-Win-Situation.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer Content */}
        <div className="px-4 max-w-3xl mx-auto w-full">
          <div className="flex gap-4 p-6 bg-muted/30 rounded-2xl border border-border/50 italic text-sm text-muted-foreground">
            <IconInfoCircle size={24} className="shrink-0 opacity-50" />
            <p>
              **Wichtiger Hinweis:** Die Preisberechnung basiert nicht
              ausschließlich auf Klicks. Unser Algorithmus berücksichtigt
              weitere Faktoren wie die **Content-Nische (RPM-Potenzial)**, die
              **Produktionsqualität**, **Engagement-Raten** und den
              **strategischen Mehrwert** des Original-Contents. Die im Simulator
              angezeigten Werte sind Richtwerte.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
