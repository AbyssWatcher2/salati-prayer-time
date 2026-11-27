import { Bell, Check, CheckCircle2, Clock, RotateCcw, Sun, X } from 'lucide-react';
import {
  formatDurationArabic,
  formatShortMMSS,
  formatTimeAr,
} from '../lib/prayerTimes';
import { getNextReminderAt, getPrayerStatus } from '../lib/reminderEngine';
import type {
  DailySchedule,
  DayLog,
  PrayerId,
  PrayerScheduleItem,
  ReminderSettings,
} from '../types/prayer';

interface PrayerChecklistProps {
  now: number;
  schedule: DailySchedule;
  dayLog: DayLog;
  settings: ReminderSettings;
  yesterdayUnprayed: PrayerScheduleItem[];
  onTogglePrayer: (id: PrayerId) => void;
  onMarkYesterdayPrayer: (id: PrayerId) => void;
  onDismissYesterdayPrayer: (id: PrayerId) => void;
}

export function PrayerChecklist({
  now,
  schedule,
  dayLog,
  settings,
  yesterdayUnprayed,
  onTogglePrayer,
  onMarkYesterdayPrayer,
  onDismissYesterdayPrayer,
}: PrayerChecklistProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-base font-black">قائمة صلوات اليوم (Checklist)</h2>
          <p className="text-xs text-[var(--text-secondary)]">
            اضغط «صليت» لإيقاف التذكير كل {settings.reminderIntervalMinutes} دقيقة عن الصلاة
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        {schedule.prayers.map((prayer) => {
          const record = dayLog[prayer.id];
          const status = getPrayerStatus(prayer, record, now);
          const nextReminderAt = getNextReminderAt(prayer, record, settings);
          const nextReminderRemainingMs =
            nextReminderAt !== null ? Math.max(0, nextReminderAt - now) : null;

          const isPrayed = status === 'prayed';
          const isDue = status === 'due';
          const isOverdue = status === 'overdue';
          const isUpcoming = status === 'upcoming';

          return (
            <div key={prayer.id} className="space-y-2.5">
              <div
                className={`surface-card rounded-2xl p-3.5 transition-all ${
                  isPrayed
                    ? 'border-emerald-500/35 bg-emerald-950/15'
                    : isOverdue
                      ? 'border-amber-500/50'
                      : isDue
                        ? 'border-emerald-400/60'
                        : ''
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Left/Right Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-base font-extrabold ${
                          isPrayed ? 'text-emerald-400' : ''
                        }`}
                      >
                        {prayer.arabicName}
                      </span>

                      {isPrayed && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-400">
                          <Check className="h-3 w-3" />
                          {record.statusWhenPrayed === 'late' ? 'تمّت (قضاء)' : 'تمّت في وقتها'}
                        </span>
                      )}

                      {isDue && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
                          <Bell className="h-3 w-3" />
                          حان وقتها — لم تُصلَّ
                        </span>
                      )}

                      {isOverdue && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold text-amber-400">
                          فات وقتها — مستمر التذكير
                        </span>
                      )}

                      {isUpcoming && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/15 px-2 py-0.5 text-[11px] font-semibold text-[var(--text-secondary)]">
                          فاضل {formatDurationArabic(prayer.startTime - now)}
                        </span>
                      )}
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-secondary)]">
                      <span>
                        الأذان:{' '}
                        <strong className="tabular-nums text-[var(--text-primary)]">
                          {formatTimeAr(prayer.startTime)}
                        </strong>
                      </span>
                      <span>
                        ينتهي:{' '}
                        <span className="tabular-nums">{formatTimeAr(prayer.endTime)}</span>
                      </span>
                    </div>

                    {/* Dynamic sub-line */}
                    {isPrayed && record.prayedAt ? (
                      <p className="mt-1 text-[11px] font-medium text-emerald-400/90">
                        صليتها الساعة <span className="tabular-nums">{formatTimeAr(record.prayedAt)}</span> • التذكير متوقف
                      </p>
                    ) : (isDue || isOverdue) && nextReminderRemainingMs !== null ? (
                      <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-amber-400">
                        <Clock className="h-3 w-3 shrink-0" />
                        <span>
                          التذكير الجاي بعد{' '}
                          <span className="tabular-nums font-extrabold">
                            {formatShortMMSS(nextReminderRemainingMs)}
                          </span>
                          {isOverdue && ` • فاتت منذ ${formatDurationArabic(now - prayer.endTime)}`}
                        </span>
                      </p>
                    ) : isDue ? (
                      <p className="mt-1 text-[11px] text-emerald-400">
                        متبقي على خروج الوقت: {formatDurationArabic(prayer.endTime - now)}
                      </p>
                    ) : null}
                  </div>

                  {/* Tactile Checklist Button */}
                  <button
                    type="button"
                    onClick={() => onTogglePrayer(prayer.id)}
                    aria-pressed={isPrayed}
                    className={`flex min-h-[54px] min-w-[96px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl px-3 py-2 text-xs font-black transition active:scale-95 ${
                      isPrayed
                        ? 'border border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                        : isDue || isOverdue
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                          : 'border border-[var(--border-strong)] bg-[var(--bg-card-elevated)] text-[var(--text-primary)]'
                    }`}
                  >
                    {isPrayed ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        <span>صليت ✓</span>
                      </>
                    ) : (
                      <>
                        <span className="h-5 w-5 rounded-full border-2 border-current opacity-80" />
                        <span>علّم صليت</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Subtle Sunrise row right after Fajr */}
              {prayer.id === 'fajr' && (
                <div className="flex items-center justify-between rounded-xl border border-dashed border-[var(--border-subtle)] px-3.5 py-2 text-xs text-[var(--text-secondary)]">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4 text-amber-400" />
                    <span className="font-semibold">الشروق (نهاية وقت الفجر)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="tabular-nums font-bold text-[var(--text-primary)]">
                      {formatTimeAr(schedule.sunrise)}
                    </span>
                    {now < schedule.sunrise && (
                      <span className="text-[11px] text-amber-400">
                        فاضل {formatDurationArabic(schedule.sunrise - now)}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Yesterday carryover section if enabled */}
      {yesterdayUnprayed.length > 0 && (
        <div className="surface-elevated rounded-2xl border border-amber-500/30 p-3.5">
          <div className="flex items-center gap-2 text-xs font-extrabold text-amber-400">
            <RotateCcw className="h-4 w-4" />
            <span>صلوات من أمس لم تُعلَّم في القائمة</span>
          </div>
          <div className="mt-2.5 space-y-2">
            {yesterdayUnprayed.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-xl bg-black/20 px-3 py-2 text-xs"
              >
                <span className="font-bold">صلاة {p.arabicName} (أمس)</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onMarkYesterdayPrayer(p.id)}
                    className="rounded-lg bg-emerald-500/20 px-2.5 py-1 font-bold text-emerald-400"
                  >
                    صليتها قضاء ✓
                  </button>
                  <button
                    type="button"
                    onClick={() => onDismissYesterdayPrayer(p.id)}
                    aria-label="تجاهل"
                    className="rounded-lg p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
