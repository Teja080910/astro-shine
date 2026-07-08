import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface Props {
  message: string;
  isOwn: boolean;
  timestamp: string;
  isDelivered: boolean;
  isRead: boolean;
}

export function ChatBubble({ message, isOwn, timestamp, isDelivered, isRead }: Props) {
  const time = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={[styles.container, isOwn ? styles.own : styles.other]}>
      <View style={[
        styles.bubble,
        isOwn ? styles.bubbleOwn : styles.bubbleOther,
        { backgroundColor: isOwn ? colors.primary : colors.surfaceLight },
      ]}>
        <Text style={[styles.text, { color: isOwn ? '#FFFFFF' : colors.textPrimary }]}>{message}</Text>
        <View style={styles.meta}>
          <Text style={[styles.time, { color: isOwn ? 'rgba(255,255,255,0.7)' : colors.textMuted }]}>{time}</Text>
          {isOwn && (
            <Text style={[styles.tick, { color: isRead ? '#60A5FA' : 'rgba(255,255,255,0.5)' }]}>
              {isRead ? '✓✓' : isDelivered ? '✓✓' : '✓'}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 3, maxWidth: '78%' },
  own: { alignSelf: 'flex-end' },
  other: { alignSelf: 'flex-start' },
  bubble: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18 },
  bubbleOwn: { borderBottomRightRadius: 4 },
  bubbleOther: { borderBottomLeftRadius: 4 },
  text: { fontSize: 15, lineHeight: 20 },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 2 },
  time: { fontSize: 11, marginRight: 3 },
  tick: { fontSize: 11 },
});
