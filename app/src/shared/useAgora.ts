import { useCallback, useRef, useEffect, useState } from 'react';
import { createAgoraRtcEngine, ChannelProfileType, ClientRoleType, IRtcEngine } from 'react-native-agora';
import { config } from '../config';

export function useAgora() {
  const [joined, setJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isCameraFront, setIsCameraFront] = useState(true);
  const [isRemoteMuted, setIsRemoteMuted] = useState(false);
  const [isRemoteVideoMuted, setIsRemoteVideoMuted] = useState(false);

  const engineRef = useRef<IRtcEngine | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        engineRef.current = createAgoraRtcEngine();
        const engine = engineRef.current;
        engine.initialize({
          appId: config.agoraAppId,
          channelProfile: ChannelProfileType.ChannelProfileCommunication,
        });

        engine.registerEventHandler({
          onJoinChannelSuccess: (connection, elapsed) => {
            console.log('[Agora] onJoinChannelSuccess', connection);
            setJoined(true);
          },
          onUserJoined: (connection, remoteUid, elapsed) => {
            console.log('[Agora] onUserJoined', remoteUid);
            setRemoteUid(remoteUid);
          },
          onUserOffline: (connection, remoteUid, reason) => {
            console.log('[Agora] onUserOffline', remoteUid);
            setRemoteUid(null);
            setIsRemoteMuted(false);
            setIsRemoteVideoMuted(false);
          },
          onUserMuteAudio: (connection, uid, muted) => {
            console.log('[Agora] onUserMuteAudio', uid, muted);
            setIsRemoteMuted(muted);
          },
          onUserMuteVideo: (connection, uid, muted) => {
            console.log('[Agora] onUserMuteVideo', uid, muted);
            setIsRemoteVideoMuted(muted);
          },
          onError: (err, msg) => {
            console.log('[Agora] onError', err, msg);
          }
        });

        engine.enableAudio();
      } catch (e) {
        console.error('[Agora] init error', e);
      }
    };
    init();

    return () => {
      if (engineRef.current) {
        engineRef.current.unregisterEventHandler({});
        engineRef.current.release();
        engineRef.current = null;
      }
    };
  }, []);

  const joinChannel = useCallback(async (channel: string, token: string, uid: number, type: 'audio' | 'video') => {
    if (!engineRef.current) return;
    try {
      engineRef.current.setClientRole(ClientRoleType.ClientRoleBroadcaster);
      if (type === 'video') {
        engineRef.current.enableVideo();
        engineRef.current.startPreview();
        setIsVideoEnabled(true);
      } else {
        engineRef.current.disableVideo();
        setIsVideoEnabled(false);
      }
      engineRef.current.joinChannel(token, channel, uid, {});
    } catch (e) {
      console.error('[Agora] joinChannel error', e);
    }
  }, []);

  const leaveChannel = useCallback(() => {
    if (!engineRef.current) return;
    try {
      engineRef.current.leaveChannel();
      setJoined(false);
      setRemoteUid(null);
      setIsRemoteMuted(false);
      setIsRemoteVideoMuted(false);
    } catch (e) {
      console.error('[Agora] leaveChannel error', e);
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (!engineRef.current) return;
    setIsMuted(prev => {
      const next = !prev;
      engineRef.current?.muteLocalAudioStream(next);
      return next;
    });
  }, []);

  const toggleSpeaker = useCallback(() => {
    if (!engineRef.current) return;
    setIsSpeakerOn(prev => {
      const next = !prev;
      engineRef.current?.setEnableSpeakerphone(next);
      return next;
    });
  }, []);

  const toggleCamera = useCallback(() => {
    if (!engineRef.current) return;
    setIsVideoEnabled(prev => {
      const next = !prev;
      if (next) {
        engineRef.current?.enableVideo();
        engineRef.current?.startPreview();
      } else {
        engineRef.current?.disableVideo();
        engineRef.current?.stopPreview();
      }
      return next;
    });
  }, []);

  const switchCamera = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.switchCamera();
    setIsCameraFront(prev => !prev);
  }, []);

  return {
    joinChannel, leaveChannel, toggleMute, toggleSpeaker, toggleCamera, switchCamera,
    joined, remoteUid, isMuted, isSpeakerOn, isVideoEnabled, isCameraFront, isRemoteMuted, isRemoteVideoMuted,
  };
}
