import { useCallback, useRef, useEffect, useState } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
import { registerGlobals } from '@livekit/react-native';
import type { LocalVideoTrack, RemoteVideoTrack } from 'livekit-client';

registerGlobals();

const LIVEKIT_URL = 'ws://31.97.222.250:7880';

export function useAgora() {
  const roomRef = useRef<Room | null>(null);
  const [joined, setJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isCameraFront, setIsCameraFront] = useState(true);
  const [isRemoteMuted, setIsRemoteMuted] = useState(false);
  const [isRemoteVideoMuted, setIsRemoteVideoMuted] = useState(false);
  const [remoteVideoTrack, setRemoteVideoTrack] = useState<RemoteVideoTrack | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<LocalVideoTrack | null>(null);

  useEffect(() => {
    return () => {
      roomRef.current?.disconnect();
      roomRef.current = null;
    };
  }, []);

  const joinChannel = useCallback(async (channel: string, token: string, uid: number, type: 'audio' | 'video') => {
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
    });
    roomRef.current = room;

    room.on(RoomEvent.TrackSubscribed, (track, participant, pub) => {
      if (track.kind === Track.Kind.Audio) {
        setIsRemoteMuted(false);
      }
      if (track.kind === Track.Kind.Video) {
        setIsRemoteVideoMuted(false);
        setRemoteVideoTrack(track as RemoteVideoTrack);
      }
    });

    room.on(RoomEvent.TrackUnsubscribed, (track, participant, pub) => {
      if (track.kind === Track.Kind.Video) {
        setIsRemoteVideoMuted(true);
        setRemoteVideoTrack(null);
      }
    });

    room.on(RoomEvent.TrackMuted, (pub, participant) => {
      if (pub.kind === Track.Kind.Audio) setIsRemoteMuted(true);
      if (pub.kind === Track.Kind.Video) {
        setIsRemoteVideoMuted(true);
        setRemoteVideoTrack(null);
      }
    });

    room.on(RoomEvent.TrackUnmuted, (pub, participant) => {
      if (pub.kind === Track.Kind.Audio) setIsRemoteMuted(false);
      if (pub.kind === Track.Kind.Video) {
        setIsRemoteVideoMuted(false);
        setRemoteVideoTrack(pub.videoTrack as RemoteVideoTrack);
      }
    });

    room.on(RoomEvent.ParticipantConnected, () => {
      setRemoteUid(1);
      setIsRemoteMuted(false);
      setIsRemoteVideoMuted(false);
    });

    room.on(RoomEvent.ParticipantDisconnected, () => {
      setRemoteUid(null);
      setRemoteVideoTrack(null);
      setIsRemoteMuted(false);
      setIsRemoteVideoMuted(false);
    });

    room.on(RoomEvent.Disconnected, () => {
      setJoined(false);
      setRemoteUid(null);
      setRemoteVideoTrack(null);
      setLocalVideoTrack(null);
    });

    try {
      await room.connect(LIVEKIT_URL, token);
      setJoined(true);

      await room.localParticipant.setMicrophoneEnabled(true);
      if (type === 'video') {
        await room.localParticipant.setCameraEnabled(true);
        setIsVideoEnabled(true);
        if (room.localParticipant.videoTrackPublications.size > 0) {
          const pub = [...room.localParticipant.videoTrackPublications.values()][0];
          setLocalVideoTrack(pub.videoTrack as LocalVideoTrack);
        }
      } else {
        setIsVideoEnabled(false);
      }
    } catch (e) {
      console.error('[LiveKit] joinChannel error', e);
    }
  }, []);

  const leaveChannel = useCallback(() => {
    roomRef.current?.disconnect();
    roomRef.current = null;
    setJoined(false);
    setRemoteUid(null);
    setRemoteVideoTrack(null);
    setLocalVideoTrack(null);
    setIsRemoteMuted(false);
    setIsRemoteVideoMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    if (!roomRef.current) return;
    setIsMuted(prev => {
      const next = !prev;
      roomRef.current!.localParticipant.setMicrophoneEnabled(!next);
      return next;
    });
  }, []);

  const toggleSpeaker = useCallback(() => {
    setIsSpeakerOn(prev => !prev);
  }, []);

  const toggleCamera = useCallback(() => {
    if (!roomRef.current) return;
    setIsVideoEnabled(prev => {
      const next = !prev;
      roomRef.current!.localParticipant.setCameraEnabled(next);
      return next;
    });
  }, []);

  const switchCamera = useCallback(() => {
    (roomRef.current?.localParticipant as any)?.switchCamera?.('front');
    setIsCameraFront(prev => !prev);
  }, []);

  return {
    joinChannel, leaveChannel, toggleMute, toggleSpeaker, toggleCamera, switchCamera,
    joined, remoteUid, isMuted, isSpeakerOn, isVideoEnabled, isCameraFront, isRemoteMuted, isRemoteVideoMuted,
    remoteVideoTrack, localVideoTrack,
  };
}
