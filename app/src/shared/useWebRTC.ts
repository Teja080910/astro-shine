import { useCallback, useRef, useEffect, useState } from 'react';
import { Platform, NativeModules } from 'react-native';
import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  mediaDevices,
} from 'react-native-webrtc';

const AudioModule = NativeModules.WebRTCModule || NativeModules.AudioModule;

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 10,
};

export function useWebRTC(onMuteChange?: (muted: boolean) => void) {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<any>(null);
  const [remoteStream, setRemoteStream] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isRemoteMuted, setIsRemoteMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isCameraFront, setIsCameraFront] = useState(true);

  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t: any) => t.stop());
      }
      if (pcRef.current) {
        pcRef.current.close();
      }
    };
  }, []);

  const createPeerConnection = useCallback((
    onIceCandidate: (candidate: any) => void,
    onRemoteStream: (stream: any) => void,
  ) => {
    try {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      // @ts-ignore - react-native-webrtc uses addEventListener
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
      // Configure audio session for VoIP
      if (Platform.OS === 'ios' && AudioModule?.audioSessionConfigure) {
        AudioModule.audioSessionConfigure();
      }
      const constraints: any = { audio: true };
      if (type === 'video') {
        constraints.video = { facingMode: isCameraFront ? 'user' : 'environment' };
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
      console.error('[WebRTC] createOffer error', e);
      return null;
    }
  }, []);

  const createAnswer = useCallback(async () => {
    if (!pcRef.current) return null;
    try {
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      return { type: answer.type, sdp: answer.sdp };
    } catch (e) {
      console.error('[WebRTC] createAnswer error', e);
      return null;
    }
  }, []);

  const setRemoteDescription = useCallback(async (sdp: any) => {
    if (!pcRef.current) return;
    try {
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
    } catch (e) {
      console.error('[WebRTC] setRemoteDescription error', e);
    }
  }, []);

  const addIceCandidate = useCallback(async (candidate: any) => {
    if (!pcRef.current) return;
    try {
      await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.error('[WebRTC] addIceCandidate error', e);
    }
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
    setIsSpeakerOn(prev => {
      const next = !prev;
      try {
        if (Platform.OS === 'android' && AudioModule?.setSpeakerphoneOn) {
          AudioModule.setSpeakerphoneOn(next);
        }
      } catch (e) {
        console.error('[WebRTC] setSpeakerphoneOn error', e);
      }
      return next;
    });
  }, []);

  const toggleCamera = useCallback(() => {
    setIsVideoEnabled(prev => {
      const next = !prev;
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((t: any) => { t.enabled = next; });
      }
      return next;
    });
  }, []);

  const switchCamera = useCallback(() => {
    setIsCameraFront(prev => !prev);
  }, []);

  const cleanup = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t: any) => t.stop());
      localStreamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    setRemoteStream(null);
    setIsMuted(false);
    setIsSpeakerOn(false);
    setIsVideoEnabled(true);
    setIsCameraFront(true);
  }, []);

  return {
    createPeerConnection, startLocalStream, createOffer, createAnswer,
    setRemoteDescription, addIceCandidate, toggleMute, toggleSpeaker,
    toggleCamera, switchCamera, cleanup,
    remoteStream, isMuted, isRemoteMuted, setIsRemoteMuted, isSpeakerOn,
    isVideoEnabled, isCameraFront, localStreamRef,
  };
}
