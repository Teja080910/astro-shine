import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useAuth } from '../../context/AuthContext';

interface Props { title: string; onSeeAll?: () => void; style?: ViewStyle; }

export function SectionHeader({ title, onSeeAll, style }: Props) {
  const { theme } = useAuth();
  const isDark = theme === 'dark';
  const titleColor = isDark ? '#FBBF24' : '#7F1D1D';
  const seeAllColor = isDark ? '#FBBF24' : '#D97706';

  return (
    <View style={[styles.container, style]}>
      <Text style={{ fontSize: 18, fontWeight: '800', color: titleColor }}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={{ fontSize: 13, color: seeAllColor, fontWeight: '700' }}>See All</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 24, marginBottom: 12 },
});
