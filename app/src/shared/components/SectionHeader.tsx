import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography } from '../theme';

interface Props { title: string; onSeeAll?: () => void; style?: ViewStyle; }

export function SectionHeader({ title, onSeeAll, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      <Text style={[typography.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 24, marginBottom: 12 },
  seeAll: { fontSize: 14, color: colors.primaryLight, fontWeight: '600' },
});
