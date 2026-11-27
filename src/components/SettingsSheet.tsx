import {
  Bell,
  Download,
  MapPin,
  Moon,
  Navigation,
  RotateCcw,
  ShieldAlert,
  Smartphone,
  Sun,
  Volume2,
} from 'lucide-react';
import { EGYPT_GOVERNORATES } from '../data/egyptGovernorates';
import { PRAYER_NAMES_AR, PRAYER_ORDER } from '../lib/prayerTimes';
import type { NotificationPermState } from '../lib/notifications';
import type { ReminderSettings, SoundChoice } from '../types/prayer';

interface SettingsSheetProps {
  settings: ReminderSettings;
  notifPerm: NotificationPermState;
  canInstallPwa: boolean;
  gpsStatus: string | null;
  testBannerMsg: string | null;
  onUpdateSettings: (patch: Partial<ReminderSettings>) => void;
  onRequestNotifications: () => Promise<NotificationPermState>;
  onTestReminder: () => Promise<void>;
  onDetectGps: () => void;
  onInstallPwa: () => Promise<boolean>;
  onResetOffsets: () => void;
}

const INTERVAL_OPTIONS = [5, 10, 15, 20, 30];

const SOUND_OPTIONS: Array<{ value: SoundChoice; label: string }> = [
  { value: 'adhan-chime', label: 'نغمة أذان هادئة' },
  { value: 'gentle', label: 'تنبيه لطيف' },
  { value: 'strong', label: 'تنبيه قوي' },
  { value: 'silent', label: 'صامت (بدون صوت)' },
];

export function SettingsSheet({
  settings,
  notifPerm,
  canInstallPwa,
  gpsStatus,
  testBannerMsg,
  onUpdateSettings,
  onRequestNotifications,
  onTestReminder,
  onDetectGps,
  onInstallPwa,
  onResetOffsets,
}: SettingsSheetProps) {
  return (
    <section className="space-y-4">
      {/* Notifications & Test */}
      <div className="surface-card rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-emerald-400" />
            <h2 className="text-sm font-black">التنبيهات والصوت</h2>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
              notifPerm === 'granted'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/20 text-amber-400'
            }`}
          >
            {notifPerm === 'granted'
              ? 'الإشعارات مفعّلة ✓'
              : notifPerm === 'denied'
                ? 'الإشعارات مرفوضة'
                : notifPerm === 'unsupported'
                  ? 'غير مدعومة هنا'
                  : 'تحتاج تفعيل'}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {notifPerm !== 'granted' && notifPerm !== 'unsupported' && (
            <button
              type="button"
              onClick={() => void onRequestNotifications()}
              className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-black text-slate-950 transition active:scale-95"
            >
              <Bell className="h-4 w-4" />
              تفعيل إشعارات الموبايل
            </button>
          )}

          <button
            type="button"
            onClick={() => void onTestReminder()}
            className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2.5 text-xs font-black text-emerald-300 transition active:scale-95"
          >
            <Volume2 className="h-4 w-4" />
            جرّب التذكير الآن
          </button>
        </div>

        {testBannerMsg && (
          <p className="rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300">
            {testBannerMsg}
          </p>
        )}

        {/* Interval */}
        <div className="pt-1">
          <label className="block text-xs font-bold text-[var(--text-secondary)]">
            تكرار التذكير كل:
          </label>
          <div className="mt-2 grid grid-cols-5 gap-1.5">
            {INTERVAL_OPTIONS.map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => onUpdateSettings({ reminderIntervalMinutes: mins })}
                className={`rounded-xl py-2 text-xs font-extrabold transition ${
                  settings.reminderIntervalMinutes === mins
                    ? 'bg-emerald-500 text-slate-950'
                    : 'border border-[var(--border-subtle)] bg-[var(--bg-input)] text-[var(--text-primary)]'
                }`}
              >
                {mins} د
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-2.5 pt-2">
          <label className="flex items-center justify-between gap-3 rounded-xl bg-[var(--bg-input)] p-3 text-xs">
            <div>
              <span className="block font-extrabold">
                استمرار التذكير حتى بعد انتهاء وقت الصلاة
              </span>
              <span className="text-[11px] text-[var(--text-secondary)]">
                يفضّل يفكرك كل {settings.reminderIntervalMinutes} د لحد ما تضغط «صليت ✓»
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.continueAfterEnd}
              onChange={(e) => onUpdateSettings({ continueAfterEnd: e.target.checked })}
              className="h-5 w-5 accent-emerald-500"
            />
          </label>

          <label className="flex items-center justify-between gap-3 rounded-xl bg-[var(--bg-input)] p-3 text-xs">
            <div>
              <span className="block font-extrabold">إظهار صلوات أمس غير المُعلَّمة</span>
              <span className="text-[11px] text-[var(--text-secondary)]">
                تظهر في قائمة اليوم لتعليمها قضاء أو تخطيها
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.carryOverYesterday}
              onChange={(e) => onUpdateSettings({ carryOverYesterday: e.target.checked })}
              className="h-5 w-5 accent-emerald-500"
            />
          </label>

          <label className="flex items-center justify-between gap-3 rounded-xl bg-[var(--bg-input)] p-3 text-xs">
            <span className="font-extrabold">اهتزاز الموبايل مع التذكير</span>
            <input
              type="checkbox"
              checked={settings.vibrationEnabled}
              onChange={(e) => onUpdateSettings({ vibrationEnabled: e.target.checked })}
              className="h-5 w-5 accent-emerald-500"
            />
          </label>
        </div>

        {/* Sound choice */}
        <div>
          <label className="block text-xs font-bold text-[var(--text-secondary)]">نغمة التذكير</label>
          <select
            value={settings.sound}
            onChange={(e) => onUpdateSettings({ sound: e.target.value as SoundChoice })}
            className="mt-1.5 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-input)] px-3 py-2.5 text-xs font-bold text-[var(--text-primary)] outline-none focus:border-emerald-500"
          >
            {SOUND_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Location & Calculation */}
      <div className="surface-card rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-emerald-400" />
          <h2 className="text-sm font-black">المحافظة وطريقة الحساب (مصر)</h2>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={settings.customLocation ? '__gps__' : settings.governorateId}
            onChange={(e) => {
              if (e.target.value !== '__gps__') {
                onUpdateSettings({
                  governorateId: e.target.value,
                  customLocation: null,
                });
              }
            }}
            className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-input)] px-3 py-2.5 text-xs font-bold text-[var(--text-primary)] outline-none focus:border-emerald-500"
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

          <button
            type="button"
            onClick={onDetectGps}
            className="inline-flex items-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-xs font-bold text-emerald-400"
          >
            <Navigation className="h-3.5 w-3.5" />
            GPS
          </button>
        </div>

        {gpsStatus && <p className="text-[11px] text-amber-400">{gpsStatus}</p>}

        {/* Asr Madhab */}
        <div className="flex items-center justify-between gap-2 rounded-xl bg-[var(--bg-input)] p-3 text-xs">
          <div>
            <span className="block font-extrabold">مذهب صلاة العصر</span>
            <span className="text-[11px] text-[var(--text-secondary)]">
              مصر تستخدم الشافعي/الجمهور رسمياً
            </span>
          </div>
          <div className="inline-flex rounded-lg bg-black/20 p-1 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => onUpdateSettings({ asrMadhab: 'shafi' })}
              className={`rounded-md px-2.5 py-1 ${
                settings.asrMadhab === 'shafi'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              الجمهور
            </button>
            <button
              type="button"
              onClick={() => onUpdateSettings({ asrMadhab: 'hanafi' })}
              className={`rounded-md px-2.5 py-1 ${
                settings.asrMadhab === 'hanafi'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              الحنفي
            </button>
          </div>
        </div>

        {/* Theme */}
        <div className="flex items-center justify-between gap-2 rounded-xl bg-[var(--bg-input)] p-3 text-xs">
          <div>
            <span className="block font-extrabold">المظهر (Theme)</span>
            <span className="text-[11px] text-[var(--text-secondary)]">
              الوضع الداكن AMOLED يوفر بطارية Redmi Note 10S
            </span>
          </div>
          <button
            type="button"
            onClick={() =>
              onUpdateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })
            }
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] px-3 py-1.5 font-bold"
          >
            {settings.theme === 'dark' ? (
              <>
                <Moon className="h-4 w-4 text-amber-400" />
                داكن
              </>
            ) : (
              <>
                <Sun className="h-4 w-4 text-amber-500" />
                فاتح
              </>
            )}
          </button>
        </div>

        {/* Fine tune offsets */}
        <div className="pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-secondary)]">
              ضبط يدوي بالدقائق (لو حابب تعدّل عن المسجد)
            </span>
            <button
              type="button"
              onClick={onResetOffsets}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400"
            >
              <RotateCcw className="h-3 w-3" />
              تصفير
            </button>
          </div>
          <div className="mt-2 grid grid-cols-5 gap-1.5">
            {PRAYER_ORDER.map((id) => (
              <div
                key={id}
                className="flex flex-col items-center rounded-xl bg-[var(--bg-input)] p-2 text-[11px]"
              >
                <span className="font-bold">{PRAYER_NAMES_AR[id]}</span>
                <input
                  type="number"
                  min={-30}
                  max={30}
                  value={settings.offsets[id]}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    onUpdateSettings({
                      offsets: { ...settings.offsets, [id]: Math.max(-30, Math.min(30, val)) },
                    });
                  }}
                  className="tabular-nums mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-transparent py-1 text-center font-bold outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Redmi Note 10S / MIUI Guide */}
      <div className="surface-card rounded-2xl border border-amber-500/30 p-4 space-y-2.5">
        <div className="flex items-center gap-2 text-amber-400">
          <Smartphone className="h-5 w-5" />
          <h2 className="text-sm font-black">إعدادات مهمة لموبايل Redmi Note 10S</h2>
        </div>

        {canInstallPwa && (
          <button
            type="button"
            onClick={() => void onInstallPwa()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-black text-slate-950"
          >
            <Download className="h-4 w-4" />
            تثبيت «صلاتي» كتطبيق على الشاشة الرئيسية
          </button>
        )}

        <ul className="space-y-1.5 text-xs leading-relaxed text-[var(--text-secondary)]">
          <li>
            1. افتح التطبيق في <strong className="text-[var(--text-primary)]">Chrome</strong> واضغط
            القائمة ⋮ ثم <strong className="text-[var(--text-primary)]">إضافة إلى الشاشة الرئيسية</strong>.
          </li>
          <li>
            2. لضمان استمرار التذكير في خلفية MIUI: ادخل على{' '}
            <strong className="text-[var(--text-primary)]">
              الإعدادات ← التطبيقات ← Chrome ← موفر البطارية ← بلا قيود
            </strong>
            .
          </li>
          <li>
            3. افتح شاشة التطبيقات المفتوحة (Recent Apps) واضغط مطوّلاً على التطبيق واختر رمز{' '}
            <strong className="text-[var(--text-primary)]">القفل 🔒</strong> حتى لا يغلقه النظام.
          </li>
          <li className="flex items-start gap-1.5 pt-1 text-[11px] text-amber-400/90">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              إشعارات أندرويد الكاملة في Chrome تتطلب فتح الموقع عبر رابط <strong>HTTPS</strong>{' '}
              (أو من localhost عبر USB).
            </span>
          </li>
        </ul>
      </div>
    </section>
  );
}
