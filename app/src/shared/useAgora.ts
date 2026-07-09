import { useCallback, useRef, useEffect, useState } from 'react';

export function useAgora() {
  const [joined, setJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isCameraFront, setIsCameraFront] = useState(true);

  const joinChannel = useCallback(async (_channel: string, _token: string, _uid: number) => {
    setJoined(true);
  }, []);

  const leaveChannel = useCallback(() => {
    setJoined(false);
    setRemoteUid(null);
  }, []);

  const toggleMute = useCallback(() => setIsMuted(p => !p), []);
  const toggleSpeaker = useCallback(() => setIsSpeakerOn(p => !p), []);
  const toggleCamera = useCallback(() => setIsVideoEnabled(p => !p), []);
  const switchCamera = useCallback(() => setIsCameraFront(p => !p), []);

  return {
    joinChannel, leaveChannel, toggleMute, toggleSpeaker, toggleCamera, switchCamera,
    joined, remoteUid, isMuted, isSpeakerOn, isVideoEnabled, isCameraFront,
  };
}
