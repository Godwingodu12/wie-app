interface NotificationPayload {
    userId: string;
    type: string;
    title: string;
    message: string;
    bookingId?: string;
    ticketId?: string;
    link?: string;
}
export declare const createNotification: (payload: NotificationPayload) => Promise<void>;
export declare const getNotifications: (params: {
    userId: string;
    limit?: number;
    skip?: number;
}) => Promise<any>;
export declare const markNotificationAsRead: (params: {
    notificationId: string;
    userId: string;
}) => Promise<any>;
export declare const markAllNotificationsAsRead: (params: {
    userId: string;
}) => Promise<any>;
export declare const deleteNotification: (params: {
    notificationId: string;
    userId: string;
}) => Promise<any>;
export {};
//# sourceMappingURL=notificationHelper.d.ts.map