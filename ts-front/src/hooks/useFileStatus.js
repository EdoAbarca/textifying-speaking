import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';

const SOCKET_URL = 'http://localhost:3001/media';

export const useFileStatus = (onFileStatusUpdate, onFileProgress, onSummaryStatusUpdate) => {
  const socketRef = useRef(null);
  const token = useAuthStore((state) => state.token);

  const connect = useCallback(() => {
    if (!token || socketRef.current?.connected) {
      return;
    }

    console.log('Connecting to WebSocket...');
    
    socketRef.current = io(SOCKET_URL, {
      auth: {
        token: token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current.on('connect', () => {
      console.log('WebSocket connected');
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    socketRef.current.on('fileStatusUpdate', (data) => {
      console.log('File status update received:', data);
      if (onFileStatusUpdate) {
        onFileStatusUpdate(data);
      }
    });

    socketRef.current.on('fileProgress', (data) => {
      console.log('File progress update received:', data);
      if (onFileProgress) {
        onFileProgress(data);
      }
    });

    socketRef.current.on('summaryStatusUpdate', (data) => {
      console.log('Summary status update received:', data);
      if (onSummaryStatusUpdate) {
        onSummaryStatusUpdate(data);
      }
    });
  }, [token, onFileStatusUpdate, onFileProgress, onSummaryStatusUpdate]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('Disconnecting WebSocket...');
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [token, connect, disconnect]);

  return {
    isConnected: socketRef.current?.connected || false,
    disconnect,
  };
};
