import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Suppress WebSocket connection errors from webpack-dev-server HMR
// These are harmless and occur when HMR tries to connect for live reloading
if (process.env.NODE_ENV === 'development') {
  // Suppress console errors for WebSocket connection failures
  const originalError = console.error;
  const originalWarn = console.warn;
  
  const isWebSocketError = (message: string, source?: string): boolean => {
    const msg = message?.toLowerCase() || '';
    const src = source?.toLowerCase() || '';
    
    // Check for WebSocket-related keywords
    const hasWebSocketKeyword = 
      msg.includes('websocket') || 
      msg.includes('ws://') ||
      src.includes('websocketclient') ||
      src.includes('socket.js') ||
      src.includes('webpack');
    
    // Check for localhost:3001 or ws://localhost:3001/ws
    const hasLocalhostPort = 
      msg.includes('localhost:3001') || 
      msg.includes('ws://localhost:3001/ws') ||
      msg.includes('ws://localhost:3001');
    
    return hasWebSocketKeyword && hasLocalhostPort;
  };

  const isFindDomNodeWarning = (message: string): boolean => {
    const msg = message?.toLowerCase() || '';
    return msg.includes('finddomnode is deprecated') && msg.includes('reactquill');
  };
  
  console.error = (...args: any[]) => {
    const errorMessage = args[0]?.toString() || '';
    const errorSource = args[1]?.toString() || '';
    const fullMessage = args.map(arg => String(arg)).join(' ');
    
    // Filter out WebSocket connection errors from webpack-dev-server
    if (
      isWebSocketError(errorMessage, errorSource) ||
      isWebSocketError(fullMessage) ||
      isFindDomNodeWarning(fullMessage) ||
      errorSource.includes('WebSocketClient.js')
    ) {
      // Silently ignore these harmless HMR connection errors
      return;
    }
    originalError.apply(console, args);
  };

  console.warn = (...args: any[]) => {
    const warnMessage = args[0]?.toString() || '';
    const warnSource = args[1]?.toString() || '';
    const fullMessage = args.map(arg => String(arg)).join(' ');
    
    // Filter out WebSocket connection warnings
    if (
      isWebSocketError(warnMessage, warnSource) ||
      isWebSocketError(fullMessage) ||
      isFindDomNodeWarning(fullMessage) ||
      warnSource.includes('WebSocketClient.js')
    ) {
      // Silently ignore these harmless HMR connection warnings
      return;
    }
    originalWarn.apply(console, args);
  };

  // Catch unhandled WebSocket errors at the window level
  window.addEventListener('error', (event) => {
    const message = event.message?.toLowerCase() || '';
    const filename = event.filename?.toLowerCase() || '';
    
    if (
      (message.includes('websocket') || filename.includes('websocketclient') || filename.includes('socket.js')) &&
      (message.includes('localhost:3001') || message.includes('ws://localhost:3001'))
    ) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }, true);

  // Also catch unhandled promise rejections related to WebSocket
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason?.toString()?.toLowerCase() || '';
    if (
      reason.includes('websocket') &&
      (reason.includes('localhost:3001') || reason.includes('ws://localhost:3001'))
    ) {
      event.preventDefault();
      return false;
    }
  });
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
