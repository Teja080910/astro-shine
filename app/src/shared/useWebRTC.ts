import { useCallback, useRef, useEffect, useState } from 'react';
import { Platform, InteractionManager, AppState, AppStateStatus } from 'react-native';

let RTCPeerConnection: any = null;
let RTCSessionDescription: any = null;
let RTCIceCandidate: any = null;
let mediaDevices: any = null;
let webrtcAvailable = false;
try {
  const webrtc = require('react-native-webrtc');
  RTCPeerConnection = webrtc.RTCPeerConnection;
  RTCSessionDescription = webrtc.RTCSessionDescription;
  RTCIceCandidate = webrtc.RTCIceCandidate;
  mediaDevices = webrtc.mediaDevices;
  webrtcAvailable = !!(RTCPeerConnection && mediaDevices?.getUserMedia);
} catch (e) {
  console.error('[WebRTC] Failed to load react-native-webrtc:', e);
}

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

const MAX_STREAM_RETRIES = 3;
const STREAM_RETRY_BASE_MS = 500;

/** Wait until the Android Activity is in foreground and fully resumed */
async function waitForActivityReady(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const state = AppState.currentState;
  if (state === 'active') return true;

  return new Promise(resolve => {
    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') {
        subscription.remove();
        resolve(true);
      }
    });
    // Timeout after 10s — Activity should never take this long
    setTimeout(() => { subscription.remove(); resolve(false); }, 10000);
  });
}

export function useWebRTC(
  onMuteChange?: (muted: boolean) => void,
  onVideoChange?: (enabled: boolean) => void,
) {
  const pcRef = useRef<any>(null);
  const localStreamRef = useRef<any>(null);
  const initialisingRef = useRef(false);
  const destroyedRef = useRef(false);
  const [remoteStream, setRemoteStream] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isRemoteMuted, setIsRemoteMuted] = useState(false);
  const [isRemoteVideoOff, setIsRemoteVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isCameraFront, setIsCameraFront] = useState(true);

  useEffect(() => {
    destroyedRef.current = false;
    return () => {
      destroyedRef.current = true;
      destroyPeerConnection();
      destroyLocalStream();
      InCallManager?.stop();
    };
  }, []);

  function destroyPeerConnection() {
    if (pcRef.current) {
      try { pcRef.current.close(); } catch {}
      pcRef.current = null;
    }
  }

  function destroyLocalStream() {
    if (localStreamRef.current) {
      try { localStreamRef.current.getTracks().forEach((t: any) => t.stop()); } catch {}
      localStreamRef.current = null;
    }
  }

  const createPeerConnection = useCallback((
    onIceCandidate: (candidate: any) => void,
    onRemoteStream: (stream: any) => void,
  ) => {
    if (!webrtcAvailable || destroyedRef.current) return null;
    // Singleton: close existing before creating new
    destroyPeerConnection();
    try {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      pc.addEventListener('icecandidate', (event: any) => {
        if (event.candidate && !destroyedRef.current) onIceCandidate(event.candidate);
      });

      pc.addEventListener('track', (event: any) => {
        if (destroyedRef.current) return;
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
    if (!mediaDevices?.getUserMedia || destroyedRef.current) return null;
    if (initialisingRef.current) {
      console.warn('[WebRTC] startLocalStream already in progress, skipping duplicate');
      return localStreamRef.current;
    }
    initialisingRef.current = true;

    try {
      // 1. Wait for Android Activity to be in RESUMED state
      const activityReady = await waitForActivityReady();
      if (!activityReady || destroyedRef.current) {
        console.error('[WebRTC] Activity never became ready');
        return null;
      }

      // 2. Always wait for navigation transitions to complete
      //    InteractionManager can resolve instantly if queue is empty,
      //    so we add a guaranteed minimum delay for Activity settling
      await new Promise<void>(resolve => InteractionManager.runAfterInteractions(() => resolve()));
      await new Promise<void>(resolve => setTimeout(resolve, 600));

      const constraints: any = { audio: true };
      if (type === 'video') {
        constraints.video = {
          facingMode: isCameraFront ? 'user' : 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 },
        };
      }

      let lastError: any = null;
      for (let attempt = 0; attempt < MAX_STREAM_RETRIES; attempt++) {
        if (destroyedRef.current) return null;
        if (attempt > 0) {
          const delay = STREAM_RETRY_BASE_MS * Math.pow(2, attempt - 1);
          console.warn(`[WebRTC] getUserMedia attempt ${attempt + 1}/${MAX_STREAM_RETRIES} after ${delay}ms`);
          await new Promise(r => setTimeout(r, delay));
        }
        try {
          InCallManager?.start({ media: type === 'video' ? 'video' : 'audio' });
          const stream = await mediaDevices.getUserMedia(constraints);
          if (destroyedRef.current) {
            stream.getTracks().forEach((t: any) => t.stop());
            return null;
          }
          destroyLocalStream();
          localStreamRef.current = stream;
          stream.getTracks().forEach((track: any) => {
            if (pcRef.current && !destroyedRef.current) pcRef.current.addTrack(track, stream);
          });
          console.log(`[WebRTC] getUserMedia succeeded on attempt ${attempt + 1}`);
          return stream;
        } catch (e: any) {
          lastError = e;
          const msg = e?.message || e?.toString?.() || '';
          const isActivityError = msg.includes('No current Activity') || msg.includes('No Activity');
          if (!isActivityError) {
            // Non-recoverable error — don't retry
            console.error('[WebRTC] getUserMedia non-recoverable error', e);
            return null;
          }
          console.warn(`[WebRTC] getUserMedia attempt ${attempt + 1} failed: ${msg}`);
        }
      }
      console.error('[WebRTC] getUserMedia exhausted all retries', lastError);
      return null;
    } finally {
      initialisingRef.current = false;
    }
  }, [isCameraFront]);

  const createOffer = useCallback(async () => {
    if (!pcRef.current || destroyedRef.current) return null;
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
    if (!pcRef.current || destroyedRef.current) return null;
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
    if (!pcRef.current || destroyedRef.current) return;
    try {
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
    } catch (e) {
      console.error('[WebRTC] setRemoteDescription error', e);
    }
  }, []);

  const addIceCandidate = useCallback(async (candidate: any) => {
    if (!pcRef.current || destroyedRef.current) return;
    try {
      await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.error('[WebRTC] addIceCandidate error', e);
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      if (localStreamRef.current && !destroyedRef.current) {
        localStreamRef.current.getAudioTracks().forEach((t: any) => { t.enabled = !next; });
      }
      onMuteChange?.(next);
      return next;
    });
  }, [onMuteChange]);

  const setAudioSpeaker = useCallback((on: boolean) => {
    try { InCallManager?.setSpeakerphoneOn(on); } catch {}
    setIsSpeakerOn(on);
  }, []);

  const toggleSpeaker = useCallback(() => {
    setAudioSpeaker(!isSpeakerOn);
  }, [isSpeakerOn, setAudioSpeaker]);

  const toggleCamera = useCallback(() => {
    setIsVideoEnabled(prev => {
      const next = !prev;
      if (localStreamRef.current && !destroyedRef.current) {
        localStreamRef.current.getVideoTracks().forEach((t: any) => { t.enabled = next; });
      }
      onVideoChange?.(next);
      return next;
    });
  }, [onVideoChange]);

  const switchCamera = useCallback(async () => {
    if (!localStreamRef.current || destroyedRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()?.[0];
    if (videoTrack?._switchCamera) {
      try {
        await videoTrack._switchCamera();
        setIsCameraFront(prev => !prev);
      } catch (e) {
        console.error('[WebRTC] switchCamera error', e);
      }
    }
  }, []);

  const cleanup = useCallback(() => {
    destroyedRef.current = true;
    initialisingRef.current = false;
    InCallManager?.stop();
    destroyLocalStream();
    destroyPeerConnection();
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
    setAudioSpeaker, webrtcAvailable, destroyedRef,
  };
}
