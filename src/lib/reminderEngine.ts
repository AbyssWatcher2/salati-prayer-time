import { PRAYER_ORDER, getDateKey } from './prayerTimes';
import type {
  DailySchedule,
  DayLog,
  LogsByDate,
  PrayerId,
  PrayerRecord,
  PrayerScheduleItem,
  PrayerStatus,
  ReminderSettings,
} from '../types/prayer';

export function createEmptyPrayerRecord(): PrayerRecord {
  return {
    prayed: false,
    reminderCount: 0,
  };
}

export function createEmptyDayLog(): DayLog {
  return {
    fajr: createEmptyPrayerRecord(),
    dhuhr: createEmptyPrayerRecord(),
    asr: createEmptyPrayerRecord(),
    maghrib: createEmptyPrayerRecord(),
    isha: createEmptyPrayerRecord(),
  };
}

export function ensureDayLog(dayLog?: Partial<DayLog>): DayLog {
  const base = createEmptyDayLog();
  if (!dayLog) return base;
  for (const id of PRAYER_ORDER) {
    if (dayLog[id]) {
      base[id] = {
        ...createEmptyPrayerRecord(),
        ...dayLog[id],
      };
    }
  }
  return base;
}

export function getPrayerStatus(
  prayer: PrayerScheduleItem,
  record: PrayerRecord | undefined,
  now: number,
): PrayerStatus {
  if (record?.prayed) {
    return 'prayed';
  }
  if (now < prayer.startTime) {
    return 'upcoming';
  }
  if (now < prayer.endTime) {
    return 'due';
  }
  return 'overdue';
}

export function getNextReminderAt(
  prayer: PrayerScheduleItem,
  record: PrayerRecord | undefined,
  settings: Pick<ReminderSettings, 'reminderIntervalMinutes' | 'continueAfterEnd'>,
): number | null {
  if (record?.prayed) {
    return null;
  }

  if (
    !settings.continueAfterEnd &&
    record?.lastRemindedAt !== undefined &&
    record.lastRemindedAt >= prayer.endTime
  ) {
    return null;
  }

  const intervalMs = Math.max(1, settings.reminderIntervalMinutes) * 60_000;
  const snoozedUntil = record?.snoozedUntil ?? 0;

  if (record?.lastRemindedAt === undefined) {
    return Math.max(prayer.startTime, snoozedUntil);
  }

  const nextScheduled = record.lastRemindedAt + intervalMs;
  if (!settings.continueAfterEnd && nextScheduled >= prayer.endTime && record.lastRemindedAt >= prayer.startTime) {
    return null;
  }

  return Math.max(nextScheduled, snoozedUntil);
}

export interface EvaluatedPrayer extends PrayerScheduleItem {
  status: PrayerStatus;
  record: PrayerRecord;
  nextReminderAt: number | null;
}

export interface ReminderEvaluation {
  duePrayers: EvaluatedPrayer[];
  pendingPrayers: EvaluatedPrayer[];
  nextUpcomingReminderAt: number | null;
}

export function evaluateReminders(
  schedule: DailySchedule,
  dayLog: DayLog | undefined,
  now: number,
  settings: Pick<ReminderSettings, 'reminderIntervalMinutes' | 'continueAfterEnd'>,
): ReminderEvaluation {
  const log = ensureDayLog(dayLog);
  const duePrayers: EvaluatedPrayer[] = [];
  const pendingPrayers: EvaluatedPrayer[] = [];
  let nextUpcomingReminderAt: number | null = null;

  for (const prayer of schedule.prayers) {
    const record = log[prayer.id];
    const status = getPrayerStatus(prayer, record, now);
    const nextReminderAt = getNextReminderAt(prayer, record, settings);

    const item: EvaluatedPrayer = {
      ...prayer,
      status,
      record,
      nextReminderAt,
    };

    if (status === 'due' || status === 'overdue') {
      pendingPrayers.push(item);
      if (nextReminderAt !== null && now >= nextReminderAt) {
        duePrayers.push(item);
      }
    }

    if (nextReminderAt !== null && nextReminderAt > now) {
      if (nextUpcomingReminderAt === null || nextReminderAt < nextUpcomingReminderAt) {
        nextUpcomingReminderAt = nextReminderAt;
      }
    }
  }

  return {
    duePrayers,
    pendingPrayers,
    nextUpcomingReminderAt,
  };
}

export function markPrayerPrayed(
  dayLog: DayLog | undefined,
  prayerId: PrayerId,
  now: number,
  prayerEndTime: number,
): DayLog {
  const nextLog = ensureDayLog(dayLog);
  const existing = nextLog[prayerId];
  nextLog[prayerId] = {
    ...existing,
    prayed: true,
    prayedAt: now,
    statusWhenPrayed: now < prayerEndTime ? 'on-time' : 'late',
    snoozedUntil: undefined,
  };
  return nextLog;
}

export function unmarkPrayerPrayed(dayLog: DayLog | undefined, prayerId: PrayerId): DayLog {
  const nextLog = ensureDayLog(dayLog);
  const existing = nextLog[prayerId];
  nextLog[prayerId] = {
    ...existing,
    prayed: false,
    prayedAt: undefined,
    statusWhenPrayed: undefined,
    lastRemindedAt: undefined,
    snoozedUntil: undefined,
  };
  return nextLog;
}

export function snoozePrayers(
  dayLog: DayLog | undefined,
  prayerIds: PrayerId[],
  now: number,
  minutes: number,
): DayLog {
  const nextLog = ensureDayLog(dayLog);
  const snoozedUntil = now + Math.max(1, minutes) * 60_000;
  for (const id of prayerIds) {
    const existing = nextLog[id];
    if (!existing.prayed) {
      nextLog[id] = {
        ...existing,
        snoozedUntil,
        lastRemindedAt: now,
      };
    }
  }
  return nextLog;
}

export function recordReminderFired(
  dayLog: DayLog | undefined,
  prayerIds: PrayerId[],
  now: number,
): DayLog {
  const nextLog = ensureDayLog(dayLog);
  for (const id of prayerIds) {
    const existing = nextLog[id];
    if (!existing.prayed) {
      nextLog[id] = {
        ...existing,
        lastRemindedAt: now,
        reminderCount: (existing.reminderCount ?? 0) + 1,
        snoozedUntil:
          existing.snoozedUntil && existing.snoozedUntil > now ? existing.snoozedUntil : undefined,
      };
    }
  }
  return nextLog;
}

export function dismissCarryoverPrayer(dayLog: DayLog | undefined, prayerId: PrayerId): DayLog {
  const nextLog = ensureDayLog(dayLog);
  nextLog[prayerId] = {
    ...nextLog[prayerId],
    dismissedCarryover: true,
  };
  return nextLog;
}

export function isDayComplete(dayLog: DayLog | undefined): boolean {
  if (!dayLog) return false;
  return PRAYER_ORDER.every((id) => Boolean(dayLog[id]?.prayed));
}

export function countPrayedInDay(dayLog: DayLog | undefined): number {
  if (!dayLog) return 0;
  return PRAYER_ORDER.filter((id) => Boolean(dayLog[id]?.prayed)).length;
}

function shiftDateKey(dateKey: string, deltaDays: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d + deltaDays);
  return getDateKey(date);
}

export function calculateStreak(logsByDate: LogsByDate, todayKey: string): number {
  let streak = 0;
  let cursor = todayKey;

  if (isDayComplete(logsByDate[cursor])) {
    streak += 1;
    cursor = shiftDateKey(cursor, -1);
  } else {
    cursor = shiftDateKey(cursor, -1);
  }

  while (isDayComplete(logsByDate[cursor])) {
    streak += 1;
    cursor = shiftDateKey(cursor, -1);
  }

  return streak;
}
