export type PrayerId = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export type PrayerStatus = 'upcoming' | 'due' | 'overdue' | 'prayed' | 'muted';

export type SoundChoice = 'adhan-chime' | 'gentle' | 'strong' | 'silent';

export type AsrMadhab = 'shafi' | 'hanafi';

export type ThemeMode = 'dark' | 'light';

export interface Governorate {
  id: string;
  nameAr: string;
  regionAr: string;
  latitude: number;
  longitude: number;
}

export interface PrayerScheduleItem {
  id: PrayerId;
  arabicName: string;
  startTime: number;
  endTime: number;
}

export interface DailySchedule {
  dateKey: string;
  date: Date;
  sunrise: number;
  prayers: PrayerScheduleItem[];
  nextDayFajr: number;
}

export interface NextPrayerInfo {
  id: PrayerId;
  arabicName: string;
  startTime: number;
  remainingMs: number;
  isTomorrow: boolean;
  progressPercent: number;
}

export interface PrayerRecord {
  prayed: boolean;
  muted?: boolean;
  prayedAt?: number;
  statusWhenPrayed?: 'on-time' | 'late';
  lastRemindedAt?: number;
  reminderCount: number;
  snoozedUntil?: number;
  dismissedCarryover?: boolean;
}

export type DayLog = Record<PrayerId, PrayerRecord>;

export type LogsByDate = Record<string, DayLog>;

export type PrayerOffsets = Record<PrayerId, number>;

export interface ReminderSettings {
  governorateId: string;
  customLocation: {
    latitude: number;
    longitude: number;
    labelAr: string;
  } | null;
  remindersEnabled: boolean;
  reminderIntervalMinutes: number;
  continueAfterEnd: boolean;
  carryOverYesterday: boolean;
  sound: SoundChoice;
  vibrationEnabled: boolean;
  notificationsEnabled: boolean;
  asrMadhab: AsrMadhab;
  theme: ThemeMode;
  offsets: PrayerOffsets;
}

export interface PendingSwAction {
  id: string;
  type: 'MARK_PRAYED' | 'SNOOZE_PRAYERS';
  dateKey?: string;
  prayerIds: PrayerId[];
  minutes?: number;
  timestamp: number;
}
