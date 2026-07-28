import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, typography } from '../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onRecharge: () => void;
}

export function InsufficientBalanceDialog({ visible, onClose, onRecharge }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.dialog, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <View style={styles.iconWrap}>
            <Ionicons name="wallet-outline" size={48} color={colors.danger} />
          </View>
          <Text style={[typography.sectionTitle, { color: colors.textPrimary, textAlign: 'center', marginBottom: 4 }]}>
            Insufficient Wallet Balance
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 20 }]}>
            You do not have sufficient wallet balance to start this call. Please recharge your wallet and try again.
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity onPress={onClose} style={[styles.button, { backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.cardBorder }]}>
              <Text style={[typography.cardTitle, { color: colors.textPrimary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onRecharge} style={[styles.button, { backgroundColor: colors.primary }]}>
              <Text style={[typography.cardTitle, { color: colors.white }]}>Recharge Now</Text>
            </TouchableOpacity>
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
