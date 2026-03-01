import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { SimpleShareLogo } from "../components/ui/simpleShareLogo";
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
    navigate("/overview");
  };

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
              className="text-lg px-8 py-6 hover:scale-105 transition-transform bg-background/50 backdrop-blur-md border-simple-purple/50 text-foreground hover:bg-simple-purple/20"
            >
              Anmelden
            </Button>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-16 md:py-24 max-w-6xl mx-auto w-full">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Warum SimpleShare?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1: Fair Prices */}
          <Card className="p-6 transition-all hover:shadow-xl hover:border-simple-purple/50 bg-card/50 backdrop-blur-sm group">
            <div className="flex justify-center mb-6 px-0">
              <div className="p-4 bg-simple-purple/10 rounded-2xl group-hover:scale-110 transition-transform">
                <IconCurrencyDollar size={36} className="text-simple-purple" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-center mb-3 text-simple-purple">
              Faire Preise
            </h3>
            <p className="text-muted-foreground text-center text-sm leading-relaxed">
              Transparente Preisgestaltung durch einen fairen Algorithmus.
              Verkäufer verdienen, was ihre Inhalte wert sind.
            </p>
          </Card>

          {/* Feature 2: Easy Processing */}
          <Card className="p-6 transition-all hover:shadow-xl hover:border-simple-teal/50 bg-card/50 backdrop-blur-sm group">
            <div className="flex justify-center mb-6 px-0">
              <div className="p-4 bg-simple-teal/10 rounded-2xl group-hover:scale-110 transition-transform">
                <IconBolt size={36} className="text-simple-teal" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-center mb-3 text-simple-teal">
              Einfache Abwicklung
            </h3>
            <p className="text-muted-foreground text-center text-sm leading-relaxed">
              Schneller und unkomplizierter Kauf- und Verkaufsprozess.
              Sofortiger Zugriff auf lizenzierte Videos.
            </p>
          </Card>

          {/* Feature 3: Legal Security */}
          <Card className="p-6 transition-all hover:shadow-xl hover:border-green-500/50 bg-card/50 backdrop-blur-sm group">
            <div className="flex justify-center mb-6 px-0">
              <div className="p-4 bg-green-500/10 rounded-2xl group-hover:scale-110 transition-transform">
                <IconShieldCheck size={36} className="text-green-500" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-center mb-3 text-green-500">
              Rechtssicherheit
            </h3>
            <p className="text-muted-foreground text-center text-sm leading-relaxed">
              Alle Lizenzen sind rechtlich bindend und dokumentiert. Schutz für
              Käufer und Verkäufer.
            </p>
          </Card>
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
                className="text-lg px-8 py-6 hover:scale-105 transition-transform bg-background/50 backdrop-blur-md border-simple-purple/50 text-foreground hover:bg-simple-purple/20"
              >
                Anmelden
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
