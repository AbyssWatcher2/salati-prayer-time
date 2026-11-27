import { describe, expect, it } from 'vitest';
import { calculateDailySchedule } from '../lib/prayerTimes';
import {
  calculateStreak,
  createEmptyDayLog,
  evaluateReminders,
  getPrayerStatus,
  markPrayerPrayed,
  recordReminderFired,
  snoozePrayers,
  unmarkPrayerPrayed,
} from '../lib/reminderEngine';
import { DEFAULT_SETTINGS } from '../lib/storage';
import type { LogsByDate } from '../types/prayer';

describe('Persistent every-15-minute prayer reminder engine', () => {
  const schedule = calculateDailySchedule(new Date(2026, 10, 27), DEFAULT_SETTINGS);
  const dhuhr = schedule.prayers[1];
  const asr = schedule.prayers[2];

  it('does not trigger for upcoming prayers before startTime', () => {
    const log = createEmptyDayLog();
    const beforeDhuhr = dhuhr.startTime - 60_000;
    expect(getPrayerStatus(dhuhr, log.dhuhr, beforeDhuhr)).toBe('upcoming');

    const res = evaluateReminders(schedule, log, beforeDhuhr, DEFAULT_SETTINGS);
    expect(res.duePrayers.map((p) => p.id)).not.toContain('dhuhr');
  });

  it('fires at startTime and keeps firing every 15 minutes even AFTER prayer endTime when not prayed', () => {
    let log = createEmptyDayLog();
    const t0 = dhuhr.startTime;

    // Fires immediately at Adhan
    let evalRes = evaluateReminders(schedule, log, t0, DEFAULT_SETTINGS);
    expect(evalRes.duePrayers.some((p) => p.id === 'dhuhr')).toBe(true);

    log = recordReminderFired(log, ['dhuhr'], t0);

    // 10 minutes later: should NOT fire yet
    evalRes = evaluateReminders(schedule, log, t0 + 10 * 60_000, DEFAULT_SETTINGS);
    expect(evalRes.duePrayers.some((p) => p.id === 'dhuhr')).toBe(false);

    // 15 minutes later: fires again
    const t1 = t0 + 15 * 60_000;
    evalRes = evaluateReminders(schedule, log, t1, DEFAULT_SETTINGS);
    expect(evalRes.duePrayers.some((p) => p.id === 'dhuhr')).toBe(true);
    log = recordReminderFired(log, ['dhuhr'], t1);

    // Jump PAST Dhuhr's endTime (when Asr has already started, so Dhuhr is overdue)
    const pastEnd = dhuhr.endTime + 20 * 60_000;
    expect(getPrayerStatus(dhuhr, log.dhuhr, pastEnd)).toBe('overdue');

    evalRes = evaluateReminders(schedule, log, pastEnd, DEFAULT_SETTINGS);
    expect(evalRes.duePrayers.some((p) => p.id === 'dhuhr')).toBe(true);
    expect(evalRes.duePrayers.some((p) => p.id === 'asr')).toBe(true);

    // Record fired at pastEnd, then check +15m later still fires for overdue Dhuhr
    log = recordReminderFired(log, ['dhuhr', 'asr'], pastEnd);
    evalRes = evaluateReminders(schedule, log, pastEnd + 15 * 60_000, DEFAULT_SETTINGS);
    expect(evalRes.duePrayers.some((p) => p.id === 'dhuhr')).toBe(true);
    expect(evalRes.duePrayers.find((p) => p.id === 'dhuhr')?.status).toBe('overdue');
  });

  it('stops all reminders immediately when user checks "صليت" and records on-time vs late', () => {
    let log = createEmptyDayLog();
    // Mark Fajr after Sunrise (late)
    const fajr = schedule.prayers[0];
    log = markPrayerPrayed(log, 'fajr', fajr.endTime + 10 * 60_000, fajr.endTime);
    expect(log.fajr.prayed).toBe(true);
    expect(log.fajr.statusWhenPrayed).toBe('late');

    // Mark Dhuhr before Asr (on-time)
    log = markPrayerPrayed(log, 'dhuhr', dhuhr.startTime + 5 * 60_000, dhuhr.endTime);
    expect(log.dhuhr.prayed).toBe(true);
    expect(log.dhuhr.statusWhenPrayed).toBe('on-time');

    const evalRes = evaluateReminders(schedule, log, asr.startTime + 30 * 60_000, DEFAULT_SETTINGS);
    expect(evalRes.duePrayers.map((p) => p.id)).not.toContain('fajr');
    expect(evalRes.duePrayers.map((p) => p.id)).not.toContain('dhuhr');
    expect(evalRes.pendingPrayers.map((p) => p.id)).not.toContain('dhuhr');

    // Unmarking resumes reminders cleanly
    log = unmarkPrayerPrayed(log, 'dhuhr');
    expect(log.dhuhr.prayed).toBe(false);
    const afterUnmark = evaluateReminders(schedule, log, asr.startTime + 30 * 60_000, DEFAULT_SETTINGS);
    expect(afterUnmark.duePrayers.map((p) => p.id)).toContain('dhuhr');
  });

  it('delays reminder by exact snooze duration', () => {
    let log = createEmptyDayLog();
    const now = dhuhr.startTime + 5 * 60_000;
    log = snoozePrayers(log, ['dhuhr'], now, 15);

    const at14Min = evaluateReminders(schedule, log, now + 14 * 60_000, DEFAULT_SETTINGS);
    expect(at14Min.duePrayers.some((p) => p.id === 'dhuhr')).toBe(false);

    const at15Min = evaluateReminders(schedule, log, now + 15 * 60_000, DEFAULT_SETTINGS);
    expect(at15Min.duePrayers.some((p) => p.id === 'dhuhr')).toBe(true);
  });

  it('respects continueAfterEnd=false when configured', () => {
    let log = createEmptyDayLog();
    log = recordReminderFired(log, ['dhuhr'], dhuhr.endTime + 1000);
    const evalRes = evaluateReminders(schedule, log, dhuhr.endTime + 20 * 60_000, {
      reminderIntervalMinutes: 15,
      continueAfterEnd: false,
    });
    expect(evalRes.duePrayers.some((p) => p.id === 'dhuhr')).toBe(false);
  });

  it('calculates multi-day completion streaks properly', () => {
    const completeDay = () => {
      let day = createEmptyDayLog();
      for (const p of schedule.prayers) {
        day = markPrayerPrayed(day, p.id, p.startTime + 60_000, p.endTime);
      }
      return day;
    };

    const logs: LogsByDate = {
      '2026-11-24': createEmptyDayLog(),
      '2026-11-25': completeDay(),
      '2026-11-26': completeDay(),
      '2026-11-27': createEmptyDayLog(), // today incomplete yet
    };

    expect(calculateStreak(logs, '2026-11-27')).toBe(2);

    logs['2026-11-27'] = completeDay();
    expect(calculateStreak(logs, '2026-11-27')).toBe(3);
  });
});
