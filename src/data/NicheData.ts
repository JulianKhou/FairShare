export interface NicheData {
  id: string; // Eindeutige ID für die Datenbank
  name_de: string;
  name_en: string;
  factor: number;
  rpm: number;
  earningsPer100k: number;
  youtubeCategoryIds: number[]; // Verknüpfung zur YT-API
}
//basierend auf 6 euro durchnitts CPM

export const NICHE_DATA: NicheData[] = [
  {
    id: "online-money",
    name_de: "Online Geldverdienen",
    name_en: "Make Money Online",
    factor: 2.58,
    rpm: 8.52,
    earningsPer100k: 852.0,
    youtubeCategoryIds: [27, 22], // Education, People & Blogs
  },
  {
    id: "finance-investing",
    name_de: "Finanzen & Investitionen",
    name_en: "Finance & Investing",
    factor: 2.33,
    rpm: 7.7,
    earningsPer100k: 770.0,
    youtubeCategoryIds: [27, 22],
  },
  {
    id: "digital-marketing",
    name_de: "Digitales Marketing",
    name_en: "Digital Marketing",
    factor: 2.17,
    rpm: 7.15,
    earningsPer100k: 715.0,
    youtubeCategoryIds: [28, 27], // Tech, Education
  },
  {
    id: "crypto",
    name_de: "Kryptowährung",
    name_en: "Cryptocurrency",
    factor: 2.25,
    rpm: 7.43,
    earningsPer100k: 743.0,
    youtubeCategoryIds: [28, 27],
  },
  {
    id: "insurance",
    name_de: "Versicherungen",
    name_en: "Insurance",
    factor: 2.17,
    rpm: 7.15,
    earningsPer100k: 715.0,
    youtubeCategoryIds: [22, 24], // People, Entertainment
  },
  {
    id: "personal-finance",
    name_de: "Persönliche Finanzen",
    name_en: "Personal Finance",
    factor: 2.0,
    rpm: 6.6,
    earningsPer100k: 660.0,
    youtubeCategoryIds: [27, 22],
  },
  {
    id: "legal-services",
    name_de: "Rechtsdienstleistungen",
    name_en: "Legal Services",
    factor: 2.08,
    rpm: 6.88,
    earningsPer100k: 688.0,
    youtubeCategoryIds: [25, 27], // News/Politics, Education
  },
  {
    id: "real-estate",
    name_de: "Immobilien",
    name_en: "Real Estate",
    factor: 1.92,
    rpm: 6.32,
    earningsPer100k: 632.0,
    youtubeCategoryIds: [22, 19], // People, Travel/Events
  },
  {
    id: "software-saas",
    name_de: "Software & SaaS",
    name_en: "Software & SaaS",
    factor: 1.75,
    rpm: 5.78,
    earningsPer100k: 578.0,
    youtubeCategoryIds: [28], // Science & Tech
  },
  {
    id: "ecommerce",
    name_de: "E-Commerce",
    name_en: "E-Commerce",
    factor: 1.75,
    rpm: 5.78,
    earningsPer100k: 578.0,
    youtubeCategoryIds: [28, 27],
  },
  {
    id: "education",
    name_de: "Bildung",
    name_en: "Education",
    factor: 1.42,
    rpm: 4.68,
    earningsPer100k: 468.0,
    youtubeCategoryIds: [27],
  },
  {
    id: "business",
    name_de: "Business",
    name_en: "Business",
    factor: 1.42,
    rpm: 4.68,
    earningsPer100k: 468.0,
    youtubeCategoryIds: [27, 22],
  },
  {
    id: "health-fitness",
    name_de: "Gesundheit & Fitness",
    name_en: "Health & Fitness",
    factor: 1.25,
    rpm: 4.12,
    earningsPer100k: 412.0,
    youtubeCategoryIds: [17, 26], // Sports, Howto/Style
  },
  {
    id: "productivity",
    name_de: "Produktivität",
    name_en: "Productivity",
    factor: 1.25,
    rpm: 4.12,
    earningsPer100k: 412.0,
    youtubeCategoryIds: [27, 28],
  },
  {
    id: "beauty-fashion",
    name_de: "Schönheit & Fashion",
    name_en: "Beauty & Fashion",
    factor: 1.25,
    rpm: 4.12,
    earningsPer100k: 412.0,
    youtubeCategoryIds: [26], // Howto & Style
  },
  {
    id: "travel",
    name_de: "Reisen",
    name_en: "Travel",
    factor: 1.25,
    rpm: 4.12,
    earningsPer100k: 412.0,
    youtubeCategoryIds: [19], // Travel & Events
  },
  {
    id: "diy",
    name_de: "DIY & Heimwerken",
    name_en: "DIY & Home Improvement",
    factor: 1.0,
    rpm: 3.3,
    earningsPer100k: 330.0,
    youtubeCategoryIds: [26],
  },
  {
    id: "cooking",
    name_de: "Rezepte & Kochen",
    name_en: "Recipes & Cooking",
    factor: 0.83,
    rpm: 2.75,
    earningsPer100k: 275.0,
    youtubeCategoryIds: [26],
  },
  {
    id: "gaming",
    name_de: "Gaming",
    name_en: "Gaming",
    factor: 0.67,
    rpm: 2.2,
    earningsPer100k: 220.0,
    youtubeCategoryIds: [20],
  },
  {
    id: "music-podcasts",
    name_de: "Musik & Podcasts",
    name_en: "Music & Podcasts",
    factor: 0.5,
    rpm: 1.65,
    earningsPer100k: 165.0,
    youtubeCategoryIds: [10], // Music
  },
];

export const DEFAULT_NICHE_DATA: NicheData = {
  id: "default",
  name_de: "Allgemein",
  name_en: "General",
  factor: 1.0,
  rpm: 3.0, // Konservativer Durchschnittswert
  earningsPer100k: 300.0,
  youtubeCategoryIds: [],
};

// Monatliche Faktoren (0 = Januar, 11 = Dezember)
const MONTHLY_SEASONALITY: Record<number, number> = {
  0: 0.75, // Januar (sehr niedrig)
  1: 0.85, // Februar
  2: 0.95, // März
  3: 1.0, // April
  4: 1.05, // Mai
  5: 1.0, // Juni
  6: 0.95, // Juli
  7: 1.0, // August
  8: 1.1, // September
  9: 1.25, // Oktober
  10: 1.5, // November (Black Friday Peak)
  11: 1.6, // Dezember (Weihnachts-Peak)
};

export const getSeasonalityFactor = (date: Date = new Date()): number => {
  const month = date.getMonth();
  return MONTHLY_SEASONALITY[month] || 1.0;
};
// Hilfsfunktion: Findet die passende Nische basierend auf der YouTube Category ID
export const findNicheByYouTubeId = (
  categoryId: number,
): NicheData | undefined => {
  // Wir geben die erste Nische zurück, die diese ID enthält.
  // Da IDs wie 27 (Education) oft vorkommen, ist es sinnvoll,
  // im Zweifel einen Standardwert oder eine Auswahl anzubieten.
  return NICHE_DATA.find((niche) =>
    niche.youtubeCategoryIds.includes(categoryId),
  );
};

export function getNicheRPM(youtubeCategoryId: number) {
  let niche = findNicheByYouTubeId(youtubeCategoryId);
  if (!niche) {
    console.warn(`Niche for Category ID ${youtubeCategoryId} not found. Using default.`);
    niche = DEFAULT_NICHE_DATA;
  }

  const seasonalityFactor = getSeasonalityFactor();
  const nicheFactor = niche.factor;
  const nicheRPM = niche.rpm;

  return nicheRPM * seasonalityFactor;
}

