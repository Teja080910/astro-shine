import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { config } from '../config';
import { useAuth } from './AuthContext';

export type CallType = 'audio' | 'video';
export type CallState = 'idle' | 'calling' | 'ringing' | 'active' | 'ended';

interface CallData {
  callId: string;
  channel: string;
  token: string;
  uid: number;
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
}

const CallContext = createContext<CallContextType>(null!);

export function CallProvider({ children }: { children: React.ReactNode }) {
  const { token, user, astrologer } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [callState, setCallState] = useState<CallState>('idle');
  const [callData, setCallData] = useState<CallData | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallData | null>(null);

  useEffect(() => {
    if (!token) return;
    const socket = io(config.socketUrl, {
      path: config.socketPath,
      query: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('call:incoming', (data: any) => {
      setIncomingCall({
        callId: data.callId,
        channel: data.channel,
        token: data.token,
        uid: data.uid,
        callerId: data.callerId,
        callerRole: data.callerRole,
        callerName: data.callerName,
        type: data.type,
      });
      setCallState('ringing');
    });

    socket.on('call:initiated', (data: any) => {
      setCallData(prev => prev ? { ...prev, callId: data.callId, channel: data.channel, token: data.token, uid: data.uid } : null);
    });

    socket.on('call:accepted', (data: any) => {
      setCallState('active');
      setCallData(prev => prev ? { ...prev, channel: data.channel, token: data.token } : null);
    });

    socket.on('call:rejected', () => {
      setCallState('idle');
      setCallData(null);
    });

    socket.on('call:missed', () => {
      setCallState('idle');
      setCallData(null);
    });

    socket.on('call:ended', (data: any) => {
      setCallState('ended');
      setCallData(prev => prev ? { ...prev, duration: data.duration } : null);
      setTimeout(() => { setCallState('idle'); setCallData(null); }, 2000);
    });

    return () => { socket.disconnect(); };
  }, [token]);

  const initiateCall = useCallback((astrologerId: string, astrologerName: string, type: CallType) => {
    setCallState('calling');
    setCallData({ callId: '', channel: '', token: '', uid: 0, type, callerName: astrologerName });
    socketRef.current?.emit('call:initiate', { astrologerId, type });
    setTimeout(() => {
      setCallState(prev => prev === 'calling' ? 'idle' : prev);
      setCallData(prev => prev && !prev.callId ? null : prev);
    }, 30000);
  }, []);

  const acceptCall = useCallback(() => {
    if (!incomingCall) return;
    socketRef.current?.emit('call:accept', { callId: incomingCall.callId });
    setCallState('active');
    setCallData(incomingCall);
    setIncomingCall(null);
  }, [incomingCall]);

  const rejectCall = useCallback(() => {
    if (!incomingCall) return;
    socketRef.current?.emit('call:reject', { callId: incomingCall.callId });
    setIncomingCall(null);
    setCallState('idle');
  }, [incomingCall]);

  const endCall = useCallback(() => {
    if (!callData || !callData.callId) return;
    socketRef.current?.emit('call:end', { callId: callData.callId });
    setCallState('ended');
    setTimeout(() => { setCallState('idle'); setCallData(null); }, 2000);
  }, [callData]);

  return (
    <CallContext.Provider value={{ callState, callData, initiateCall, acceptCall, rejectCall, endCall, incomingCall, setIncomingCall }}>
      {children}
    </CallContext.Provider>
  );
}

export const useCall = () => useContext(CallContext);
