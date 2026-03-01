export default function Impressum() {
  return (
    <div className="container mx-auto max-w-3xl py-16 px-4">
      <h1 className="text-3xl font-bold mb-8">Impressum</h1>

      <div className="prose prose-sm dark:prose-invert space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-2">Angaben gemäß § 5 TMG</h2>
          <p>
            <strong>Julian Khoudraji</strong>
            <br />
            Bromberger Weg 13
            <br />
            32339 Espelkamp
            <br />
            Deutschland
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Kontakt</h2>
          <p>
            E-Mail:{" "}
            <a
              href="mailto:contact@simpleshare.eu"
              className="text-primary hover:underline"
            >
              contact@simpleshare.eu
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">
            Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV
          </h2>
          <p>
            <strong>Julian Khoudraji</strong>
            <br />
            Bromberger Weg 13
            <br />
            32339 Espelkamp
            <br />
            Deutschland
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Haftung für Inhalte</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte
            auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach
            §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht
            verpflichtet, übermittelte oder gespeicherte fremde Informationen zu
            überwachen oder nach Umständen zu forschen, die auf eine
            rechtswidrige Tätigkeit hinweisen.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Haftung für Links</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Unser Angebot enthält Links zu externen Websites Dritter, auf deren
            Inhalte wir keinen Einfluss haben. Deshalb können wir für diese
            fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der
            verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber
            der Seiten verantwortlich.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Urheberrecht</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Die durch die Seitenbetreiber erstellten Inhalte und Werke auf
            diesen Seiten unterliegen dem deutschen Urheberrecht. Die
            Vervielfältigung, Bearbeitung, Verbreitung und jede Art der
            Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der
            schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Streitschlichtung</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Die Europäische Kommission stellt eine Plattform zur
            Online-Streitbeilegung (OS) bereit:{" "}
            <a
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              https://ec.europa.eu/consumers/odr
            </a>
            . Wir sind nicht bereit oder verpflichtet, an
            Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
            teilzunehmen.
          </p>
        </section>
      </div>
    </div>
  );
}
