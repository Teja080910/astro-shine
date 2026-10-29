import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { OmIcon } from './OmIcon';

interface Props {
  onLeftPress?: () => void;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  showFavorites?: boolean;
  onFavoritesPress?: () => void;
  notificationCount?: number;
  onNotificationsPress?: () => void;
  rightExtra?: React.ReactNode;
  style?: any;
}

const HEADER_HEIGHT = 68;
const EDGE_PADDING = 16;
const ICON_SIZE = 26;

export function BrandHeader({
  onLeftPress,
  leftIcon = 'menu-outline',
  showFavorites,
  onFavoritesPress,
  notificationCount = 0,
  onNotificationsPress,
  rightExtra,
  style,
}: Props) {
  const { theme } = useAuth();
  const isDark = theme === 'dark';
  const { width } = useWindowDimensions();
  const isCompact = width < 380;

  const iconColor = isDark ? '#F59E0B' : '#7F1D1D';
  const wordmarkColor = isDark ? '#FBBF24' : '#8B1E1E';
  const taglineColor = isDark ? '#FBBF24' : '#D97706';

  return (
    <View style={[styles.container, style]}>
      {/* Left group anchored to the left edge */}
      <View style={[styles.side, styles.leftSide]}>
        {onLeftPress ? (
          <TouchableOpacity
            onPress={onLeftPress}
            style={styles.iconButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
          >
            <Ionicons name={leftIcon} size={ICON_SIZE} color={iconColor} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Brand centered in the remaining space */}
      <View style={styles.center} pointerEvents="box-none">
        <View style={styles.brandRow}>
          <OmIcon isDark={isDark} size={isCompact ? 30 : 34} />
          <Text
            style={[
              styles.wordmark,
              { color: wordmarkColor, fontSize: isCompact ? 16 : 20 },
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            ASTROSHINE
          </Text>
        </View>
        <Text
          style={[
            styles.tagline,
            { color: taglineColor, fontSize: isCompact ? 7 : 8 },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          YOUR DESTINY, YOUR GUIDANCE
        </Text>
      </View>

      {/* Right group anchored to the right edge */}
      <View style={[styles.side, styles.rightSide]}>
        {rightExtra}
        {showFavorites && (
          <TouchableOpacity
            onPress={onFavoritesPress}
            style={styles.iconButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
          >
            <Ionicons name="heart-outline" size={22} color={iconColor} />
          </TouchableOpacity>
        )}
        {onNotificationsPress && (
          <TouchableOpacity
            onPress={onNotificationsPress}
            style={[styles.iconButton, styles.notificationButton]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
          >
            <Ionicons name="notifications-outline" size={24} color={iconColor} />
            {notificationCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: HEADER_HEIGHT,
    justifyContent: 'center',
  },
  side: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftSide: {
    left: EDGE_PADDING,
    justifyContent: 'flex-start',
  },
  rightSide: {
    right: EDGE_PADDING,
    justifyContent: 'flex-end',
    gap: 6,
  },
  iconButton: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationButton: {
    position: 'relative',
  },
  center: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 84,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    maxWidth: '100%',
  },
  wordmark: {
    fontWeight: '900',
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  tagline: {
    fontWeight: '800',
    letterSpacing: 1.4,
    marginTop: 2,
    textAlign: 'center',
    width: '100%',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#DC2626',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
});
