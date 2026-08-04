import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../theme';

interface NavbarProps {
  title: string;
  navigation?: any;
  showBack?: boolean;
  rightComponent?: React.ReactNode;
}

export function Navbar({ title, navigation, showBack = true, rightComponent }: NavbarProps) {
  const canGoBack = navigation && (navigation.canGoBack() || showBack);

  return (
    <View style={[styles.container, { borderBottomColor: colors.divider }]}>
      {canGoBack ? (
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
      
      <Text style={[typography.sectionTitle, styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
        {title}
      </Text>

      {rightComponent ? (
        <View style={styles.rightContainer}>{rightComponent}</View>
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    width: '100%',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '700',
  },
  rightContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  placeholder: {
    width: 40,
  },
});
