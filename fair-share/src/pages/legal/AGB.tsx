export default function AGB() {
  return (
    <div className="container mx-auto max-w-3xl py-16 px-4">
      <h1 className="text-3xl font-bold mb-8">
        Allgemeine Geschäftsbedingungen (AGB)
      </h1>

      <div className="prose prose-sm dark:prose-invert space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-2">§ 1 Geltungsbereich</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Diese Allgemeinen Geschäftsbedingungen gelten für die Nutzung der
            Plattform FairShare (nachfolgend „Plattform") und alle darüber
            abgeschlossenen Lizenzverträge zwischen Content-Erstellern
            (nachfolgend „Lizenzgeber") und Reaktions-Erstellern (nachfolgend
            „Lizenznehmer").
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">
            § 2 Leistungsbeschreibung
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            FairShare ist eine Plattform zur Lizenzierung von YouTube-Inhalten
            für Reaktionsvideos. Die Plattform bietet:
          </p>
          <ul className="text-muted-foreground text-sm list-disc list-inside mt-2 space-y-1">
            <li>
              Automatische Preisberechnung auf Basis des FairShare-Algorithmus
            </li>
            <li>Verwaltung von Lizenzanfragen und -verträgen</li>
            <li>Sichere Zahlungsabwicklung über Stripe</li>
            <li>Generierung von Lizenzverträgen als PDF</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">§ 3 Registrierung</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Die Nutzung der Plattform erfordert eine Registrierung über Google
            OAuth. Mit der Registrierung bestätigen Sie, dass Sie mindestens 18
            Jahre alt sind oder die Zustimmung eines Erziehungsberechtigten
            haben. Sie sind für die Richtigkeit Ihrer Angaben verantwortlich.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">§ 4 Lizenzmodelle</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Die Plattform bietet folgende Lizenzmodelle:
          </p>
          <ul className="text-muted-foreground text-sm list-disc list-inside mt-2 space-y-1">
            <li>
              <strong>Einmalzahlung:</strong> Der Lizenznehmer zahlt einen
              einmaligen Festpreis, berechnet durch den FairShare-Algorithmus
              oder den vom Lizenzgeber festgelegten Mindestpreis (je nachdem,
              welcher höher ist).
            </li>
            <li>
              <strong>Pay-per-Views:</strong> Der Lizenznehmer zahlt
              quartalsweise basierend auf den tatsächlichen Aufrufen seines
              Reaktionsvideos. Die Views werden täglich automatisch erfasst und
              an Stripe gemeldet.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">
            § 5 Zahlungsbedingungen
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Alle Zahlungen werden über den Zahlungsdienstleister Stripe
            abgewickelt. Die Preise verstehen sich inklusive der gesetzlichen
            Mehrwertsteuer. Lizenzgeber müssen ein Stripe Connect-Konto
            einrichten, um Auszahlungen erhalten zu können. FairShare ist
            lediglich Vermittler und nicht Vertragspartei der Lizenzen.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">§ 6 Lizenzumfang</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Die über FairShare erteilte Lizenz berechtigt den Lizenznehmer
            ausschließlich zur Erstellung und Veröffentlichung eines
            Reaktionsvideos auf YouTube unter Verwendung des lizenzierten
            Originalvideos. Eine Unterlizenzierung oder anderweitige Nutzung ist
            nicht gestattet.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">§ 7 Widerrufsrecht</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Bei digitalen Inhalten erlischt das Widerrufsrecht mit Beginn der
            Ausführung des Vertrags, sofern der Verbraucher dem ausdrücklich
            zugestimmt und Kenntnis vom Verlust des Widerrufsrechts genommen
            hat. Bei Einmalzahlungen erlischt das Widerrufsrecht mit dem
            Download der Lizenzvereinbarung. Bei Abonnements gilt eine
            Kündigungsfrist zum Ende des jeweiligen Abrechnungszeitraums.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">§ 8 Haftung</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            FairShare haftet nicht für die Inhalte der lizenzierten Videos oder
            der darauf basierenden Reaktionsvideos. Die Haftung von FairShare
            ist auf Fälle von Vorsatz und grober Fahrlässigkeit beschränkt.
            FairShare übernimmt keine Garantie für die Verfügbarkeit der
            Plattform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">§ 9 Kündigung</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Nutzer können ihr Konto jederzeit löschen. Bestehende Lizenzverträge
            bleiben hiervon unberührt. Bei Vertragsverletzungen oder Missbrauch
            behält sich FairShare das Recht vor, Konten zu sperren oder zu
            löschen.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">
            § 10 Schlussbestimmungen
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Es gilt das Recht der Bundesrepublik Deutschland. Sollten einzelne
            Bestimmungen dieser AGB unwirksam sein, bleibt die Wirksamkeit der
            übrigen Bestimmungen unberührt. Änderungen dieser AGB werden den
            Nutzern rechtzeitig mitgeteilt.
          </p>
        </section>

        <p className="text-xs text-muted-foreground/60 mt-8">
          Stand: Februar 2026
        </p>
      </div>
    </div>
  );
}
