import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from '../theme';
import { config } from '../../config';

interface Props {
  uri?: string;
  size?: number;
  online?: boolean;
  onPress?: () => void;
  name?: string;
}

export function Avatar({ uri, size = 48, online, onPress, name }: Props) {
  const getAbsoluteUri = (path?: string) => {
    if (!path) return undefined;
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
      return path;
    }
    return `${config.apiUrl}${path}`;
  };

  const getInitials = (n?: string) => {
    if (!n) return '?';
    const parts = n.trim().split(/\s+/);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const absoluteUri = getAbsoluteUri(uri);

  const content = absoluteUri ? (
    <Image source={{ uri: absoluteUri }} style={[{ width: size, height: size, borderRadius: size / 2 }]} />
  ) : (
    <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ color: colors.white, fontSize: size * 0.38, fontWeight: '700' }}>
        {getInitials(name)}
      </Text>
    </View>
  );

  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress} style={{ position: 'relative' }}>
      {content}
      {online !== undefined && (
        <View style={[styles.dot, { backgroundColor: online ? colors.success : colors.textMuted, borderColor: colors.background }]} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  dot: { position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
});
