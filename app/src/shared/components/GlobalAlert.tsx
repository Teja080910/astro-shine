import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Image, Alert, AlertButton, Platform } from 'react-native';
import { colors, radii, typography, shadows } from '../theme';
import { Ionicons } from '@expo/vector-icons';

type AlertParams = {
  title: string;
  message?: string;
  buttons?: AlertButton[];
};

let activeAlertCallback: ((params: AlertParams | null) => void) | null = null;

// Monkey-patch React Native's Alert.alert
const originalAlert = Alert.alert;
Alert.alert = (title: string, message?: string, buttons?: AlertButton[], options?: any) => {
  if (activeAlertCallback) {
    activeAlertCallback({ title, message, buttons });
  } else {
    originalAlert(title, message, buttons, options);
  }
};

export function GlobalAlert() {
  const [alert, setAlert] = useState<AlertParams | null>(null);

  useEffect(() => {
    activeAlertCallback = (params) => {
      setAlert(params);
    };
    return () => {
      activeAlertCallback = null;
    };
  }, []);

  if (!alert) return null;

  const { title = '', message = '', buttons = [] } = alert;

  // Detect appropriate icon based on title/message keywords
  const lowerTitle = title.toLowerCase();
  const lowerMessage = message.toLowerCase();
  
  let iconComponent = <Image source={require('../../../assets/logo_clean.png')} style={styles.logo} resizeMode="contain" />;
  
  if (lowerTitle.includes('error') || lowerTitle.includes('fail') || lowerMessage.includes('error') || lowerMessage.includes('fail')) {
    iconComponent = <Ionicons name="close-circle-outline" size={48} color={colors.danger} style={styles.icon} />;
  } else if (lowerTitle.includes('warning') || lowerMessage.includes('warning') || lowerTitle.includes('offline') || lowerMessage.includes('offline')) {
    iconComponent = <Ionicons name="warning-outline" size={48} color={colors.warning} style={styles.icon} />;
  } else if (lowerTitle.includes('success') || lowerTitle.includes('saved') || lowerTitle.includes('reported') || lowerMessage.includes('success') || lowerMessage.includes('saved')) {
    iconComponent = <Ionicons name="checkmark-circle-outline" size={48} color={colors.success} style={styles.icon} />;
  }

  // If no buttons, default to a simple Close/OK button
  const alertButtons = buttons.length > 0 ? buttons : [{ text: 'OK', onPress: () => {} }];

  const handleButtonPress = (onPress?: () => void) => {
    setAlert(null);
    if (onPress) {
      onPress();
    }
  };

  return (
    <Modal visible={true} transparent animationType="fade" onRequestClose={() => setAlert(null)}>
      <View style={styles.overlay}>
        <View style={[styles.dialog, { backgroundColor: colors.glassBg, borderColor: colors.cardBorder }, shadows.card]}>
          <View style={styles.iconWrap}>{iconComponent}</View>
          
          <Text style={[typography.sectionTitle, { color: colors.textPrimary, textAlign: 'center', marginBottom: message ? 8 : 20 }]}>
            {title}
          </Text>
          
          {message ? (
            <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 20 }]}>
              {message}
            </Text>
          ) : null}

          <View style={[styles.buttonContainer, alertButtons.length > 2 && { flexDirection: 'column' }]}>
            {alertButtons.map((btn, index) => {
              const isCancel = btn.style === 'cancel' || btn.text?.toLowerCase() === 'cancel' || btn.text?.toLowerCase() === 'no';
              const isDestructive = btn.style === 'destructive';
              
              let btnBgColor = colors.primary;
              let btnTextColor = colors.white;
              let borderStyle = {};

              if (isCancel) {
                btnBgColor = 'transparent';
                btnTextColor = colors.textPrimary;
                borderStyle = { borderWidth: 1, borderColor: colors.cardBorder };
              } else if (isDestructive) {
                btnBgColor = colors.danger;
                btnTextColor = colors.white;
              }

              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.button, { backgroundColor: btnBgColor }, borderStyle]}
                  onPress={() => handleButtonPress(btn.onPress)}
                >
                  <Text style={[typography.cardTitle, { color: btnTextColor, fontWeight: '700' }]}>
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 9, 11, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 320,
    borderRadius: radii.card,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
  },
  logo: {
    width: 64,
    height: 48,
  },
  icon: {
    alignSelf: 'center',
  },
  iconWrap: {
    marginBottom: 16,
    height: 52,
    justifyContent: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: radii.button,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    minWidth: 100,
  },
});
