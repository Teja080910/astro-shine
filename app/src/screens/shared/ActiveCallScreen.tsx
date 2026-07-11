import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../shared';
import { Ionicons } from '@expo/vector-icons';
import { useCall } from '../../context/CallContext';
import { useAgora } from '../../shared/useAgora';
import { RtcSurfaceView, VideoSourceType } from 'react-native-agora';

export function ActiveCallScreen() {
  const { callData, callState, endCall } = useCall();
  const { joinChannel, leaveChannel, toggleMute, toggleSpeaker, toggleCamera, switchCamera, isMuted, isSpeakerOn, isVideoEnabled, isCameraFront, remoteUid, isRemoteMuted, isRemoteVideoMuted } = useAgora();
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const joinedRef = useRef(false);

  const otherName = callData?.callerName || 'Connected';
  const isVideo = callData?.type === 'video';

  useEffect(() => {
    if (callState === 'active' && callData?.channel && callData?.token && !joinedRef.current) {
      joinedRef.current = true;
      joinChannel(callData.channel, callData.token, callData.uid, callData.type);
    }
  }, [callState, callData]);

  useEffect(() => {
    if (callState === 'active') {
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callState]);

  useEffect(() => {
    if (callState === 'ended' || callState === 'idle') {
      leaveChannel();
      joinedRef.current = false;
    }
  }, [callState]);

  const formatTime = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    leaveChannel();
    joinedRef.current = false;
    endCall();
  };

  if (callState === 'idle') return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        {isVideo && (
          <View style={styles.videoContainer}>
            <View style={styles.remoteVideo}>
              {remoteUid && !isRemoteVideoMuted ? (
                <>
                  <RtcSurfaceView
                    canvas={{
                      uid: remoteUid,
                      sourceType: VideoSourceType.VideoSourceRemote,
                    }}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.remoteNameContainer}>
                    <Text style={styles.remoteVideoName}>{otherName}</Text>
                    {isRemoteMuted && (
                      <Ionicons name="mic-off" size={16} color={colors.danger} style={{ marginLeft: 6 }} />
                    )}
                  </View>
                </>
              ) : (
                <>
                  <Ionicons name="person-circle" size={80} color={colors.textMuted} />
                  <Text style={styles.remoteName}>{otherName}</Text>
                  {isRemoteVideoMuted && (
                    <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 8 }}>Camera turned off</Text>
                  )}
                  {remoteUid && isRemoteMuted && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                      <Ionicons name="mic-off" size={16} color={colors.danger} />
                      <Text style={{ color: colors.danger, marginLeft: 4, fontSize: 14 }}>Muted</Text>
                    </View>
                  )}
                </>
              )}
            </View>
            <View style={[styles.localVideo, { opacity: isVideoEnabled ? 1 : 0.4 }]}>
              {isVideoEnabled ? (
                <RtcSurfaceView
                  canvas={{
                    uid: 0,
                    sourceType: VideoSourceType.VideoSourceCamera,
                  }}
                  style={StyleSheet.absoluteFill}
                />
              ) : (
                <Ionicons name="person" size={24} color={colors.white} />
              )}
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
              {callState === 'active' 
                ? (isRemoteMuted ? 'Muted' : formatTime(seconds)) 
                : callState === 'ended' 
                  ? 'Call Ended' 
                  : 'Connecting...'}
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
  remoteNameContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    zIndex: 10,
  },
  remoteVideoName: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  localVideo: { position: 'absolute', top: 50, right: 16, width: 100, height: 140, borderRadius: 12, backgroundColor: colors.surfaceLight, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  controls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20, paddingVertical: 40, paddingBottom: 60, flexWrap: 'wrap' },
  controlButton: { alignItems: 'center' },
  controlIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  controlIconActive: { backgroundColor: colors.primary },
  controlLabel: { color: colors.white, fontSize: 12, fontWeight: '500' },
  endCallButton: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center' },
});
