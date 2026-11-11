import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { colors, radii, typography } from '../theme';

interface Action {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'danger' | 'secondary';
}

interface Props {
  visible: boolean;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions: Action[];
  onClose?: () => void;
}

export function ConfirmDialog({ visible, title, subtitle, icon, actions, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.dialog, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          {icon ? (
            <View style={styles.iconWrap}>{icon}</View>
          ) : (
            <Image source={require('../../../assets/logo_clean.png')} style={styles.logo} resizeMode="contain" />
          )}
          {title && <Text style={[typography.sectionTitle, { color: colors.textPrimary, textAlign: 'center', marginBottom: subtitle ? 4 : 16 }]}>{title}</Text>}
          {subtitle && <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 20 }]}>{subtitle}</Text>}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {actions.map((action, i) => {
              // Client request: every confirm action uses the brand orange
              // (#EE7B10) - "danger" no longer paints a different red, and
              // "secondary" no longer falls back to a grey surface.
              const bgColor = colors.primary;
              const txtColor = colors.white;
              return (
                <TouchableOpacity key={i} onPress={action.onPress} style={[styles.button, { backgroundColor: bgColor }]}>
                  <Text style={[typography.cardTitle, { color: txtColor }]}>{action.label}</Text>
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
    backgroundColor: 'rgba(0,0,0,0.6)',
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
    width: 56,
    height: 41,
    marginBottom: 16,
  },
  iconWrap: {
    marginBottom: 16,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: radii.button,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
