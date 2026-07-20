import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadows } from '../theme';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';

interface Tab { key: string; icon: string; label: string; }

interface Props { tabs: Tab[]; activeTab: string; onTabPress: (key: string) => void; }

export function FloatingBottomBar({ tabs, activeTab, onTabPress }: Props) {
  const { theme } = useAuth();
  const { unreadCounts } = useChat();
  const isDark = theme === 'dark';
  const totalUnread = Object.values(unreadCounts).reduce((s, c) => s + c, 0);
  const badgeCount = totalUnread > 99 ? 99 : totalUnread;

  const activeColor = '#D97706';
  const activeBg = isDark ? 'rgba(217, 119, 6, 0.25)' : '#FEF3C7';

  return (
    <View style={[styles.wrapper, { borderColor: colors.cardBorder, borderWidth: 1 }]}>
      <View style={[styles.blur, { backgroundColor: isDark ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)' }]}>
        <View style={styles.container}>
          {tabs.map((tab) => {
            const active = tab.key === activeTab;
            const isChat = tab.key === 'Chat';
            const iconName = active ? tab.icon.replace('-outline', '') : tab.icon;
            return (
              <TouchableOpacity key={tab.key} style={styles.tab} onPress={() => onTabPress(tab.key)} activeOpacity={0.7}>
                <View style={[styles.iconContainer, active && { backgroundColor: activeBg }]}>
                  <Ionicons name={iconName as any} size={22} color={active ? activeColor : colors.textMuted} />
                  {isChat && badgeCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{badgeCount}{totalUnread > 99 ? '+' : ''}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.label, active && { color: activeColor, fontWeight: '700' }]}>{tab.label}</Text>
                {active && <View style={[styles.indicator, { backgroundColor: activeColor }]} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 20, left: 16, right: 16,
    borderRadius: radii.card,
    overflow: 'hidden',
  },
  blur: {
    borderRadius: radii.card,
  },
  container: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 8 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  iconContainer: { padding: 6, borderRadius: 12, position: 'relative' },
  label: { fontSize: 11, fontWeight: '500', color: colors.textMuted, marginTop: 2 },
  indicator: { width: 4, height: 4, borderRadius: 2, marginTop: 4 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
});
