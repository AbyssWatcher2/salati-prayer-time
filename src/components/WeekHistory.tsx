import { Check, Flame, Trophy } from 'lucide-react';
import { formatShortDateAr, getDateKey, PRAYER_NAMES_AR, PRAYER_ORDER } from '../lib/prayerTimes';
import { countPrayedInDay } from '../lib/reminderEngine';
import type { LogsByDate } from '../types/prayer';

interface WeekHistoryProps {
  now: number;
  logsByDate: LogsByDate;
  streak: number;
}

export function WeekHistory({ now, logsByDate, streak }: WeekHistoryProps) {
  const days = Array.from({ length: 7 }, (_, idx) => {
    const base = new Date(now);
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() - idx);
    const key = getDateKey(d);
    const log = logsByDate[key];
    return {
      key,
      label: idx === 0 ? 'اليوم' : idx === 1 ? 'أمس' : formatShortDateAr(d),
      log,
      completed: countPrayedInDay(log),
    };
  });

  const totalWeekPrayed = days.reduce((sum, d) => sum + d.completed, 0);
  const weekPercent = Math.round((totalWeekPrayed / 35) * 100);

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="surface-card rounded-2xl p-4">
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <Flame className="h-4 w-4 text-amber-400" />
            <span>أيام الالتزام المتتالية</span>
          </div>
          <div className="tabular-nums mt-2 text-2xl font-black text-amber-400">{streak} يوم</div>
        </div>

        <div className="surface-card rounded-2xl p-4">
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <Trophy className="h-4 w-4 text-emerald-400" />
            <span>التزام آخر ٧ أيام</span>
          </div>
          <div className="tabular-nums mt-2 text-2xl font-black text-emerald-400">
            {weekPercent}%
          </div>
        </div>
      </div>

      <div className="surface-card overflow-hidden rounded-2xl">
        <div className="border-b border-[var(--border-subtle)] px-4 py-3">
          <h2 className="text-sm font-black">سجل الصلوات (آخر ٧ أيام)</h2>
          <p className="text-[11px] text-[var(--text-secondary)]">
            متابعة يومية لكل صلاة من الصلوات الخمس
          </p>
        </div>

        <div className="divide-y divide-[var(--border-subtle)]">
          {days.map((day) => (
            <div key={day.key} className="flex items-center justify-between gap-2 px-4 py-3">
              <div className="min-w-0">
                <div className="text-xs font-extrabold">{day.label}</div>
                <div className="tabular-nums text-[11px] text-[var(--text-secondary)]">
                  {day.completed} / 5 صلوات
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {PRAYER_ORDER.map((id) => {
                  const rec = day.log?.[id];
                  const isDone = Boolean(rec?.prayed);
                  const isLate = rec?.statusWhenPrayed === 'late';
                  return (
                    <div
                      key={id}
                      title={`${PRAYER_NAMES_AR[id]}: ${isDone ? 'تمّت' : 'لم تُعلَّم'}`}
                      className={`flex h-9 w-11 flex-col items-center justify-center rounded-xl border text-[10px] font-bold ${
                        isDone
                          ? isLate
                            ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                            : 'border-emerald-500/40 bg-emerald-500/20 text-emerald-400'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-input)] text-[var(--text-muted)]'
                      }`}
                    >
                      {isDone ? <Check className="h-3.5 w-3.5" /> : <span>—</span>}
                      <span className="text-[9px] leading-none">{PRAYER_NAMES_AR[id]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
