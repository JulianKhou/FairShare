import { useEffect } from "react";
import {
  IconRocket,
  IconTarget,
  IconShieldCheck,
  IconUsers,
} from "@tabler/icons-react";

export default function AboutUs() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 px-4 text-center overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[500px] bg-simple-purple/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
            Wir verändern{" "}
            <span className="bg-clip-text text-transparent bg-linear-to-r from-simple-purple to-simple-teal">
              Reaction-Content
            </span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            SimpleShare ist die erste Plattform, die eine Brücke zwischen
            Original-Creatoren und Reaction-Kanälen schlägt. Fair, automatisiert
            und rechtssicher.
          </p>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="px-4 py-16 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="bg-card/50 backdrop-blur-sm p-8 rounded-3xl border border-border/50 hover:border-simple-purple/30 transition-all group">
          <div className="w-14 h-14 bg-simple-purple/10 text-simple-purple rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <IconRocket size={32} />
          </div>
          <h2 className="text-3xl font-bold mb-4 text-simple-purple">
            Unsere Mission
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Wir möchten sicherstellen, dass Content-Ersteller fair für ihre
            Arbeit entlohnt werden, wenn andere darauf reagieren. Gleichzeitig
            geben wir Reaction-Kanälen die Freiheit, kreativ zu sein, ohne Angst
            vor Strikes oder rechtlichen Problemen zu haben.
          </p>
        </div>

        <div className="bg-card/50 backdrop-blur-sm p-8 rounded-3xl border border-border/50 hover:border-simple-teal/30 transition-all group">
          <div className="w-14 h-14 bg-simple-teal/10 text-simple-teal rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <IconTarget size={32} />
          </div>
          <h2 className="text-3xl font-bold mb-4 text-simple-teal">
            Unsere Vision
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            SimpleShare soll der globale Standard für die Lizenzierung von
            digitalem Content im Reaction-Zeitalter werden. Ein Ökosystem, in
            dem Kooperation statt Konfrontation im Vordergrund steht.
          </p>
        </div>
      </section>

      {/* Values Section */}
      <section className="px-4 py-16 bg-white/5 border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">
            Wofür wir stehen
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="text-simple-purple mb-4 flex justify-center">
                <IconShieldCheck size={48} stroke={1.5} />
              </div>
              <h3 className="text-xl font-bold mb-2">Rechtssicherheit</h3>
              <p className="text-muted-foreground text-sm">
                Offiziell geprüfte Lizenzen, die vor Copyright-Claims schützen.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="text-simple-teal mb-4 flex justify-center">
                <IconUsers size={48} stroke={1.5} />
              </div>
              <h3 className="text-xl font-bold mb-2">Community Fokus</h3>
              <p className="text-muted-foreground text-sm">
                Entwickelt von Creatoren für Creatoren. Wir verstehen eure
                Bedürfnisse.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="text-orange-500 mb-4 flex justify-center">
                <IconShieldCheck size={48} stroke={1.5} />
              </div>
              <h3 className="text-xl font-bold mb-2">Transparenz</h3>
              <p className="text-muted-foreground text-sm">
                Keine versteckten Kosten. Klare Aufschlüsselung jedes Euros.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team CTA */}
      <section className="px-4 py-24 text-center">
        <div className="max-w-2xl mx-auto p-12 rounded-[40px] bg-linear-to-br from-simple-purple/20 to-simple-teal/20 border border-white/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-white/5 blur-3xl rounded-full"></div>
          <h2 className="text-3xl font-bold mb-4 relative z-10">
            Bereit für die Zukunft?
          </h2>
          <p className="text-muted-foreground mb-8 relative z-10">
            Werde Teil der SimpleShare-Bewegung und revolutioniere deinen
            Content.
          </p>
          <button className="bg-foreground text-background px-8 py-3 rounded-full font-bold hover:opacity-90 transition-opacity relative z-10">
            Jetzt starten
          </button>
        </div>
      </section>
    </div>
  );
}
