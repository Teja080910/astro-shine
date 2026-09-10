import { useCallback, useRef, useEffect, useState } from 'react';
import { Platform } from 'react-native';

const LIVEKIT_URL = process.env.EXPO_PUBLIC_LIVEKIT_URL || 'ws://31.97.222.250:7880';

let RoomClass: any;
let RoomEventEnum: any;
let TrackEnum: any;

async function loadLiveKit() {
  if (Platform.OS !== 'web') {
    const lk = await import('@livekit/react-native');
    lk.registerGlobals();
  }
  const lk = await import('livekit-client');
  RoomClass = lk.Room;
  RoomEventEnum = lk.RoomEvent;
  TrackEnum = lk.Track;
}

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

  useEffect(() => {
    return () => {
      roomRef.current?.disconnect?.();
      roomRef.current = null;
    };
  }, []);

  const joinChannel = useCallback(async (channel: string, token: string, uid: number, type: 'audio' | 'video') => {
    try {
      if (Platform.OS !== 'web') {
        try {
          const { setAudioModeAsync } = require('expo-audio');
          setAudioModeAsync({
            playsInSilentMode: true,
            shouldPlayInBackground: true,
            interruptionMode: 'duckOthers',
          }).catch(() => {});
        } catch {}
      }
      await loadLiveKit();
      const room = new RoomClass({ adaptiveStream: true, dynacast: true });
      roomRef.current = room;

      room.on(RoomEventEnum.TrackSubscribed, (track: any, participant: any) => {
        console.log('[LiveKit] Track subscribed:', track.kind, participant.identity);
        if (track.kind === TrackEnum.Kind.Audio) setIsRemoteMuted(false);
        if (track.kind === TrackEnum.Kind.Video) {
          setIsRemoteVideoMuted(false);
          setRemoteVideoTrack(track);
        }
      });

      room.on(RoomEventEnum.TrackUnsubscribed, (track: any) => {
        if (track.kind === TrackEnum.Kind.Video) { setIsRemoteVideoMuted(true); setRemoteVideoTrack(null); }
      });

      room.on(RoomEventEnum.TrackMuted, (pub: any) => {
        if (pub.kind === TrackEnum.Kind.Audio) setIsRemoteMuted(true);
        if (pub.kind === TrackEnum.Kind.Video) { setIsRemoteVideoMuted(true); setRemoteVideoTrack(null); }
      });

      room.on(RoomEventEnum.TrackUnmuted, (pub: any) => {
        if (pub.kind === TrackEnum.Kind.Audio) setIsRemoteMuted(false);
        if (pub.kind === TrackEnum.Kind.Video) {
          setIsRemoteVideoMuted(false);
          setRemoteVideoTrack(pub.videoTrack);
        }
      });

      room.on(RoomEventEnum.ParticipantConnected, () => {
        console.log('[LiveKit] Remote participant connected');
        setRemoteUid(1); setIsRemoteMuted(false); setIsRemoteVideoMuted(false);
      });

      room.on(RoomEventEnum.ParticipantDisconnected, () => {
        setRemoteUid(null); setRemoteVideoTrack(null);
      });

      room.on(RoomEventEnum.LocalTrackPublished, (pub: any) => {
        if (pub.kind === TrackEnum.Kind.Video) { setLocalVideoTrack(pub.track); }
      });

      room.on(RoomEventEnum.LocalTrackUnpublished, (pub: any) => {
        if (pub.kind === TrackEnum.Kind.Video) { setLocalVideoTrack(null); }
      });

      room.on(RoomEventEnum.Disconnected, () => {
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
    }
  }, []);

  const leaveChannel = useCallback(() => {
    roomRef.current?.disconnect?.();
    roomRef.current = null;
    setJoined(false); setRemoteUid(null); setRemoteVideoTrack(null); setLocalVideoTrack(null);
    setIsRemoteMuted(false); setIsRemoteVideoMuted(false);
  }, []);

  const toggleMute = useCallback(async () => {
    const m = !isMuted;
    setIsMuted(m);
    try {
      await roomRef.current?.localParticipant?.setMicrophoneEnabled(!m);
    } catch (e: any) {
      console.error('[LiveKit] toggleMute error:', e.message || e);
      setIsMuted(!m);
    }
  }, [isMuted]);

  const toggleSpeaker = useCallback(async () => {
    const newVal = !isSpeakerOn;
    setIsSpeakerOn(newVal);
    if (Platform.OS !== 'web') {
      try {
        const { setAudioModeAsync } = require('expo-audio');
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          interruptionMode: 'duckOthers',
          routeOverride: !newVal ? 'earpiece' : undefined,
        });
      } catch {}
    }
  }, [isSpeakerOn]);

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
