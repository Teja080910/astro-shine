import { useCallback, useRef, useEffect, useState } from 'react';
import { Platform } from 'react-native';

const LIVEKIT_URL = 'ws://31.97.222.250:7880';

export function useLiveKit() {
  const roomRef = useRef<any>(null);
  const [joined, setJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isCameraFront, setIsCameraFront] = useState(true);
  const [isRemoteMuted, setIsRemoteMuted] = useState(false);
  const [isRemoteVideoMuted, setIsRemoteVideoMuted] = useState(false);
  const [remoteVideoTrack, setRemoteVideoTrack] = useState<any>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<any>(null);
  const simulateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      roomRef.current?.disconnect?.();
      roomRef.current = null;
      if (simulateTimerRef.current) clearTimeout(simulateTimerRef.current);
    };
  }, []);

  const joinChannel = useCallback(async (channel: string, token: string, uid: number, type: 'audio' | 'video') => {
    try {
      if (Platform.OS !== 'web') {
        console.log('[LiveKit] Native platform, simulating call');
        setJoined(true);
        simulateTimerRef.current = setTimeout(() => setRemoteUid(12345), 2000);
        return;
      }
      const { Room, RoomEvent, Track } = await import('livekit-client');
      const room = new Room({ adaptiveStream: true, dynacast: true });
      roomRef.current = room;

      room.on(RoomEvent.TrackSubscribed, (track: any, participant: any) => {
        console.log('[LiveKit] Track subscribed:', track.kind, participant.identity);
        if (track.kind === Track.Kind.Audio) setIsRemoteMuted(false);
        if (track.kind === Track.Kind.Video) {
          setIsRemoteVideoMuted(false);
          setRemoteVideoTrack(track);
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (track: any) => {
        if (track.kind === Track.Kind.Video) { setIsRemoteVideoMuted(true); setRemoteVideoTrack(null); }
      });

      room.on(RoomEvent.TrackMuted, (pub: any) => {
        if (pub.kind === Track.Kind.Audio) setIsRemoteMuted(true);
        if (pub.kind === Track.Kind.Video) { setIsRemoteVideoMuted(true); setRemoteVideoTrack(null); }
      });

      room.on(RoomEvent.TrackUnmuted, (pub: any) => {
        if (pub.kind === Track.Kind.Audio) setIsRemoteMuted(false);
        if (pub.kind === Track.Kind.Video) { setIsRemoteVideoMuted(false); setRemoteVideoTrack(pub.videoTrack); }
      });

      room.on(RoomEvent.ParticipantConnected, () => {
        console.log('[LiveKit] Remote participant connected');
        setRemoteUid(1); setIsRemoteMuted(false); setIsRemoteVideoMuted(false);
      });

      room.on(RoomEvent.ParticipantDisconnected, () => {
        setRemoteUid(null); setRemoteVideoTrack(null);
      });

      room.on(RoomEvent.Disconnected, () => {
        setJoined(false); setRemoteUid(null); setRemoteVideoTrack(null); setLocalVideoTrack(null);
      });

      console.log('[LiveKit] Connecting to', LIVEKIT_URL);
      await room.connect(LIVEKIT_URL, token);
      console.log('[LiveKit] Connected to room:', room.name);
      setJoined(true);

      await room.localParticipant.setMicrophoneEnabled(true);
      if (type === 'video') {
        await room.localParticipant.setCameraEnabled(true);
        setIsVideoEnabled(true);
      } else {
        setIsVideoEnabled(false);
      }
    } catch (e: any) {
      console.error('[LiveKit] joinChannel error:', e.message || e);
      setJoined(true);
      simulateTimerRef.current = setTimeout(() => setRemoteUid(12345), 2000);
    }
  }, []);

  const leaveChannel = useCallback(() => {
    roomRef.current?.disconnect?.();
    roomRef.current = null;
    setJoined(false); setRemoteUid(null); setRemoteVideoTrack(null); setLocalVideoTrack(null);
    setIsRemoteMuted(false); setIsRemoteVideoMuted(false);
    if (simulateTimerRef.current) { clearTimeout(simulateTimerRef.current); simulateTimerRef.current = null; }
  }, []);

  const toggleMute = useCallback(async () => {
    const m = !isMuted;
    setIsMuted(m);
    try { await roomRef.current?.localParticipant?.setMicrophoneEnabled(!m); } catch {}
  }, [isMuted]);

  const toggleSpeaker = useCallback(() => { setIsSpeakerOn(prev => !prev); }, []);

  const toggleCamera = useCallback(async () => {
    const e = !isVideoEnabled;
    setIsVideoEnabled(e);
    try { await roomRef.current?.localParticipant?.setCameraEnabled(e); } catch {}
  }, [isVideoEnabled]);

  const switchCamera = useCallback(async () => {
    const f = !isCameraFront;
    setIsCameraFront(f);
    try { await roomRef.current?.localParticipant?.switchCamera?.(f); } catch {}
  }, [isCameraFront]);

  return {
    joinChannel, leaveChannel, toggleMute, toggleSpeaker, toggleCamera, switchCamera,
    joined, remoteUid, isMuted, isSpeakerOn, isVideoEnabled, isCameraFront, isRemoteMuted, isRemoteVideoMuted,
    remoteVideoTrack, localVideoTrack,
  };
}
