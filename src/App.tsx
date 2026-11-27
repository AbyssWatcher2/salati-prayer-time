import { useState } from 'react';
import { ActiveReminderBanner } from './components/ActiveReminderBanner';
import { BottomNav, type AppTab } from './components/BottomNav';
import { EgyptScheduleTable } from './components/EgyptScheduleTable';
import { HeaderCard } from './components/HeaderCard';
import { PrayerChecklist } from './components/PrayerChecklist';
import { SettingsSheet } from './components/SettingsSheet';
import { WeekHistory } from './components/WeekHistory';
import { usePrayerReminderApp } from './hooks/usePrayerReminderApp';

export function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('today');
  const app = usePrayerReminderApp();

  return (
    <div className="app-shell min-h-dvh">
      <div className="safe-top-bar fixed top-0 left-0 right-0 z-50" aria-hidden="true" />
      <main className="mx-auto max-w-lg space-y-3.5 px-3.5">
        <HeaderCard
          now={app.now}
          locationLabel={app.locationLabel}
          nextPrayer={app.nextPrayer}
          prayedCountToday={app.prayedCountToday}
          streak={app.streak}
          onOpenSchedule={() => setActiveTab('schedule')}
        />

        {app.notifPerm === 'default' && activeTab === 'today' && (
          <div className="surface-elevated flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/35 px-3.5 py-2.5 text-xs">
            <span className="font-semibold text-[var(--text-primary)]">
              فعل إشعارات الهاتف عشان التذكير يوصلك كل ربع ساعة.
            </span>
            <button
              type="button"
              onClick={() => void app.handleRequestNotifications()}
              className="shrink-0 rounded-xl bg-emerald-500 px-3 py-1.5 font-black text-slate-950 transition active:scale-95"
            >
              تفعيل
            </button>
          </div>
        )}

        {activeTab === 'today' && (
          <>
            <ActiveReminderBanner
              now={app.now}
              pendingPrayers={app.evaluation.pendingPrayers}
              activeAlert={app.activeAlert}
              intervalMinutes={app.settings.reminderIntervalMinutes}
              onMarkAllPrayed={(ids) => app.markPrayersDone(ids)}
              onMarkSinglePrayed={(id) => app.togglePrayer(id)}
              onSnooze={(ids) => app.snoozePendingPrayers(ids)}
              onDismissTest={app.dismissAlertPopup}
            />

            <PrayerChecklist
              now={app.now}
              schedule={app.schedule}
              dayLog={app.todayLog}
              settings={app.settings}
              yesterdayUnprayed={app.yesterdayUnprayed}
              onTogglePrayer={(id) => app.togglePrayer(id)}
              onMarkYesterdayPrayer={(id) => app.markPrayersDone([id], app.yesterdayKey)}
              onDismissYesterdayPrayer={app.dismissYesterdayPrayer}
            />
          </>
        )}

        {activeTab === 'schedule' && (
          <EgyptScheduleTable
            now={app.now}
            todaySchedule={app.schedule}
            monthSchedules={app.monthSchedules}
            todayLog={app.todayLog}
            settings={app.settings}
            locationLabel={app.locationLabel}
            onChangeGovernorate={(govId) =>
              app.updateSettings({ governorateId: govId, customLocation: null })
            }
            onDetectGps={app.detectGpsLocation}
            gpsStatus={app.gpsStatus}
          />
        )}

        {activeTab === 'history' && (
          <WeekHistory now={app.now} logsByDate={app.logsByDate} streak={app.streak} />
        )}

        {activeTab === 'settings' && (
          <SettingsSheet
            settings={app.settings}
            notifPerm={app.notifPerm}
            canInstallPwa={app.canInstallPwa}
            gpsStatus={app.gpsStatus}
            testBannerMsg={app.testBannerMsg}
            onUpdateSettings={app.updateSettings}
            onRequestNotifications={app.handleRequestNotifications}
            onTestReminder={app.triggerTestReminder}
            onDetectGps={app.detectGpsLocation}
            onInstallPwa={app.triggerPwaInstall}
            onResetOffsets={app.resetAllOffsets}
          />
        )}
      </main>

      <BottomNav
        activeTab={activeTab}
        pendingCount={app.evaluation.pendingPrayers.length}
        onSelectTab={setActiveTab}
      />
    </div>
  );
}

export default App;
