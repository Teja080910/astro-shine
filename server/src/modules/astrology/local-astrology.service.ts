import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import axios from 'axios';
import {
  Observer,
  getPanchangam,
  getKundli,
  matchKundli,
  tithiNames,
  nakshatraNames,
  yogaNames,
} from '@ishubhamx/panchangam-js';
import type {
  BirthDetails,
  HoroscopeResult,
  KundliResult,
  MatchmakingResult,
  PanchangResult,
  PlanetaryPosition,
} from './astrology.types';
import { formatTimeInZone, localNoonUtc, toUtcDate } from './astro-utils';

const PLANET_KEYS: Record<string, string> = {
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

const KOOTA_MAX: Record<string, number> = {
  varna: 1,
  vashya: 2,
  tara: 3,
  yoni: 4,
  grahaMaitri: 5,
  gana: 6,
  rashi: 7,
  nadi: 8,
};

const KOOTA_DESCRIPTIONS: Record<string, string> = {
  varna: 'Varna (spiritual compatibility)',
  vashya: 'Vashya (mutual attraction)',
  tara: 'Tara (birth star compatibility)',
  yoni: 'Yoni (sexual compatibility)',
  grahaMaitri: 'Graha Maitri (mental compatibility)',
  gana: 'Gana (temperament compatibility)',
  rashi: 'Rashi (zodiac compatibility)',
  nadi: 'Nadi (health compatibility)',
};

const KOOTA_NAME_TO_KEY: Record<string, string> = {
  varna: 'varna',
  vashya: 'vashya',
  tara: 'tara',
  yoni: 'yoni',
  'graha maitri': 'grahaMaitri',
  grahamaitri: 'grahaMaitri',
  maitri: 'grahaMaitri',
  gana: 'gana',
  bhakoot: 'rashi',
  bhakut: 'rashi',
  rashi: 'rashi',
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

@Injectable()
export class LocalAstrologyService {
  private readonly logger = new Logger(LocalAstrologyService.name);

  private observer(lat: number, lng: number) {
    return new Observer(lat || 28.6139, lng || 77.209, 216);
  }

  panchang(
    dateStr: string,
    lat: number,
    lng: number,
    timezone: number,
  ): PanchangResult {
    const tz = timezone || 5.5;
    const observer = this.observer(lat, lng);
    const p: any = getPanchangam(localNoonUtc(dateStr, tz), observer, {
      timezoneOffset: Math.round(tz * 60),
    });

    const tithiName = tithiNames[p.tithi - 1] || '';
    const tithi =
      p.tithi === 15 || p.tithi === 30
        ? tithiName
        : `${p.tithi <= 15 ? 'Shukla' : 'Krishna'} ${tithiName}`;

    return {
      tithi,
      nakshatra: nakshatraNames[p.nakshatra] || '',
      yoga: yogaNames[p.yoga] || '',
      karana: typeof p.karana === 'string' ? p.karana : '',
      sunrise: formatTimeInZone(p.sunrise, tz),
      sunset: formatTimeInZone(p.sunset, tz),
      moonrise: formatTimeInZone(p.moonrise, tz),
      moonset: formatTimeInZone(p.moonset, tz),
      rahuKaal: {
        start: formatTimeInZone(p.rahuKalamStart, tz),
        end: formatTimeInZone(p.rahuKalamEnd, tz),
      },
      abhijitMuhurta: p.abhijitMuhurta
        ? {
            start: formatTimeInZone(p.abhijitMuhurta.start, tz),
            end: formatTimeInZone(p.abhijitMuhurta.end, tz),
          }
        : { start: '12:00:00', end: '12:51:00' },
    };
  }

  private rawKundli(details: BirthDetails): any {
    const tz = details.timezone || 5.5;
    return getKundli(
      toUtcDate(details.dateString, details.timeString, tz),
      this.observer(details.lat, details.lng),
      { ayanamsa: 'lahiri', houseSystem: 'whole_sign' },
    );
  }

  kundli(details: BirthDetails): KundliResult {
    const k: any = this.rawKundli(details);
    const planetaryPositions: Record<string, PlanetaryPosition> = {};

    for (const [name, pos] of Object.entries(k.planets || {})) {
      const key = PLANET_KEYS[name];
      if (!key) continue;
      const p = pos as any;
      planetaryPositions[key] = {
        graha: name,
        longitude: Number(p.longitude) || 0,
        longitudeSpeed: Number(p.speed) || 0,
        isRetrograde: !!p.isRetrograde,
        nakshatra: { name: p.nakshatra || '', pada: Number(p.pada) || 1 },
        rashi: p.rashiName || '',
      };
    }

    const asc: any = k.ascendant || {};
    const lagna: PlanetaryPosition = {
      graha: 'Ascendant',
      longitude: Number(asc.longitude) || 0,
      longitudeSpeed: 0,
      isRetrograde: false,
      nakshatra: { name: asc.nakshatra || '', pada: Number(asc.pada) || 1 },
      rashi: asc.rashiName || '',
    };
    planetaryPositions['La'] = lagna;

    const houses: number[] = [];
    for (const bhava of k.houses || []) {
      for (const planetName of bhava.planets || []) {
        if (PLANET_KEYS[planetName]) houses.push(Number(bhava.number));
      }
    }
    houses.sort((a, b) => a - b);

    return { planetaryPositions, lagna, houses };
  }

  matchmaking(
    details1: BirthDetails,
    details2: BirthDetails,
  ): MatchmakingResult {
    const boy = this.rawKundli(details1);
    const girl = this.rawKundli(details2);
    const m: any = matchKundli(boy, girl);

    const kootas: Record<
      string,
      { score: number; maxScore: number; description: string }
    > = {};
    for (const [key, max] of Object.entries(KOOTA_MAX)) {
      kootas[key] = {
        score: 0,
        maxScore: max,
        description: KOOTA_DESCRIPTIONS[key],
      };
    }

    for (const k of m?.ashtakoot?.kootas || []) {
      const key = KOOTA_NAME_TO_KEY[String(k.name || '').toLowerCase().trim()];
      if (!key) continue;
      kootas[key] = {
        score: Number(k.score) || 0,
        maxScore: Number(k.maxScore) || KOOTA_MAX[key],
        description: k.description || KOOTA_DESCRIPTIONS[key],
      };
    }

    const totalScore =
      Number(m?.ashtakoot?.totalScore) ||
      Object.values(kootas).reduce((s, k) => s + k.score, 0);
    const maxScore =
      Object.values(kootas).reduce((s, k) => s + k.maxScore, 0) || 36;

    const pct = maxScore > 0 ? totalScore / maxScore : 0;
    let compatibility = 'Poor';
    if (pct >= 0.7) compatibility = 'Excellent';
    else if (pct >= 0.5) compatibility = 'Good';
    else if (pct >= 0.3) compatibility = 'Average';

    return { totalScore, maxScore, kootas, compatibility };
  }

  private async fetchFreeHoroscope(sign: string): Promise<string | null> {
    try {
      const res = await axios.get(
        'https://horoscope-app-api.vercel.app/api/v1/get-horoscope/daily',
        {
          params: {
            sign: sign.charAt(0).toUpperCase() + sign.slice(1),
            day: 'today',
          },
          timeout: 8000,
        },
      );
      const text = res.data?.data?.horoscope;
      return typeof text === 'string' && text.trim() ? text.trim() : null;
    } catch (e: any) {
      this.logger.warn(
        `Free horoscope API unavailable: ${e?.message || e}`,
      );
      return null;
    }
  }

  async horoscope(sign: string, date: string): Promise<HoroscopeResult> {
    const normalized = (sign || '').toLowerCase();
    const lucky = HOROSCOPE_LUCKY[normalized] || HOROSCOPE_LUCKY.aries;

    const remote = await this.fetchFreeHoroscope(normalized);
    if (!remote) {
      throw new ServiceUnavailableException(
        `Horoscope data is unavailable from the primary and free sources for ${normalized}/${date}`,
      );
    }

    return {
      prediction: remote,
      lovePrediction: '',
      careerPrediction: '',
      financePrediction: '',
      healthPrediction: '',
      luckyNumber: lucky.number,
      luckyColor: lucky.color,
      mood: lucky.mood,
    };
  }

  chaughadiya(
    dateStr: string,
    lat: number,
    lng: number,
    timezone: number,
  ): { chaughadiya: { day: { time: string; muhurta: string }[] } } {
    const tz = timezone || 5.5;
    const observer = this.observer(lat, lng);
    const p: any = getPanchangam(localNoonUtc(dateStr, tz), observer, {
      timezoneOffset: Math.round(tz * 60),
    });
    const day = (p.choghadiya?.day || []).map((slot: any) => ({
      time: formatTimeInZone(slot.startTime, tz),
      muhurta: slot.name,
    }));
    return { chaughadiya: { day } };
  }
}
