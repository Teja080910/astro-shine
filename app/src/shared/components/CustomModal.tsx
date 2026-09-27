import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  useWindowDimensions,
  ScrollView,
  Platform,
  Keyboard,
} from 'react-native';
import { colors, radii, shadows, typography } from '../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  dismissable?: boolean;
  scrollable?: boolean;
}

export function CustomModal({
  visible,
  onClose,
  children,
  title,
  dismissable = true,
  scrollable = true,
}: Props) {
  const { height } = useWindowDimensions();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e?.endCoordinates?.height || 0);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 200 }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      setKeyboardHeight(0);
    }
  }, [visible]);

  const isKeyboardOpen = keyboardHeight > 0;
  const maxSheetHeight = isKeyboardOpen
    ? Math.max(220, height - keyboardHeight - 40)
    : height * 0.85;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={dismissable ? () => { Keyboard.dismiss(); onClose(); } : undefined}
    >
      <Pressable
        style={[
          styles.overlay,
          {
            paddingBottom: keyboardHeight,
          },
        ]}
        onPress={() => {
          Keyboard.dismiss();
          if (dismissable) onClose();
        }}
      >
        <Animated.View
          style={[
            styles.sheet,
            {
              maxHeight: maxSheetHeight,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              backgroundColor: colors.surface,
              paddingBottom: isKeyboardOpen ? 12 : 34,
            },
          ]}
        >
          {scrollable ? (
            <ScrollView
              bounces={true}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              style={{ flexShrink: 1, flexGrow: 0 }}
              contentContainerStyle={{ flexGrow: 0 }}
            >
              <Pressable onPress={(e) => e?.stopPropagation?.()}>
                <View style={styles.handle} />
                {title ? (
                  <Text
                    style={[
                      typography.sectionTitle,
                      { paddingHorizontal: 24, marginBottom: 16, color: colors.textPrimary },
                    ]}
                  >
                    {title}
                  </Text>
                ) : null}
                {children}
              </Pressable>
            </ScrollView>
          ) : (
            <Pressable onPress={(e) => e?.stopPropagation?.()} style={{ flexShrink: 1 }}>
              <View style={styles.handle} />
              {title ? (
                <Text
                  style={[
                    typography.sectionTitle,
                    { paddingHorizontal: 24, marginBottom: 16, color: colors.textPrimary },
                  ]}
                >
                  {title}
                </Text>
              ) : null}
              {children}
            </Pressable>
          )}
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.bottomSheet,
    borderTopRightRadius: radii.bottomSheet,
    paddingBottom: 34,
    overflow: 'hidden',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
});
