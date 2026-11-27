import { describe, expect, it } from 'vitest';
import { EGYPT_GOVERNORATES } from '../data/egyptGovernorates';
import {
  calculateDailySchedule,
  calculateMultiDaySchedule,
  formatCountdownHMS,
  formatTimeAr,
  getNextPrayerInfo,
} from '../lib/prayerTimes';
import { DEFAULT_SETTINGS } from '../lib/storage';

describe('Egypt prayer times calculation', () => {
  it('calculates strictly ordered prayer times for Cairo using Egyptian Survey Authority', () => {
    const date = new Date(2026, 10, 27, 12, 0, 0); // Nov 27, 2026
    const schedule = calculateDailySchedule(date, DEFAULT_SETTINGS);

    expect(schedule.prayers).toHaveLength(5);
    const [fajr, dhuhr, asr, maghrib, isha] = schedule.prayers;

    expect(fajr.startTime).toBeLessThan(schedule.sunrise);
    expect(schedule.sunrise).toBeLessThan(dhuhr.startTime);
    expect(dhuhr.startTime).toBeLessThan(asr.startTime);
    expect(asr.startTime).toBeLessThan(maghrib.startTime);
    expect(maghrib.startTime).toBeLessThan(isha.startTime);
    expect(isha.startTime).toBeLessThan(schedule.nextDayFajr);

    // Verify end times match the Egyptian prayer window boundaries
    expect(fajr.endTime).toBe(schedule.sunrise);
    expect(dhuhr.endTime).toBe(asr.startTime);
    expect(asr.endTime).toBe(maghrib.startTime);
    expect(maghrib.endTime).toBe(isha.startTime);
    expect(isha.endTime).toBe(schedule.nextDayFajr);
  });

  it('includes all 27 Egyptian governorates', () => {
    expect(EGYPT_GOVERNORATES).toHaveLength(27);
    expect(EGYPT_GOVERNORATES[0].id).toBe('cairo');
  });

  it('applies per-prayer minute offsets accurately', () => {
    const date = new Date(2026, 10, 27);
    const base = calculateDailySchedule(date, DEFAULT_SETTINGS);
    const shifted = calculateDailySchedule(date, {
      ...DEFAULT_SETTINGS,
      offsets: { ...DEFAULT_SETTINGS.offsets, dhuhr: 5, maghrib: -3 },
    });

    expect(shifted.prayers[1].startTime - base.prayers[1].startTime).toBe(5 * 60_000);
    expect(shifted.prayers[3].startTime - base.prayers[3].startTime).toBe(-3 * 60_000);
  });

  it('generates multi-day Egypt schedule tables and computes next prayer across midnight', () => {
    const date = new Date(2026, 10, 27);
    const days = calculateMultiDaySchedule(date, 7, DEFAULT_SETTINGS);
    expect(days).toHaveLength(7);

    const today = days[0];
    // Mid-day: right before Asr
    const asr = today.prayers[2];
    const beforeAsr = asr.startTime - 10 * 60_000;
    const nextMidday = getNextPrayerInfo(today, beforeAsr);
    expect(nextMidday.id).toBe('asr');
    expect(nextMidday.isTomorrow).toBe(false);
    expect(nextMidday.remainingMs).toBe(10 * 60_000);
    expect(formatCountdownHMS(nextMidday.remainingMs)).toBe('00:10:00');

    // After Isha: rolls to tomorrow's Fajr
    const isha = today.prayers[4];
    const afterIsha = isha.startTime + 30 * 60_000;
    const nextTomorrow = getNextPrayerInfo(today, afterIsha);
    expect(nextTomorrow.id).toBe('fajr');
    expect(nextTomorrow.isTomorrow).toBe(true);
    expect(nextTomorrow.startTime).toBe(today.nextDayFajr);
    expect(formatTimeAr(isha.startTime)).toMatch(/م$/);
  });
});
