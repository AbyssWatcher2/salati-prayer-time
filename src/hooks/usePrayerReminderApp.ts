import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  calculateDailySchedule,
  calculateMultiDaySchedule,
  formatDurationArabic,
  getDateKey,
  getNextPrayerInfo,
  getPreviousDateKey,
  PRAYER_ORDER,
  resolveCoordinates,
} from '../lib/prayerTimes';
import {
  calculateStreak,
  countPrayedInDay,
  dismissCarryoverPrayer,
  ensureDayLog,
  evaluateReminders,
  markPrayerPrayed,
  recordReminderFired,
  snoozePrayers,
  unmarkPrayerPrayed,
} from '../lib/reminderEngine';
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendPrayerNotification,
  triggerDeviceVibration,
  type NotificationPermState,
} from '../lib/notifications';
import { playReminderSound, unlockAudio } from '../lib/sound';
import {
  drainPendingSwActions,
  loadLogs,
  loadSettings,
  saveLogs,
  saveSettings,
} from '../lib/storage';
import type {
  DailySchedule,
  DayLog,
  LogsByDate,
  PendingSwAction,
  PrayerId,
  ReminderSettings,
} from '../types/prayer';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface ActiveAlertInfo {
  title: string;
  body: string;
  prayerIds: PrayerId[];
  hasOverdue: boolean;
  isTest?: boolean;
}

export function usePrayerReminderApp() {
  const [settings, setSettings] = useState<ReminderSettings>(() => loadSettings());
  const [logsByDate, setLogsByDate] = useState<LogsByDate>(() => loadLogs());
  const [now, setNow] = useState<number>(() => Date.now());
  const [notifPerm, setNotifPerm] = useState<NotificationPermState>(() => getNotificationPermission());
  const [activeAlert, setActiveAlert] = useState<ActiveAlertInfo | null>(null);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);
  const [testBannerMsg, setTestBannerMsg] = useState<string | null>(null);

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const logsRef = useRef(logsByDate);
  logsRef.current = logsByDate;

  const todayKey = useMemo(() => getDateKey(new Date(now)), [now]);
  const yesterdayKey = useMemo(() => getPreviousDateKey(new Date(now)), [now]);

  const schedule: DailySchedule = useMemo(
    () => calculateDailySchedule(new Date(now), settings),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [todayKey, settings],
  );

  const yesterdaySchedule: DailySchedule = useMemo(() => {
    const d = new Date(now);
    const prev = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
    return calculateDailySchedule(prev, settings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yesterdayKey, settings]);

  const monthSchedules = useMemo(() => {
    const d = new Date(now);
    return calculateMultiDaySchedule(d, 30, settings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayKey, settings]);

  const todayLog: DayLog = useMemo(
    () => ensureDayLog(logsByDate[todayKey]),
    [logsByDate, todayKey],
  );

  const yesterdayLog: DayLog = useMemo(
    () => ensureDayLog(logsByDate[yesterdayKey]),
    [logsByDate, yesterdayKey],
  );

  const evaluation = useMemo(
    () => evaluateReminders(schedule, todayLog, now, settings),
    [schedule, todayLog, now, settings],
  );

  const nextPrayer = useMemo(() => getNextPrayerInfo(schedule, now), [schedule, now]);

  const prayedCountToday = useMemo(() => countPrayedInDay(todayLog), [todayLog]);
  const streak = useMemo(() => calculateStreak(logsByDate, todayKey), [logsByDate, todayKey]);
  const locationLabel = useMemo(() => resolveCoordinates(settings).labelAr, [settings]);

  const yesterdayUnprayed = useMemo(() => {
    if (!settings.carryOverYesterday) return [];
    return yesterdaySchedule.prayers.filter((p) => {
      const rec = yesterdayLog[p.id];
      return !rec.prayed && !rec.dismissedCarryover;
    });
  }, [settings.carryOverYesterday, yesterdaySchedule.prayers, yesterdayLog]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', settings.theme === 'dark' ? '#050a09' : '#f4f7f5');
    }
  }, [settings.theme]);

  // Persist settings & logs
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveLogs(logsByDate);
  }, [logsByDate]);

  // Unlock Web Audio on first user interaction
  useEffect(() => {
    const handleFirstGesture = () => {
      void unlockAudio();
    };
    window.addEventListener('pointerdown', handleFirstGesture, { once: true });
    return () => window.removeEventListener('pointerdown', handleFirstGesture);
  }, []);

  // Capture PWA install prompt on Android Chrome
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const applyPendingAction = useCallback((action: PendingSwAction) => {
    const targetDateKey = action.dateKey || getDateKey(new Date());
    const targetSchedule = calculateDailySchedule(
      new Date(`${targetDateKey}T12:00:00`),
      settingsRef.current,
    );

    setLogsByDate((prev) => {
      let dayLog = ensureDayLog(prev[targetDateKey]);
      if (action.type === 'MARK_PRAYED') {
        for (const id of action.prayerIds) {
          const item = targetSchedule.prayers.find((p) => p.id === id);
          if (item) {
            dayLog = markPrayerPrayed(dayLog, id, action.timestamp || Date.now(), item.endTime);
          }
        }
      } else if (action.type === 'SNOOZE_PRAYERS') {
        dayLog = snoozePrayers(
          dayLog,
          action.prayerIds,
          action.timestamp || Date.now(),
          action.minutes ?? settingsRef.current.reminderIntervalMinutes,
        );
      }
      return {
        ...prev,
        [targetDateKey]: dayLog,
      };
    });

    setActiveAlert(null);
  }, []);

  // Sync SW notification actions (from IndexedDB or postMessage)
  useEffect(() => {
    const syncDbActions = async () => {
      const actions = await drainPendingSwActions();
      for (const action of actions) {
        applyPendingAction(action);
      }
    };
    void syncDbActions();

    const handleSwMessage = (event: MessageEvent) => {
      const data = event.data as PendingSwAction | undefined;
      if (data && (data.type === 'MARK_PRAYED' || data.type === 'SNOOZE_PRAYERS')) {
        applyPendingAction(data);
        void drainPendingSwActions();
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
    }
    const handleFocusSync = () => {
      setNow(Date.now());
      setNotifPerm(getNotificationPermission());
      void syncDbActions();
    };
    window.addEventListener('focus', handleFocusSync);
    document.addEventListener('visibilitychange', handleFocusSync);

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      }
      window.removeEventListener('focus', handleFocusSync);
      document.removeEventListener('visibilitychange', handleFocusSync);
    };
  }, [applyPendingAction]);

  // Core reminder check function triggered by worker tick & visibility
  const runReminderCheck = useCallback((tickNow: number) => {
    const currentSettings = settingsRef.current;
    const currentLogs = logsRef.current;
    const currentDateKey = getDateKey(new Date(tickNow));
    const currentSchedule = calculateDailySchedule(new Date(tickNow), currentSettings);
    const currentDayLog = ensureDayLog(currentLogs[currentDateKey]);

    const { duePrayers } = evaluateReminders(
      currentSchedule,
      currentDayLog,
      tickNow,
      currentSettings,
    );

    if (duePrayers.length === 0) return;

    const prayerIds = duePrayers.map((p) => p.id);
    const hasOverdue = duePrayers.some((p) => p.status === 'overdue');
    const names = duePrayers.map((p) => p.arabicName).join(' و');

    const title =
      duePrayers.length === 1
        ? duePrayers[0].status === 'overdue'
          ? `تذكير: صلاة ${duePrayers[0].arabicName} فات وقتها — قوم صليها`
          : `حان الآن موعد صلاة ${duePrayers[0].arabicName}`
        : `تذكير بالصلاة: ${names}`;

    const details = duePrayers
      .map((p) => {
        const elapsed = formatDurationArabic(tickNow - p.startTime);
        return p.status === 'overdue'
          ? `${p.arabicName} (فات وقتها، مر ${elapsed})`
          : `${p.arabicName} (بدأ من ${elapsed})`;
      })
      .join(' • ');

    const body = `${details} — اضغط «صليت ✓» لإيقاف التذكير كل ${currentSettings.reminderIntervalMinutes} د.`;

    // Record firing first so concurrent ticks cannot double-fire
    setLogsByDate((prev) => {
      const latestDayLog = ensureDayLog(prev[currentDateKey]);
      return {
        ...prev,
        [currentDateKey]: recordReminderFired(latestDayLog, prayerIds, tickNow),
      };
    });

    setActiveAlert({
      title,
      body,
      prayerIds,
      hasOverdue,
    });

    if (currentSettings.sound !== 'silent') {
      void playReminderSound(currentSettings.sound);
    }
    if (currentSettings.vibrationEnabled) {
      triggerDeviceVibration(hasOverdue);
    }
    if (currentSettings.notificationsEnabled) {
      void sendPrayerNotification({
        title,
        body,
        dateKey: currentDateKey,
        prayerIds,
        overdue: hasOverdue,
      });
    }
  }, []);

  // 1-second UI clock for live clock & countdowns
  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  // Dedicated Web Worker for reliable background-resistant reminder ticks
  useEffect(() => {
    let worker: Worker | null = null;
    if (typeof Worker !== 'undefined') {
      worker = new Worker('./timer-worker.js');
      worker.onmessage = (event) => {
        if (event.data?.type === 'TICK') {
          const tickNow = typeof event.data.now === 'number' ? event.data.now : Date.now();
          setNow(tickNow);
          runReminderCheck(tickNow);
        }
      };
      worker.postMessage({ type: 'START', intervalMs: 10000 });
    } else {
      const fallbackId = window.setInterval(() => {
        const t = Date.now();
        setNow(t);
        runReminderCheck(t);
      }, 10000);
      return () => window.clearInterval(fallbackId);
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        const t = Date.now();
        setNow(t);
        runReminderCheck(t);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      if (worker) {
        worker.postMessage({ type: 'STOP' });
        worker.terminate();
      }
    };
  }, [runReminderCheck]);

  const togglePrayer = useCallback(
    (prayerId: PrayerId, dateKeyOverride?: string) => {
      void unlockAudio();
      const targetKey = dateKeyOverride ?? todayKey;
      const targetSched = dateKeyOverride === yesterdayKey ? yesterdaySchedule : schedule;
      const item = targetSched.prayers.find((p) => p.id === prayerId);
      if (!item) return;

      const clickNow = Date.now();
      setLogsByDate((prev) => {
        const existingDay = ensureDayLog(prev[targetKey]);
        const isAlreadyPrayed = existingDay[prayerId].prayed;
        const updatedDay = isAlreadyPrayed
          ? unmarkPrayerPrayed(existingDay, prayerId)
          : markPrayerPrayed(existingDay, prayerId, clickNow, item.endTime);
        return {
          ...prev,
          [targetKey]: updatedDay,
        };
      });

      setActiveAlert((prev) => {
        if (!prev) return null;
        const remaining = prev.prayerIds.filter((id) => id !== prayerId);
        return remaining.length > 0 ? { ...prev, prayerIds: remaining } : null;
      });
    },
    [schedule, todayKey, yesterdayKey, yesterdaySchedule],
  );

  const markPrayersDone = useCallback(
    (prayerIds: PrayerId[], dateKeyOverride?: string) => {
      void unlockAudio();
      const targetKey = dateKeyOverride ?? todayKey;
      const targetSched = dateKeyOverride === yesterdayKey ? yesterdaySchedule : schedule;
      const clickNow = Date.now();

      setLogsByDate((prev) => {
        let updatedDay = ensureDayLog(prev[targetKey]);
        for (const id of prayerIds) {
          const item = targetSched.prayers.find((p) => p.id === id);
          if (item) {
            updatedDay = markPrayerPrayed(updatedDay, id, clickNow, item.endTime);
          }
        }
        return {
          ...prev,
          [targetKey]: updatedDay,
        };
      });

      setActiveAlert(null);
    },
    [schedule, todayKey, yesterdayKey, yesterdaySchedule],
  );

  const snoozePendingPrayers = useCallback(
    (prayerIds: PrayerId[], minutes?: number) => {
      void unlockAudio();
      const clickNow = Date.now();
      const snoozeMins = minutes ?? settings.reminderIntervalMinutes;
      setLogsByDate((prev) => {
        const updatedDay = snoozePrayers(prev[todayKey], prayerIds, clickNow, snoozeMins);
        return {
          ...prev,
          [todayKey]: updatedDay,
        };
      });
      setActiveAlert(null);
    },
    [settings.reminderIntervalMinutes, todayKey],
  );

  const dismissYesterdayPrayer = useCallback(
    (prayerId: PrayerId) => {
      setLogsByDate((prev) => ({
        ...prev,
        [yesterdayKey]: dismissCarryoverPrayer(prev[yesterdayKey], prayerId),
      }));
    },
    [yesterdayKey],
  );

  const updateSettings = useCallback((patch: Partial<ReminderSettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...patch,
      offsets: patch.offsets ? { ...prev.offsets, ...patch.offsets } : prev.offsets,
    }));
  }, []);

  const handleRequestNotifications = useCallback(async () => {
    await unlockAudio();
    const res = await requestNotificationPermission();
    setNotifPerm(res);
    if (res === 'granted') {
      updateSettings({ notificationsEnabled: true });
    }
    return res;
  }, [updateSettings]);

  const triggerTestReminder = useCallback(async () => {
    await unlockAudio();
    if (settings.sound !== 'silent') {
      await playReminderSound(settings.sound);
    }
    if (settings.vibrationEnabled) {
      triggerDeviceVibration(false);
    }
    const perm = getNotificationPermission();
    setNotifPerm(perm);

    const testIds: PrayerId[] =
      evaluation.pendingPrayers.length > 0
        ? evaluation.pendingPrayers.map((p) => p.id)
        : [nextPrayer.id];

    const notifSent = await sendPrayerNotification({
      title: 'تجربة تذكير الصلاة — صلاتي',
      body: `هكذا سيظهر التذكير كل ${settings.reminderIntervalMinutes} دقيقة حتى تضغط «صليت ✓»`,
      dateKey: todayKey,
      prayerIds: testIds,
      overdue: false,
    });

    setActiveAlert({
      title: 'تجربة التذكير شغالة بنجاح ✓',
      body: `هيفكرك التطبيق كل ${settings.reminderIntervalMinutes} دقيقة عند دخول وقت الصلاة وحتى لو فات وقتها لحد ما تضغط «صليت ✓».`,
      prayerIds: testIds,
      hasOverdue: false,
      isTest: true,
    });

    setTestBannerMsg(
      notifSent
        ? 'تم إرسال إشعار تجريبي + تشغيل الصوت والاهتزاز.'
        : perm === 'granted'
          ? 'تم تشغيل الصوت والاهتزاز (تأكد من فتح التطبيق عبر HTTPS لإشعارات Chrome الكاملة).'
          : 'تم تشغيل الصوت والاهتزاز! فعل إذن الإشعارات ليصلك التنبيه في الخلفية.',
    );
    window.setTimeout(() => setTestBannerMsg(null), 5000);
  }, [
    evaluation.pendingPrayers,
    nextPrayer.id,
    settings.reminderIntervalMinutes,
    settings.sound,
    settings.vibrationEnabled,
    todayKey,
  ]);

  const detectGpsLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setGpsStatus('المتصفح لا يدعم تحديد الموقع التلقائي.');
      return;
    }
    setGpsStatus('جاري تحديد موقعك...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateSettings({
          customLocation: {
            latitude: Number(pos.coords.latitude.toFixed(4)),
            longitude: Number(pos.coords.longitude.toFixed(4)),
            labelAr: 'موقعي الحالي (GPS)',
          },
        });
        setGpsStatus('تم تحديث المواقيت حسب موقعك الحالي بنجاح.');
      },
      () => {
        setGpsStatus('تعذر الوصول للموقع — يمكنك اختيار محافظتك من القائمة.');
      },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  }, [updateSettings]);

  const triggerPwaInstall = useCallback(async () => {
    if (!installEvent) return false;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    setInstallEvent(null);
    return outcome === 'accepted';
  }, [installEvent]);

  const dismissAlertPopup = useCallback(() => {
    setActiveAlert(null);
  }, []);

  const resetAllOffsets = useCallback(() => {
    const empty = PRAYER_ORDER.reduce(
      (acc, id) => ({ ...acc, [id]: 0 }),
      {} as ReminderSettings['offsets'],
    );
    updateSettings({ offsets: empty });
  }, [updateSettings]);

  return {
    now,
    todayKey,
    yesterdayKey,
    schedule,
    monthSchedules,
    todayLog,
    logsByDate,
    settings,
    evaluation,
    nextPrayer,
    prayedCountToday,
    streak,
    locationLabel,
    yesterdayUnprayed,
    notifPerm,
    activeAlert,
    canInstallPwa: Boolean(installEvent),
    gpsStatus,
    testBannerMsg,
    togglePrayer,
    markPrayersDone,
    snoozePendingPrayers,
    dismissYesterdayPrayer,
    updateSettings,
    handleRequestNotifications,
    triggerTestReminder,
    detectGpsLocation,
    triggerPwaInstall,
    dismissAlertPopup,
    resetAllOffsets,
  };
}
