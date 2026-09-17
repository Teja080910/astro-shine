import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import axios from 'axios';

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

interface AstroBodyParams {
  [key: string]: string | number;
}

interface BirthApiParams {
  day: number;
  month: number;
  year: number;
  hour: number;
  min: number;
  lat: number;
  lon: number;
  tzone: number;
}

const API_BASE = 'https://json.astrologyapi.com/v1';

const PLANET_NAMES: Record<string, string> = {
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

const KOOTA_DETAILS: Record<string, { maxScore: number; description: string }> =
  {
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

const KOOTA_KEYS: Record<string, string> = {
  varna: 'varna',
  vashya: 'vashya',
  tara: 'tara',
  yoni: 'yoni',
  grahaMaitri: 'maitri',
  gana: 'gan',
  rashi: 'bhakut',
  nadi: 'nadi',
};

const HOROSCOPE_LUCKY: Record<
  string,
  { number: number; color: string; mood: string }
> = {
  aries: { number: 9, color: 'Red', mood: 'Energetic' },
  taurus: { number: 6, color: 'Green', mood: 'Calm' },
  gemini: { number: 5, color: 'Yellow', mood: 'Curious' },
  cancer: { number: 2, color: 'White', mood: 'Reflective' },
  leo: { number: 1, color: 'Gold', mood: 'Bold' },
  virgo: { number: 5, color: 'Green', mood: 'Focused' },
  libra: { number: 6, color: 'Pink', mood: 'Peaceful' },
  scorpio: { number: 8, color: 'Maroon', mood: 'Determined' },
  sagittarius: { number: 3, color: 'Purple', mood: 'Adventurous' },
  capricorn: { number: 8, color: 'Brown', mood: 'Ambitious' },
  aquarius: { number: 4, color: 'Blue', mood: 'Innovative' },
  pisces: { number: 7, color: 'Sea Green', mood: 'Dreamy' },
};

function parseDateStr(dateStr: string): {
  day: number;
  month: number;
  year: number;
} {
  const parts = (dateStr || '').trim().split('-').map(Number);
  if (parts.length === 3 && parts.every((p) => !isNaN(p) && p > 0)) {
    if (parts[0] > 31) {
      return { day: parts[2], month: parts[1], year: parts[0] }; // YYYY-MM-DD
    }
    if (parts[2] > 31) {
      return { day: parts[0], month: parts[1], year: parts[2] }; // DD-MM-YYYY
    }
    return { day: parts[0], month: parts[1], year: parts[2] }; // DD-MM-YY
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return { day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear() };
  }
  return { day: 1, month: 1, year: 1990 };
}

function parseTimeStr(s: string): string {
  const t = (s || '').trim();
  const m3 = t.match(/(\d+)\s*:\s*(\d+)\s*:\s*(\d+)/);
  if (m3) {
    const h = String(Number(m3[1])).padStart(2, '0');
    const min = String(Number(m3[2])).padStart(2, '0');
    const sec = String(Number(m3[3])).padStart(2, '0');
    return `${h}:${min}:${sec}`;
  }
  const m2 = t.match(/(\d+)\s*:\s*(\d+)/);
  if (m2) {
    const h = String(Number(m2[1])).padStart(2, '0');
    const min = String(Number(m2[2])).padStart(2, '0');
    return `${h}:${min}:00`;
  }
  return '';
}

@Injectable()
export class AstrologyService {
  private readonly logger = new Logger(AstrologyService.name);
  private readonly userId = process.env.ASTRO_API_USER_ID || '';
  private readonly apiKey = process.env.ASTRO_API_KEY || '';

  private getAuth(): string {
    return (
      'Basic ' + Buffer.from(`${this.userId}:${this.apiKey}`).toString('base64')
    );
  }

  private assertConfigured() {
    if (!this.userId || !this.apiKey) {
      throw new ServiceUnavailableException(
        'Astrology API is not configured. Set ASTRO_API_USER_ID and ASTRO_API_KEY.',
      );
    }
  }

  private async call<T>(
    endpoint: string,
    body: AstroBodyParams = {},
  ): Promise<T> {
    this.assertConfigured();
    try {
      const res = await axios.post<T>(`${API_BASE}/${endpoint}`, body, {
        headers: {
          authorization: this.getAuth(),
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
        },
        timeout: 15000,
      });
      return res.data;
    } catch (e: any) {
      this.logger.error(
        `AstrologyAPI ${endpoint} failed: ${e.response?.data?.message || e.message}`,
      );
      throw new ServiceUnavailableException(
        `Astrology API request failed: ${e.response?.data?.message || e.message}`,
      );
    }
  }

  private birthParams(d: BirthDetails): BirthApiParams {
    const [h, m] = (d.timeString || '').split(':').map(Number);
    const { day, month, year } = parseDateStr(d.dateString);
    return {
      day,
      month,
      year,
      hour: h || 6,
      min: m || 0,
      lat: d.lat || 28.6139,
      lon: d.lng || 77.209,
      tzone: d.timezone || 5.5,
    };
  }

  async calculateKundli(details: BirthDetails): Promise<KundliResult> {
    const params = this.birthParams(details);
    const planets = await this.call<any[]>('planets', { ...params });

    const planetaryPositions: Record<string, PlanetaryPosition> = {};
    for (const p of planets) {
      if (p.name === 'Ascendant') continue;
      const key = PLANET_NAMES[p.name] || p.name;
      planetaryPositions[key] = {
        graha: p.name,
        longitude: Number(p.fullDegree) || 0,
        longitudeSpeed: Number(p.speed) || 0,
        isRetrograde: String(p.isRetro).toLowerCase() === 'true',
        nakshatra: {
          name: p.nakshatra || '',
          pada: Number(p.nakshatra_pad) || 1,
        },
        rashi: p.sign || '',
      };
    }

    const asc = planets.find((p) => p.name === 'Ascendant');
    const lagna: PlanetaryPosition = {
      graha: 'Ascendant',
      longitude: Number(asc?.fullDegree) || 0,
      longitudeSpeed: 0,
      isRetrograde: false,
      nakshatra: {
        name: asc?.nakshatra || '',
        pada: Number(asc?.nakshatra_pad) || 1,
      },
      rashi: asc?.sign || '',
    };
    if (asc) {
      planetaryPositions['La'] = lagna;
    }

    const houses: number[] = [];
    for (const p of planets) {
      const h = Number(p.house);
      if (h >= 1 && h <= 12) houses.push(h);
    }
    houses.sort((a, b) => a - b);

    return { planetaryPositions, lagna, houses };
  }

  async calculateMatchmaking(
    details1: BirthDetails,
    details2: BirthDetails,
  ): Promise<MatchmakingResult> {
    const p1 = this.birthParams(details1);
    const p2 = this.birthParams(details2);
    const params: AstroBodyParams = {
      m_day: p1.day,
      m_month: p1.month,
      m_year: p1.year,
      m_hour: p1.hour,
      m_min: p1.min,
      m_lat: p1.lat,
      m_lon: p1.lon,
      m_tzone: p1.tzone,
      f_day: p2.day,
      f_month: p2.month,
      f_year: p2.year,
      f_hour: p2.hour,
      f_min: p2.min,
      f_lat: p2.lat,
      f_lon: p2.lon,
      f_tzone: p2.tzone,
    };

    const [kootaRes, reportRes] = await Promise.all([
      this.call<any>('match_ashtakoot_points', params),
      this.call<any>('match_making_report', params),
    ]);

    const kootas: Record<
      string,
      { score: number; maxScore: number; description: string }
    > = {};
    for (const [key, apiKey] of Object.entries(KOOTA_KEYS)) {
      const k = kootaRes?.[apiKey];
      kootas[key] = {
        score: Number(k?.received_points) || 0,
        maxScore: Number(k?.total_points) || KOOTA_DETAILS[key].maxScore,
        description: k?.description || KOOTA_DETAILS[key].description,
      };
    }

    const totalScore =
      Number(kootaRes?.total?.received_points) ||
      Object.values(kootas).reduce((s, k) => s + k.score, 0);
    const maxScore =
      Number(kootaRes?.total?.total_points) ||
      Object.values(KOOTA_DETAILS).reduce((s, k) => s + k.maxScore, 0);

    const pct = maxScore > 0 ? totalScore / maxScore : 0;
    let compatibility = 'Poor';
    if (pct >= 0.7) compatibility = 'Excellent';
    else if (pct >= 0.5) compatibility = 'Good';
    else if (pct >= 0.3) compatibility = 'Average';

    return { totalScore, maxScore, kootas, compatibility };
  }

  async calculatePanchang(
    dateStr: string,
    lat: number,
    lng: number,
    timezone: number,
  ): Promise<PanchangResult> {
    const { day, month, year } = parseDateStr(dateStr);
    const params: AstroBodyParams = {
      day,
      month,
      year,
      hour: 6,
      min: 0,
      lat: lat || 28.6139,
      lon: lng || 77.209,
      tzone: timezone || 5.5,
    };

    const res = await this.call<any>('advanced_panchang', params);
    const tithi = res?.tithi?.details?.tithi_name || res?.tithi || '';
    const nakshatra = res?.nakshatra?.details?.nak_name || res?.nakshatra || '';
    const yoga = res?.yog?.details?.yog_name || res?.yog || '';
    const karana = res?.karan?.details?.karan_name || res?.karan || '';

    return {
      tithi,
      nakshatra,
      yoga,
      karana,
      sunrise: parseTimeStr(res?.sunrise || ''),
      sunset: parseTimeStr(res?.sunset || ''),
      moonrise: parseTimeStr(res?.moonrise || ''),
      moonset: parseTimeStr(res?.moonset || ''),
      rahuKaal: {
        start: parseTimeStr(res?.rahukaal?.start || ''),
        end: parseTimeStr(res?.rahukaal?.end || ''),
      },
      abhijitMuhurta: {
        start: parseTimeStr(res?.abhijit_muhurta?.start || '') || '12:00:00',
        end: parseTimeStr(res?.abhijit_muhurta?.end || '') || '12:51:00',
      },
    };
  }

  async calculateHoroscope(
    sign: string,
    dateStr: string,
  ): Promise<HoroscopeResult> {
    const normalized = (sign || '').toLowerCase();
    const res = await this.call<any>(`sun_sign_prediction/daily/${normalized}`);
    const pred = res?.prediction || {};
    const lucky = HOROSCOPE_LUCKY[normalized] || HOROSCOPE_LUCKY.aries;

    return {
      prediction: pred?.personal_life || pred?.prediction || '',
      lovePrediction: pred?.emotions || pred?.personal_life || '',
      careerPrediction: pred?.profession || '',
      financePrediction: pred?.luck || '',
      healthPrediction: pred?.health || '',
      luckyNumber: lucky.number,
      luckyColor: lucky.color,
      mood: lucky.mood,
    };
  }

  async getChaughadiyaMuhurta(
    dateStr: string,
    lat: number,
    lng: number,
    timezone: number,
  ) {
    const { day, month, year } = parseDateStr(dateStr);
    const params: AstroBodyParams = {
      day,
      month,
      year,
      hour: 6,
      min: 0,
      lat: lat || 28.6139,
      lon: lng || 77.209,
      tzone: timezone || 5.5,
    };
    return this.call<any>('chaughadiya_muhurta', params);
  }
}
