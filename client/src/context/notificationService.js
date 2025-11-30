import { io } from 'socket.io-client';

class NotificationService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.isConnecting = false;
  }
  // Connect to notification service
  connect(token) {
    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting) {
      return;
    }
    if (this.socket?.connected) {
      return;
    }
    // If socket exists but is disconnected, clean it up first
    if (this.socket && !this.socket.connected) {
      this.socket.removeAllListeners();
      this.socket = null;
    }
    this.isConnecting = true;
    // Get the base URL and ensure it's properly formatted
    const baseUrl = import.meta.env.VITE_NOTIFICATION_API_BASE_URL || 'http://localhost:5006';
    try {
      this.socket = io(baseUrl, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        timeout: 20000, // Increased timeout
        autoConnect: true,
        forceNew: true, // Force new connection
      });
      this.setupEventListeners();
    } catch (error) {
      console.error('❌ Error creating socket connection:', error);
      this.isConnecting = false;
    }
  }
  // Setup event listeners
  setupEventListeners() {
    if (!this.socket) return;
    this.socket.on('connect', () => {
      this.isConnecting = false;
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnecting = false;
      // Auto-reconnect if the disconnection wasn't intentional
      if (reason === 'io server disconnect') {
        // The server disconnected us, try to reconnect
        setTimeout(() => {
          if (this.socket && !this.socket.connected) {
            this.socket.connect();
          }
        }, 1000);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error.message);
      this.isConnecting = false;
      
      // More detailed error logging
      if (error.message.includes('websocket')) {
        console.log('⚠️ WebSocket connection failed, will try polling...');
      }
    });
    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Reconnection attempt #${attemptNumber}`);
    });

    this.socket.on('reconnect_failed', () => {
      this.isConnecting = false;
    });
    this.socket.on('reconnect', (attemptNumber) => {
      this.isConnecting = false;
    });
    this.socket.on('new-notification', (data) => {
      this.trigger('new-notification', data);
    });
    this.socket.on('notification-read', (data) => {
      this.trigger('notification-read', data);
    });
    this.socket.on('all-notifications-read', (data) => {
      this.trigger('all-notifications-read', data);
    });
    this.socket.on('notification-deleted', (data) => {
      console.log('🗑️ Notification deleted:', data);
      this.trigger('notification-deleted', data);
    });
  }
  // Subscribe to events
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }
  // Unsubscribe from events
  off(event, callback) {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }
  // Trigger event listeners
  trigger(event, data) {
    if (!this.listeners.has(event)) return;
    
    this.listeners.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }

  // Check if connected
  isConnected() {
    return this.socket?.connected || false;
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
      this.isConnecting = false;
    }
  }
  // Manual reconnect method
  reconnect(token) {
    this.disconnect();
    setTimeout(() => {
      this.connect(token);
    }, 500);
  }
}
// Singleton instance
const notificationService = new NotificationService();
export default notificationService;