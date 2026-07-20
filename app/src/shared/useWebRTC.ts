import { useCallback, useRef, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  mediaDevices,
} from 'react-native-webrtc';

let InCallManager: any = null;
try { InCallManager = require('react-native-incall-manager').default; } catch {}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 10,
};

export function useWebRTC(
  onMuteChange?: (muted: boolean) => void,
  onVideoChange?: (enabled: boolean) => void,
) {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<any>(null);
  const [remoteStream, setRemoteStream] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isRemoteMuted, setIsRemoteMuted] = useState(false);
  const [isRemoteVideoOff, setIsRemoteVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isCameraFront, setIsCameraFront] = useState(true);

  useEffect(() => {
    return () => {
      InCallManager?.stop();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t: any) => t.stop());
      }
      if (pcRef.current) pcRef.current.close();
    };
  }, []);

  const setAudioSpeaker = useCallback((on: boolean) => {
    try {
      InCallManager?.setSpeakerphoneOn(on);
    } catch (e) {
      console.error('[WebRTC] setSpeakerphoneOn error', e);
    }
    setIsSpeakerOn(on);
  }, []);

  const createPeerConnection = useCallback((
    onIceCandidate: (candidate: any) => void,
    onRemoteStream: (stream: any) => void,
  ) => {
    try {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      // @ts-ignore
      pc.addEventListener('icecandidate', (event: any) => {
        if (event.candidate) onIceCandidate(event.candidate);
      });

      // @ts-ignore
      pc.addEventListener('track', (event: any) => {
        const [stream] = event.streams;
        setRemoteStream(stream);
        onRemoteStream(stream);
      });

      return pc;
    } catch (e) {
      console.error('[WebRTC] createPeerConnection error', e);
      return null;
    }
  }, []);

  const startLocalStream = useCallback(async (type: 'audio' | 'video') => {
    try {
      InCallManager?.start({ media: type === 'video' ? 'video' : 'audio' });
      if (type === 'video') {
        InCallManager?.setSpeakerphoneOn(true);
        setIsSpeakerOn(true);
      }
      const constraints: any = { audio: true };
      if (type === 'video') {
        constraints.video = { facingMode: isCameraFront ? 'user' : 'environment', width: 640, height: 480 };
      }
      const stream = await mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      stream.getTracks().forEach((track: any) => {
        if (pcRef.current) pcRef.current.addTrack(track, stream);
      });
      return stream;
    } catch (e) {
      console.error('[WebRTC] getUserMedia error', e);
      return null;
    }
  }, [isCameraFront]);

  const createOffer = useCallback(async () => {
    if (!pcRef.current) return null;
    try {
      const offer = await pcRef.current.createOffer();
      await pcRef.current.setLocalDescription(offer);
      return { type: offer.type, sdp: offer.sdp };
    } catch (e) {
      console.error('[WebRTC] createOffer error', e); return null;
    }
  }, []);

  const createAnswer = useCallback(async () => {
    if (!pcRef.current) return null;
    try {
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      return { type: answer.type, sdp: answer.sdp };
    } catch (e) {
      console.error('[WebRTC] createAnswer error', e); return null;
    }
  }, []);

  const setRemoteDescription = useCallback(async (sdp: any) => {
    if (!pcRef.current) return;
    try {
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
    } catch (e) { console.error('[WebRTC] setRemoteDescription error', e); }
  }, []);

  const addIceCandidate = useCallback(async (candidate: any) => {
    if (!pcRef.current) return;
    try {
      await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) { console.error('[WebRTC] addIceCandidate error', e); }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((t: any) => { t.enabled = !next; });
      }
      onMuteChange?.(next);
      return next;
    });
  }, [onMuteChange]);

  const toggleSpeaker = useCallback(() => {
    setAudioSpeaker(!isSpeakerOn);
  }, [isSpeakerOn, setAudioSpeaker]);

  const toggleCamera = useCallback(() => {
    setIsVideoEnabled(prev => {
      const next = !prev;
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((t: any) => { t.enabled = next; });
      }
      onVideoChange?.(next);
      return next;
    });
  }, [onVideoChange]);

  const switchCamera = useCallback(async () => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()?.[0];
    if (videoTrack && videoTrack._switchCamera) {
      try {
        await videoTrack._switchCamera();
        setIsCameraFront(prev => !prev);
      } catch (e) {
        console.error('[WebRTC] switchCamera error', e);
      }
    }
  }, []);

  const cleanup = useCallback(() => {
    InCallManager?.stop();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t: any) => t.stop());
      localStreamRef.current = null;
    }
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    setRemoteStream(null);
    setIsMuted(false);
    setIsRemoteMuted(false);
    setIsRemoteVideoOff(false);
    setIsSpeakerOn(false);
    setIsVideoEnabled(true);
    setIsCameraFront(true);
  }, []);

  return {
    createPeerConnection, startLocalStream, createOffer, createAnswer,
    setRemoteDescription, addIceCandidate, toggleMute, toggleSpeaker,
    toggleCamera, switchCamera, cleanup,
    remoteStream, isMuted, isRemoteMuted, setIsRemoteMuted,
    isRemoteVideoOff, setIsRemoteVideoOff,
    isSpeakerOn, isVideoEnabled, isCameraFront, localStreamRef,
    setAudioSpeaker,
  };
}
