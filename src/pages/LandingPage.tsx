import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { SimpleShareLogo } from "../components/ui/simpleShareLogo";
import {
  IconCurrencyDollar,
  IconShieldCheck,
  IconBolt,
  IconRocket,
  IconPuzzle,
  IconConfetti,
  IconBrandYoutube,
  IconWorld,
} from "@tabler/icons-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/auth/useAuth";
import { handleLogin } from "../hooks/auth/useHandleAuth";

function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="flex flex-col flex-1 bg-background">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-4 py-20 md:py-32 bg-linear-to-b from-simple-purple/10 to-background">
        <div className="flex items-center gap-4 mb-8 animate-fade-in">
          <SimpleShareLogo size={80} />
        </div>

        <h1 className="text-4xl md:text-6xl font-bold text-center mb-6 tracking-tight animate-fade-in">
          Simple<span className="text-simple-purple">Share</span>
        </h1>

        <p className="text-xl md:text-2xl text-center mb-4 text-muted-foreground max-w-2xl animate-fade-in">
          Der Marktplatz für Videolizenzen
        </p>

        <p className="text-base md:text-lg text-center mb-8 text-muted-foreground max-w-3xl animate-fade-in">
          Verkaufe deine Videos oder kaufe Lizenzen um Creator zu unterstützen.
          Fair, transparent und rechtssicher.
        </p>

        <div className="flex gap-4 items-center animate-fade-in">
          <Button
            asChild
            size="lg"
            className="text-lg px-8 py-6 hover:scale-105 transition-transform shadow-lg shadow-simple-purple/20"
          >
            <Link to="/how-it-works">So funktioniert's</Link>
          </Button>
          <Button
            onClick={user ? () => navigate("/overview") : handleLogin}
            size="lg"
            variant="outline"
            className="text-lg px-8 py-6 hover:scale-105 transition-transform bg-background/50 backdrop-blur-md border-simple-purple/50 text-foreground hover:bg-simple-purple/20"
          >
            {user ? "Zur Plattform" : "Anmelden"}
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-16 md:py-24 max-w-6xl mx-auto w-full">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Warum SimpleShare?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1: Fair Prices */}
          <Card className="p-8 transition-all hover:shadow-2xl hover:border-simple-purple/50 bg-simple-purple/5 border-simple-purple/10 backdrop-blur-sm group rounded-3xl">
            <div className="flex justify-center mb-6">
              <div className="p-5 bg-simple-purple/15 text-simple-purple rounded-2xl group-hover:scale-110 transition-transform">
                <IconCurrencyDollar size={40} />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-center mb-3 text-simple-purple">
              Faire Preise
            </h3>
            <p className="text-muted-foreground text-center text-sm leading-relaxed">
              Transparente Preisgestaltung durch einen fairen Algorithmus.
              Verkäufer verdienen, was ihre Inhalte wert sind.
            </p>
          </Card>

          {/* Feature 2: Easy Processing */}
          <Card className="p-8 transition-all hover:shadow-2xl hover:border-simple-teal/50 bg-simple-teal/5 border-simple-teal/10 backdrop-blur-sm group rounded-3xl">
            <div className="flex justify-center mb-6">
              <div className="p-5 bg-simple-teal/15 text-simple-teal rounded-2xl group-hover:scale-110 transition-transform">
                <IconBolt size={40} />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-center mb-3 text-simple-teal">
              Einfache Abwicklung
            </h3>
            <p className="text-muted-foreground text-center text-sm leading-relaxed">
              Schneller und unkomplizierter Kauf- und Verkaufsprozess.
              Sofortiger Zugriff auf lizenzierte Videos.
            </p>
          </Card>

          {/* Feature 3: Legal Security */}
          <Card className="p-8 transition-all hover:shadow-2xl hover:border-green-500/50 bg-green-500/5 border-green-500/10 backdrop-blur-sm group rounded-3xl">
            <div className="flex justify-center mb-6">
              <div className="p-5 bg-green-500/15 text-green-500 rounded-2xl group-hover:scale-110 transition-transform">
                <IconShieldCheck size={40} />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-center mb-3 text-green-500">
              Rechtssicherheit
            </h3>
            <p className="text-muted-foreground text-center text-sm leading-relaxed">
              Alle Lizenzen sind rechtlich bindend und dokumentiert. Schutz für
              Käufer und Verkäufer.
            </p>
          </Card>
        </div>
      </section>

      {/* Roadmap Section */}
      <section className="px-4 py-16 md:py-24 bg-linear-to-b from-background to-simple-purple/5">
        <div className="max-w-5xl mx-auto w-full text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-16">
            Unsere Roadmap
          </h2>

          <div className="relative">
            {/* The Line - Desktop only */}
            <div className="hidden md:block absolute top-[24px] left-0 right-0 h-0.5 bg-simple-purple/20" />

            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              {/* Milestone 1: Beta */}
              <div className="relative flex flex-col items-center group cursor-help">
                <div className="relative w-12 h-12 rounded-full bg-simple-purple/20 text-simple-purple flex items-center justify-center mb-4 z-10 border-2 border-simple-purple shadow-lg shadow-simple-purple/20 transition-transform group-hover:scale-110">
                  <IconRocket size={24} />
                  <div className="absolute -top-1 right-0 w-4 h-4 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                </div>
                <h4 className="font-bold text-foreground">Beta Release</h4>
                <p className="text-xs text-muted-foreground mt-2">
                  Bereits Live
                </p>

                {/* Tooltip */}
                <div className="absolute top-full mt-4 w-48 p-4 rounded-2xl bg-card/90 backdrop-blur-md border border-border shadow-2xl opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 transition-all z-20 text-left">
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Erster öffentlicher Testlauf mit Kernfunktionen wie
                    Video-Listing und manuellem Lizenzkauf.
                  </p>
                </div>
              </div>

              {/* Milestone 2: Chrome Extension */}
              <div className="relative flex flex-col items-center group cursor-help">
                <div className="w-12 h-12 rounded-full bg-simple-teal/20 text-simple-teal flex items-center justify-center mb-4 z-10 border-2 border-simple-teal animate-pulse transition-transform group-hover:scale-110">
                  <IconPuzzle size={24} />
                </div>
                <h4 className="font-bold text-foreground">Chrome Extension</h4>
                <p className="text-xs text-simple-teal font-medium mt-2">
                  In Arbeit
                </p>

                {/* Tooltip */}
                <div className="absolute top-full mt-4 w-64 p-4 rounded-2xl bg-card/90 backdrop-blur-md border border-border shadow-2xl opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 transition-all z-20 text-left">
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Automatische Erkennung beim Schauen von Original-Videos und
                    Datenbank-Abgleich sowie Support beim Hochladen von
                    Reactions.
                  </p>
                </div>
              </div>

              {/* Milestone 3: Official Release */}
              <div className="relative flex flex-col items-center group cursor-help">
                <div className="w-12 h-12 rounded-full bg-muted text-muted-foreground flex items-center justify-center mb-4 z-10 border-2 border-muted border-dashed transition-transform group-hover:scale-110">
                  <IconConfetti size={24} />
                </div>
                <h4 className="font-bold text-foreground">Full Release</h4>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Public Launch Q2
                </p>

                {/* Tooltip */}
                <div className="absolute top-full mt-4 w-48 p-4 rounded-2xl bg-card/90 backdrop-blur-md border border-border shadow-2xl opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 transition-all z-20 text-left">
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Offizieller Start mit allen Premium-Features, erweitertem
                    Dashboard und vollem Support für Creator.
                  </p>
                </div>
              </div>

              {/* Milestone 4: YT Claim System */}
              <div className="relative flex flex-col items-center group cursor-help">
                <div className="w-12 h-12 rounded-full bg-muted text-muted-foreground flex items-center justify-center mb-4 z-10 border-2 border-muted border-dashed transition-transform group-hover:scale-110">
                  <IconBrandYoutube size={24} />
                </div>
                <h4 className="font-bold text-foreground">YT Claim System</h4>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Automatisches System
                </p>

                {/* Tooltip */}
                <div className="absolute top-full mt-4 w-64 p-4 rounded-2xl bg-card/90 backdrop-blur-md border border-border shadow-2xl opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 transition-all z-20 text-left">
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Vollautomatisches Whitelisting; Videos ohne gültige Lizenz
                    werden automatisch erkannt und Maßnahmen eingeleitet.
                  </p>
                </div>
              </div>

              {/* Milestone 5: Expansion */}
              <div className="relative flex flex-col items-center group cursor-help">
                <div className="w-12 h-12 rounded-full bg-muted text-muted-foreground flex items-center justify-center mb-4 z-10 border-2 border-muted border-dashed transition-transform group-hover:scale-110">
                  <IconWorld size={24} />
                </div>
                <h4 className="font-bold text-foreground">Global Scaling</h4>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Weltweite Expansion
                </p>

                {/* Tooltip */}
                <div className="absolute top-full mt-4 w-48 p-4 rounded-2xl bg-card/90 backdrop-blur-md border border-border shadow-2xl opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 transition-all z-20 md:-translate-x-12 text-left">
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Unterstützung für weitere Währungen, Sprachen und
                    Markteintritt in den USA und Asien.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16 md:py-24 bg-linear-to-t from-simple-purple/10 to-background">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Bereit loszulegen?
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            Starte jetzt und entdecke exklusive Videoinhalte oder verkaufe deine
            eigenen Videos.
          </p>
          <div className="flex justify-center gap-4 items-center">
            <Button
              asChild
              size="lg"
              className="text-lg px-8 py-6 hover:scale-105 transition-transform"
            >
              <Link to="/how-it-works">So funktioniert's</Link>
            </Button>
            <Button
              onClick={user ? () => navigate("/overview") : handleLogin}
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 hover:scale-105 transition-transform bg-background/50 backdrop-blur-md border-simple-purple/50 text-foreground hover:bg-simple-purple/20"
            >
              {user ? "Zur Plattform" : "Anmelden"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
