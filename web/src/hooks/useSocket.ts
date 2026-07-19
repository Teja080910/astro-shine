'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { config } from '@/config';

type EventHandler = (data: any) => void;

export function useSocket(events: Record<string, EventHandler>) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(config.apiUrl, {
      path: '/ws',
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    for (const [event, handler] of Object.entries(events)) {
      socket.on(event, handler);
    }

    return () => {
      for (const [event] of Object.entries(events)) {
        socket.off(event);
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const emit = useCallback((event: string, data: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { emit };
}
