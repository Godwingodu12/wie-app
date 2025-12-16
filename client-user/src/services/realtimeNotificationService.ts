import { io, Socket } from 'socket.io-client';

type NotificationEvent =
  | 'new-notification'
  | 'notification-read'
  | 'all-notifications-read'
  | 'notification-deleted';

type Listener = (data: any) => void;

class RealtimeNotificationService {
  private socket: Socket | null = null;
  private listeners: Map<NotificationEvent, Listener[]> = new Map();
  private isConnecting = false;

  connect(token: string | null | undefined) {
    if (!token) {
      return;
    }

    if (this.isConnecting) {
      return;
    }

    if (this.socket?.connected) {
      return;
    }

    if (this.socket && !this.socket.connected) {
      this.socket.removeAllListeners();
      this.socket = null;
    }

    this.isConnecting = true;

    // Prefer a dedicated base URL if provided, otherwise derive it from the REST API URL
    const baseUrlFromEnv =
      process.env.NEXT_PUBLIC_NOTIFICATION_API_BASE_URL ||
      process.env.NEXT_PUBLIC_NOTIFICATION_API_URL;

    let baseUrl =
      typeof baseUrlFromEnv === 'string'
        ? baseUrlFromEnv.replace(/\/api\/notification\/?$/, '')
        : 'http://localhost:5006';

    // Ensure baseUrl doesn't have trailing slash
    baseUrl = baseUrl.replace(/\/$/, '');

    try {
      this.socket = io(baseUrl, {
        auth: {
          token,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        timeout: 20000,
        autoConnect: true,
        forceNew: true,
        path: '/socket.io/',
      });

      this.setupEventListeners();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Error creating socket connection:', error);
      this.isConnecting = false;
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnecting = false;
    });

    this.socket.on('disconnect', (reason: string) => {
      this.isConnecting = false;

      if (reason === 'io server disconnect') {
        setTimeout(() => {
          if (this.socket && !this.socket.connected) {
            this.socket.connect();
          }
        }, 1000);
      }
    });

    this.socket.on('connect_error', (error: Error & { message: string }) => {
      // eslint-disable-next-line no-console
      console.error('❌ Notification socket connection error:', error.message);
      this.isConnecting = false;

      if (error.message.includes('websocket')) {
        // eslint-disable-next-line no-console
        console.log('⚠️ WebSocket connection failed, will try polling...');
      }
    });

    this.socket.on('reconnect_attempt', (attemptNumber: number) => {
      // eslint-disable-next-line no-console
      console.log(`🔄 Notification reconnection attempt #${attemptNumber}`);
    });

    this.socket.on('reconnect_failed', () => {
      this.isConnecting = false;
    });

    this.socket.on('reconnect', () => {
      this.isConnecting = false;
    });

    this.socket.on('new-notification', (data: any) => {
      this.trigger('new-notification', data);
    });

    this.socket.on('notification-read', (data: any) => {
      this.trigger('notification-read', data);
    });

    this.socket.on('all-notifications-read', (data: any) => {
      this.trigger('all-notifications-read', data);
    });

    this.socket.on('notification-deleted', (data: any) => {
      // eslint-disable-next-line no-console
      console.log('🗑️ Notification deleted:', data);
      this.trigger('notification-deleted', data);
    });
  }

  on(event: NotificationEvent, callback: Listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: NotificationEvent, callback: Listener) {
    if (!this.listeners.has(event)) return;

    const callbacks = this.listeners.get(event)!;
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  private trigger(event: NotificationEvent, data: any) {
    if (!this.listeners.has(event)) return;

    this.listeners.get(event)!.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error in notification event listener:', error);
      }
    });
  }

  isConnected() {
    return this.socket?.connected || false;
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
      this.isConnecting = false;
    }
  }

  reconnect(token: string | null | undefined) {
    this.disconnect();
    setTimeout(() => {
      this.connect(token);
    }, 500);
  }
}

const realtimeNotificationService = new RealtimeNotificationService();

export default realtimeNotificationService;


