import api from "./api";

export interface AppNotification {
  id: number;
  type: string;
  title: string;
  body: string;
  data: Record<string, any> | null;
  read_at: string | null;
  created_at: string;
}

export interface NotificationPage {
  data: AppNotification[];
  current_page: number;
  last_page: number;
  total: number;
}

export const getNotifications = (page = 1) =>
  api.get<{ success: boolean; data: NotificationPage }>(`/notifications?page=${page}`);

export const getUnreadCount = () =>
  api.get<{ success: boolean; data: { count: number } }>("/notifications/unread-count");

export const markNotificationRead = (id: number) =>
  api.patch(`/notifications/${id}/read`);

export const markAllNotificationsRead = () =>
  api.patch("/notifications/read-all");
