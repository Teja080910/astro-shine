import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { config } from '../config';
import { useAuth } from './AuthContext';
import { Platform, PermissionsAndroid, Alert } from 'react-native';

export type CallType = 'audio' | 'video';
export type CallState = 'idle' | 'calling' | 'ringing' | 'active' | 'ended';

interface CallData {
  callId: string;
  callerId?: string;
  callerRole?: string;
  callerName?: string;
  type: CallType;
  duration?: number;
}

interface CallContextType {
  callState: CallState;
  callData: CallData | null;
  initiateCall: (astrologerId: string, astrologerName: string, type: CallType) => void;
  acceptCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
  incomingCall: CallData | null;
  setIncomingCall: (data: CallData | null) => void;
  socketRef: React.MutableRefObject<Socket | null>;
}

async function requestCallPermissions(type: 'audio' | 'video'): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    const permissions = [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
    if (type === 'video') permissions.push(PermissionsAndroid.PERMISSIONS.CAMERA);
    const granted = await PermissionsAndroid.requestMultiple(permissions);
    const audioOk = granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
    const cameraOk = type === 'video'
      ? granted[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED
      : true;
    if (!audioOk || !cameraOk) {
      Alert.alert('Permissions Required', `Please grant ${type === 'video' ? 'microphone and camera' : 'microphone'} permissions.`);
      return false;
    }
    return true;
  } catch { return false; }
}

const CallContext = createContext<CallContextType>(null!);

export function CallProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const acceptGuardRef = useRef(false);
  const pendingTimersRef = useRef<NodeJS.Timeout[]>([]);
  const [callState, setCallState] = useState<CallState>('idle');
  const [callData, setCallData] = useState<CallData | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallData | null>(null);

  const clearTimers = useCallback(() => {
    pendingTimersRef.current.forEach(clearTimeout);
    pendingTimersRef.current = [];
  }, []);

  // Socket lifecycle — disconnect old before connecting new
  useEffect(() => {
    if (!token) return;
    socketRef.current?.disconnect();
    const socket = io(config.socketUrl, {
      path: config.socketPath,
      query: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('call:incoming', (data: any) => {
      acceptGuardRef.current = false;
      setIncomingCall({ callId: data.callId, callerId: data.callerId, callerRole: data.callerRole, callerName: data.callerName, type: data.type });
      setCallState('ringing');
    });

    socket.on('call:error', (data: any) => {
      Alert.alert('Call Error', data.message || 'Call failed');
      clearTimers();
      setCallState('idle');
      setCallData(null);
      setIncomingCall(null);
    });

    socket.on('call:initiated', (data: any) => {
      setCallData(prev => prev ? { ...prev, callId: data.callId } : null);
    });

    socket.on('call:accepted', () => {
      setCallState('active');
    });

    socket.on('call:rejected', () => {
      clearTimers();
      setCallState('idle');
      setCallData(null);
    });

    socket.on('call:missed', () => {
      clearTimers();
      setCallState('idle');
      setCallData(null);
    });

    socket.on('call:ended', (data: any) => {
      clearTimers();
      setCallState('ended');
      setCallData(prev => prev ? { ...prev, duration: data.duration } : null);
      const t = setTimeout(() => { setCallState('idle'); setCallData(null); }, 2000);
      pendingTimersRef.current.push(t);
    });

    return () => { clearTimers(); socket.disconnect(); };
  }, [token, clearTimers]);

  const initiateCall = useCallback(async (astrologerId: string, astrologerName: string, type: CallType) => {
    const ok = await requestCallPermissions(type);
    if (!ok) return;
    setCallState('calling');
    setCallData({ callId: '', type, callerName: astrologerName });
    socketRef.current?.emit('call:initiate', { astrologerId, type });
    const t = setTimeout(() => {
      setCallState(prev => prev === 'calling' ? 'idle' : prev);
      setCallData(prev => prev && !prev.callId ? null : prev);
    }, 60000);
    pendingTimersRef.current.push(t);
  }, []);

  const rejectCall = useCallback(() => {
    if (!incomingCall) return;
    socketRef.current?.emit('call:reject', { callId: incomingCall.callId });
    setIncomingCall(null);
    setCallState('idle');
  }, [incomingCall]);

  const acceptCall = useCallback(async () => {
    // Idempotency guard — prevent double-tap
    if (acceptGuardRef.current || !incomingCall) return;
    acceptGuardRef.current = true;

    try {
      const ok = await requestCallPermissions(incomingCall.type);
      if (!ok) { acceptGuardRef.current = false; rejectCall(); return; }
      socketRef.current?.emit('call:accept', { callId: incomingCall.callId });
      setCallState('active');
      setCallData(incomingCall);
      setIncomingCall(null);
    } catch {
      acceptGuardRef.current = false;
    }
  }, [incomingCall, rejectCall]);

  const endCall = useCallback(() => {
    if (!callData?.callId) return;
    socketRef.current?.emit('call:end', { callId: callData.callId });
    clearTimers();
    setCallState('ended');
    const t = setTimeout(() => { setCallState('idle'); setCallData(null); }, 2000);
    pendingTimersRef.current.push(t);
  }, [callData, clearTimers]);

  return (
    <CallContext.Provider value={{ callState, callData, initiateCall, acceptCall, rejectCall, endCall, incomingCall, setIncomingCall, socketRef }}>
      {children}
    </CallContext.Provider>
  );
}

export const useCall = () => useContext(CallContext);
