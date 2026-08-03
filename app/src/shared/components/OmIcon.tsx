import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

export function OmIcon({ isDark }: { isDark: boolean }) {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../../assets/om_symbol.png')}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
