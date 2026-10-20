export type FoodCategory = 'Fridge' | 'Fresh' | 'Dairy' | 'Raw' | 'Frozen' | 'Pantry';

export type ReminderLeadDays = 1 | 2 | 3;

export type ViewMode = 'tiles' | 'list';

export type SortOption = 'expiry' | 'name' | 'category';

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  category: FoodCategory;
  /** ISO date string YYYY-MM-DD */
  expiryDate: string;
  createdAt: string;
  reminderDaysBefore: ReminderLeadDays;
  notificationId?: string;
  isOpened: boolean;
  openedAt?: string;
  /** Optional photo URI captured by user or fetched via barcode */
  photoUri?: string;
}

export interface FifoSettings {
  defaultReminderDays: ReminderLeadDays;
  dailyDigestEnabled: boolean;
  /** 24-hour clock hour for daily digest notification (e.g., 9 = 09:00, 17 = 17:00) */
  dailyDigestHour: number;
  /** Number of days an item stays fresh once marked 'Opened' */
  openedCapDays: number;
  autoBarcodeLookup: boolean;
  defaultViewMode: ViewMode;
}

export interface WasteStats {
  consumedCount: number;
  expiredTossedCount: number;
  frozenRescuedCount: number;
}

export interface CategoryMeta {
  id: FoodCategory;
  label: string;
  emoji: string;
  accentColor: string;
  softBg: string;
  borderColor: string;
  description: string;
}
