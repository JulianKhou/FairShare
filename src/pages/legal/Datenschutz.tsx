export default function Datenschutz() {
  return (
    <div className="container mx-auto max-w-3xl py-16 px-4">
      <h1 className="text-3xl font-bold mb-8">Datenschutzerklärung</h1>

      <div className="prose prose-sm dark:prose-invert space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-2">
            1. Datenschutz auf einen Blick
          </h2>
          <h3 className="text-lg font-medium mb-1">Allgemeine Hinweise</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Die folgenden Hinweise geben einen einfachen Überblick darüber, was
            mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website
            besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie
            persönlich identifiziert werden können.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">
            2. Verantwortliche Stelle
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Verantwortlich für die Datenverarbeitung auf dieser Website ist:
          </p>
          <p className="text-sm mt-2">
            <strong>[Vor- und Nachname]</strong>
            <br />
            [Straße und Hausnummer]
            <br />
            [PLZ und Ort]
            <br />
            E-Mail: kontakt@fairshare.de
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">
            3. Datenerfassung auf dieser Website
          </h2>

          <h3 className="text-lg font-medium mb-1 mt-4">Cookies</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Diese Website verwendet technisch notwendige Cookies für die
            Authentifizierung und Sitzungsverwaltung. Diese Cookies sind für den
            Betrieb der Seite erforderlich und können nicht deaktiviert werden.
          </p>

          <h3 className="text-lg font-medium mb-1 mt-4">Server-Log-Dateien</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Der Provider der Seiten erhebt und speichert automatisch
            Informationen in sogenannten Server-Log-Dateien, die Ihr Browser
            automatisch an uns übermittelt. Dies sind: Browsertyp und -version,
            verwendetes Betriebssystem, Referrer URL, Hostname des zugreifenden
            Rechners, Uhrzeit der Serveranfrage und IP-Adresse.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">
            4. Registrierung und Konten
          </h2>

          <h3 className="text-lg font-medium mb-1 mt-4">
            Google/YouTube Login
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Für die Nutzung von SimpleShare ist eine Anmeldung über Google (OAuth
            2.0) erforderlich. Dabei werden folgende Daten von Google
            übermittelt: Name, E-Mail-Adresse und Profilbild. Zusätzlich
            erhalten wir Zugriff auf Ihre öffentlichen YouTube-Videodaten
            (Titel, Views, Kategorie, Veröffentlichungsdatum), um den
            SimpleShare-Algorithmus anzuwenden.
          </p>

          <h3 className="text-lg font-medium mb-1 mt-4">Supabase</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Wir nutzen Supabase als Backend-Dienst für Authentifizierung und
            Datenspeicherung. Ihre Daten werden auf europäischen Servern
            gespeichert. Weitere Informationen:{" "}
            <a
              href="https://supabase.com/privacy"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              Supabase Datenschutz
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">5. Zahlungsabwicklung</h2>

          <h3 className="text-lg font-medium mb-1 mt-4">Stripe</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Für die Zahlungsabwicklung nutzen wir Stripe Inc. Bei einem
            Kaufvorgang werden Ihre Zahlungsdaten direkt an Stripe übermittelt
            und nicht auf unseren Servern gespeichert. Es gelten die
            Datenschutzbestimmungen von Stripe:{" "}
            <a
              href="https://stripe.com/de/privacy"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              https://stripe.com/de/privacy
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">6. Ihre Rechte</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Sie haben jederzeit das Recht auf unentgeltliche Auskunft über Ihre
            gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger
            und den Zweck der Datenverarbeitung sowie ein Recht auf
            Berichtigung, Sperrung oder Löschung dieser Daten. Hierzu sowie zu
            weiteren Fragen zum Thema personenbezogene Daten können Sie sich
            jederzeit an uns wenden.
          </p>
          <ul className="text-muted-foreground text-sm list-disc list-inside mt-2 space-y-1">
            <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
            <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
            <li>Recht auf Löschung (Art. 17 DSGVO)</li>
            <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
            <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
            <li>Widerspruchsrecht (Art. 21 DSGVO)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">7. YouTube API</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            SimpleShare nutzt die YouTube Data API v3. Durch die Nutzung unseres
            Dienstes stimmen Sie den YouTube-Nutzungsbedingungen zu:{" "}
            <a
              href="https://www.youtube.com/t/terms"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              YouTube Nutzungsbedingungen
            </a>{" "}
            und der{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              Google Datenschutzerklärung
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
