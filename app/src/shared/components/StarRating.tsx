import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

interface Props { rating: number; size?: number; showNumber?: boolean; reviewCount?: number; }

export function StarRating({ rating, size = 16, showNumber, reviewCount }: Props) {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= Math.round(rating) ? 'star' : 'star-outline'}
          size={size}
          color={star <= Math.round(rating) ? colors.accentGold : colors.textMuted}
          style={{ marginRight: 2 }}
        />
      ))}
      {showNumber && <Text style={[styles.text, { color: colors.textSecondary, fontSize: size - 2 }]}>{rating.toFixed(1)}</Text>}
      {reviewCount !== undefined && <Text style={[styles.text, { color: colors.textSecondary, fontSize: size - 2 }]}>({reviewCount})</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  text: { marginLeft: 4 },
});
