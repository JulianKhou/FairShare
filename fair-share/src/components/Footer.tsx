import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-border/50 mt-auto">
      <div className="container mx-auto px-4 py-6 flex items-center justify-center gap-4 text-sm text-muted-foreground">
        <nav className="flex items-center gap-4">
          <Link
            to="/impressum"
            className="hover:text-foreground transition-colors"
          >
            Impressum
          </Link>
          <Link
            to="/datenschutz"
            className="hover:text-foreground transition-colors"
          >
            Datenschutz
          </Link>
          <Link to="/agb" className="hover:text-foreground transition-colors">
            AGB
          </Link>
        </nav>
      </div>
    </footer>
  );
}
