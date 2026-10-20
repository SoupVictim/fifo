import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { UCircle as Circle, USvg as Svg } from '../components/UniversalSvg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFifo } from '../store/FifoContext';
import { CATEGORIES } from '../utils/categories';

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const { items, stats } = useFifo();

  const totalHandled = stats.consumedCount + stats.expiredTossedCount;
  const freshnessScore =
    totalHandled > 0
      ? Math.round((stats.consumedCount / totalHandled) * 100)
      : 100;

  const size = 148;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - freshnessScore / 100);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
    return counts;
  }, [items]);

  return (
    <View style={[styles.screen, { paddingTop: Math.max(insets.top, 14) }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.kicker}>FOOD WASTE & CONSUMPTION</Text>
          <Text style={styles.title}>Freshness Tracker</Text>
        </View>

        {/* Hero Circular Score Ring Card */}
        <View style={styles.scoreCard}>
          <View style={styles.ringWrapper}>
            <Svg width={size} height={size}>
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#D1FAE5"
                strokeWidth={strokeWidth}
                fill="none"
              />
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#10B981"
                strokeWidth={strokeWidth}
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                rotation="-90"
                origin={`${size / 2}, ${size / 2}`}
              />
            </Svg>
            <View style={styles.ringCenterText}>
              <Text style={styles.scorePct}>{freshnessScore}%</Text>
              <Text style={styles.scoreLabel}>USED FRESH</Text>
            </View>
          </View>

          <Text style={styles.heroHeadline}>
            Great kitchen efficiency!
          </Text>
          <Text style={styles.heroSubtitle}>
            You have used {stats.consumedCount} items before their expiry date
            and rescued {stats.frozenRescuedCount} items by moving them to the
            freezer.
          </Text>
        </View>

        {/* 3 Metric Tiles */}
        <View style={styles.metricsRow}>
          <View style={styles.metricTile}>
            <Text style={[styles.metricValue, { color: '#059669' }]}>
              {stats.consumedCount}
            </Text>
            <Text style={styles.metricCaption}>Used in Time</Text>
          </View>

          <View style={styles.metricTile}>
            <Text style={[styles.metricValue, { color: '#0284C7' }]}>
              {stats.frozenRescuedCount}
            </Text>
            <Text style={styles.metricCaption}>Frozen Saved</Text>
          </View>

          <View style={styles.metricTile}>
            <Text style={[styles.metricValue, { color: '#E11D48' }]}>
              {stats.expiredTossedCount}
            </Text>
            <Text style={styles.metricCaption}>Expired</Text>
          </View>
        </View>

        {/* Active Kitchen Breakdown by Category */}
        <View style={styles.breakdownCard}>
          <Text style={styles.sectionTitle}>
            Active Kitchen Breakdown ({items.length} items)
          </Text>
          <View style={styles.categoryRows}>
            {CATEGORIES.map((cat) => {
              const count = categoryCounts[cat.id] || 0;
              const pct =
                items.length > 0 ? Math.round((count / items.length) * 100) : 0;
              return (
                <View key={cat.id} style={styles.catRow}>
                  <View style={styles.catRowHeader}>
                    <View style={styles.catNameGroup}>
                      <Text style={styles.catEmoji}>{cat.emoji}</Text>
                      <Text style={styles.catName}>{cat.label}</Text>
                    </View>
                    <Text style={styles.catCountText}>
                      {count} {count === 1 ? 'item' : 'items'}
                    </Text>
                  </View>
                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${Math.max(count > 0 ? 8 : 0, pct)}%`,
                          backgroundColor: cat.accentColor,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>
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
  scoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  ringWrapper: {
    width: 148,
    height: 148,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  ringCenterText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scorePct: {
    fontSize: 32,
    fontWeight: '900',
    color: '#047857',
    letterSpacing: -1,
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  heroHeadline: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  metricTile: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  metricCaption: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 3,
  },
  breakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  categoryRows: {
    gap: 12,
  },
  catRow: {
    gap: 6,
  },
  catRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  catNameGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catEmoji: {
    fontSize: 15,
  },
  catName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  catCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  progressBarTrack: {
    height: 7,
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 999,
  },
});
