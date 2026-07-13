import { useCallback, useState } from 'react';

export function useAgora() {
  const [joined, setJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isCameraFront, setIsCameraFront] = useState(true);
  const [isRemoteMuted, setIsRemoteMuted] = useState(false);
  const [isRemoteVideoMuted, setIsRemoteVideoMuted] = useState(false);

  const joinChannel = useCallback(async (channel: string, token: string, uid: number, type: 'audio' | 'video') => {
    console.log('[Web Agora Mock] Joining channel:', channel);
    setJoined(true);
    // Simulate a remote user joining after 2 seconds for testing on web
    setTimeout(() => {
      setRemoteUid(12345);
    }, 2000);
  }, []);

  const leaveChannel = useCallback(() => {
    console.log('[Web Agora Mock] Leaving channel');
    setJoined(false);
    setRemoteUid(null);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const toggleSpeaker = useCallback(() => {
    setIsSpeakerOn(prev => !prev);
  }, []);

  const toggleCamera = useCallback(() => {
    setIsVideoEnabled(prev => !prev);
  }, []);

  const switchCamera = useCallback(() => {
    setIsCameraFront(prev => !prev);
  }, []);

  return {
    joinChannel, leaveChannel, toggleMute, toggleSpeaker, toggleCamera, switchCamera,
    joined, remoteUid, isMuted, isSpeakerOn, isVideoEnabled, isCameraFront, isRemoteMuted, isRemoteVideoMuted,
  };
}
