import React, { useEffect, useRef } from 'react';
import { Animated, ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

export function BrandSplash() {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 7, tension: 45, useNativeDriver: true }),
      ]),
      Animated.timing(taglineOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
  }, [opacity, scale, taglineOpacity]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0B0B12', '#09090B', '#140F22']}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[styles.brand, { opacity, transform: [{ scale }] }]}>
        <View style={styles.logoGlow}>
          <View style={styles.logoRing}>
            <Image
              source={require('../../../assets/logo_clean.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </View>
        <Text style={styles.wordmark}>ASTROSHINE</Text>
        <Animated.View style={[styles.taglineRow, { opacity: taglineOpacity }]}>
          <View style={styles.taglineLine} />
          <Text style={styles.tagline}>YOUR DESTINY, OUR GUIDANCE</Text>
          <View style={styles.taglineLine} />
        </Animated.View>
      </Animated.View>
      <ActivityIndicator size="small" color={colors.accentGold} style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    alignItems: 'center',
  },
  logoGlow: {
    width: 232,
    height: 232,
    borderRadius: 116,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRing: {
    width: 208,
    height: 208,
    borderRadius: 104,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    backgroundColor: '#0D0D14',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: 196,
    height: 196,
  },
  wordmark: {
    marginTop: 22,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 4,
    color: '#FBBF24',
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  taglineLine: {
    width: 26,
    height: 1,
    backgroundColor: 'rgba(245, 158, 11, 0.45)',
  },
  tagline: {
    marginHorizontal: 10,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.5,
    color: 'rgba(182, 182, 194, 0.9)',
  },
  loader: {
    position: 'absolute',
    bottom: 72,
  },
});
