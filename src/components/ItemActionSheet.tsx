import React from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FifoIcon } from './FifoIcon';
import * as Haptics from 'expo-haptics';
import { FoodCategory, FoodItem, ReminderLeadDays } from '../types/fifo';
import { CATEGORIES } from '../utils/categories';
import {
  addDaysToIso,
  formatReadableDate,
  getDaysRemaining,
} from '../utils/dateParser';
import { DayExpiryCircle } from './DayExpiryCircle';
import { FoodThumbnail } from './FoodThumbnail';

interface ItemActionSheetProps {
  item: FoodItem | null;
  openedCapDays: number;
  onClose: () => void;
  onConsume: (id: string) => void;
  onMarkOpened: (id: string) => void;
  onMoveToFreezer: (id: string) => void;
  onTossExpired: (id: string) => void;
  onUpdateItem: (id: string, patch: Partial<FoodItem>) => void;
}

export function ItemActionSheet({
  item,
  openedCapDays,
  onClose,
  onConsume,
  onMarkOpened,
  onMoveToFreezer,
  onTossExpired,
  onUpdateItem,
}: ItemActionSheetProps) {
  if (!item) return null;

  const daysRemaining = getDaysRemaining(item.expiryDate);
  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  };

  return (
    <Modal
      visible={!!item}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropDismiss} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.handleBar} />

          {/* Header Summary */}
          <View style={styles.headerRow}>
            <FoodThumbnail
              photoUri={item.photoUri}
              category={item.category}
              variant="large"
            />
            <View style={styles.headerInfo}>
              <Text style={styles.itemTitle} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.itemSub}>
                Best before {formatReadableDate(item.expiryDate)}
              </Text>
              {item.brand ? (
                <Text style={styles.brandText}>{item.brand}</Text>
              ) : null}
            </View>
            <DayExpiryCircle
              daysRemaining={daysRemaining}
              isFrozen={item.category === 'Frozen'}
              size={54}
              strokeWidth={4.5}
            />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Primary Quick Actions */}
            <View style={styles.primaryActionsGrid}>
              <Pressable
                onPress={() => {
                  triggerHaptic();
                  onConsume(item.id);
                  onClose();
                }}
                style={({ pressed }) => [
                  styles.actionBtn,
                  styles.consumeBtn,
                  pressed && styles.btnPressed,
                ]}
              >
                <FifoIcon name="check-circle" size={18} color="#FFFFFF" />
                <Text style={styles.consumeBtnText}>Mark as Used</Text>
              </Pressable>

              <View style={styles.secondaryActionRow}>
                <Pressable
                  onPress={() => {
                    triggerHaptic();
                    onMarkOpened(item.id);
                    onClose();
                  }}
                  style={({ pressed }) => [
                    styles.secondaryActionBtn,
                    styles.openedBtn,
                    pressed && styles.btnPressed,
                  ]}
                >
                  <FifoIcon name="unlock" size={15} color="#B45309" />
                  <Text style={styles.openedBtnText}>
                    {item.isOpened
                      ? `Opened (${openedCapDays}d cap)`
                      : `Opened (${openedCapDays}d)`}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    triggerHaptic();
                    onMoveToFreezer(item.id);
                    onClose();
                  }}
                  style={({ pressed }) => [
                    styles.secondaryActionBtn,
                    styles.freezeBtn,
                    pressed && styles.btnPressed,
                  ]}
                >
                  <FifoIcon name="wind" size={15} color="#0369A1" />
                  <Text style={styles.freezeBtnText}>Freeze (+90d)</Text>
                </Pressable>
              </View>
            </View>

            {/* Modify Expiry Date */}
            <View style={styles.sectionBox}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionLabel}>Adjust Expiry Date</Text>
                <Text style={styles.sectionValue}>
                  {formatReadableDate(item.expiryDate)}
                </Text>
              </View>
              <View style={styles.dateAdjustRow}>
                {[
                  { label: '-1 Day', delta: -1 },
                  { label: '+1 Day', delta: 1 },
                  { label: '+3 Days', delta: 3 },
                  { label: '+1 Week', delta: 7 },
                ].map((btn) => (
                  <Pressable
                    key={btn.label}
                    onPress={() => {
                      triggerHaptic();
                      onUpdateItem(item.id, {
                        expiryDate: addDaysToIso(item.expiryDate, btn.delta),
                      });
                    }}
                    style={({ pressed }) => [
                      styles.adjustPill,
                      pressed && styles.btnPressed,
                    ]}
                  >
                    <Text style={styles.adjustPillText}>{btn.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Change Category */}
            <View style={styles.sectionBox}>
              <Text style={styles.sectionLabel}>Category & Storage</Text>
              <View style={styles.categoryWrap}>
                {CATEGORIES.map((cat) => {
                  const active = item.category === cat.id;
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => {
                        triggerHaptic();
                        onUpdateItem(item.id, {
                          category: cat.id as FoodCategory,
                        });
                      }}
                      style={[
                        styles.catChoicePill,
                        active && {
                          backgroundColor: '#0F172A',
                          borderColor: '#0F172A',
                        },
                      ]}
                    >
                      <Text style={styles.catChoiceEmoji}>{cat.emoji}</Text>
                      <Text
                        style={[
                          styles.catChoiceText,
                          active && { color: '#FFFFFF' },
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Notification Lead Time */}
            <View style={styles.sectionBox}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionLabel}>Expiry Reminder Notice</Text>
                <View style={styles.leadRow}>
                  {([1, 2, 3] as ReminderLeadDays[]).map((lead) => {
                    const active = item.reminderDaysBefore === lead;
                    return (
                      <Pressable
                        key={lead}
                        onPress={() => {
                          triggerHaptic();
                          onUpdateItem(item.id, { reminderDaysBefore: lead });
                        }}
                        style={[
                          styles.leadPill,
                          active && styles.leadPillActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.leadPillText,
                            active && styles.leadPillTextActive,
                          ]}
                        >
                          {lead}d before
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Toss / Expired Button */}
            <Pressable
              onPress={() => {
                triggerHaptic();
                onTossExpired(item.id);
                onClose();
              }}
              style={({ pressed }) => [
                styles.tossBtn,
                pressed && styles.btnPressed,
              ]}
            >
              <FifoIcon name="trash-2" size={15} color="#E11D48" />
              <Text style={styles.tossBtnText}>Toss / Mark as Wasted</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  backdropDismiss: {
    flex: 1,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    maxHeight: '84%',
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  itemSub: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginTop: 2,
  },
  brandText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 1,
  },
  scrollContent: {
    paddingTop: 16,
    gap: 14,
  },
  primaryActionsGrid: {
    gap: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 18,
  },
  consumeBtn: {
    backgroundColor: '#059669',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  consumeBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  openedBtn: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  openedBtnText: {
    color: '#B45309',
    fontSize: 13,
    fontWeight: '700',
  },
  freezeBtn: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  freezeBtnText: {
    color: '#0369A1',
    fontSize: 13,
    fontWeight: '700',
  },
  btnPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  sectionBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  sectionValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  dateAdjustRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  adjustPill: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  adjustPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  catChoicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catChoiceEmoji: {
    fontSize: 13,
  },
  catChoiceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  leadRow: {
    flexDirection: 'row',
    gap: 6,
  },
  leadPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  leadPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  leadPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  leadPillTextActive: {
    color: '#FFFFFF',
  },
  tossBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  tossBtnText: {
    color: '#E11D48',
    fontSize: 13,
    fontWeight: '700',
  },
});
