import { Clock, Flame, MapPin, Sparkles } from 'lucide-react';
import {
  formatClockWithSecondsAr,
  formatCountdownHMS,
  formatGregorianDateAr,
  formatHijriDateAr,
  formatTimeAr,
} from '../lib/prayerTimes';
import type { NextPrayerInfo } from '../types/prayer';

interface HeaderCardProps {
  now: number;
  locationLabel: string;
  nextPrayer: NextPrayerInfo;
  prayedCountToday: number;
  streak: number;
  onOpenSchedule: () => void;
}

export function HeaderCard({
  now,
  locationLabel,
  nextPrayer,
  prayedCountToday,
  streak,
  onOpenSchedule,
}: HeaderCardProps) {
  const currentDate = new Date(now);
  const clock = formatClockWithSecondsAr(now);
  const gregorianDate = formatGregorianDateAr(currentDate);
  const hijriDate = formatHijriDateAr(currentDate);

  return (
    <header className="space-y-3">
      {/* Live Clock, Date & Egypt Governorate Bar */}
      <div className="surface-card rounded-2xl px-4 py-3.5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <Clock className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="tabular-nums text-xl font-extrabold tracking-tight">
                  {clock.time}
                </span>
                <span className="text-xs font-semibold text-emerald-400">{clock.period}</span>
              </div>
              <p className="truncate text-xs text-[var(--text-secondary)]">{gregorianDate}</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400">
              <MapPin className="h-3.5 w-3.5" />
              {locationLabel}، مصر
            </span>
            {hijriDate && (
              <span className="text-[11px] font-medium text-amber-400/90">{hijriDate} هـ</span>
            )}
          </div>
        </div>
      </div>

      {/* Next Prayer Hero Card */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/90 via-[#0c1d19] to-[#081210] p-5 text-white shadow-lg">
        <div className="pointer-events-none absolute -left-10 -top-10 h-36 w-36 rounded-full bg-emerald-500/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 -right-8 h-32 w-32 rounded-full bg-amber-500/10 blur-2xl" />

        <div className="relative flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-200">
              <Sparkles className="h-3 w-3 text-amber-400" />
              <span>الصلاة القادمة {nextPrayer.isTomorrow ? '(غدا)' : ''}</span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-white">
              صلاة {nextPrayer.arabicName}
            </h1>
            <p className="mt-0.5 text-sm text-emerald-100/80">
              موعدها:{' '}
              <span className="tabular-nums font-bold text-amber-300">
                {formatTimeAr(nextPrayer.startTime)}
              </span>
            </p>
          </div>

          <div className="text-left">
            <span className="block text-[11px] font-medium text-emerald-200/80">
              فاضل عليها
            </span>
            <div className="tabular-nums mt-0.5 text-3xl font-black tracking-tight text-emerald-300">
              {formatCountdownHMS(nextPrayer.remainingMs)}
            </div>
          </div>
        </div>

        {/* Progress toward next prayer */}
        <div className="relative mt-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-l from-amber-400 to-emerald-400 transition-all duration-700"
              style={{ width: `${Math.round(nextPrayer.progressPercent)}%` }}
            />
          </div>
        </div>

        {/* Daily progress & streak */}
        <div className="relative mt-4 flex items-center justify-between gap-2 border-t border-white/10 pt-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-emerald-200">
              إنجاز اليوم:{' '}
              <span className="tabular-nums text-white">{prayedCountToday} / 5</span> صلوات
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 font-bold text-amber-300">
              <Flame className="h-3.5 w-3.5" />
              <span className="tabular-nums">{streak}</span> يوم التزام
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenSchedule}
            className="rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-bold text-emerald-200 transition active:scale-95 hover:bg-white/20"
          >
            جدول مصر كامل
          </button>
        </div>
      </div>
    </header>
  );
}
