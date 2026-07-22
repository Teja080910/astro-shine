'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { config } from '@/config';

type EventHandler = (data: any) => void;

export function useSocket(events: Record<string, EventHandler>) {
  const socketRef = useRef<Socket | null>(null);
  const eventsRef = useRef(events);
  eventsRef.current = events;

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin-token') : null;
    const socket = io(config.apiUrl, {
      path: '/ws',
      transports: ['websocket', 'polling'],
      query: { token: token || '' },
    });
    socketRef.current = socket;

    const currentEvents = eventsRef.current;
    for (const [event, handler] of Object.entries(currentEvents)) {
      socket.on(event, handler);
    }

    return () => {
      for (const [event] of Object.entries(currentEvents)) {
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
