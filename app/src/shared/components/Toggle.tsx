import React from 'react';
import { TouchableOpacity, View, ViewStyle } from 'react-native';
import { colors } from '../theme';

interface Props {
  value: boolean;
  onValueChange: (v: boolean) => void;
  trackColor?: { false: string; true: string };
  disabled?: boolean;
  style?: ViewStyle;
}

export function Toggle({ value, onValueChange, trackColor, disabled, style }: Props) {
  return (
    <TouchableOpacity
      disabled={disabled}
      activeOpacity={0.8}
      onPress={() => onValueChange(!value)}
      style={[{
        width: 42,
        height: 24,
        borderRadius: 12,
        backgroundColor: value ? (trackColor?.true || colors.primary) : (trackColor?.false || '#d1d5db'),
        justifyContent: 'center',
        paddingHorizontal: 2,
      }, style]}
    >
      <View pointerEvents="none" style={{
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#fff',
        alignSelf: value ? 'flex-end' : 'flex-start',
      }} />
    </TouchableOpacity>
  );
}
