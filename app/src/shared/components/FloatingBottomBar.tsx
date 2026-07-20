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
  const borderColor = isDark ? '#F59E0B' : '#D97706';
  const barBg = isDark ? '#111827' : '#FFFFFF';

  return (
    <View style={styles.tabBarRoot}>
      <View style={[styles.outerWrapper, isDark ? shadows.floating : shadows.card]}>
        <View
          style={[
            styles.innerCard,
            {
              backgroundColor: barBg,
              borderColor: borderColor,
              borderWidth: 2,
              borderRadius: 999,
            },
          ]}
        >
          <View style={styles.container}>
            {tabs.map((tab) => {
              const active = tab.key === activeTab;
              const isChat = tab.key === 'Chat';
              const iconName = active ? tab.icon.replace('-outline', '') : tab.icon;
              return (
                <TouchableOpacity key={tab.key} style={styles.tab} onPress={() => onTabPress(tab.key)} activeOpacity={0.7}>
                  <View style={[styles.iconContainer, active && { backgroundColor: activeBg }]}>
                    <Ionicons name={iconName as any} size={22} color={active ? activeColor : (isDark ? '#9CA3AF' : '#6B7280')} />
                    {isChat && badgeCount > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{badgeCount}{totalUnread > 99 ? '+' : ''}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.label, { color: isDark ? '#9CA3AF' : '#6B7280' }, active && { color: activeColor, fontWeight: '700' }]}>{tab.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
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
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  outerWrapper: {
    borderRadius: 999,
    backgroundColor: 'transparent',
  },
  innerCard: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 999,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  label: { fontSize: 10, fontWeight: '600', marginTop: 1 },
  badge: {
    position: 'absolute',
    top: -2,
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
