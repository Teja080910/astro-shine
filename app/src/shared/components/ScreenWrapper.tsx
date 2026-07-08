import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle, StatusBar } from 'react-native';
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
  const content = (
    <View style={[!noPadding && styles.padding, { flex: 1 }, style]}>
      {children}
    </View>
  );

  const bg = backgroundColor || colors.background;
  const isDarkBar = backgroundColor ? true : (theme === 'dark');

  return (
    <SafeAreaView edges={edges} style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDarkBar ? "light-content" : "dark-content"} backgroundColor={bg} />
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
  container: { flex: 1, backgroundColor: colors.background },
  padding: { padding: 16 },
});
