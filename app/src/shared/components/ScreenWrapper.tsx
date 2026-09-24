import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ViewStyle,
  StatusBar,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
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

export function ScreenWrapper({ children, scroll, style, noPadding, edges = ['top', 'bottom'], backgroundColor }: Props) {
  const { theme } = useAuth();
  const isDark = theme === 'dark';
  const bg = backgroundColor || (isDark ? '#09090B' : '#FFFFFF');
  const isDarkBar = backgroundColor ? true : isDark;

  const scrollRef = useRef<ScrollView>(null);
  const containerRef = useRef<View>(null);
  const scrollOffsetRef = useRef(0);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  const handleContainerLayout = () => {
    containerRef.current?.measureInWindow((_x, y) => {
      if (typeof y !== 'number' || y === keyboardOffset) return;
      setKeyboardOffset(y);
    });
  };

  useEffect(() => {
    if (!scroll || Platform.OS !== 'android') return;
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => {
        const focused: any = TextInput.State.currentlyFocusedInput();
        const scroll = scrollRef.current;
        const scrollHost: any = scroll?.getNativeScrollRef?.();
        if (!focused || !scroll || !scrollHost || typeof focused.measureInWindow !== 'function') return;
        focused.measureInWindow((_x: number, y: number, _w: number, h: number) => {
          scrollHost.measureInWindow((_sx: number, sy: number, _sw: number, sh: number) => {
            const overlap = y + h + 16 - (sy + sh);
            if (overlap <= 0) return;
            scroll.scrollTo({ y: scrollOffsetRef.current + overlap, animated: true });
          });
        });
      }, 150);
    });
    return () => sub.remove();
  }, [scroll]);

  const content = (
    <View style={[!noPadding && styles.padding, { flex: 1 }, style]}>
      {children}
    </View>
  );

  const scrollArea = (
    <ScrollView
      ref={scrollRef}
      style={styles.flex}
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      onScroll={(e) => {
        scrollOffsetRef.current = e.nativeEvent.contentOffset.y;
      }}
      scrollEventThrottle={16}
    >
      {content}
    </ScrollView>
  );

  return (
    <SafeAreaView edges={edges} style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDarkBar ? "light-content" : "dark-content"} backgroundColor={bg} />
      {scroll ? (
        <View ref={containerRef} style={styles.flex} onLayout={handleContainerLayout}>
          {Platform.OS === 'android' ? (
            <KeyboardAvoidingView
              style={styles.flex}
              behavior="height"
              keyboardVerticalOffset={keyboardOffset}
            >
              {scrollArea}
            </KeyboardAvoidingView>
          ) : (
            scrollArea
          )}
        </View>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  padding: { padding: 16 },
});
