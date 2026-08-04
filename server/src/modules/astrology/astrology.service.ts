import { Injectable, Logger } from '@nestjs/common';

const jyotish = require('jyotish');
const SunCalc = require('suncalc');

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

    const date = new Date(dateStr + 'T00:00:00Z');
    const sunTimes = SunCalc.getTimes(date, lat, lng);
    const sunriseDate = new Date(sunTimes.sunrise.getTime() + timezone * 60 * 60 * 1000);
    const sunsetDate = new Date(sunTimes.sunset.getTime() + timezone * 60 * 60 * 1000);

    const sunriseStr = sunriseDate.toISOString().split('T')[1].split('.')[0];
    const sunsetStr = sunsetDate.toISOString().split('T')[1].split('.')[0];

    const dayLength = (sunsetDate.getTime() - sunriseDate.getTime()) / (8 * 60 * 60 * 1000);
    const dayOfWeek = date.getUTCDay();
    const rahuSlots: Record<number, number> = { 0: 7, 1: 1, 2: 5, 3: 3, 4: 4, 5: 2, 6: 6 };
    const rahuSlot = rahuSlots[dayOfWeek] ?? 0;
    const rahuStart = new Date(sunriseDate.getTime() + rahuSlot * dayLength * 60 * 60 * 1000);
    const rahuEnd = new Date(rahuStart.getTime() + dayLength * 60 * 60 * 1000);

    const rahuStartStr = rahuStart.toISOString().split('T')[1].split('.')[0];
    const rahuEndStr = rahuEnd.toISOString().split('T')[1].split('.')[0];

    return { tithi, nakshatra: nakshatraName, yoga, karana, sunrise: sunriseStr, sunset: sunsetStr, rahuKaal: { start: rahuStartStr, end: rahuEndStr } };
  }

  calculateHoroscope(sign: string, dateStr: string): HoroscopeResult {
    const details: BirthDetails = { dateString: dateStr, timeString: '06:00:00', lat: 28.6139, lng: 77.209, timezone: 5.5 };
    const positions = jyotish.grahas.getGrahasPosition(details);

    const westernToVedic: Record<string, string> = {
      aries: 'Mesha', taurus: 'Vrishabha', gemini: 'Mithuna', cancer: 'Karka',
      leo: 'Simha', virgo: 'Kanya', libra: 'Tula', scorpio: 'Vrishchika',
      sagittarius: 'Dhanu', capricorn: 'Makara', aquarius: 'Kumbha', pisces: 'Meena',
    };
    const vedicSign = westernToVedic[sign.toLowerCase()];
    const signIndex = RASHI_NAMES.indexOf(vedicSign || '');
    if (signIndex < 0) {
      const idx = Math.abs(sign.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 12;
      const predictions = [
        'Today brings new opportunities in your career. Stay open to unexpected changes.',
        'Focus on your relationships today. A heartfelt conversation will bring clarity.',
        'Financial gains are indicated. Review your investments for long-term growth.',
        'Your creative energy is at its peak. Channel it into a passion project.',
        'Take time for self-care today. A short break will recharge your spirits.',
        'Communication flows smoothly. Perfect day for important discussions.',
        'Trust your intuition today. It will guide you toward the right decision.',
        'A pleasant surprise awaits you in the evening. Stay positive.',
        'Health needs attention. Incorporate some physical activity into your routine.',
        'Family matters come to the forefront. Your wisdom will resolve conflicts.',
        'Travel plans may materialize sooner than expected. Be prepared.',
        'Spiritual growth is highlighted. Meditation will bring inner peace.',
      ];
      const love = ['Romance blossoms today. Express your feelings openly.', 'Deepen your emotional bonds through honest communication.', 'A romantic surprise may brighten your day.', 'Venus favors love and harmony in relationships.', 'Single? Someone special may enter your life soon.'];
      const career = ['Leadership opportunities arise. Step up with confidence.', 'Collaboration with colleagues will yield great results.', 'A new project or responsibility comes your way.', 'Your hard work is about to be recognized.', 'Networking today opens future career doors.'];
      const finance = ['A positive financial trend begins today.', 'Review your budget — a saving opportunity awaits.', 'An unexpected financial gain is possible.', 'Invest wisely. Long-term gains are indicated.', 'Avoid impulsive spending. Patience brings rewards.'];
      const health = ['Prioritize rest today. Your energy needs replenishing.', 'A light workout will boost your mood and vitality.', 'Pay attention to digestion. Eat light and healthy.', 'Mental wellness matters. Take a mindfulness break.', 'Your vitality is strong. Channel it productively.'];
      const colors = ['Red', 'Yellow', 'Green', 'White', 'Orange', 'Blue', 'Pink', 'Purple', 'Silver', 'Gold'];
      const moods = ['Energetic', 'Calm', 'Focused', 'Reflective', 'Joyful', 'Determined', 'Peaceful', 'Curious', 'Ambitious', 'Grateful'];
      return {
        prediction: predictions[idx],
        lovePrediction: love[idx % love.length],
        careerPrediction: career[idx % career.length],
        financePrediction: finance[idx % finance.length],
        healthPrediction: health[idx % health.length],
        luckyNumber: Math.floor(Math.random() * 100) + 1,
        luckyColor: colors[Math.floor(Math.random() * colors.length)],
        mood: moods[Math.floor(Math.random() * moods.length)],
      };
    }

    const signLongStart = signIndex * 30;
    const signLongEnd = signLongStart + 30;

    const planetsInSign: string[] = [];
    for (const [name, data] of Object.entries(positions)) {
      if (name === 'houses') continue;
      const p = data as any;
      if (p.longitude >= signLongStart && p.longitude < signLongEnd) {
        planetsInSign.push(name);
      }
    }

    const moon = positions['Mo'] || positions['Moon'] || { longitude: 0 };
    const moonNakshatra = jyotish.nakshatras.getNakshatras(moon.longitude || 0);
    const moonRashi = jyotish.rashis.getRashi(moon.longitude || 0);
    const sunRashi = jyotish.rashis.getRashi((positions['Su'] || positions['Sun'] || { longitude: 0 }).longitude || 0);

    const nakshatraLord = NAKSHATRA_LORDS[moonNakshatra?.name || ''] || '';

    const planetCount = planetsInSign.length;
    const hasBenefic = planetsInSign.some((p) => ['Ju', 'Ve', 'Mo'].includes(p));
    const hasMalefic = planetsInSign.some((p) => ['Sa', 'Ma', 'Ra', 'Ke'].includes(p));

    const predictions: string[] = [];
    if (planetCount === 0) {
      predictions.push('The day brings a sense of calm as no major planets transit your sign.');
    } else if (hasBenefic && !hasMalefic) {
      predictions.push('Beneficial planetary influences bring positive energy and opportunities today.');
    } else if (hasMalefic && !hasBenefic) {
      predictions.push('Challenging planetary aspects may require patience and careful decision-making.');
    } else {
      predictions.push('A balanced mix of planetary energies offers both opportunities and challenges today.');
    }

    if (moonRashi?.name && RASHI_NAMES[signIndex] === moonRashi.name) {
      predictions.push('The Moon transits your sign, heightening emotional awareness and intuition.');
    }
    if (sunRashi?.name && RASHI_NAMES[signIndex] === sunRashi.name) {
      predictions.push('The Sun illuminates your sign, boosting confidence and vitality.');
    }

    if (nakshatraLord) {
      predictions.push(`The Moon is in ${moonNakshatra?.name || ''} nakshatra, ruled by ${nakshatraLord}, influencing your emotional responses.`);
    }

    const venus = positions['Ve'] || positions['Venus'] || { longitude: 0 };
    const jupiter = positions['Ju'] || positions['Jupiter'] || { longitude: 0 };
    const saturn = positions['Sa'] || positions['Saturn'] || { longitude: 0 };
    const mars = positions['Ma'] || positions['Mars'] || { longitude: 0 };
    const mercury = positions['Me'] || positions['Mercury'] || { longitude: 0 };

    const venusRashi = jyotish.rashis.getRashi(venus.longitude || 0);
    const jupiterRashi = jyotish.rashis.getRashi(jupiter.longitude || 0);
    const saturnRashi = jyotish.rashis.getRashi(saturn.longitude || 0);
    const marsRashi = jyotish.rashis.getRashi(mars.longitude || 0);
    const mercuryRashi = jyotish.rashis.getRashi(mercury.longitude || 0);

    const inSign = (rashi: any) => rashi?.name === RASHI_NAMES[signIndex];

    const lovePrediction = inSign(venusRashi)
      ? 'Venus graces your sign, bringing romance, harmony, and emotional connection.'
      : inSign(moonRashi)
        ? 'The Moon enhances your emotional sensitivity — a good day for heartfelt conversations.'
        : 'Love requires patience today. Small gestures of kindness go a long way.';

    const careerPrediction = inSign(saturnRashi)
      ? 'Saturn in your sign demands discipline and hard work — long-term rewards follow.'
      : inSign(jupiterRashi)
        ? 'Jupiter expands your career prospects. Opportunities for growth and learning arise.'
        : inSign(sunRashi)
          ? 'The Sun empowers your leadership abilities. Take initiative at work.'
          : 'Steady progress at work. Focus on completing pending tasks.';

    const financePrediction = inSign(jupiterRashi)
      ? 'Jupiter brings financial expansion. A good time for investments and planning.'
      : inSign(mercuryRashi)
        ? 'Mercury sharpens your financial acumen. Review and optimize your budget.'
        : 'Financial stability is indicated. Avoid unnecessary risks today.';

    const healthPrediction = inSign(marsRashi)
      ? 'Mars energizes your body. Channel this vitality into exercise and physical activity.'
      : inSign(sunRashi)
        ? 'The Sun boosts your vitality. A great day for health routines and wellness.'
        : inSign(moonRashi)
          ? 'The Moon influences your emotions — stress may affect your health. Rest and relax.'
          : 'Maintain your routine. Moderate exercise and a balanced diet keep you strong.';

    const luckyNumber = ((signIndex + 1) * 7 + new Date(dateStr).getDate()) % 100 + 1;
    const luckyColor = ['Red', 'Yellow', 'Green', 'White', 'Orange', 'Blue', 'Pink', 'Purple', 'Silver', 'Gold', 'Brown', 'Cream'][signIndex];
    const mood = ['Energetic', 'Calm', 'Focused', 'Reflective', 'Joyful', 'Determined', 'Peaceful', 'Curious', 'Ambitious', 'Grateful', 'Hopeful', 'Bold'][signIndex];

    return {
      prediction: predictions.join(' '),
      lovePrediction,
      careerPrediction,
      financePrediction,
      healthPrediction,
      luckyNumber,
      luckyColor,
      mood,
    };
  }
}
