import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';

interface Tab { key: string; icon: string; label: string; }

interface Props { tabs: Tab[]; activeTab: string; onTabPress: (key: string) => void; }

export function FloatingBottomBar({ tabs, activeTab, onTabPress }: Props) {
  const { theme } = useAuth();
  const { unreadCounts } = useChat();
  const isDark = theme === 'dark';
  const insets = useSafeAreaInsets();
  const totalUnread = Object.values(unreadCounts).reduce((s, c) => s + c, 0);
  const badgeCount = totalUnread > 99 ? 99 : totalUnread;

  const activeColor = '#D97706';
  const inactiveColor = isDark ? '#9CA3AF' : '#6B7280';
  const barBg = isDark ? '#111827' : '#FFFFFF';
  const borderColor = isDark ? '#374151' : '#E5E7EB';

  return (
    <View style={[styles.tabBarRoot, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={[styles.innerCard, { backgroundColor: barBg, borderColor: borderColor }]}>
        {tabs.map((tab) => {
          const active = tab.key === activeTab;
          const isChat = tab.key === 'Chat';
          const iconName = active ? tab.icon.replace('-outline', '') : tab.icon;
          return (
            <TouchableOpacity key={tab.key} style={styles.tab} onPress={() => onTabPress(tab.key)} activeOpacity={0.7}>
              <View>
                <Ionicons name={iconName as any} size={24} color={active ? activeColor : inactiveColor} />
                {isChat && badgeCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badgeCount}{totalUnread > 99 ? '+' : ''}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.label, { color: inactiveColor }, active && { color: activeColor, fontWeight: '700' }]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarRoot: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
    borderTopWidth: 0,
    paddingBottom: 8,
    paddingHorizontal: 12,
  },
  innerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tab: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, minWidth: 40 },
  label: { fontSize: 9, fontWeight: '600', marginTop: 1 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
});
