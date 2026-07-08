import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface Props {
  online: boolean;
  size?: number;
}

export function OnlineDot({ online, size = 10 }: Props) {
  return (
    <View
      style={[
        styles.dot,
        { width: size, height: size, borderRadius: size / 2 },
        online ? styles.online : styles.offline,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  dot: { borderWidth: 2, borderColor: colors.background },
  online: { backgroundColor: '#22C55E' },
  offline: { backgroundColor: colors.textMuted },
});
