import { useState } from 'react';
import { CalendarDays, MapPin, Navigation } from 'lucide-react';
import { EGYPT_GOVERNORATES } from '../data/egyptGovernorates';
import {
  formatDurationArabic,
  formatHijriDateAr,
  formatShortDateAr,
  formatTimeAr,
} from '../lib/prayerTimes';
import { getPrayerStatus } from '../lib/reminderEngine';
import type { DailySchedule, DayLog, ReminderSettings } from '../types/prayer';

interface EgyptScheduleTableProps {
  now: number;
  todaySchedule: DailySchedule;
  monthSchedules: DailySchedule[];
  todayLog: DayLog;
  settings: ReminderSettings;
  locationLabel: string;
  onChangeGovernorate: (govId: string) => void;
  onDetectGps: () => void;
  gpsStatus: string | null;
}

export function EgyptScheduleTable({
  now,
  todaySchedule,
  monthSchedules,
  todayLog,
  settings,
  locationLabel,
  onChangeGovernorate,
  onDetectGps,
  gpsStatus,
}: EgyptScheduleTableProps) {
  const [rangeMode, setRangeMode] = useState<'7days' | '30days'>('7days');
  const displayedDays = rangeMode === '7days' ? monthSchedules.slice(0, 7) : monthSchedules;

  const todayRows = [
    {
      key: 'fajr',
      name: 'الفجر',
      time: todaySchedule.prayers[0].startTime,
      status: getPrayerStatus(todaySchedule.prayers[0], todayLog.fajr, now),
      isPrayer: true,
    },
    {
      key: 'sunrise',
      name: 'الشروق',
      time: todaySchedule.sunrise,
      status: now < todaySchedule.sunrise ? ('upcoming' as const) : ('passed' as const),
      isPrayer: false,
    },
    {
      key: 'dhuhr',
      name: 'الظهر',
      time: todaySchedule.prayers[1].startTime,
      status: getPrayerStatus(todaySchedule.prayers[1], todayLog.dhuhr, now),
      isPrayer: true,
    },
    {
      key: 'asr',
      name: 'العصر',
      time: todaySchedule.prayers[2].startTime,
      status: getPrayerStatus(todaySchedule.prayers[2], todayLog.asr, now),
      isPrayer: true,
    },
    {
      key: 'maghrib',
      name: 'المغرب',
      time: todaySchedule.prayers[3].startTime,
      status: getPrayerStatus(todaySchedule.prayers[3], todayLog.maghrib, now),
      isPrayer: true,
    },
    {
      key: 'isha',
      name: 'العشاء',
      time: todaySchedule.prayers[4].startTime,
      status: getPrayerStatus(todaySchedule.prayers[4], todayLog.isha, now),
      isPrayer: true,
    },
  ];

  return (
    <section className="space-y-4">
      {/* Governorate quick picker */}
      <div className="surface-card rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-black">جدول مواعيد الصلاة في مصر</h2>
            <p className="text-[11px] text-[var(--text-secondary)]">
              حسب توقيت الهيئة المصرية العامة للمساحة • {locationLabel}
            </p>
          </div>
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
            <CalendarDays className="h-5 w-5" />
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <MapPin className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400" />
            <select
              aria-label="اختر المحافظة"
              value={settings.customLocation ? '__gps__' : settings.governorateId}
              onChange={(e) => {
                if (e.target.value !== '__gps__') {
                  onChangeGovernorate(e.target.value);
                }
              }}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-input)] py-2.5 pr-9 pl-3 text-xs font-bold text-[var(--text-primary)] outline-none focus:border-emerald-500"
            >
              {settings.customLocation && (
                <option value="__gps__">{settings.customLocation.labelAr}</option>
              )}
              {EGYPT_GOVERNORATES.map((gov) => (
                <option key={gov.id} value={gov.id}>
                  {gov.nameAr} — {gov.regionAr}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onDetectGps}
            className="inline-flex items-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-xs font-bold text-emerald-400 transition active:scale-95"
          >
            <Navigation className="h-3.5 w-3.5" />
            GPS
          </button>
        </div>

        {gpsStatus && <p className="text-[11px] text-amber-400">{gpsStatus}</p>}
      </div>

      {/* Today's full table: الصلاة | امتي | فاضل قد ايه */}
      <div className="surface-card overflow-hidden rounded-2xl">
        <div className="border-b border-[var(--border-subtle)] px-4 py-3">
          <h3 className="text-sm font-extrabold">مواقيت اليوم بالتفصيل</h3>
          <p className="text-[11px] text-[var(--text-secondary)]">
            يوضح وقت كل صلاة والوقت المتبقي عليها الآن
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-card-elevated)] text-[var(--text-secondary)]">
                <th className="px-3.5 py-2.5 font-bold">الصلاة</th>
                <th className="px-3 py-2.5 font-bold">الموعد (امتي)</th>
                <th className="px-3 py-2.5 font-bold">فاضل قد ايه</th>
                <th className="px-3.5 py-2.5 font-bold">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {todayRows.map((row) => {
                const diff = row.time - now;
                const remainingText =
                  diff > 0
                    ? `بعد ${formatDurationArabic(diff)}`
                    : `منذ ${formatDurationArabic(Math.abs(diff))}`;

                let statusBadge = 'قادمة';
                let badgeClass = 'bg-slate-500/15 text-[var(--text-secondary)]';
                if (!row.isPrayer) {
                  statusBadge = diff > 0 ? 'شروق' : 'انتهى';
                  badgeClass = 'bg-amber-500/10 text-amber-400';
                } else if (row.status === 'prayed') {
                  statusBadge = 'تمت ✓';
                  badgeClass = 'bg-emerald-500/20 text-emerald-400';
                } else if (row.status === 'due') {
                  statusBadge = 'وقتها الآن';
                  badgeClass = 'bg-emerald-500/20 text-emerald-300';
                } else if (row.status === 'overdue') {
                  statusBadge = 'فات وقتها';
                  badgeClass = 'bg-rose-500/20 text-rose-300';
                }

                return (
                  <tr key={row.key} className="hover:bg-white/[0.02]">
                    <td className="px-3.5 py-3 font-extrabold">{row.name}</td>
                    <td className="tabular-nums px-3 py-3 font-bold text-emerald-400">
                      {formatTimeAr(row.time)}
                    </td>
                    <td className="tabular-nums px-3 py-3 text-[var(--text-secondary)]">
                      {remainingText}
                    </td>
                    <td className="px-3.5 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${badgeClass}`}
                      >
                        {statusBadge}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Multi-day / Monthly Egypt Schedule Table */}
      <div className="surface-card overflow-hidden rounded-2xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-4 py-3">
          <div>
            <h3 className="text-sm font-extrabold">جدول الأيام القادمة</h3>
            <p className="text-[11px] text-[var(--text-secondary)]">
              مواعيد الصلوات في {locationLabel}
            </p>
          </div>
          <div className="inline-flex rounded-xl bg-[var(--bg-input)] p-1 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setRangeMode('7days')}
              className={`rounded-lg px-2.5 py-1 transition ${
                rangeMode === '7days'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              ٧ أيام
            </button>
            <button
              type="button"
              onClick={() => setRangeMode('30days')}
              className={`rounded-lg px-2.5 py-1 transition ${
                rangeMode === '30days'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              ٣٠ يوم
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px] text-right text-[11px]">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-card-elevated)] text-[var(--text-secondary)]">
                <th className="px-3 py-2.5 font-bold">التاريخ</th>
                <th className="px-2 py-2.5 font-bold">الفجر</th>
                <th className="px-2 py-2.5 font-bold">الشروق</th>
                <th className="px-2 py-2.5 font-bold">الظهر</th>
                <th className="px-2 py-2.5 font-bold">العصر</th>
                <th className="px-2 py-2.5 font-bold">المغرب</th>
                <th className="px-2 py-2.5 font-bold">العشاء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {displayedDays.map((day, idx) => {
                const isToday = idx === 0;
                const hijri = formatHijriDateAr(day.date);
                return (
                  <tr
                    key={day.dateKey}
                    className={isToday ? 'bg-emerald-500/10 font-bold' : ''}
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span>{formatShortDateAr(day.date)}</span>
                        {isToday && (
                          <span className="rounded bg-emerald-500 px-1.5 py-0.5 text-[9px] font-black text-slate-950">
                            اليوم
                          </span>
                        )}
                      </div>
                      {hijri && (
                        <div className="text-[10px] font-normal text-[var(--text-muted)]">
                          {hijri}
                        </div>
                      )}
                    </td>
                    <td className="tabular-nums px-2 py-2.5">{formatTimeAr(day.prayers[0].startTime)}</td>
                    <td className="tabular-nums px-2 py-2.5 text-amber-400/90">
                      {formatTimeAr(day.sunrise)}
                    </td>
                    <td className="tabular-nums px-2 py-2.5">{formatTimeAr(day.prayers[1].startTime)}</td>
                    <td className="tabular-nums px-2 py-2.5">{formatTimeAr(day.prayers[2].startTime)}</td>
                    <td className="tabular-nums px-2 py-2.5">{formatTimeAr(day.prayers[3].startTime)}</td>
                    <td className="tabular-nums px-2 py-2.5">{formatTimeAr(day.prayers[4].startTime)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
