import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  FifoSettings,
  FoodCategory,
  FoodItem,
  ReminderLeadDays,
  ViewMode,
  WasteStats,
} from '../types/fifo';
import { addDaysToIso, getDaysRemaining, getTodayIso } from '../utils/dateParser';
import {
  cancelItemNotification,
  configureNotificationsHandler,
  scheduleExpiryNotification,
} from '../utils/notifications';

const STORAGE_KEYS = {
  ITEMS: '@fifo/items_v1',
  SETTINGS: '@fifo/settings_v1',
  STATS: '@fifo/stats_v1',
};

const DEFAULT_SETTINGS: FifoSettings = {
  defaultReminderDays: 2,
  dailyDigestEnabled: true,
  dailyDigestHour: 9,
  openedCapDays: 3,
  autoBarcodeLookup: true,
  defaultViewMode: 'tiles',
};

const DEFAULT_STATS: WasteStats = {
  consumedCount: 18,
  expiredTossedCount: 2,
  frozenRescuedCount: 6,
};

function createStarterItems(): FoodItem[] {
  const today = getTodayIso();
  return [
    {
      id: 'seed-1',
      name: 'Scottish Salmon Fillets (2pk)',
      brand: 'Waitrose Duchy',
      category: 'Raw',
      expiryDate: addDaysToIso(today, 1),
      createdAt: today,
      reminderDaysBefore: 1,
      isOpened: false,
    },
    {
      id: 'seed-2',
      name: 'Baby Leaf Spinach & Rocket',
      brand: 'Florette',
      category: 'Fresh',
      expiryDate: addDaysToIso(today, 2),
      createdAt: today,
      reminderDaysBefore: 2,
      isOpened: true,
      openedAt: today,
    },
    {
      id: 'seed-3',
      name: 'Greek Style Natural Yogurt',
      brand: 'Fage Total',
      category: 'Dairy',
      expiryDate: addDaysToIso(today, 3),
      createdAt: today,
      reminderDaysBefore: 2,
      isOpened: false,
    },
    {
      id: 'seed-4',
      name: 'British Whole Milk 2L',
      brand: 'Cravendale',
      category: 'Dairy',
      expiryDate: addDaysToIso(today, 5),
      createdAt: today,
      reminderDaysBefore: 2,
      isOpened: false,
    },
    {
      id: 'seed-5',
      name: 'Free Range Large Eggs (6)',
      brand: 'Clarence Court',
      category: 'Fridge',
      expiryDate: addDaysToIso(today, 8),
      createdAt: today,
      reminderDaysBefore: 3,
      isOpened: false,
    },
    {
      id: 'seed-6',
      name: 'Sliced Sourdough Loaf',
      brand: 'Gail’s Bakery',
      category: 'Frozen',
      expiryDate: addDaysToIso(today, 45),
      createdAt: today,
      reminderDaysBefore: 3,
      isOpened: false,
    },
  ];
}

interface AddFoodItemInput {
  name: string;
  brand?: string;
  barcode?: string;
  category: FoodCategory;
  expiryDate: string;
  reminderDaysBefore: ReminderLeadDays;
  photoUri?: string;
}

interface FifoContextValue {
  items: FoodItem[];
  settings: FifoSettings;
  stats: WasteStats;
  viewMode: ViewMode;
  isLoaded: boolean;
  setViewMode: (mode: ViewMode) => void;
  addItem: (input: AddFoodItemInput) => Promise<FoodItem>;
  updateItem: (id: string, patch: Partial<FoodItem>) => Promise<void>;
  markItemOpened: (id: string) => Promise<void>;
  moveItemToFreezer: (id: string) => Promise<void>;
  consumeItem: (id: string) => Promise<void>;
  tossExpiredItem: (id: string) => Promise<void>;
  updateSettings: (patch: Partial<FifoSettings>) => Promise<void>;
  resetDemoData: () => Promise<void>;
}

const FifoContext = createContext<FifoContextValue | undefined>(undefined);

export function FifoProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [settings, setSettings] = useState<FifoSettings>(DEFAULT_SETTINGS);
  const [stats, setStats] = useState<WasteStats>(DEFAULT_STATS);
  const [viewMode, setViewModeState] = useState<ViewMode>('tiles');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    configureNotificationsHandler();
    (async () => {
      try {
        const [rawItems, rawSettings, rawStats] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.ITEMS),
          AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
          AsyncStorage.getItem(STORAGE_KEYS.STATS),
        ]);

        if (rawSettings) {
          const parsedSettings: FifoSettings = {
            ...DEFAULT_SETTINGS,
            ...JSON.parse(rawSettings),
          };
          setSettings(parsedSettings);
          setViewModeState(parsedSettings.defaultViewMode);
        }

        if (rawItems) {
          setItems(JSON.parse(rawItems));
        } else {
          const starter = createStarterItems();
          setItems(starter);
          await AsyncStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(starter));
        }

        if (rawStats) {
          setStats({ ...DEFAULT_STATS, ...JSON.parse(rawStats) });
        }
      } catch {
        setItems(createStarterItems());
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  const persistItems = useCallback(async (next: FoodItem[]) => {
    setItems(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(next));
    } catch {
      // Ignore storage write error
    }
  }, []);

  const persistSettings = useCallback(async (next: FifoSettings) => {
    setSettings(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(next));
    } catch {
      // Ignore
    }
  }, []);

  const persistStats = useCallback(async (next: WasteStats) => {
    setStats(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(next));
    } catch {
      // Ignore
    }
  }, []);

  const setViewMode = useCallback(
    (mode: ViewMode) => {
      setViewModeState(mode);
      const updated = { ...settings, defaultViewMode: mode };
      persistSettings(updated);
    },
    [settings, persistSettings]
  );

  const addItem = useCallback(
    async (input: AddFoodItemInput): Promise<FoodItem> => {
      const notifId = await scheduleExpiryNotification(
        {
          name: input.name,
          category: input.category,
          expiryDate: input.expiryDate,
          reminderDaysBefore: input.reminderDaysBefore,
        },
        settings.dailyDigestHour
      );

      const newItem: FoodItem = {
        id: `fifo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: input.name.trim() || 'Food Item',
        brand: input.brand?.trim() || undefined,
        barcode: input.barcode,
        category: input.category,
        expiryDate: input.expiryDate,
        createdAt: getTodayIso(),
        reminderDaysBefore: input.reminderDaysBefore,
        notificationId: notifId,
        isOpened: false,
        photoUri: input.photoUri,
      };

      const next = [newItem, ...items];
      await persistItems(next);
      return newItem;
    },
    [items, persistItems, settings.dailyDigestHour]
  );

  const updateItem = useCallback(
    async (id: string, patch: Partial<FoodItem>) => {
      const existing = items.find((i) => i.id === id);
      if (!existing) return;

      const merged: FoodItem = { ...existing, ...patch };
      if (
        patch.expiryDate !== undefined ||
        patch.reminderDaysBefore !== undefined ||
        patch.name !== undefined
      ) {
        await cancelItemNotification(existing.notificationId);
        merged.notificationId = await scheduleExpiryNotification(
          merged,
          settings.dailyDigestHour
        );
      }

      const next = items.map((i) => (i.id === id ? merged : i));
      await persistItems(next);
    },
    [items, persistItems, settings.dailyDigestHour]
  );

  const markItemOpened = useCallback(
    async (id: string) => {
      const existing = items.find((i) => i.id === id);
      if (!existing) return;

      const currentDays = getDaysRemaining(existing.expiryDate);
      const cappedDate =
        currentDays > settings.openedCapDays
          ? addDaysToIso(getTodayIso(), settings.openedCapDays)
          : existing.expiryDate;

      await updateItem(id, {
        isOpened: true,
        openedAt: getTodayIso(),
        expiryDate: cappedDate,
        reminderDaysBefore: 1,
      });
    },
    [items, settings.openedCapDays, updateItem]
  );

  const moveItemToFreezer = useCallback(
    async (id: string) => {
      const existing = items.find((i) => i.id === id);
      if (!existing) return;

      const baseDate =
        getDaysRemaining(existing.expiryDate) < 0 ? getTodayIso() : existing.expiryDate;
      const extendedDate = addDaysToIso(baseDate, 90);

      await updateItem(id, {
        category: 'Frozen',
        expiryDate: extendedDate,
        reminderDaysBefore: 3,
      });

      await persistStats({
        ...stats,
        frozenRescuedCount: stats.frozenRescuedCount + 1,
      });
    },
    [items, updateItem, stats, persistStats]
  );

  const consumeItem = useCallback(
    async (id: string) => {
      const existing = items.find((i) => i.id === id);
      if (existing?.notificationId) {
        await cancelItemNotification(existing.notificationId);
      }
      const next = items.filter((i) => i.id !== id);
      await persistItems(next);
      await persistStats({
        ...stats,
        consumedCount: stats.consumedCount + 1,
      });
    },
    [items, persistItems, stats, persistStats]
  );

  const tossExpiredItem = useCallback(
    async (id: string) => {
      const existing = items.find((i) => i.id === id);
      if (existing?.notificationId) {
        await cancelItemNotification(existing.notificationId);
      }
      const next = items.filter((i) => i.id !== id);
      await persistItems(next);
      await persistStats({
        ...stats,
        expiredTossedCount: stats.expiredTossedCount + 1,
      });
    },
    [items, persistItems, stats, persistStats]
  );

  const updateSettings = useCallback(
    async (patch: Partial<FifoSettings>) => {
      const next = { ...settings, ...patch };
      await persistSettings(next);
    },
    [settings, persistSettings]
  );

  const resetDemoData = useCallback(async () => {
    const starter = createStarterItems();
    await persistItems(starter);
    await persistStats(DEFAULT_STATS);
  }, [persistItems, persistStats]);

  return (
    <FifoContext.Provider
      value={{
        items,
        settings,
        stats,
        viewMode,
        isLoaded,
        setViewMode,
        addItem,
        updateItem,
        markItemOpened,
        moveItemToFreezer,
        consumeItem,
        tossExpiredItem,
        updateSettings,
        resetDemoData,
      }}
    >
      {children}
    </FifoContext.Provider>
  );
}

export function useFifo(): FifoContextValue {
  const ctx = useContext(FifoContext);
  if (!ctx) {
    throw new Error('useFifo must be used within a FifoProvider');
  }
  return ctx;
}
