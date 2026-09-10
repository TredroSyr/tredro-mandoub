import api from "@/lib/axios";
import {
  DevicePlatform,
  ListNotificationsParams,
  MarkAllNotificationsReadResponse,
  MarkNotificationReadResponse,
  NotificationsListResponse,
  RegisterDeviceResponse,
  UnreadCountResponse,
  UnregisterDeviceResponse,
} from "../types";

export const listNotifications = async (
  params?: ListNotificationsParams,
): Promise<NotificationsListResponse> =>
  (await api.get("notifications/", { params })).data;

export const getUnreadNotificationsCount =
  async (): Promise<UnreadCountResponse> =>
    (await api.get("notifications/unread-count/")).data;

export const markNotificationRead = async (
  id: number | string,
): Promise<MarkNotificationReadResponse> =>
  (await api.post(`notifications/${id}/read/`)).data;

export const markAllNotificationsRead =
  async (): Promise<MarkAllNotificationsReadResponse> =>
    (await api.post("notifications/read-all/")).data;

export const registerNotificationDevice = async (
  token: string,
  platform: DevicePlatform,
): Promise<RegisterDeviceResponse> =>
  (await api.post("notifications/devices/", { token, platform })).data;

export const unregisterNotificationDevice = async (
  token: string,
): Promise<UnregisterDeviceResponse> =>
  (await api.delete("notifications/devices/", { data: { token } })).data;
