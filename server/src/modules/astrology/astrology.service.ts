import { Injectable, Logger } from '@nestjs/common';

const jyotish = require('jyotish');

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
  kootas: Record<string, { score: number; maxScore: number; description: string }>;
  compatibility: string;
}

export interface PanchangResult {
  tithi: string;
  nakshatra: string;
  yoga: string;
  karana: string;
  sunrise: string;
  sunset: string;
  rahuKaal: { start: string; end: string };
}

const NAKSHATRA_LORDS: Record<string, string> = {
  Ashwini: 'Ketu', Bharani: 'Venus', Krittika: 'Sun', Rohini: 'Moon',
  Mrigashira: 'Mars', Ardra: 'Rahu', Punarvasu: 'Jupiter', Pushya: 'Saturn',
  Ashlesha: 'Mercury', Magha: 'Ketu', PurvaPhalguni: 'Venus', UttaraPhalguni: 'Sun',
  Hasta: 'Moon', Chitra: 'Mars', Swati: 'Rahu', Vishakha: 'Jupiter',
  Anuradha: 'Saturn', Jyeshtha: 'Mercury', Mula: 'Ketu', PurvaAshadha: 'Venus',
  UttaraAshadha: 'Sun', Shravana: 'Moon', Dhanishta: 'Mars', Shatabhisha: 'Rahu',
  PurvaBhadrapada: 'Jupiter', UttaraBhadrapada: 'Saturn', Revati: 'Mercury',
};

const RASHI_LORDS: Record<string, string> = {
  Mesha: 'Mars', Vrishabha: 'Venus', Mithuna: 'Mercury', Karka: 'Moon',
  Simha: 'Sun', Kanya: 'Mercury', Tula: 'Venus', Vrishchika: 'Mars',
  Dhanu: 'Jupiter', Makara: 'Saturn', Kumbha: 'Saturn', Meena: 'Jupiter',
};

const KOOTA_DETAILS: Record<string, { maxScore: number; description: string }> = {
  varna: { maxScore: 1, description: 'Varna (spiritual compatibility)' },
  vashya: { maxScore: 2, description: 'Vashya (mutual attraction)' },
  tara: { maxScore: 3, description: 'Tara (birth star compatibility)' },
  yoni: { maxScore: 4, description: 'Yoni (sexual compatibility)' },
  grahaMaitri: { maxScore: 5, description: 'Graha Maitri (mental compatibility)' },
  gana: { maxScore: 6, description: 'Gana (temperament compatibility)' },
  rashi: { maxScore: 7, description: 'Rashi (zodiac compatibility)' },
  nadi: { maxScore: 8, description: 'Nadi (health compatibility)' },
};

const RASHI_NAMES = ['Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya', 'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena'];
const NAKSHATRA_NAMES = ['Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'PurvaPhalguni', 'UttaraPhalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'PurvaAshadha', 'UttaraAshadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'PurvaBhadrapada', 'UttaraBhadrapada', 'Revati'];
const GANA_MAP: Record<string, string> = { Ashwini: 'Deva', Bharani: 'Manushya', Krittika: 'Rakshasa', Rohini: 'Manushya', Mrigashira: 'Deva', Ardra: 'Manushya', Punarvasu: 'Deva', Pushya: 'Deva', Ashlesha: 'Rakshasa', Magha: 'Rakshasa', PurvaPhalguni: 'Manushya', UttaraPhalguni: 'Manushya', Hasta: 'Deva', Chitra: 'Rakshasa', Swati: 'Deva', Vishakha: 'Rakshasa', Anuradha: 'Deva', Jyeshtha: 'Rakshasa', Mula: 'Rakshasa', PurvaAshadha: 'Manushya', UttaraAshadha: 'Manushya', Shravana: 'Deva', Dhanishta: 'Rakshasa', Shatabhisha: 'Rakshasa', PurvaBhadrapada: 'Manushya', UttaraBhadrapada: 'Manushya', Revati: 'Deva' };
const GANA_SCORE: Record<string, Record<string, number>> = { Deva: { Deva: 6, Manushya: 5, Rakshasa: 0 }, Manushya: { Deva: 5, Manushya: 6, Rakshasa: 3 }, Rakshasa: { Deva: 0, Manushya: 3, Rakshasa: 6 } };
const YONI_COMPAT: Record<string, string[]> = { Ashwa: ['Mahish'], Gaja: ['Simha'], Mesha: ['Ahi'], Sarpa: ['Nakula'], Mriga: ['Bidala'], Simha: ['Gaja'], Bidala: ['Mriga'], Nakula: ['Sarpa'], Mahish: ['Ashwa'], Ahi: ['Mesha'], Vanara: ['Vanara'] };

@Injectable()
export class AstrologyService {
  private readonly logger = new Logger(AstrologyService.name);

  calculateKundli(details: BirthDetails): KundliResult {
    const positions = jyotish.grahas.getGrahasPosition(details);
    const planetaryPositions: Record<string, PlanetaryPosition> = {};
    for (const [name, data] of Object.entries(positions)) {
      if (name === 'houses') continue;
      const p = data as any;
      planetaryPositions[name] = {
        graha: p.graha || name,
        longitude: p.longitude,
        longitudeSpeed: p.longitudeSpeed || 0,
        isRetrograde: !!p.isRetrograde,
        nakshatra: p.nakshatra || { name: '', pada: 1 },
        rashi: p.rashi || '',
      };
    }
    const lagna = planetaryPositions['La'] || planetaryPositions['Lagna'] || null;
    const houses = positions.houses || [];
    return { planetaryPositions, lagna, houses };
  }

  calculateMatchmaking(details1: BirthDetails, details2: BirthDetails): MatchmakingResult {
    const k1 = this.calculateKundli(details1);
    const k2 = this.calculateKundli(details2);
    const p1 = k1.planetaryPositions;
    const p2 = k2.planetaryPositions;
    const moon1 = p1['Mo'] || p1['Chandra'] || p1['Moon'];
    const moon2 = p2['Mo'] || p2['Chandra'] || p2['Moon'];
    const n1 = moon1?.nakshatra?.name || '';
    const n2 = moon2?.nakshatra?.name || '';
    const r1 = moon1?.rashi || '';
    const r2 = moon2?.rashi || '';
    const idx1 = NAKSHATRA_NAMES.indexOf(n1);
    const idx2 = NAKSHATRA_NAMES.indexOf(n2);
    const rIdx1 = RASHI_NAMES.indexOf(r1);
    const rIdx2 = RASHI_NAMES.indexOf(r2);

    const kootas: Record<string, { score: number; maxScore: number; description: string }> = {};

    const varnaScore = rIdx1 >= 0 && rIdx2 >= 0 ? (Math.abs(rIdx1 - rIdx2) % 2 === 0 ? 1 : 0) : 0;
    kootas.varna = { score: varnaScore, ...KOOTA_DETAILS.varna };

    const vashyaScore = rIdx1 >= 0 && rIdx2 >= 0 ? (Math.floor(rIdx1 / 3) === Math.floor(rIdx2 / 3) ? 2 : 1) : 0;
    kootas.vashya = { score: vashyaScore, ...KOOTA_DETAILS.vashya };

    const diff = Math.abs(idx1 - idx2) % 27;
    const taraScore = diff === 0 || diff === 3 || diff === 6 || diff === 9 || diff === 12 || diff === 15 || diff === 18 || diff === 21 || diff === 24 ? 3 : diff === 1 || diff === 4 || diff === 7 || diff === 10 || diff === 13 || diff === 16 || diff === 19 || diff === 22 || diff === 25 ? 1.5 : 0;
    kootas.tara = { score: taraScore, ...KOOTA_DETAILS.tara };

    const yoniNames = ['Ashwa', 'Gaja', 'Mesha', 'Sarpa', 'Mriga', 'Simha', 'Bidala', 'Nakula', 'Mahish', 'Ahi', 'Vanara', 'Vanara'];
    const y1 = yoniNames[Math.floor(idx1 / 2.45) % yoniNames.length] || 'Vanara';
    const y2 = yoniNames[Math.floor(idx2 / 2.45) % yoniNames.length] || 'Vanara';
    const yoniScore = y1 === y2 || YONI_COMPAT[y1]?.includes(y2) || YONI_COMPAT[y2]?.includes(y1) ? 4 : 0;
    kootas.yoni = { score: yoniScore, ...KOOTA_DETAILS.yoni };

    const lord1 = NAKSHATRA_LORDS[n1] || '';
    const lord2 = NAKSHATRA_LORDS[n2] || '';
    const friendPairs: Record<string, string[]> = { Sun: ['Moon', 'Mars', 'Jupiter'], Moon: ['Sun', 'Mercury'], Mars: ['Sun', 'Moon', 'Jupiter'], Mercury: ['Venus', 'Saturn'], Jupiter: ['Sun', 'Moon', 'Mars'], Venus: ['Mercury', 'Saturn'], Saturn: ['Mercury', 'Venus'], Rahu: ['Jupiter', 'Venus'], Ketu: ['Mars', 'Saturn'] };
    const friends = friendPairs[lord1] || [];
    const grahaMaitriScore = lord1 === lord2 ? 5 : friends.includes(lord2) ? 3 : 0;
    kootas.grahaMaitri = { score: grahaMaitriScore, ...KOOTA_DETAILS.grahaMaitri };

    const g1 = GANA_MAP[n1] || 'Manushya';
    const g2 = GANA_MAP[n2] || 'Manushya';
    const ganaScore = GANA_SCORE[g1]?.[g2] ?? 3;
    kootas.gana = { score: ganaScore, ...KOOTA_DETAILS.gana };

    const rashiScore = rIdx1 >= 0 && rIdx2 >= 0 ? (Math.abs(rIdx1 - rIdx2) % 9 === 0 ? 7 : Math.abs(rIdx1 - rIdx2) % 3 === 0 ? 5 : 3) : 0;
    kootas.rashi = { score: rashiScore, ...KOOTA_DETAILS.rashi };

    const nadi1 = Math.floor(idx1 / 9);
    const nadi2 = Math.floor(idx2 / 9);
    const nadiScore = nadi1 !== nadi2 ? 8 : 0;
    kootas.nadi = { score: nadiScore, ...KOOTA_DETAILS.nadi };

    const totalScore = Object.values(kootas).reduce((s, k) => s + k.score, 0);
    const maxScore = Object.values(KOOTA_DETAILS).reduce((s, k) => s + k.maxScore, 0);

    let compatibility = 'Poor';
    const pct = totalScore / maxScore;
    if (pct >= 0.7) compatibility = 'Excellent';
    else if (pct >= 0.5) compatibility = 'Good';
    else if (pct >= 0.3) compatibility = 'Average';

    return { totalScore: Math.round(totalScore), maxScore, kootas, compatibility };
  }

  calculatePanchang(dateStr: string, lat: number, lng: number, timezone: number): PanchangResult {
    const details: BirthDetails = { dateString: dateStr, timeString: '06:00:00', lat, lng, timezone };
    const positions = jyotish.grahas.getGrahasPosition(details);
    const sun = positions['Su'] || positions['Sun'] || { longitude: 0 };
    const moon = positions['Mo'] || positions['Moon'] || { longitude: 0 };
    const sunLong = sun.longitude || 0;
    const moonLong = moon.longitude || 0;

    const tithiIdx = Math.floor((moonLong - sunLong) / 12);
    const tithiNames = ['Prathama', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashti', 'Saptami', 'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima', 'Amavasya'];
    const tithi = tithiNames[((tithiIdx % 16) + 16) % 16] || 'Prathama';

    const nakshatra = jyotish.nakshatras.getNakshatras(moonLong);
    const nakshatraName = nakshatra?.name || '';

    const yogaIdx = Math.floor((sunLong + moonLong) / 13.3333);
    const yogaNames = ['Vishkumbha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda', 'Sukarma', 'Dhriti', 'Shula', 'Ganda', 'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra', 'Siddhi', 'Vyatipata', 'Variyana', 'Parigha', 'Shiva', 'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma', 'Indra', 'Vaidhriti'];
    const yoga = yogaNames[((yogaIdx % 27) + 27) % 27] || '';

    const karanaIdx = Math.floor((moonLong - sunLong) / 6);
    const karanaNames = ['Bava', 'Balava', 'Kaulava', 'Taitila', 'Garija', 'Vanija', 'Vishti', 'Shakuni', 'Chatushpada', 'Naga', 'Kimstughna'];
    const karana = karanaNames[((karanaIdx % 11) + 11) % 11] || '';

    const sunrise = '06:00:00';
    const sunset = '18:00:00';
    const rahuKaal = { start: '07:30:00', end: '09:00:00' };

    return { tithi, nakshatra: nakshatraName, yoga, karana, sunrise, sunset, rahuKaal };
  }
}
