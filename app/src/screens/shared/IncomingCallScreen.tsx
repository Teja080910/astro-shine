import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Vibration } from 'react-native';
import { colors } from '../../shared';
import { Ionicons } from '@expo/vector-icons';
import { useCall } from '../../context/CallContext';
import { Audio } from 'expo-av';

export function IncomingCallScreen() {
  const { incomingCall, acceptCall, rejectCall } = useCall();
  const [accepting, setAccepting] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const soundRef = useRef<Audio.Sound | null>(null);

  const handleAccept = async () => {
    if (accepting) return;
    setAccepting(true);
    await acceptCall();
    // Reset guard after a short delay in case accept didn't succeed
    setTimeout(() => setAccepting(false), 3000);
  };

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    pulse.start();

    let isMounted = true;
    const startRingtone = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../../../assets/ringtone.mp3'),
          { shouldPlay: true, isLooping: true }
        );
        if (isMounted) {
          soundRef.current = sound;
        } else {
          await sound.unloadAsync();
        }
      } catch (error) {
        console.warn('Failed to play ringtone:', error);
      }
    };

    startRingtone();
    Vibration.vibrate([0, 500, 1000], true);

    return () => {
      isMounted = false;
      pulse.stop();
      Vibration.cancel();
      if (soundRef.current) {
        soundRef.current.stopAsync().catch(() => {});
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  if (!incomingCall) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Animated.View style={[styles.avatarRing, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={64} color={colors.white} />
            </View>
          </Animated.View>
          <Text style={styles.name}>{incomingCall.callerName || 'Incoming Call'}</Text>
          <Text style={styles.callType}>{incomingCall.type === 'video' ? 'Video Call' : 'Audio Call'}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.rejectButton} onPress={rejectCall}>
            <View style={styles.rejectIcon}><Ionicons name="call" size={28} color={colors.white} style={{ transform: [{ rotate: '135deg' }] }} /></View>
            <Text style={styles.actionLabel}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acceptButton} onPress={acceptCall}>
            <View style={styles.acceptIcon}><Ionicons name="call" size={28} color={colors.white} /></View>
            <Text style={styles.actionLabel}>Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 9999, elevation: 9999 },
  container: { flex: 1, backgroundColor: '#0A0A0A', justifyContent: 'space-between', paddingBottom: 60 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatarRing: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.primary + '40', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 28, fontWeight: '700', color: colors.white, marginBottom: 8 },
  callType: { fontSize: 16, color: colors.textMuted },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 60, paddingBottom: 40 },
  rejectButton: { alignItems: 'center' },
  acceptButton: { alignItems: 'center' },
  rejectIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  acceptIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#22C55E', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionLabel: { color: colors.white, fontSize: 14, fontWeight: '500' },
});
