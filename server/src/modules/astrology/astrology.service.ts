import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import axios from 'axios';
import { LocalAstrologyService } from './local-astrology.service';
import { parseDateStr, parseTimeStr } from './astro-utils';
import {
  BirthDetails,
  HoroscopeResult,
  KOOTA_DETAILS,
  KOOTA_KEYS,
  KundliResult,
  MatchmakingResult,
  PanchangResult,
  PLANET_NAMES,
  PlanetaryPosition,
} from './astrology.types';

export * from './astrology.types';

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

@Injectable()
export class AstrologyService {
  private readonly logger = new Logger(AstrologyService.name);
  private readonly userId = process.env.ASTRO_API_USER_ID || '';
  private readonly apiKey = process.env.ASTRO_API_KEY || '';

  constructor(private readonly local: LocalAstrologyService) {}

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
    try {
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
    } catch (e: any) {
      this.logger.warn(`Kundli falling back to local engine: ${e.message}`);
      return this.local.kundli(details);
    }
  }

  async calculateMatchmaking(
    details1: BirthDetails,
    details2: BirthDetails,
  ): Promise<MatchmakingResult> {
    try {
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

      const [kootaRes] = await Promise.all([
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

      return {
        totalScore,
        maxScore,
        kootas,
        compatibility: this.compatibilityFromScore(totalScore, maxScore),
      };
    } catch (e: any) {
      this.logger.warn(
        `Matchmaking falling back to local engine: ${e.message}`,
      );
      return this.local.matchmaking(details1, details2);
    }
  }

  private compatibilityFromScore(totalScore: number, maxScore: number): string {
    const pct = maxScore > 0 ? totalScore / maxScore : 0;
    if (pct >= 0.7) return 'Excellent';
    if (pct >= 0.5) return 'Good';
    if (pct >= 0.3) return 'Average';
    return 'Poor';
  }

  async calculatePanchang(
    dateStr: string,
    lat: number,
    lng: number,
    timezone: number,
  ): Promise<PanchangResult> {
    try {
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
    } catch (e: any) {
      this.logger.warn(`Panchang falling back to local engine: ${e.message}`);
      return this.local.panchang(dateStr, lat, lng, timezone);
    }
  }

  async calculateHoroscope(
    sign: string,
    dateStr: string,
  ): Promise<HoroscopeResult> {
    const normalized = (sign || '').toLowerCase();
    try {
      const res = await this.call<any>(
        `sun_sign_prediction/daily/${normalized}`,
      );
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
    } catch (e: any) {
      this.logger.warn(
        `Horoscope falling back to local engine: ${e.message}`,
      );
      return this.local.horoscope(sign, dateStr);
    }
  }

  async getChaughadiyaMuhurta(
    dateStr: string,
    lat: number,
    lng: number,
    timezone: number,
  ) {
    try {
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
      return await this.call<any>('chaughadiya_muhurta', params);
    } catch (e: any) {
      this.logger.warn(
        `Chaughadiya falling back to local engine: ${e.message}`,
      );
      return this.local.chaughadiya(dateStr, lat, lng, timezone);
    }
  }
}
