import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { FairShareLogo } from "../components/ui/fairShareLogo";
import {
  IconCurrencyDollar,
  IconShieldCheck,
  IconBolt,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/auth/useAuth";
import { handleLogin } from "../hooks/auth/useHandleAuth";

function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => {
    // Navigate to explore, which will trigger auth flow if needed
    navigate("/explore");
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-4 py-20 md:py-32 bg-linear-to-b from-fair-purple/10 to-background">
        <div className="flex items-center gap-4 mb-8 animate-fade-in">
          <FairShareLogo size={80} />
        </div>

        <h1 className="text-4xl md:text-6xl font-bold text-center mb-6 tracking-tight animate-fade-in">
          Fair<span className="text-fair-purple">Share</span>
        </h1>

        <p className="text-xl md:text-2xl text-center mb-4 text-muted-foreground max-w-2xl animate-fade-in">
          Der Marktplatz für Videolizenzen
        </p>

        <p className="text-base md:text-lg text-center mb-8 text-muted-foreground max-w-3xl animate-fade-in">
          Verkaufe deine Videos oder kaufe Lizenzen für exklusiven Content.
          Fair, transparent und rechtssicher.
        </p>

        <div className="flex gap-4 items-center animate-fade-in">
          <Button
            onClick={handleGetStarted}
            size="lg"
            className="text-lg px-8 py-6 hover:scale-105 transition-transform"
          >
            {user ? "Zur Plattform" : "Jetzt entdecken"}
          </Button>
          {!user && (
            <Button
              onClick={handleLogin}
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 hover:scale-105 transition-transform bg-background/50 backdrop-blur-md border-fair-purple/50 text-foreground hover:bg-fair-purple/20"
            >
              Anmelden
            </Button>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-16 md:py-24 max-w-6xl mx-auto w-full">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Warum FairShare?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1: Fair Prices */}
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-fair-purple/10 rounded-full">
                <IconCurrencyDollar size={40} className="text-fair-purple" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-center mb-3">
              Faire Preise
            </h3>
            <p className="text-muted-foreground text-center">
              Transparente Preisgestaltung durch einen fairen Algorithmus.
              Verkäufer verdienen, was ihre Inhalte wert sind.
            </p>
          </Card>

          {/* Feature 2: Easy Processing */}
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-fair-teal/10 rounded-full">
                <IconBolt size={40} className="text-fair-teal" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-center mb-3">
              Einfache Abwicklung
            </h3>
            <p className="text-muted-foreground text-center">
              Schneller und unkomplizierter Kauf- und Verkaufsprozess.
              Sofortiger Zugriff auf lizenzierte Videos.
            </p>
          </Card>

          {/* Feature 3: Legal Security */}
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-green-500/10 rounded-full">
                <IconShieldCheck size={40} className="text-green-500" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-center mb-3">
              Rechtssicherheit
            </h3>
            <p className="text-muted-foreground text-center">
              Alle Lizenzen sind rechtlich bindend und dokumentiert. Schutz für
              Käufer und Verkäufer.
            </p>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16 md:py-24 bg-linear-to-t from-fair-purple/10 to-background">
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
              onClick={handleGetStarted}
              size="lg"
              className="text-lg px-8 py-6 hover:scale-105 transition-transform"
            >
              {user ? "Zur Plattform" : "Jetzt entdecken"}
            </Button>
            {!user && (
              <Button
                onClick={handleLogin}
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 hover:scale-105 transition-transform bg-background/50 backdrop-blur-md border-fair-purple/50 text-foreground hover:bg-fair-purple/20"
              >
                Anmelden
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
          <p>© 2026 FairShare. Alle Rechte vorbehalten.</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
