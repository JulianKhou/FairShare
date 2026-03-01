import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background/50 backdrop-blur-md py-8 mt-auto">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6 text-sm">
        <div className="text-muted-foreground order-2 md:order-1">
          © 2026 SimpleShare. Alle Rechte vorbehalten.
        </div>

        <nav className="flex items-center gap-6 text-muted-foreground order-1 md:order-2">
          <Link
            to="/impressum"
            className="hover:text-simple-purple transition-colors"
          >
            Impressum
          </Link>
          <Link
            to="/datenschutz"
            className="hover:text-simple-purple transition-colors"
          >
            Datenschutz
          </Link>
          <Link
            to="/agb"
            className="hover:text-simple-purple transition-colors"
          >
            AGB
          </Link>
          <Link
            to="/about-us"
            className="hover:text-simple-purple transition-colors"
          >
            Über uns
          </Link>
        </nav>
      </div>
    </footer>
  );
}
