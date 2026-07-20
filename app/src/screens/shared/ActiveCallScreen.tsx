import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../shared';
import { Ionicons } from '@expo/vector-icons';
import { useCall } from '../../context/CallContext';
import { useWebRTC } from '../../shared/useWebRTC';

const WEBRTC_EVENTS = ['webrtc:offer', 'webrtc:answer', 'webrtc:ice-candidate'];

export function ActiveCallScreen() {
  const { callData, callState, endCall, socketRef } = useCall();
  const {
    createPeerConnection, startLocalStream, createOffer, createAnswer,
    setRemoteDescription, addIceCandidate, toggleMute, toggleSpeaker,
    toggleCamera, switchCamera, cleanup,
    remoteStream, isMuted, isSpeakerOn, isVideoEnabled, isCameraFront,
  } = useWebRTC();
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const joinedRef = useRef(false);

  const otherName = callData?.callerName || 'Connected';
  const isVideo = callData?.type === 'video';

  useEffect(() => {
    if (callState === 'active' && callData?.callId && !joinedRef.current) {
      joinedRef.current = true;
      startCall(callData.callId, callData.type);
    }
    return () => {
      if (callState === 'idle') {
        cleanup();
        WEBRTC_EVENTS.forEach(e => socketRef.current?.off(e));
      }
    };
  }, [callState, callData?.callId]);

  const startCall = async (callId: string, type: 'audio' | 'video') => {
    const socket = socketRef.current;
    if (!socket) return;

    // Clean up any old WebRTC listeners from previous calls
    WEBRTC_EVENTS.forEach(e => socket.off(e));

    const pc = createPeerConnection(
      (candidate) => socket.emit('webrtc:ice-candidate', { callId, candidate }),
      () => {},
    );
    if (!pc) return;

    await startLocalStream(type);

    socket.on('webrtc:offer', async (data: any) => {
      if (data.callId !== callId) return;
      await setRemoteDescription(data.sdp);
      const answer = await createAnswer();
      if (answer) socket.emit('webrtc:answer', { callId, sdp: answer });
    });

    socket.on('webrtc:answer', async (data: any) => {
      if (data.callId !== callId) return;
      await setRemoteDescription(data.sdp);
    });

    socket.on('webrtc:ice-candidate', async (data: any) => {
      if (data.callId !== callId) return;
      await addIceCandidate(data.candidate);
    });

    // If this device initiated the call (no callerId means we're the caller), send offer
    const isCaller = !callData?.callerId;
    if (isCaller) {
      const offer = await createOffer();
      if (offer) socket.emit('webrtc:offer', { callId, sdp: offer });
    }
  };

  useEffect(() => {
    if (callState === 'active') {
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callState]);

  const formatTime = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    cleanup();
    endCall();
  };

  if (callState === 'idle') return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        {isVideo && (
          <View style={styles.videoContainer}>
            <View style={styles.remoteVideo}>
              {remoteStream ? (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center' }]}>
                  <Ionicons name="videocam" size={48} color={colors.primary} />
                  <Text style={{ color: colors.white, marginTop: 8 }}>Remote Stream</Text>
                </View>
              ) : (
                <>
                  <Ionicons name="person-circle" size={80} color={colors.textMuted} />
                  <Text style={styles.remoteName}>{otherName}</Text>
                </>
              )}
            </View>
            <View style={[styles.localVideo, { opacity: isVideoEnabled ? 1 : 0.4 }]}>
              <Ionicons name="person" size={24} color={colors.white} />
            </View>
          </View>
        )}

        {!isVideo && (
          <View style={styles.audioContainer}>
            <View style={styles.avatarLarge}>
              <Ionicons name="person" size={64} color={colors.white} />
            </View>
            <Text style={styles.name}>{otherName}</Text>
            <Text style={styles.status}>
              {callState === 'active' ? formatTime(seconds) : callState === 'ended' ? 'Call Ended' : 'Connecting...'}
            </Text>
          </View>
        )}

        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton} onPress={toggleMute}>
            <View style={[styles.controlIcon, isMuted && styles.controlIconActive]}>
              <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={24} color={colors.white} />
            </View>
            <Text style={styles.controlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={toggleSpeaker}>
            <View style={[styles.controlIcon, isSpeakerOn && styles.controlIconActive]}>
              <Ionicons name={isSpeakerOn ? 'volume-high' : 'volume-mute'} size={24} color={colors.white} />
            </View>
            <Text style={styles.controlLabel}>{isSpeakerOn ? 'Speaker' : 'Earpiece'}</Text>
          </TouchableOpacity>

          {isVideo && (
            <>
              <TouchableOpacity style={styles.controlButton} onPress={toggleCamera}>
                <View style={[styles.controlIcon, !isVideoEnabled && styles.controlIconActive]}>
                  <Ionicons name={isVideoEnabled ? 'videocam' : 'videocam-off'} size={24} color={colors.white} />
                </View>
                <Text style={styles.controlLabel}>{isVideoEnabled ? 'Video On' : 'Video Off'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlButton} onPress={switchCamera}>
                <View style={styles.controlIcon}>
                  <Ionicons name="camera-reverse" size={24} color={colors.white} />
                </View>
                <Text style={styles.controlLabel}>Flip</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={styles.endCallButton} onPress={handleEndCall}>
            <Ionicons name="call" size={28} color={colors.white} style={{ transform: [{ rotate: '135deg' }] }} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 9998, elevation: 9998 },
  container: { flex: 1, backgroundColor: '#0A0A0A', justifyContent: 'space-between' },
  audioContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatarLarge: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  name: { fontSize: 24, fontWeight: '700', color: colors.white, marginBottom: 8 },
  status: { fontSize: 16, color: colors.textMuted },
  videoContainer: { flex: 1, position: 'relative' },
  remoteVideo: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a' },
  remoteName: { color: colors.white, fontSize: 18, marginTop: 12 },
  localVideo: { position: 'absolute', top: 50, right: 16, width: 100, height: 140, borderRadius: 12, backgroundColor: colors.surfaceLight, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  controls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20, paddingVertical: 40, paddingBottom: 60, flexWrap: 'wrap' },
  controlButton: { alignItems: 'center' },
  controlIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  controlIconActive: { backgroundColor: colors.primary },
  controlLabel: { color: colors.white, fontSize: 12, fontWeight: '500' },
  endCallButton: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center' },
});
