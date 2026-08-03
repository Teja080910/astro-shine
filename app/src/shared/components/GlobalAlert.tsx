import React, { useState, useEffect } from 'react';
import { Alert, AlertButton } from 'react-native';
import { colors } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { ConfirmDialog } from './ConfirmDialog';

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
  
  let icon = null;
  if (lowerTitle.includes('error') || lowerTitle.includes('fail') || lowerMessage.includes('error') || lowerMessage.includes('fail')) {
    icon = <Ionicons name="close-circle-outline" size={48} color={colors.danger} />;
  } else if (lowerTitle.includes('warning') || lowerMessage.includes('warning') || lowerTitle.includes('offline') || lowerMessage.includes('offline')) {
    icon = <Ionicons name="warning-outline" size={48} color={colors.warning} />;
  } else if (lowerTitle.includes('success') || lowerTitle.includes('saved') || lowerTitle.includes('reported') || lowerMessage.includes('success') || lowerMessage.includes('saved')) {
    icon = <Ionicons name="checkmark-circle-outline" size={48} color={colors.success} />;
  }

  // Map Alert buttons to ConfirmDialog actions
  const actions = (buttons.length > 0 ? buttons : [{ text: 'OK', onPress: () => {} }]).map((btn) => ({
    label: btn.text || 'OK',
    onPress: () => {
      setAlert(null);
      if (btn.onPress) {
        btn.onPress();
      }
    },
    variant: (btn.style === 'destructive' ? 'danger' : (btn.style === 'cancel' || btn.text?.toLowerCase() === 'cancel' || btn.text?.toLowerCase() === 'no') ? 'secondary' : 'primary') as any,
  }));

  return (
    <ConfirmDialog
      visible={true}
      title={title}
      subtitle={message}
      icon={icon || undefined}
      actions={actions}
      onClose={() => setAlert(null)}
    />
  );
}
