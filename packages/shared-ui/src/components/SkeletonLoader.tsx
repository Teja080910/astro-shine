import React from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii } from '../theme';

export function SkeletonLoader({ width = '100%', height = 16, style }: { width?: any; height?: number; style?: any }) {
  const shimmer = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View style={[{ width, height, borderRadius: radii.input, backgroundColor: colors.surfaceLight, overflow: 'hidden' }, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] }), backgroundColor: colors.cardBorder }]} />
    </View>
  );
}

export function CardSkeleton() {
  return (
    <View style={{ padding: 16, gap: 12 }}>
      <SkeletonLoader height={180} />
      <SkeletonLoader width="60%" height={20} />
      <SkeletonLoader width="80%" height={14} />
      <SkeletonLoader width="40%" height={14} />
    </View>
  );
}
