"use client";

import { useRouter } from "next/navigation";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from "@/module/notifications/hooks";
import { resolveNotificationUrl } from "@/module/notifications/lib/notification-routing";
import { Notification } from "@/module/notifications/types";
import { NotificationList } from "@/module/notifications/components/notification-list";

export function NotificationsDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { data, isLoading } = useNotificationsQuery();
  const { mutate: markRead } = useMarkNotificationReadMutation();
  const { mutate: markAllRead, isPending: isMarkingAllRead } =
    useMarkAllNotificationsReadMutation();

  const notifications = data?.data?.notifications ?? [];
  const unreadCount = data?.data?.unread_count ?? 0;

  const handleItemClick = (notification: Notification) => {
    if (!notification.is_read) markRead(notification.id);
    onOpenChange(false);
    router.push(resolveNotificationUrl(notification.event_key));
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} swipeDirection="up">
      <DrawerContent>
        <DrawerHeader className="flex-row items-center justify-between gap-2">
          <DrawerTitle>الإشعارات</DrawerTitle>
          {unreadCount > 0 && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={isMarkingAllRead}
              onClick={() => markAllRead()}
            >
              تعليم الكل كمقروء
            </Button>
          )}
        </DrawerHeader>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4 pt-2">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <IconRenderer
                name="clock_outlined"
                className="size-6 animate-pulse text-muted-foreground/50"
              />
            </div>
          ) : (
            <NotificationList
              notifications={notifications}
              onItemClick={handleItemClick}
            />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
