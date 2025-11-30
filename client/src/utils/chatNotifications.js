class ChatNotificationHandler {
  constructor() {
    this.hasPermission = false;
    this.init();
  }

  async init() {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        this.hasPermission = true;
      } else if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        this.hasPermission = permission === 'granted';
      }
    } else {
      console.warn('⚠️ This browser does not support desktop notification');}
  }

  show(data) {
    if (!this.hasPermission) return;
    const isOnMessagesPage = window.location.pathname.includes('/message');
    const currentChatId = sessionStorage.getItem('currentChatId');
    if (isOnMessagesPage && currentChatId === data.chatId) {
      return;
    }
    const notification = new Notification(
      `New message from ${data.message.senderName}`, 
      {
        body: data.message.content,
        icon: data.message.senderImage || '/wie-logo.png',
        badge: '/wie-logo.png',
        tag: data.chatId,
        requireInteraction: false,
        vibrate: [200, 100, 200],
        silent: false
      }
    );
    notification.onclick = () => {
      window.focus();
      sessionStorage.setItem('openChatId', data.chatId);
      window.location.href = '/message';
      notification.close();
    };

    setTimeout(() => notification.close(), 5000);
  }

  // Request permission explicitly (call this on user action)
  async requestPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      this.hasPermission = permission === 'granted';
      return this.hasPermission;
    }
    return this.hasPermission;
  }
}
export default new ChatNotificationHandler();