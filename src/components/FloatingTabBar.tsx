import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { FifoIcon } from './FifoIcon';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

export function FloatingTabBar() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const navigate = (route: '/' | '/scan' | '/stats' | '/settings') => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => {});
    }
    router.push(route);
  };

  const isHome = pathname === '/' || pathname === '/index';
  const isScan = pathname === '/scan';
  const isStats = pathname === '/stats';
  const isSettings = pathname === '/settings';

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.outerWrapper,
        { paddingBottom: Math.max(insets.bottom, 14) },
      ]}
    >
      <View style={styles.pillCapsule}>
        {/* Kitchen / Items Tab */}
        <Pressable
          onPress={() => navigate('/')}
          style={({ pressed }) => [
            styles.navItem,
            isHome && styles.navItemActive,
            pressed && styles.pressed,
          ]}
        >
          <FifoIcon
            name="grid"
            size={18}
            color={isHome ? '#059669' : '#64748B'}
          />
          <Text style={[styles.navLabel, isHome && styles.navLabelActive]}>
            Kitchen
          </Text>
        </Pressable>

        {/* Center Elevated Scan Trigger */}
        <Pressable
          onPress={() => navigate('/scan')}
          style={({ pressed }) => [
            styles.scanCapsule,
            isScan && styles.scanCapsuleActive,
            pressed && styles.scanPressed,
          ]}
        >
          <FifoIcon name="maximize" size={17} color="#FFFFFF" />
          <Text style={styles.scanCapsuleText}>Scan</Text>
        </Pressable>

        {/* Freshness & Waste Tracker Tab */}
        <Pressable
          onPress={() => navigate('/stats')}
          style={({ pressed }) => [
            styles.navItem,
            isStats && styles.navItemActive,
            pressed && styles.pressed,
          ]}
        >
          <FifoIcon
            name="pie-chart"
            size={18}
            color={isStats ? '#059669' : '#64748B'}
          />
          <Text style={[styles.navLabel, isStats && styles.navLabelActive]}>
            Freshness
          </Text>
        </Pressable>

        {/* Settings / Reminders Tab */}
        <Pressable
          onPress={() => navigate('/settings')}
          style={({ pressed }) => [
            styles.navItem,
            isSettings && styles.navItemActive,
            pressed && styles.pressed,
          ]}
        >
          <FifoIcon
            name="sliders"
            size={18}
            color={isSettings ? '#059669' : '#64748B'}
          />
          <Text style={[styles.navLabel, isSettings && styles.navLabelActive]}>
            Alerts
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    zIndex: 50,
  },
  pillCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 7,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 10,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 999,
  },
  navItemActive: {
    backgroundColor: '#ECFDF5',
  },
  navLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: -0.1,
  },
  navLabelActive: {
    color: '#047857',
    fontWeight: '700',
  },
  scanCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    marginHorizontal: 2,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  scanCapsuleActive: {
    backgroundColor: '#047857',
  },
  scanCapsuleText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
  scanPressed: {
    transform: [{ scale: 0.95 }],
  },
});
