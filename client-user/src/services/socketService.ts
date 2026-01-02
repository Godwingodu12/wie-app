import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5004';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnecting = false;

  connect(token: string): Socket {
    if (!token) {
      return this.socket as Socket;
    }

    if (this.isConnecting) {
      return this.socket as Socket;
    }

    if (this.socket?.connected) {
      return this.socket;
    }

    // Clean up existing disconnected socket
    if (this.socket && !this.socket.connected) {
      this.socket.removeAllListeners();
      this.socket = null;
    }

    this.isConnecting = true;

    this.socket = io(SOCKET_URL, {
      path: '/wie-socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 20000,
      autoConnect: true,
      forceNew: false,
    });

    this.socket.on('connect', () => {
      this.isConnecting = false;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnecting = false;
      
      if (reason === 'io server disconnect') {
        setTimeout(() => {
          if (this.socket && !this.socket.connected) {
            this.socket.connect();
          }
        }, 1000);
      }
    });

    this.socket.on('connect_error', (error) => {
      this.isConnecting = false;
      this.reconnectAttempts++;

      if (error.message?.includes('Authentication') || 
          error.message?.includes('jwt expired') ||
          this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.disconnect();
      }
    });

    this.socket.on('error', (error) => {
      // Silent error
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
    }
  }

  reconnect(token: string) {
    this.disconnect();
    setTimeout(() => {
      this.connect(token);
    }, 500);
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  joinChat(chatId: string) {
    if (!this.socket?.connected) {
      return;
    }
    this.socket.emit('join-chat', chatId);
  }

  leaveChat(chatId: string) {
    if (!this.socket?.connected) return;
    this.socket.emit('leave-chat', chatId);
  }

  markAsRead(chatId: string, messageIds: string[]) {
    if (!this.socket?.connected) return;
    this.socket.emit('mark-read', { chatId, messageIds });
  }

  sendTyping(chatId: string, isTyping: boolean) {
    if (!this.socket?.connected) return;
    this.socket.emit('typing', { chatId, isTyping });
  }

  requestUnreadCounts() {
    if (!this.socket?.connected) {
      return;
    }
    this.socket.emit('request-unread-counts');
  }

  on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void) {
    if (callback) {
      this.socket?.off(event, callback);
    } else {
      this.socket?.off(event);
    }
  }

  // ✅ NEW: Specific typing event handlers
  onUserTyping(callback: (data: { userId: string; chatId: string; isTyping: boolean }) => void) {
    this.socket?.on('user-typing', callback);
  }

  offUserTyping(callback?: (data: { userId: string; chatId: string; isTyping: boolean }) => void) {
    if (callback) {
      this.socket?.off('user-typing', callback);
    } else {
      this.socket?.off('user-typing');
    }
  }

  onUserStatusChange(callback: (data: { userId: string; isOnline: boolean; lastSeen?: string }) => void) {
    this.socket?.on('user-status-change', callback);
  }

  offUserStatusChange(callback?: (data: { userId: string; isOnline: boolean; lastSeen?: string }) => void) {
    if (callback) {
      this.socket?.off('user-status-change', callback);
    } else {
      this.socket?.off('user-status-change');
    }
  }
}
export const socketService = new SocketService();
export default socketService;