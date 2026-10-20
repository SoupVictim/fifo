import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { UCircle, USvg } from './UniversalSvg';
import { getExpiryCircleTheme } from '../utils/dateParser';

interface DayExpiryCircleProps {
  daysRemaining: number;
  isFrozen?: boolean;
  size?: number;
  strokeWidth?: number;
  elevated?: boolean;
}

export function DayExpiryCircle({
  daysRemaining,
  isFrozen = false,
  size = 48,
  strokeWidth = 4,
  elevated = false,
}: DayExpiryCircleProps) {
  const theme = getExpiryCircleTheme(daysRemaining, isFrozen);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - theme.progress);

  // Scale text size cleanly with circle diameter for older-eye readability
  const baseFontSize = Math.round(size * 0.27);
  const computedFontSize =
    theme.shortText.length > 4
      ? Math.max(11, baseFontSize - 2)
      : Math.max(12, baseFontSize);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: elevated ? '#FFFFFF' : theme.bgTint,
        },
        elevated && styles.elevatedShadow,
      ]}
    >
      <USvg width={size} height={size} style={styles.svg}>
        <UCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <UCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </USvg>
      <View style={styles.labelWrap}>
        <Text
          style={[
            styles.daysText,
            {
              color: theme.textColor,
              fontSize: computedFontSize,
            },
          ]}
          numberOfLines={1}
        >
          {theme.shortText}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  elevatedShadow: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  labelWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  daysText: {
    fontWeight: '800',
    letterSpacing: -0.3,
  },
});
