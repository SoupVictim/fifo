import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { FifoIcon } from '../components/FifoIcon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useFifo } from '../store/FifoContext';
import { ReminderLeadDays } from '../types/fifo';
import { getDaysRemaining } from '../utils/dateParser';
import { sendTestExpiryNotification } from '../utils/notifications';

const DIGEST_HOUR_OPTIONS = [
  { label: '08:00 AM', hour: 8 },
  { label: '09:00 AM', hour: 9 },
  { label: '05:30 PM', hour: 17 },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const {
    items,
    settings,
    viewMode,
    setViewMode,
    updateSettings,
    resetDemoData,
  } = useFifo();
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => {});
    }
    setStatusFeedback(msg);
    setTimeout(() => {
      setStatusFeedback(null);
    }, 2500);
  };

  const handleTestNotification = async () => {
    const urgentItems = items.filter(
      (i) => getDaysRemaining(i.expiryDate) <= 2
    );
    const ok = await sendTestExpiryNotification(
      urgentItems.length,
      urgentItems[0]?.name
    );
    if (ok) {
      const previewItem = urgentItems[0]?.name || 'Scottish Salmon Fillets';
      showFeedback(
        `🔔 Alert Preview: "${previewItem}" expires soon — Use first or move to Freezer!`
      );
    } else {
      showFeedback('Please allow notifications in system settings.');
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: Math.max(insets.top, 14) }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.kicker}>REMINDERS & PREFERENCES</Text>
          <Text style={styles.title}>Alerts & Settings</Text>
        </View>

        {statusFeedback ? (
          <View style={styles.feedbackBanner}>
            <FifoIcon name="check-circle" size={16} color="#059669" />
            <Text style={styles.feedbackText}>{statusFeedback}</Text>
          </View>
        ) : null}

        {/* Expiry Notification Settings Card */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Expiry Reminders</Text>

          {/* Default Lead Time (1, 2, 3 days before) */}
          <View style={styles.settingBlock}>
            <View style={styles.settingLabelCol}>
              <Text style={styles.settingTitle}>Default Reminder Notice</Text>
              <Text style={styles.settingDesc}>
                Automatically pre-selected when scanning new items
              </Text>
            </View>
            <View style={styles.segmentedRow}>
              {([1, 2, 3] as ReminderLeadDays[]).map((d) => {
                const active = settings.defaultReminderDays === d;
                return (
                  <Pressable
                    key={d}
                    onPress={() => {
                      updateSettings({ defaultReminderDays: d });
                      showFeedback(`Default reminder set to ${d}d before expiry`);
                    }}
                    style={[
                      styles.segmentBtn,
                      active && styles.segmentBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        active && styles.segmentTextActive,
                      ]}
                    >
                      {d} {d === 1 ? 'Day' : 'Days'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Daily Digest Notification Time */}
          <View style={styles.settingBlock}>
            <View style={styles.settingRowInline}>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingTitle}>Daily Summary Digest</Text>
                <Text style={styles.settingDesc}>
                  Batch expiring items into a single daily reminder
                </Text>
              </View>
              <Switch
                value={settings.dailyDigestEnabled}
                onValueChange={(val) =>
                  updateSettings({ dailyDigestEnabled: val })
                }
                trackColor={{ false: '#CBD5E1', true: '#A7F3D0' }}
                thumbColor={settings.dailyDigestEnabled ? '#059669' : '#F8FAFC'}
              />
            </View>

            {settings.dailyDigestEnabled && (
              <View style={[styles.segmentedRow, { marginTop: 10 }]}>
                {DIGEST_HOUR_OPTIONS.map((opt) => {
                  const active = settings.dailyDigestHour === opt.hour;
                  return (
                    <Pressable
                      key={opt.hour}
                      onPress={() => {
                        updateSettings({ dailyDigestHour: opt.hour });
                        showFeedback(`Daily digest scheduled for ${opt.label}`);
                      }}
                      style={[
                        styles.segmentBtn,
                        active && styles.segmentBtnActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          active && styles.segmentTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {/* Test Notification Action */}
          <Pressable
            onPress={handleTestNotification}
            style={({ pressed }) => [
              styles.testNotifBtn,
              pressed && { opacity: 0.8 },
            ]}
          >
            <FifoIcon name="bell" size={16} color="#059669" />
            <Text style={styles.testNotifText}>Send Test Expiry Alert Now</Text>
          </Pressable>
        </View>

        {/* Smart Kitchen Rules & Layout Preferences */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Smart Rules & Display</Text>

          {/* Opened Cap Rule */}
          <View style={styles.settingBlock}>
            <Text style={styles.settingTitle}>"Mark as Opened" Shelf-Life</Text>
            <Text style={styles.settingDesc}>
              When you mark milk, sauces, or packs as opened, cap remaining days to:
            </Text>
            <View style={styles.segmentedRow}>
              {[2, 3, 5].map((days) => {
                const active = settings.openedCapDays === days;
                return (
                  <Pressable
                    key={days}
                    onPress={() => {
                      updateSettings({ openedCapDays: days });
                      showFeedback(`Opened items capped at ${days} days`);
                    }}
                    style={[
                      styles.segmentBtn,
                      active && styles.segmentBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        active && styles.segmentTextActive,
                      ]}
                    >
                      {days} Days
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Default View Mode (Tiles vs List) */}
          <View style={styles.settingRowInline}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Kitchen Layout Mode</Text>
              <Text style={styles.settingDesc}>
                Switch between 2-column Tiles and single-column List
              </Text>
            </View>
            <View style={styles.miniToggleGroup}>
              <Pressable
                onPress={() => setViewMode('tiles')}
                style={[
                  styles.miniToggleBtn,
                  viewMode === 'tiles' && styles.miniToggleBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.miniToggleText,
                    viewMode === 'tiles' && styles.miniToggleTextActive,
                  ]}
                >
                  Tiles
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setViewMode('list')}
                style={[
                  styles.miniToggleBtn,
                  viewMode === 'list' && styles.miniToggleBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.miniToggleText,
                    viewMode === 'list' && styles.miniToggleTextActive,
                  ]}
                >
                  List
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.divider} />

          {/* OpenFoodFacts Barcode Toggle */}
          <View style={styles.settingRowInline}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Barcode Auto-Lookup</Text>
              <Text style={styles.settingDesc}>
                Auto-fill product name, brand & category via OpenFoodFacts
              </Text>
            </View>
            <Switch
              value={settings.autoBarcodeLookup}
              onValueChange={(val) =>
                updateSettings({ autoBarcodeLookup: val })
              }
              trackColor={{ false: '#CBD5E1', true: '#A7F3D0' }}
              thumbColor={settings.autoBarcodeLookup ? '#059669' : '#F8FAFC'}
            />
          </View>
        </View>

        {/* Demo Data Reset */}
        <Pressable
          onPress={async () => {
            await resetDemoData();
            showFeedback('Restored sample kitchen inventory!');
          }}
          style={({ pressed }) => [
            styles.resetBtn,
            pressed && { opacity: 0.75 },
          ]}
        >
          <FifoIcon name="refresh-cw" size={14} color="#64748B" />
          <Text style={styles.resetBtnText}>Restore Sample Kitchen Items</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 120,
  },
  header: {
    paddingTop: 6,
    paddingBottom: 14,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.6,
    marginTop: 1,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  feedbackText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#047857',
    flex: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  cardSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  settingBlock: {
    gap: 8,
  },
  settingLabelCol: {
    gap: 2,
  },
  settingRowInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  settingDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 17,
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  segmentBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    borderRadius: 13,
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  testNotifBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingVertical: 12,
    borderRadius: 15,
  },
  testNotifText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#047857',
  },
  miniToggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
  },
  miniToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9,
  },
  miniToggleBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  miniToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  miniToggleTextActive: {
    color: '#0F172A',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
});
