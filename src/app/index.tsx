import React, { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { FifoIcon } from '../components/FifoIcon';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useFifo } from '../store/FifoContext';
import { FoodCategory, FoodItem, SortOption } from '../types/fifo';
import { CATEGORIES } from '../utils/categories';
import { getDaysRemaining } from '../utils/dateParser';
import { FoodItemCard } from '../components/FoodItemCard';
import { ItemActionSheet } from '../components/ItemActionSheet';

const FILTER_CATEGORIES: ('All' | FoodCategory)[] = [
  'All',
  ...CATEGORIES.map((c) => c.id),
];

export default function KitchenInventoryScreen() {
  const insets = useSafeAreaInsets();
  const {
    items,
    settings,
    viewMode,
    setViewMode,
    consumeItem,
    markItemOpened,
    moveItemToFreezer,
    tossExpiredItem,
    updateItem,
  } = useFifo();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | FoodCategory>('All');
  const [sortBy, setSortBy] = useState<SortOption>('expiry');
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  const activeItem = useMemo(
    () => items.find((i) => i.id === activeItemId) ?? null,
    [items, activeItemId]
  );

  const urgentCount = useMemo(
    () => items.filter((i) => getDaysRemaining(i.expiryDate) <= 2).length,
    [items]
  );

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = items.filter((item) => {
      const matchesCat =
        selectedCategory === 'All' || item.category === selectedCategory;
      const matchesQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.brand && item.brand.toLowerCase().includes(q));
      return matchesCat && matchesQuery;
    });

    list.sort((a, b) => {
      if (sortBy === 'expiry') {
        return getDaysRemaining(a.expiryDate) - getDaysRemaining(b.expiryDate);
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return a.category.localeCompare(b.category);
    });

    return list;
  }, [items, searchQuery, selectedCategory, sortBy]);

  // Pair items for 2-column tile grid
  const tileRows = useMemo(() => {
    const rows: FoodItem[][] = [];
    for (let i = 0; i < filteredItems.length; i += 2) {
      rows.push(filteredItems.slice(i, i + 2));
    }
    return rows;
  }, [filteredItems]);

  const cycleSortOption = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => {});
    }
    if (sortBy === 'expiry') setSortBy('name');
    else if (sortBy === 'name') setSortBy('category');
    else setSortBy('expiry');
  };

  return (
    <View style={[styles.screen, { paddingTop: Math.max(insets.top, 14) }]}>
      {/* Top Header */}
      <View style={styles.headerContainer}>
        <View>
          <View style={styles.brandRow}>
            <View style={styles.brandDot} />
            <Text style={styles.brandKicker}>FIRST IN, FIRST OUT</Text>
          </View>
          <Text style={styles.screenTitle}>My Kitchen</Text>
        </View>

        <View style={styles.headerRight}>
          {/* Urgent Alert Pill */}
          <View
            style={[
              styles.urgentBadge,
              urgentCount === 0 && styles.urgentBadgeSafe,
            ]}
          >
            <View
              style={[
                styles.urgentDot,
                urgentCount === 0 && { backgroundColor: '#10B981' },
              ]}
            />
            <Text
              style={[
                styles.urgentBadgeText,
                urgentCount === 0 && { color: '#047857' },
              ]}
            >
              {urgentCount > 0 ? `${urgentCount} expiring` : 'All fresh'}
            </Text>
          </View>

          {/* 1-Tap View Switcher (Tiles vs List) */}
          <View style={styles.viewToggleSegment}>
            <Pressable
              onPress={() => setViewMode('tiles')}
              style={[
                styles.viewToggleBtn,
                viewMode === 'tiles' && styles.viewToggleBtnActive,
              ]}
              accessibilityLabel="Switch to Tile view"
            >
              <FifoIcon
                name="grid"
                size={15}
                color={viewMode === 'tiles' ? '#0F172A' : '#94A3B8'}
              />
            </Pressable>
            <Pressable
              onPress={() => setViewMode('list')}
              style={[
                styles.viewToggleBtn,
                viewMode === 'list' && styles.viewToggleBtnActive,
              ]}
              accessibilityLabel="Switch to List view"
            >
              <FifoIcon
                name="list"
                size={15}
                color={viewMode === 'list' ? '#0F172A' : '#94A3B8'}
              />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Search Bar & Sort Button */}
      <View style={styles.searchSortRow}>
        <View style={styles.searchBox}>
          <FifoIcon name="search" size={16} color="#94A3B8" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search milk, chicken, spinach..."
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <FifoIcon name="x-circle" size={15} color="#94A3B8" />
            </Pressable>
          )}
        </View>

        <Pressable
          onPress={cycleSortOption}
          style={({ pressed }) => [
            styles.sortPill,
            pressed && { opacity: 0.75 },
          ]}
        >
          <FifoIcon name="sliders" size={13} color="#334155" />
          <Text style={styles.sortPillText}>
            {sortBy === 'expiry'
              ? 'Expiry'
              : sortBy === 'name'
              ? 'Name'
              : 'Category'}
          </Text>
        </Pressable>
      </View>

      {/* Category Filter Strip */}
      <View style={styles.categoryStripWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryStrip}
        >
          {FILTER_CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[
                  styles.categoryFilterChip,
                  active && styles.categoryFilterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.categoryFilterText,
                    active && styles.categoryFilterTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Items Feed (Tiles or List) */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.feedScrollContent}
      >
        {filteredItems.length === 0 ? (
          <View style={styles.emptyStateBox}>
            <View style={styles.emptyIconCircle}>
              <FifoIcon name="camera" size={26} color="#059669" />
            </View>
            <Text style={styles.emptyTitle}>No items found</Text>
            <Text style={styles.emptySubtitle}>
              Scan an expiry date or barcode to add groceries in seconds.
            </Text>
            <Pressable
              onPress={() => router.push('/scan')}
              style={styles.emptyScanBtn}
            >
              <FifoIcon name="maximize" size={16} color="#FFFFFF" />
              <Text style={styles.emptyScanBtnText}>Scan First Item</Text>
            </Pressable>
          </View>
        ) : viewMode === 'tiles' ? (
          <View style={styles.tilesGridContainer}>
            {tileRows.map((row, idx) => (
              <View key={idx} style={styles.tileRow}>
                <FoodItemCard
                  item={row[0]}
                  mode="tiles"
                  onPress={(it) => setActiveItemId(it.id)}
                  onQuickConsume={(it) => consumeItem(it.id)}
                />
                {row[1] ? (
                  <FoodItemCard
                    item={row[1]}
                    mode="tiles"
                    onPress={(it) => setActiveItemId(it.id)}
                    onQuickConsume={(it) => consumeItem(it.id)}
                  />
                ) : (
                  <View style={styles.tilePlaceholderSpacer} />
                )}
              </View>
            ))}
          </View>
        ) : (
          <View>
            {filteredItems.map((item) => (
              <FoodItemCard
                key={item.id}
                item={item}
                mode="list"
                onPress={(it) => setActiveItemId(it.id)}
                onQuickConsume={(it) => consumeItem(it.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom Sheet Modal for Item Actions & Edits */}
      <ItemActionSheet
        item={activeItem}
        openedCapDays={settings.openedCapDays}
        onClose={() => setActiveItemId(null)}
        onConsume={consumeItem}
        onMarkOpened={markItemOpened}
        onMoveToFreezer={moveItemToFreezer}
        onTossExpired={tossExpiredItem}
        onUpdateItem={updateItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  brandKicker: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.8,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.6,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  urgentBadgeSafe: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  urgentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  urgentBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  viewToggleSegment: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 3,
  },
  viewToggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9,
  },
  viewToggleBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  searchSortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },
  sortPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: 13,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sortPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  categoryStripWrapper: {
    marginBottom: 8,
  },
  categoryStrip: {
    paddingHorizontal: 18,
    gap: 7,
    paddingVertical: 2,
  },
  categoryFilterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryFilterChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  categoryFilterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  categoryFilterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  feedScrollContent: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 110,
  },
  tilesGridContainer: {
    gap: 12,
  },
  tileRow: {
    flexDirection: 'row',
    gap: 12,
  },
  tilePlaceholderSpacer: {
    flex: 1,
  },
  emptyStateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 18,
    lineHeight: 19,
  },
  emptyScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
  },
  emptyScanBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
