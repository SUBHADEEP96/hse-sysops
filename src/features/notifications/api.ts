import { request } from "@/src/api/http-client";
import { routes } from "@/src/api/routes";
export type Notification = {
  id: string | number;
  title?: string;
  message?: string;
  is_read?: boolean | number;
  audit_id?: string | number;
  created_at?: string;
};
export const notificationKeys = {
  all: ["notifications"] as const,
  unread: ["notifications", "unread"] as const,
};
export const getNotifications = () =>
  request<Notification[]>("sat", routes.notifications);
export const getUnreadCount = () =>
  request<{ count?: number; unread_count?: number }>("sat", routes.unread);
export const markRead = (id: string | number) =>
  request("sat", `${routes.notifications}/${id}/read`, {
    method: "PATCH",
    body: {},
  });
export const markAllRead = () =>
  request("sat", `${routes.notifications}/read-all`, {
    method: "PATCH",
    body: {},
  });
