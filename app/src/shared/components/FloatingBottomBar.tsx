import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadows } from '../theme';

interface Tab { key: string; icon: string; label: string; }

interface Props { tabs: Tab[]; activeTab: string; onTabPress: (key: string) => void; }

export function FloatingBottomBar({ tabs, activeTab, onTabPress }: Props) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.blur}>
        <View style={styles.container}>
          {tabs.map((tab) => {
            const active = tab.key === activeTab;
            return (
              <TouchableOpacity key={tab.key} style={styles.tab} onPress={() => onTabPress(tab.key)} activeOpacity={0.7}>
                <View style={[styles.iconContainer, active && styles.activeIcon]}>
                  <Ionicons name={tab.icon as any} size={22} color={active ? colors.white : colors.textMuted} />
                </View>
                <Text style={[styles.label, active && styles.activeLabel]}>{tab.label}</Text>
                {active && <View style={styles.indicator} />}
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
    ...shadows.floating,
  },
  blur: {
    borderRadius: radii.card,
    backgroundColor: 'rgba(17, 24, 39, 0.92)',
  },
  container: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 8 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  iconContainer: { padding: 6, borderRadius: 12 },
  activeIcon: { backgroundColor: colors.primary + '30' },
  label: { fontSize: 11, fontWeight: '500', color: colors.textMuted, marginTop: 2 },
  activeLabel: { color: colors.primaryLight },
  indicator: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primaryLight, marginTop: 4 },
});
