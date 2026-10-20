import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { FoodCategory } from '../types/fifo';
import { getCategoryMeta } from '../utils/categories';

interface FoodThumbnailProps {
  photoUri?: string;
  category: FoodCategory;
  variant?: 'tile' | 'row' | 'large';
}

export function FoodThumbnail({
  photoUri,
  category,
  variant = 'row',
}: FoodThumbnailProps) {
  const meta = getCategoryMeta(category);

  if (variant === 'tile') {
    return (
      <View
        style={[
          styles.tileContainer,
          { backgroundColor: meta.softBg, borderColor: meta.borderColor },
        ]}
      >
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.tileImage} resizeMode="cover" />
        ) : (
          <View style={styles.placeholderCenter}>
            <Text style={styles.tileEmoji}>{meta.emoji}</Text>
          </View>
        )}
        <View style={styles.categoryBadgeOverlay}>
          <Text style={[styles.categoryOverlayText, { color: meta.accentColor }]}>
            {meta.label}
          </Text>
        </View>
      </View>
    );
  }

  const dimensions = variant === 'large' ? 64 : 52;

  return (
    <View
      style={[
        styles.rowContainer,
        {
          width: dimensions,
          height: dimensions,
          borderRadius: variant === 'large' ? 18 : 15,
          backgroundColor: meta.softBg,
          borderColor: meta.borderColor,
        },
      ]}
    >
      {photoUri ? (
        <Image
          source={{ uri: photoUri }}
          style={[
            styles.rowImage,
            { borderRadius: variant === 'large' ? 17 : 14 },
          ]}
          resizeMode="cover"
        />
      ) : (
        <Text style={variant === 'large' ? styles.largeEmoji : styles.rowEmoji}>
          {meta.emoji}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tileContainer: {
    height: 92,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },
  placeholderCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileEmoji: {
    fontSize: 34,
  },
  categoryBadgeOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  categoryOverlayText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  rowContainer: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  rowImage: {
    width: '100%',
    height: '100%',
  },
  rowEmoji: {
    fontSize: 24,
  },
  largeEmoji: {
    fontSize: 30,
  },
});
