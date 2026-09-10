"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getUnreadNotificationsCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  registerNotificationDevice,
  unregisterNotificationDevice,
} from "../api";
import { DevicePlatform, ListNotificationsParams } from "../types";

export const useNotificationsQuery = (params?: ListNotificationsParams) =>
  useQuery({
    queryKey: ["notifications", "list", params],
    queryFn: () => listNotifications(params),
  });

// Cheap enough to poll — keeps the header badge honest even without push.
export const useUnreadNotificationsCountQuery = () =>
  useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => getUnreadNotificationsCount(),
    refetchInterval: 60000,
  });

export const useMarkNotificationReadMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

export const useMarkAllNotificationsReadMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

export const useRegisterNotificationDeviceMutation = () =>
  useMutation({
    mutationFn: ({
      token,
      platform,
    }: {
      token: string;
      platform: DevicePlatform;
    }) => registerNotificationDevice(token, platform),
  });

export const useUnregisterNotificationDeviceMutation = () =>
  useMutation({
    mutationFn: (token: string) => unregisterNotificationDevice(token),
  });
