import { CalculationMethod, Coordinates, Madhab, PrayerTimes } from 'adhan';
import { getGovernorateById } from '../data/egyptGovernorates';
import type {
  DailySchedule,
  NextPrayerInfo,
  PrayerId,
  PrayerScheduleItem,
  ReminderSettings,
} from '../types/prayer';

export const PRAYER_ORDER: PrayerId[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export const PRAYER_NAMES_AR: Record<PrayerId, string> = {
  fajr: 'الفجر',
  dhuhr: 'الظهر',
  asr: 'العصر',
  maghrib: 'المغرب',
  isha: 'العشاء',
};

export function getDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getPreviousDateKey(date: Date): string {
  const prev = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
  return getDateKey(prev);
}

export function resolveCoordinates(settings: Pick<ReminderSettings, 'governorateId' | 'customLocation'>): {
  latitude: number;
  longitude: number;
  labelAr: string;
} {
  if (settings.customLocation) {
    return settings.customLocation;
  }
  const gov = getGovernorateById(settings.governorateId);
  return {
    latitude: gov.latitude,
    longitude: gov.longitude,
    labelAr: gov.nameAr,
  };
}

function buildAdhanParams(settings: Pick<ReminderSettings, 'asrMadhab' | 'offsets'>) {
  const params = CalculationMethod.Egyptian();
  params.madhab = settings.asrMadhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  params.adjustments.fajr = settings.offsets.fajr ?? 0;
  params.adjustments.dhuhr = settings.offsets.dhuhr ?? 0;
  params.adjustments.asr = settings.offsets.asr ?? 0;
  params.adjustments.maghrib = settings.offsets.maghrib ?? 0;
  params.adjustments.isha = settings.offsets.isha ?? 0;
  return params;
}

export function calculateDailySchedule(
  date: Date,
  settings: Pick<ReminderSettings, 'governorateId' | 'customLocation' | 'asrMadhab' | 'offsets'>,
): DailySchedule {
  const dayDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const nextDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  const loc = resolveCoordinates(settings);
  const coords = new Coordinates(loc.latitude, loc.longitude);
  const params = buildAdhanParams(settings);

  const todayTimes = new PrayerTimes(coords, dayDate, params);
  const tomorrowTimes = new PrayerTimes(coords, nextDate, params);

  const fajr = todayTimes.fajr.getTime();
  const sunrise = todayTimes.sunrise.getTime();
  const dhuhr = todayTimes.dhuhr.getTime();
  const asr = todayTimes.asr.getTime();
  const maghrib = todayTimes.maghrib.getTime();
  const isha = todayTimes.isha.getTime();
  const nextDayFajr = tomorrowTimes.fajr.getTime();

  const prayers: PrayerScheduleItem[] = [
    { id: 'fajr', arabicName: PRAYER_NAMES_AR.fajr, startTime: fajr, endTime: sunrise },
    { id: 'dhuhr', arabicName: PRAYER_NAMES_AR.dhuhr, startTime: dhuhr, endTime: asr },
    { id: 'asr', arabicName: PRAYER_NAMES_AR.asr, startTime: asr, endTime: maghrib },
    { id: 'maghrib', arabicName: PRAYER_NAMES_AR.maghrib, startTime: maghrib, endTime: isha },
    { id: 'isha', arabicName: PRAYER_NAMES_AR.isha, startTime: isha, endTime: nextDayFajr },
  ];

  return {
    dateKey: getDateKey(dayDate),
    date: dayDate,
    sunrise,
    prayers,
    nextDayFajr,
  };
}

export function calculateMultiDaySchedule(
  startDate: Date,
  daysCount: number,
  settings: Pick<ReminderSettings, 'governorateId' | 'customLocation' | 'asrMadhab' | 'offsets'>,
): DailySchedule[] {
  const list: DailySchedule[] = [];
  for (let i = 0; i < daysCount; i += 1) {
    const d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
    list.push(calculateDailySchedule(d, settings));
  }
  return list;
}

export function getNextPrayerInfo(schedule: DailySchedule, now: number): NextPrayerInfo {
  for (let i = 0; i < schedule.prayers.length; i += 1) {
    const p = schedule.prayers[i];
    if (now < p.startTime) {
      const prevStart =
        i === 0
          ? new Date(
              schedule.date.getFullYear(),
              schedule.date.getMonth(),
              schedule.date.getDate(),
              0,
              0,
              0,
            ).getTime()
          : schedule.prayers[i - 1].startTime;
      const totalSpan = Math.max(1, p.startTime - prevStart);
      const elapsed = Math.max(0, now - prevStart);
      const progressPercent = Math.min(100, Math.max(0, (elapsed / totalSpan) * 100));

      return {
        id: p.id,
        arabicName: p.arabicName,
        startTime: p.startTime,
        remainingMs: p.startTime - now,
        isTomorrow: false,
        progressPercent,
      };
    }
  }

  const ishaStart = schedule.prayers[schedule.prayers.length - 1].startTime;
  const totalSpan = Math.max(1, schedule.nextDayFajr - ishaStart);
  const elapsed = Math.max(0, now - ishaStart);

  return {
    id: 'fajr',
    arabicName: PRAYER_NAMES_AR.fajr,
    startTime: schedule.nextDayFajr,
    remainingMs: Math.max(0, schedule.nextDayFajr - now),
    isTomorrow: true,
    progressPercent: Math.min(100, Math.max(0, (elapsed / totalSpan) * 100)),
  };
}

export function formatTimeAr(timestamp: number): string {
  const d = new Date(timestamp);
  const hours24 = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const period = hours24 >= 12 ? 'م' : 'ص';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${String(hours12).padStart(2, '0')}:${minutes} ${period}`;
}

export function formatClockWithSecondsAr(timestamp: number): {
  time: string;
  period: string;
} {
  const d = new Date(timestamp);
  const hours24 = d.getHours();
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  const period = hours24 >= 12 ? 'مساءً' : 'صباحاً';
  return {
    time: `${String(hours12).padStart(2, '0')}:${minutes}:${seconds}`,
    period,
  };
}

export function formatCountdownHMS(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatShortMMSS(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatDurationArabic(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60_000));
  if (totalMinutes < 1) {
    const secs = Math.max(1, Math.floor(ms / 1000));
    return `${secs} ث`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours === 0) {
    return `${mins} دقيقة`;
  }
  if (mins === 0) {
    return `${hours} ساعة`;
  }
  return `${hours} س ${mins} د`;
}

export function formatGregorianDateAr(date: Date): string {
  try {
    return new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return date.toLocaleDateString('ar-EG');
  }
}

export function formatShortDateAr(date: Date): string {
  try {
    return new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(date);
  } catch {
    return getDateKey(date);
  }
}

export function formatHijriDateAr(date: Date): string {
  try {
    return new Intl.DateTimeFormat('ar-EG-u-ca-islamic-umalqura-nu-latn', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    try {
      return new Intl.DateTimeFormat('ar-EG-u-ca-islamic-nu-latn', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(date);
    } catch {
      return '';
    }
  }
}
