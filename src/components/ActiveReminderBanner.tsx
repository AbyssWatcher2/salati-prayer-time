import { AlertTriangle, BellRing, CheckCircle2, Clock } from 'lucide-react';
import { formatDurationArabic, formatTimeAr } from '../lib/prayerTimes';
import type { EvaluatedPrayer } from '../lib/reminderEngine';
import type { PrayerId } from '../types/prayer';
import type { ActiveAlertInfo } from '../hooks/usePrayerReminderApp';

interface ActiveReminderBannerProps {
  now: number;
  pendingPrayers: EvaluatedPrayer[];
  activeAlert: ActiveAlertInfo | null;
  intervalMinutes: number;
  onMarkAllPrayed: (ids: PrayerId[]) => void;
  onMarkSinglePrayed: (id: PrayerId) => void;
  onSnooze: (ids: PrayerId[]) => void;
  onDismissTest: () => void;
}

export function ActiveReminderBanner({
  now,
  pendingPrayers,
  activeAlert,
  intervalMinutes,
  onMarkAllPrayed,
  onMarkSinglePrayed,
  onSnooze,
  onDismissTest,
}: ActiveReminderBannerProps) {
  if (activeAlert?.isTest && pendingPrayers.length === 0) {
    return (
      <section className="pulse-alert rounded-3xl border-2 border-emerald-400/60 bg-emerald-950/70 p-4 text-white shadow-lg">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-2xl bg-emerald-500/20 p-2.5 text-emerald-300">
            <BellRing className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-extrabold text-emerald-200">{activeAlert.title}</h2>
            <p className="mt-1 text-xs leading-relaxed text-emerald-100/90">{activeAlert.body}</p>
            <button
              type="button"
              onClick={onDismissTest}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-extrabold text-slate-950 transition active:scale-[0.98]"
            >
              <CheckCircle2 className="h-5 w-5" />
              تم الفهم — إغلاق التجربة
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (pendingPrayers.length === 0) {
    return null;
  }

  const hasOverdue = pendingPrayers.some((p) => p.status === 'overdue');
  const pendingIds = pendingPrayers.map((p) => p.id);

  return (
    <section
      className={`pulse-alert rounded-3xl border-2 p-4 shadow-lg ${
        hasOverdue
          ? 'border-amber-500/70 bg-gradient-to-br from-amber-950/90 via-[#1f1307] to-[#140d06] text-amber-50'
          : 'border-emerald-400/70 bg-gradient-to-br from-emerald-950/90 via-[#0d221c] to-[#081713] text-emerald-50'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 shrink-0 rounded-2xl p-2.5 ${
            hasOverdue ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
          }`}
        >
          {hasOverdue ? <AlertTriangle className="h-6 w-6" /> : <BellRing className="h-6 w-6" />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-black">
              {hasOverdue ? 'صلوات في انتظارك — قم صلّي الآن' : 'حان وقت الصلاة'}
            </h2>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-bold">
              تذكير كل {intervalMinutes} د
            </span>
          </div>

          <p className="mt-1 text-xs opacity-90">
            التذكير سيستمر تلقائياً كل ربع ساعة حتى بعد انتهاء وقت الصلاة لحد ما تضغط «صليت ✓».
          </p>

          <div className="mt-3 space-y-2">
            {pendingPrayers.map((p) => {
              const elapsed = formatDurationArabic(now - p.startTime);
              const isOverdue = p.status === 'overdue';
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-2 rounded-2xl bg-black/30 px-3 py-2.5 border border-white/10"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold">صلاة {p.arabicName}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isOverdue
                            ? 'bg-rose-500/25 text-rose-200'
                            : 'bg-emerald-500/25 text-emerald-200'
                        }`}
                      >
                        {isOverdue ? 'فات وقتها' : 'وقتها الآن'}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] opacity-80">
                      أذّنت {formatTimeAr(p.startTime)} • منذ {elapsed}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onMarkSinglePrayed(p.id)}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-black text-slate-950 transition active:scale-95"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    صليت
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onMarkAllPrayed(pendingIds)}
              className="inline-flex min-h-[46px] items-center justify-center gap-1.5 rounded-2xl bg-emerald-500 px-3 py-2.5 text-sm font-black text-slate-950 shadow transition active:scale-[0.98]"
            >
              <CheckCircle2 className="h-5 w-5" />
              {pendingPrayers.length > 1 ? 'الحمد لله، صليتهم كلهم ✓' : 'الحمد لله، صليت ✓'}
            </button>

            <button
              type="button"
              onClick={() => onSnooze(pendingIds)}
              className="inline-flex min-h-[46px] items-center justify-center gap-1.5 rounded-2xl border border-white/20 bg-white/10 px-3 py-2.5 text-xs font-bold text-white transition active:scale-[0.98]"
            >
              <Clock className="h-4 w-4" />
              فكّرني بعد {intervalMinutes} دقيقة
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
