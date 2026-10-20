import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FifoIcon } from './FifoIcon';
import { FoodItem, ViewMode } from '../types/fifo';
import { getCategoryMeta } from '../utils/categories';
import { formatShortDate, getDaysRemaining } from '../utils/dateParser';
import { DayExpiryCircle } from './DayExpiryCircle';
import { FoodThumbnail } from './FoodThumbnail';

interface FoodItemCardProps {
  item: FoodItem;
  mode: ViewMode;
  onPress: (item: FoodItem) => void;
  onQuickConsume: (item: FoodItem) => void;
}

export function FoodItemCard({
  item,
  mode,
  onPress,
  onQuickConsume,
}: FoodItemCardProps) {
  const daysRemaining = getDaysRemaining(item.expiryDate);
  const categoryMeta = getCategoryMeta(item.category);
  const isFrozen = item.category === 'Frozen';

  if (mode === 'tiles') {
    return (
      <Pressable
        onPress={() => onPress(item)}
        style={({ pressed }) => [
          styles.tileCard,
          pressed && styles.cardPressed,
        ]}
      >
        <View style={styles.tileVisualWrap}>
          <FoodThumbnail
            photoUri={item.photoUri}
            category={item.category}
            variant="tile"
          />
          <View style={styles.tileCircleFloating}>
            <DayExpiryCircle
              daysRemaining={daysRemaining}
              isFrozen={isFrozen}
              size={44}
              strokeWidth={3.5}
              elevated
            />
          </View>
        </View>

        <View style={styles.tileBody}>
          <Text style={styles.tileTitle} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.tileMetaRow}>
            <Text style={styles.metaDateText}>
              Exp {formatShortDate(item.expiryDate)}
            </Text>
            {item.isOpened && (
              <View style={styles.openedMiniPill}>
                <Text style={styles.openedMiniText}>Opened</Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => onPress(item)}
      style={({ pressed }) => [
        styles.listCard,
        pressed && styles.cardPressed,
      ]}
    >
      <FoodThumbnail
        photoUri={item.photoUri}
        category={item.category}
        variant="row"
      />

      <View style={styles.listContent}>
        <Text style={styles.listTitle} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.listSubtitleRow}>
          <View
            style={[
              styles.categoryPill,
              { backgroundColor: categoryMeta.softBg },
            ]}
          >
            <Text
              style={[
                styles.categoryPillText,
                { color: categoryMeta.accentColor },
              ]}
            >
              {categoryMeta.label}
            </Text>
          </View>
          <Text style={styles.dotSeparator}>•</Text>
          <Text style={styles.metaDateText}>
            Exp {formatShortDate(item.expiryDate)}
          </Text>
          {item.isOpened && (
            <View style={styles.openedMiniPill}>
              <Text style={styles.openedMiniText}>Opened</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.listRightActions}>
        <DayExpiryCircle
          daysRemaining={daysRemaining}
          isFrozen={isFrozen}
          size={46}
          strokeWidth={4}
        />
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onQuickConsume(item);
          }}
          hitSlop={8}
          style={({ pressed }) => [
            styles.quickCheckBtn,
            pressed && { opacity: 0.7 },
          ]}
          accessibilityLabel={`Mark ${item.name} as used`}
        >
          <FifoIcon name="check" size={16} color="#059669" />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tileCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  tileVisualWrap: {
    position: 'relative',
    marginBottom: 14,
  },
  tileCircleFloating: {
    position: 'absolute',
    right: 8,
    bottom: -14,
  },
  tileBody: {
    paddingHorizontal: 2,
    paddingBottom: 2,
  },
  tileTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  tileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: '#F8FAFC',
  },
  listContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  listSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 5,
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dotSeparator: {
    fontSize: 12,
    color: '#94A3B8',
  },
  metaDateText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  openedMiniPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  openedMiniText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  listRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickCheckBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
