import { useEffect, useState, useRef, useCallback } from 'react';

/**
 * Custom WebSocket hook for real-time updates
 * @param {string} url - WebSocket URL
 * @param {object} options - Configuration options
 * @returns {object} WebSocket state and methods
 */
export const useWebSocket = (url, options = {}) => {
  const {
    reconnect = true,
    reconnectInterval = 5000,
    onOpen,
    onClose,
    onMessage,
    onError
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Connect to WebSocket
  const connect = useCallback(() => {
    try {
      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = (event) => {
        console.log('WebSocket connected:', url);
        setIsConnected(true);
        setError(null);
        if (onOpen) onOpen(event);
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', url);
        setIsConnected(false);
        if (onClose) onClose(event);

        // Auto-reconnect if enabled
        if (reconnect && !event.wasClean) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect...');
            connect();
          }, reconnectInterval);
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          if (onMessage) onMessage(data);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
          setLastMessage(event.data);
          if (onMessage) onMessage(event.data);
        }
      };

      wsRef.current.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError(event);
        if (onError) onError(event);
      };
    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setError(err);
    }
  }, [url, reconnect, reconnectInterval, onOpen, onClose, onMessage, onError]);

  // Send message through WebSocket
  const sendMessage = useCallback((message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const messageString = typeof message === 'string'
        ? message
        : JSON.stringify(message);
      wsRef.current.send(messageString);
      return true;
    }
    console.warn('WebSocket is not connected');
    return false;
  }, []);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // Setup and cleanup
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    error,
    sendMessage,
    disconnect,
    reconnect: connect
  };
};

// Specific hook for MCP WebSocket
export const useMCPWebSocket = (onMessage) => {
  const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3003';

  return useWebSocket(WS_URL, {
    onMessage,
    reconnect: true,
    reconnectInterval: 3000
  });
};

export default useWebSocket;