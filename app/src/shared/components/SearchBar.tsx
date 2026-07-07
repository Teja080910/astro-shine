import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from '../theme';

interface Props {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  style?: ViewStyle;
  onClear?: () => void;
}

export function SearchBar({ value, onChangeText, placeholder = 'Search...', style, onClear }: Props) {
  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceLight, borderColor: colors.cardBorder }, style]}>
      <Ionicons name="search-outline" size={20} color={colors.textMuted} />
      <TextInput
        style={[styles.input, { color: colors.textPrimary }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => { onChangeText(''); onClear?.(); }}>
          <Ionicons name="close-circle" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.input,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
    margin: 16,
  },
  input: { flex: 1, fontSize: 15, marginLeft: 10 },
});
