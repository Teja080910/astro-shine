import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { useAuth } from '../../context/AuthContext';

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  noPadding?: boolean;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  backgroundColor?: string;
}

export function ScreenWrapper({ children, scroll, style, noPadding, edges = ['top'], backgroundColor }: Props) {
  const { theme } = useAuth();
  const isDark = theme === 'dark';
  const bg = backgroundColor || (isDark ? '#09090B' : '#FFFFFF');
  const isDarkBar = backgroundColor ? true : isDark;
  const bgOpacity = isDark ? 0.08 : 0.16;

  const content = (
    <View style={[!noPadding && styles.padding, { flex: 1 }, style]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView edges={edges} style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDarkBar ? "light-content" : "dark-content"} backgroundColor={bg} />
      <Image 
        source={require('../../../assets/home_bg_transparent.png')} 
        style={[StyleSheet.absoluteFillObject, { opacity: bgOpacity }]} 
        resizeMode="cover" 
      />
      {scroll ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  padding: { padding: 16 },
});
