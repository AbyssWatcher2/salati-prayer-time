import type { LogsByDate, PendingSwAction, ReminderSettings } from '../types/prayer';

const SETTINGS_KEY = 'salati_settings_v1';
const LOGS_KEY = 'salati_logs_v1';
const DB_NAME = 'prayer-reminder-db';
const STORE_NAME = 'pendingActions';

export const DEFAULT_SETTINGS: ReminderSettings = {
  governorateId: 'cairo',
  customLocation: null,
  remindersEnabled: true,
  reminderIntervalMinutes: 15,
  continueAfterEnd: true,
  carryOverYesterday: false,
  sound: 'adhan-chime',
  vibrationEnabled: true,
  notificationsEnabled: true,
  asrMadhab: 'shafi',
  theme: 'dark',
  offsets: {
    fajr: 0,
    dhuhr: 0,
    asr: 0,
    maghrib: 0,
    isha: 0,
  },
};

export function loadSettings(): ReminderSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<ReminderSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      offsets: {
        ...DEFAULT_SETTINGS.offsets,
        ...(parsed.offsets ?? {}),
      },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: ReminderSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export function loadLogs(): LogsByDate {
  try {
    const raw = localStorage.getItem(LOGS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as LogsByDate;
  } catch {
    return {};
  }
}

export function saveLogs(logs: LogsByDate): void {
  try {
    // Keep up to 45 most recent days to prevent unbounded localStorage growth
    const keys = Object.keys(logs).sort();
    const pruned: LogsByDate = {};
    const keptKeys = keys.slice(-45);
    for (const k of keptKeys) {
      pruned[k] = logs[k];
    }
    localStorage.setItem(LOGS_KEY, JSON.stringify(pruned));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export async function drainPendingSwActions(): Promise<PendingSwAction[]> {
  if (typeof indexedDB === 'undefined') return [];
  try {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const database = req.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    const items = await new Promise<PendingSwAction[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getAllReq = store.getAll();
      getAllReq.onsuccess = () => {
        const result = (getAllReq.result as PendingSwAction[]) ?? [];
        if (result.length > 0) {
          store.clear();
        }
        resolve(result);
      };
      getAllReq.onerror = () => reject(getAllReq.error);
      tx.oncomplete = () => db.close();
    });

    return items.sort((a, b) => a.timestamp - b.timestamp);
  } catch {
    return [];
  }
}
