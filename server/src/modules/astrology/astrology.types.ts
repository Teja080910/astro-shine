export interface BirthDetails {
  dateString: string;
  timeString: string;
  lat: number;
  lng: number;
  timezone: number;
}

export interface PlanetaryPosition {
  graha: string;
  longitude: number;
  longitudeSpeed: number;
  isRetrograde: boolean;
  nakshatra: { name: string; pada: number };
  rashi: string;
}

export interface KundliResult {
  planetaryPositions: Record<string, PlanetaryPosition>;
  lagna: PlanetaryPosition;
  houses: number[];
}

export interface MatchmakingResult {
  totalScore: number;
  maxScore: number;
  kootas: Record<
    string,
    { score: number; maxScore: number; description: string }
  >;
  compatibility: string;
}

export interface PanchangResult {
  tithi: string;
  nakshatra: string;
  yoga: string;
  karana: string;
  sunrise: string;
  sunset: string;
  moonrise: string;
  moonset: string;
  rahuKaal: { start: string; end: string };
  abhijitMuhurta?: { start: string; end: string };
}

export interface HoroscopeResult {
  prediction: string;
  lovePrediction: string;
  careerPrediction: string;
  financePrediction: string;
  healthPrediction: string;
  luckyNumber: number;
  luckyColor: string;
  mood: string;
}

export interface MuhuratSlot {
  time: string;
  muhurta: string;
}

export const PLANET_NAMES: Record<string, string> = {
  Sun: 'Su',
  Moon: 'Mo',
  Mars: 'Ma',
  Mercury: 'Me',
  Jupiter: 'Ju',
  Venus: 'Ve',
  Saturn: 'Sa',
  Rahu: 'Ra',
  Ketu: 'Ke',
};

export const KOOTA_DETAILS: Record<
  string,
  { maxScore: number; description: string }
> = {
  varna: { maxScore: 1, description: 'Varna (spiritual compatibility)' },
  vashya: { maxScore: 2, description: 'Vashya (mutual attraction)' },
  tara: { maxScore: 3, description: 'Tara (birth star compatibility)' },
  yoni: { maxScore: 4, description: 'Yoni (sexual compatibility)' },
  grahaMaitri: {
    maxScore: 5,
    description: 'Graha Maitri (mental compatibility)',
  },
  gana: { maxScore: 6, description: 'Gana (temperament compatibility)' },
  rashi: { maxScore: 7, description: 'Rashi (zodiac compatibility)' },
  nadi: { maxScore: 8, description: 'Nadi (health compatibility)' },
};

export const KOOTA_KEYS: Record<string, string> = {
  varna: 'varna',
  vashya: 'vashya',
  tara: 'tara',
  yoni: 'yoni',
  grahaMaitri: 'maitri',
  gana: 'gan',
  rashi: 'bhakut',
  nadi: 'nadi',
};
