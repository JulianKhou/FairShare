/**
 * Konfigurationswerte für den Algorithmus.
 * Ausgelagert, damit sie leicht angepasst werden können.
 */
const FAIR_SHARE_CONFIG = {
  BASE_SHARE: 0.5, // Startwert: 50%
  HYPE_WINDOW_DAYS: 2, // Zeitraum für "Hype-Strafe"
  HYPE_FACTOR: 1.5, // Straffaktor
  EVERGREEN_DAYS: 30, // Ab wann gilt es als "alt"?
  EVERGREEN_FACTOR: 0.8, // Rabatt für alte Videos
} as const;

/**
 * Interface für die Eingabeparameter.
 * Verwendung eines Objekts statt einzelner Argumente erhöht die Lesbarkeit.
 */
export interface FairShareParams {
  viewsReactor: number; // Ø Views des React-Kanals
  viewsCreator: number; // Ø Views des Original-Creators
  durationReactorMinutes: number; // Länge der Reaction
  durationCreatorMinutes: number; // Länge des Originals
  percentShown: number; // Anteil des Originals (0.0 bis 1.0)
  daysSinceUpload: number; // Zeitdifferenz in Tagen
}

/**
 * Berechnet den fairen Revenue-Share basierend auf der Master-Formel.
 *
 * @param params - Das FairShareParams Objekt
 * @returns number - Der faire Anteil als Dezimalwert (0.0 - 1.0)
 */
export const calculateFairShare = (params: FairShareParams): number => {
  const {
    viewsReactor,
    viewsCreator,
    durationReactorMinutes,
    durationCreatorMinutes,
    percentShown,
    daysSinceUpload,
  } = params;

  // 1. Validierung / Sanity Checks
  // Verhindert Division durch Null und negative Werte
  const safeReactDuration = Math.max(durationReactorMinutes, 0.1);
  const safeCreatorViews = Math.max(viewsCreator, 1);
  const safeReactViews = Math.max(viewsReactor, 0);

  // 2. Zeit-Faktor (Z) bestimmen
  let timeFactor = 1.0;
  if (daysSinceUpload <= FAIR_SHARE_CONFIG.HYPE_WINDOW_DAYS) {
    timeFactor = FAIR_SHARE_CONFIG.HYPE_FACTOR;
  } else if (daysSinceUpload > FAIR_SHARE_CONFIG.EVERGREEN_DAYS) {
    timeFactor = FAIR_SHARE_CONFIG.EVERGREEN_FACTOR;
  }

  // 3. Content Score berechnen
  // Formel: Basis * Nutzung * (LängeOrig / LängeReact) * Zeit
  const transformFactor = durationCreatorMinutes / safeReactDuration;

  const contentScore =
    FAIR_SHARE_CONFIG.BASE_SHARE * percentShown * transformFactor * timeFactor;

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

  // Capping: Ergebnis strikt zwischen 0.0 und 1.0 halten
  return Math.min(Math.max(finalShare, 0), 1);
};
