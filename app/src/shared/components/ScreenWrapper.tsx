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
}

export function ScreenWrapper({ children, scroll, style, noPadding, edges = ['top'] }: Props) {
  const { theme } = useAuth();
  const content = (
    <View style={[!noPadding && styles.padding, { flex: 1 }, style]}>
      {children}
    </View>
  );

  const isDark = theme === 'dark';

  return (
    <SafeAreaView edges={edges} style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
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
