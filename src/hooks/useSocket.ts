'use client';
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

// Single shared socket instance
let socketInstance: Socket | null = null;

function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(window.location.origin, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      withCredentials: true, // send httpOnly cookies with socket handshake
    });

    socketInstance.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });
  }
  return socketInstance;
}

/** Disconnect and destroy the shared socket (call on logout) */
export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}

/**
 * useSocket — connects to Socket.IO and invalidates React Query caches
 * when lead data changes on the server. Call this once per layout component.
 */
export function useSocket() {
  const qc = useQueryClient();
  const handlerRef = useRef<() => void>();

  useEffect(() => {
    const socket = getSocket();

    handlerRef.current = () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['kpis'] });
      qc.invalidateQueries({ queryKey: ['hr-leads'] });
      qc.invalidateQueries({ queryKey: ['hr-dashboard'] });
      qc.invalidateQueries({ queryKey: ['hr-closed-leads'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['meetings'] });
      qc.invalidateQueries({ queryKey: ['pipeline-board'] });
      qc.invalidateQueries({ queryKey: ['my-tasks'] });
      qc.invalidateQueries({ queryKey: ['lead-activities'] });
    };

    socket.on('lead:changed', handlerRef.current);

    return () => {
      if (handlerRef.current) {
        socket.off('lead:changed', handlerRef.current);
      }
    };
  }, [qc]);
}
