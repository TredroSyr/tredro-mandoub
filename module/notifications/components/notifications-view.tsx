"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/ui/skeleton";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from "../hooks";
import { resolveNotificationUrl } from "../lib/notification-routing";
import { Notification } from "../types";
import { NotificationList } from "./notification-list";

const FILTERS: { key: boolean | undefined; label: string }[] = [
  { key: undefined, label: "الكل" },
  { key: true, label: "غير مقروء" },
];

export function NotificationsView() {
  const router = useRouter();
  const [unreadOnly, setUnreadOnly] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, isFetching, refetch } = useNotificationsQuery({
    unread: unreadOnly,
    page,
  });
  const { mutate: markRead } = useMarkNotificationReadMutation();
  const { mutate: markAllRead, isPending: isMarkingAllRead } =
    useMarkAllNotificationsReadMutation();

  // The query only holds one page at a time — accumulate pages 2+ onto the
  // first page's results instead of replacing the visible list on "load more".
  // Adjusted directly during render (React's recommended pattern for deriving
  // state from a changing prop) rather than in an effect, to avoid the extra
  // render pass a post-commit setState would cause.
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastSeenData, setLastSeenData] = useState(data);
  if (data !== lastSeenData) {
    setLastSeenData(data);
    const fetched = data?.data?.notifications;
    if (fetched) {
      setNotifications((prev) => (page === 1 ? fetched : [...prev, ...fetched]));
    }
  }

  const handleFilterChange = (value: boolean | undefined) => {
    setUnreadOnly(value);
    setPage(1);
    setNotifications([]);
  };

  const unreadCount = data?.data?.unread_count ?? 0;
  const pagination = data?.data?.pagination;

  const handleItemClick = (notification: Notification) => {
    if (!notification.is_read) markRead(notification.id);
    router.push(resolveNotificationUrl(notification.event_key));
  };

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex gap-1.5 rounded-full bg-muted/50 p-1">
          {FILTERS.map((f) => (
            <button
              key={String(f.key)}
              type="button"
              onClick={() => handleFilterChange(f.key)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors ${
                unreadOnly === f.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {unreadCount > 0 && (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={isMarkingAllRead}
            onClick={() => markAllRead()}
          >
            <IconRenderer name="success_outlined" className="size-4" />
            تعليم الكل كمقروء
          </Button>
        )}
      </div>

      <div className="space-y-2.5">
        {isLoading && (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}

        {isError && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-muted/40 p-6 text-center">
            <IconRenderer
              name="warning_outlined"
              className="h-8 w-8 text-destructive/60"
            />
            <p className="text-[11px] text-muted-foreground">تعذّر تحميل الإشعارات.</p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <IconRenderer name="refresh_outlined" className="h-4 w-4" />
              إعادة المحاولة
            </Button>
          </div>
        )}

        {!isLoading && notifications.length > 0 && (
          <NotificationList
            notifications={notifications}
            onItemClick={handleItemClick}
          />
        )}

        {pagination && pagination.total_pages > pagination.page && (
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            disabled={isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            {isFetching ? "جارِ التحميل..." : "تحميل المزيد"}
          </Button>
        )}
      </div>
    </section>
  );
}
