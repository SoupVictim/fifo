import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { FoodItem } from '../types/fifo';
import { formatReadableDate } from './dateParser';

const CHANNEL_ID = 'fifo-expiry-alerts';

/**
 * Safely returns the expo-notifications module only when running in a standalone
 * or development build. In Expo Go on Android (storeClient) or on Web, returns null
 * so `ExpoTopicSubscriptionModule` is never evaluated and never crashes Expo Go.
 */
function getNativeNotifications(): typeof import('expo-notifications') | null {
  if (Platform.OS === 'web') return null;
  if (
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient
  ) {
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-notifications');
  } catch {
    return null;
  }
}

export function configureNotificationsHandler(): void {
  const Notifications = getNativeNotifications();
  if (!Notifications) return;

  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch {
    // Ignore in unsupported environments
  }
}

export async function ensureNotificationPermissions(): Promise<boolean> {
  const Notifications = getNativeNotifications();
  if (!Notifications) return true;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Food Expiry Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 200, 120, 200],
        lightColor: '#10B981',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch {
    return false;
  }
}

export async function cancelItemNotification(notificationId?: string): Promise<void> {
  if (!notificationId) return;
  const Notifications = getNativeNotifications();
  if (!Notifications) return;

  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // Ignore if already delivered or cancelled
  }
}

export async function scheduleExpiryNotification(
  item: Pick<FoodItem, 'name' | 'category' | 'expiryDate' | 'reminderDaysBefore'>,
  digestHour: number = 9
): Promise<string | undefined> {
  const Notifications = getNativeNotifications();
  if (!Notifications) {
    // Return a local tracking ID in Expo Go / Web
    return `local-alert-${Date.now()}`;
  }

  const granted = await ensureNotificationPermissions();
  if (!granted) return undefined;

  try {
    const parts = item.expiryDate.split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return undefined;

    const triggerDate = new Date(
      parts[0],
      parts[1] - 1,
      parts[2] - item.reminderDaysBefore,
      digestHour,
      0,
      0
    );

    const now = new Date();
    if (triggerDate.getTime() <= now.getTime()) {
      return undefined;
    }

    const dayWord =
      item.reminderDaysBefore === 1
        ? 'tomorrow'
        : `in ${item.reminderDaysBefore} days`;
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Fifo: ${item.name} expires ${dayWord}`,
        body: `${item.category} item • Best before ${formatReadableDate(item.expiryDate)}. Use it soon or move to Freezer!`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: CHANNEL_ID,
      },
    });
    return id;
  } catch {
    return undefined;
  }
}

export async function sendTestExpiryNotification(
  urgentItemsCount: number,
  sampleItemName?: string
): Promise<boolean> {
  const Notifications = getNativeNotifications();
  if (!Notifications) {
    // In Expo Go / Web, return true so the in-app banner confirms the reminder rule
    return true;
  }

  const granted = await ensureNotificationPermissions();
  if (!granted) return false;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title:
          urgentItemsCount > 0
            ? `Fifo Daily Digest • ${urgentItemsCount} item${urgentItemsCount === 1 ? '' : 's'} expiring soon`
            : 'Fifo Reminder Test • Everything is Fresh!',
        body: sampleItemName
          ? `Use "${sampleItemName}" first (First In, First Out) or freeze it in one tap.`
          : 'Your expiry reminders are active and ready.',
        sound: true,
      },
      trigger: null,
    });
    return true;
  } catch {
    return false;
  }
}
