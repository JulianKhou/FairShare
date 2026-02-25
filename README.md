# SimpleShare

![SimpleShare Logo](src/assets/simpleShareLogo.svg)
<!-- Add this later if there is an actual file or remove it -->

**SimpleShare** ist eine Plattform, auf der du deine Videos verkaufen oder
Lizenzen erwerben kannst, um Creator zu unterstützen. Alles fair, transparent
und rechtssicher.

## 🚀 Technologien

Dieses Projekt wurde mit modernsten Webtechnologien entwickelt:

- **Frontend:** [React](https://reactjs.org/) + [Vite](https://vitejs.dev/) +
  TypeScript
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Komponenten:** [shadcn/ui](https://ui.shadcn.com/)
- **Icons:** [Tabler Icons](https://tablericons.com/)
- **Backend & Datenbank:** [Supabase](https://supabase.com/)
- **Zahlungsabwicklung:** [Stripe](https://stripe.com/)

## 🛠️ Entwicklungsserver starten

Um das Projekt lokal auszuführen, folge diesen Schritten:

1. **Abhängigkeiten installieren:**
   ```bash
   npm install
   ```

2. **Entwicklungsserver starten:**
   ```bash
   npm run dev
   ```

3. Öffne `http://localhost:5173` in deinem Browser.

## 📦 Build für Produktion

Um eine optimierte Version für die Produktion zu erstellen:

```bash
npm run build
```

Das generierte Bundle befindet sich anschließend im `dist`-Ordner.

## 🔑 Umgebungsvariablen

Bevor du das Projekt startest, stelle sicher, dass du die benötigten
Umgebungsvariablen (`.env` oder `.env.local` Datei) konfiguriert hast, unter
anderem für:

- Supabase (URL & Anon Key)
- Stripe (Private/Public Keys)

## 📄 Lizenz

SimpleShare - Alle Rechte vorbehalten.
