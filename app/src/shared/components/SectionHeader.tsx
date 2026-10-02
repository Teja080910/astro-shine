import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

interface Props {
  title: string;
  onSeeAll?: () => void;
  style?: ViewStyle;
  icon?: keyof typeof Ionicons.glyphMap | string;
  showUnderline?: boolean;
}

export function SectionHeader({ title, onSeeAll, style, icon, showUnderline }: Props) {
  const { theme } = useAuth();
  const isDark = theme === 'dark';
  const titleColor = isDark ? '#FBBF24' : '#7F1D1D';
  const seeAllColor = isDark ? '#FBBF24' : '#D97706';
  const shouldUnderline = showUnderline ?? !!icon;

  return (
    <View style={[styles.container, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {icon && (
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={icon as any} size={18} color={isDark ? '#F87171' : '#7F1D1D'} />
          </View>
        )}
        <View>
          <Text style={{ fontSize: 17, fontWeight: '800', color: titleColor }}>{title}</Text>
          {shouldUnderline && (
            <View
              style={{
                width: 48,
                height: 2.5,
                backgroundColor: '#DC2626',
                borderRadius: 2,
                marginTop: 3,
              }}
            />
          )}
        </View>
      </View>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={{ fontSize: 13, color: seeAllColor, fontWeight: '700' }}>See All ›</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
});
