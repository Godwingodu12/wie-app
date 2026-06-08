// D:\SQARIS\new 3\wiehive-user-org-master\client\constants\config.ts

export const LOCAL_IP = '192.168.1.8'; // Verified machine IP

export const MOCK_MODE = false; // Using REAL backend for dynamic data

export const SERVICES = {
  AUTH: `http://${LOCAL_IP}:5000/api/auth/`,
  USER: `http://${LOCAL_IP}:5005/api/user/`,
  TICKETS: `http://${LOCAL_IP}:5005/api/tickets/`,
  MEDIA: `http://${LOCAL_IP}:5010/api/`,
  CONNECTION: `http://${LOCAL_IP}:5012/api/`,
  CHAT: `http://${LOCAL_IP}:5004/api/chat/`,
  NOTIFICATION: `http://${LOCAL_IP}:5006/api/notification/`,
  TICKET: `http://${LOCAL_IP}:5003/api/ticket/`,
  TRANSACTION: `http://${LOCAL_IP}:5007/api/transaction/`,
  FOLLOW: `http://${LOCAL_IP}:5009/api/`,
};
