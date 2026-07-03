import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from '../theme';

interface Props {
  uri?: string;
  size?: number;
  online?: boolean;
  onPress?: () => void;
  name?: string;
}

export function Avatar({ uri, size = 48, online, onPress, name }: Props) {
  const content = uri ? (
    <Image source={{ uri }} style={[{ width: size, height: size, borderRadius: size / 2 }]} />
  ) : (
    <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }]}>
      <Ionicons name="person" size={size * 0.5} color={colors.white} />
    </View>
  );

  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress} style={{ position: 'relative' }}>
      {content}
      {online !== undefined && (
        <View style={[styles.dot, { backgroundColor: online ? colors.success : colors.textMuted }]} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  dot: { position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: colors.background },
});
