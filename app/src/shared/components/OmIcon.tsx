import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

export function BrandLogo({ isDark }: { isDark?: boolean }) {
  return (
    <View style={styles.container}>
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
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
