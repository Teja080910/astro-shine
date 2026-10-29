import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface Props {
  isDark?: boolean;
  size?: number;
}

export function BrandLogo({ isDark, size = 38 }: Props) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image
        source={require('../../../assets/logo_clean.png')}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
}

export const OmIcon = BrandLogo;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
