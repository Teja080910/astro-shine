import React from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { colors, radii } from '../theme';

interface Props {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  allLabel?: string;
}

export function FilterTabs({ options, value, onChange, style, contentContainerStyle }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.container, style]}
      contentContainerStyle={[styles.content, contentContainerStyle]}
    >
      {options.map((option) => {
        const selected = option === value;
        return (
          <TouchableOpacity
            key={option}
            onPress={() => onChange(option)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={[
              styles.tab,
              {
                backgroundColor: selected
                  ? colors.primary + '20'
                  : colors.chipBg,
                borderColor: selected ? colors.primary : colors.chipBorder,
              },
            ]}
          >
            <Text
              style={[
                styles.label,
                {
                  color: selected ? colors.primary : colors.textBody,
                  fontWeight: selected ? '700' : '500',
                },
              ]}
              numberOfLines={1}
            >
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 0,
    flexShrink: 0,
    height: 44,
    minHeight: 44,
    maxHeight: 44,
  },
  content: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  tab: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: radii.chip,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
  },
});
