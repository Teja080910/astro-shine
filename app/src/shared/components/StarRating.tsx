import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

interface Props { rating: number; size?: number; showNumber?: boolean; reviewCount?: number; }

export function StarRating({ rating, size = 16, showNumber, reviewCount }: Props) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((star) => {
        let name: 'star' | 'star-half' | 'star-outline' = 'star-outline';
        if (star <= full) name = 'star';
        else if (star === full + 1 && half) name = 'star-half';
        return (
          <Ionicons
            key={star}
            name={name}
            size={size}
            color={name !== 'star-outline' ? colors.accentGold : colors.textMuted}
            style={{ marginRight: 2 }}
          />
        );
      })}
      {showNumber && <Text style={[styles.text, { color: colors.textSecondary, fontSize: size - 2 }]}>{rating.toFixed(1)}</Text>}
      {reviewCount !== undefined && <Text style={[styles.text, { color: colors.textSecondary, fontSize: size - 2 }]}>({reviewCount})</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  text: { marginLeft: 4 },
});
