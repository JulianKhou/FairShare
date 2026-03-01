/**
 * Konfigurationswerte für den Algorithmus.
 * Ausgelagert, damit sie leicht angepasst werden können.
 */
const SIMPLE_SHARE_CONFIG = {
  BASE_SHARE: 0.5, // Startwert: 50%
  HYPE_DECAY_DAYS: 7, // Zeitraum, in dem der Aufschlag linear abnimmt
  HYPE_FACTOR: 1.5, // Maximaler Straffaktor an Tag 0
  EVERGREEN_DAYS: 30, // Ab wann gilt es als "alt"?
  EVERGREEN_FACTOR: 0.8, // Rabatt für alte Videos
} as const;

/**
 * Interface für die Eingabeparameter.
 * Verwendung eines Objekts statt einzelner Argumente erhöht die Lesbarkeit.
 */
export interface SimpleShareParams {
  viewsReactor: number; // Ø Views des React-Kanals
  viewsCreator: number; // Ø Views des Original-Creators
  durationReactorSeconds: number; // Länge der Reaction
  durationCreatorSeconds: number; // Länge des Originals
  percentShown: number; // Anteil des Originals (0.0 bis 1.0)
  daysSinceUpload: number; // Zeitdifferenz in Tagen
}

/**
 * Berechnet den fairen Revenue-Share basierend auf der Master-Formel.
 *
 * @param params - Das SimpleShareParams Objekt
 * @returns number - Der faire Anteil als Dezimalwert (0.0 - 1.0)
 */
export const calculateSimpleShare = (params: SimpleShareParams): number => {
  const {
    viewsReactor,
    viewsCreator,
    durationReactorSeconds,
    durationCreatorSeconds,
    percentShown,
    daysSinceUpload,
  } = params;

  // 1. Validierung / Sanity Checks
  // Verhindert Division durch Null und negative Werte
  const safeReactDuration = Math.max(durationReactorSeconds, 0.1);
  const safeCreatorViews = Math.max(viewsCreator, 1);
  const safeReactViews = Math.max(viewsReactor, 0);

  // 2. Zeit-Faktor (Z) bestimmen
  let timeFactor = 1.0;
  if (daysSinceUpload < SIMPLE_SHARE_CONFIG.HYPE_DECAY_DAYS) {
    // Linearer Zerfall von HYPE_FACTOR (Tag 0) zu 1.0 (Tag 7)
    const decayProgress = daysSinceUpload / SIMPLE_SHARE_CONFIG.HYPE_DECAY_DAYS;
    timeFactor =
      SIMPLE_SHARE_CONFIG.HYPE_FACTOR -
      decayProgress * (SIMPLE_SHARE_CONFIG.HYPE_FACTOR - 1.0);
  } else if (daysSinceUpload > SIMPLE_SHARE_CONFIG.EVERGREEN_DAYS) {
    timeFactor = SIMPLE_SHARE_CONFIG.EVERGREEN_FACTOR;
  }

  // 3. Content Score berechnen
  // Formel: Basis * Nutzung * (LängeOrig / LängeReact) * Zeit
  const transformFactor = durationCreatorSeconds / safeReactDuration;

  const contentScore =
    SIMPLE_SHARE_CONFIG.BASE_SHARE *
    percentShown *
    transformFactor *
    timeFactor;

  // 4. Reichweiten-Rabatt (E) berechnen
  // Ratio: Wie viel größer ist der Reactor?
  const ratio = safeReactViews / safeCreatorViews;

  let discountFactor = 1.0;

  // Rabatt nur, wenn Reactor GRÖSSER ist (Ratio > 1).
  // Wenn Reactor kleiner ist, bleibt Faktor 1.0 (kein Rabatt).
  if (ratio > 1) {
    // Logarithmische Dämpfung: 1 / (1 + log10(ratio))
    discountFactor = 1 / (1 + Math.log10(ratio));
  }

  // 5. Finalisierung
  const finalShare = contentScore * discountFactor;

  console.group("SimpleShare Calculation Debug");
  console.log("Params:", params);
  console.log("Time Factor:", timeFactor, "(Days:", daysSinceUpload, ")");
  console.log(
    "Transform Factor:",
    transformFactor,
    "(Creator:",
    durationCreatorSeconds,
    "/ Reactor:",
    safeReactDuration,
    ")",
  );
  console.log("Content Score:", contentScore);
  console.log("Discount Factor:", discountFactor, "(Ratio:", ratio, ")");
  console.log("Final Share (Uncapped):", finalShare);
  console.groupEnd();

  // Capping: Ergebnis strikt zwischen 0.0 und 1.0 halten
  return Math.min(Math.max(finalShare, 0), 1);
};
