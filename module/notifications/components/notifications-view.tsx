"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { iconName } from "@/assets/icons/iconRenderer/types";
import { toast } from "@/components/ui/toast";
import { ApiErrorResponse } from "@/module/auth/types";
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from "../hooks";
import { resolveNotificationUrl } from "../lib/notification-routing";
import { Notification } from "../types";

type ReadStatus = "unread" | "read";

/** Latin (Western) digits everywhere, even inside Arabic-locale formatting — mirrors lib/format.ts. */
const NUMBERING_SYSTEM = { numberingSystem: "latn" } as const;

/** Distinct icon + color + Arabic label per event key so notification types are visually scannable at a glance. */
const EVENT_CONFIG: Record<
  string,
  { icon: iconName; badgeClass: string; label: string }
> = {
  "customer_request.created": {
    icon: "plus_circle_outlined",
    badgeClass: "bg-sky-500/10 text-sky-600",
    label: "طلب عميل جديد",
  },
  "customer_request.accepted": {
    icon: "message_open_outlined",
    badgeClass: "bg-emerald-500/10 text-emerald-600",
    label: "قبول طلب عميل",
  },
  "customer_request.rejected": {
    icon: "close_outlined",
    badgeClass: "bg-red-500/10 text-red-600",
    label: "رفض طلب عميل",
  },
  "stock_transfer.requested": {
    icon: "re_order_outlined",
    badgeClass: "bg-amber-500/10 text-amber-600",
    label: "طلب نقل مخزون",
  },
  "stock_transfer.dispatched": {
    icon: "send_outlined",
    badgeClass: "bg-blue-500/10 text-blue-600",
    label: "إرسال نقل مخزون",
  },
  "stock_transfer.modified": {
    icon: "edit_outlined",
    badgeClass: "bg-violet-500/10 text-violet-600",
    label: "تعديل نقل مخزون",
  },
  "stock_transfer.confirmed": {
    icon: "success_outlined",
    badgeClass: "bg-emerald-500/10 text-emerald-600",
    label: "تأكيد نقل مخزون",
  },
  "stock_transfer.received": {
    icon: "download_outlined",
    badgeClass: "bg-teal-500/10 text-teal-600",
    label: "استلام نقل مخزون",
  },
  "stock_transfer.cancelled": {
    icon: "block_outlined",
    badgeClass: "bg-rose-500/10 text-rose-600",
    label: "إلغاء نقل مخزون",
  },
};

const DEFAULT_EVENT_CONFIG: { icon: iconName; badgeClass: string } = {
  icon: "notification_outlined",
  badgeClass: "bg-muted text-muted-foreground",
};

const getEventConfig = (eventKey: string) => EVENT_CONFIG[eventKey];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function getSenderInfo(payload: Record<string, unknown>): {
  name?: string;
  avatar?: string;
} {
  const name =
    typeof payload.sender_name === "string" ? payload.sender_name : undefined;
  const avatar =
    typeof payload.sender_avatar === "string"
      ? payload.sender_avatar
      : typeof payload.avatar_url === "string"
        ? payload.avatar_url
        : undefined;
  return { name, avatar };
}

const QUOTES = [
  { text: "لا تنتظر اللحظة المثالية، اصنعها بنفسك.", author: "مجهول" },
  {
    text: "النجاح هو مجموع جهود صغيرة تتكرر يوماً بعد يوم.",
    author: "روبرت كولير",
  },
  {
    text: "ابدأ من حيث أنت، استخدم ما لديك، وافعل ما تستطيع.",
    author: "آرثر آش",
  },
];

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** "اليوم" / "أمس" / Arabic month name (+ year if not the current year) — no date-fns in this project. */
function getDateGroupLabel(date: Date): string {
  const now = new Date();
  if (isSameDay(date, now)) return "اليوم";

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) return "أمس";

  const sameYear = date.getFullYear() === now.getFullYear();
  return new Intl.DateTimeFormat("ar-SY", {
    month: "long",
    ...(sameYear ? {} : { year: "numeric" }),
    ...NUMBERING_SYSTEM,
  }).format(date);
}

function groupByDate(items: Notification[]) {
  const groups: { label: string; items: Notification[] }[] = [];
  for (const notification of items) {
    const label = getDateGroupLabel(new Date(notification.created_at));
    const lastGroup = groups[groups.length - 1];
    if (lastGroup?.label === label) {
      lastGroup.items.push(notification);
    } else {
      groups.push({ label, items: [notification] });
    }
  }
  return groups;
}

const RELATIVE_TIME_FORMATTER = new Intl.RelativeTimeFormat("ar", {
  numeric: "auto",
  ...NUMBERING_SYSTEM,
});

const RELATIVE_TIME_DIVISIONS: {
  amount: number;
  unit: Intl.RelativeTimeFormatUnit;
}[] = [
  { amount: 60, unit: "second" },
  { amount: 60, unit: "minute" },
  { amount: 24, unit: "hour" },
  { amount: 7, unit: "day" },
  { amount: 4.34524, unit: "week" },
  { amount: 12, unit: "month" },
  { amount: Number.POSITIVE_INFINITY, unit: "year" },
];

/**
 * Hand-rolled relative time ("منذ 5 ساعات"-equivalent), since date-fns isn't a
 * dependency here. Intl.RelativeTimeFormat("ar") already applies correct
 * Arabic dual/plural rules (checked for 1/2/3/5/11/21 across seconds through
 * years) so no manual pluralization on top of it is needed.
 */
function formatRelativeTime(date: Date): string {
  let duration = (date.getTime() - Date.now()) / 1000;
  for (const division of RELATIVE_TIME_DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return RELATIVE_TIME_FORMATTER.format(
        Math.round(duration),
        division.unit,
      );
    }
    duration /= division.amount;
  }
  return "";
}

function StatusTab({
  icon,
  label,
  count,
  loading,
  active,
  onClick,
}: {
  icon: iconName;
  label: string;
  count?: number;
  loading?: boolean;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "relative flex w-1/2 min-w-0 cursor-pointer items-center gap-2 px-3 py-3.5 text-start transition-colors",
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <IconRenderer name={icon} className="size-4 shrink-0" />
      <span className="flex min-w-0 flex-wrap items-baseline gap-x-1.5">
        <span
          className={cn(
            "truncate text-sm",
            active ? "font-bold" : "font-medium",
          )}
        >
          {label}
        </span>
        {loading ? (
          <Skeleton className="h-4 w-6 rounded-full" />
        ) : (
          count !== undefined &&
          count > 0 && (
            <span className="rounded-full bg-destructive/10 px-1.5 text-[11px] font-semibold text-destructive tabular-nums">
              {count > 99 ? "99+" : count}
            </span>
          )
        )}
      </span>
      {active && (
        <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />
      )}
    </button>
  );
}

function NotificationRow({
  notification,
  onOpen,
  onMarkRead,
}: {
  notification: Notification;
  onOpen: (notification: Notification) => void;
  onMarkRead: (id: number) => void;
}) {
  const isUnread = !notification.is_read;
  const config = getEventConfig(notification.event_key);
  const icon = config?.icon ?? DEFAULT_EVENT_CONFIG.icon;
  const badgeClass = config?.badgeClass ?? DEFAULT_EVENT_CONFIG.badgeClass;
  const eventLabel = config?.label ?? notification.title;
  const sender = getSenderInfo(notification.payload);
  const initials = sender.name ? getInitials(sender.name) : undefined;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(notification)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(notification);
        }
      }}
      className={cn(
        "group/row relative flex w-full cursor-pointer items-start gap-2.5 px-3 py-3 text-start transition-colors hover:bg-muted/60 sm:gap-3 sm:px-4",
        isUnread && "bg-primary/4",
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full",
          badgeClass,
        )}
      >
        <IconRenderer name={icon} className="size-4" />
      </span>

      {/* Mobile (primary target): label row, then avatar+name row, then a full-width wrapping body row. */}
      <div className="flex min-w-0 flex-1 flex-col gap-1 sm:hidden">
        <p
          className={cn(
            "truncate pe-24 text-sm",
            isUnread
              ? "font-semibold text-foreground"
              : "font-medium text-foreground/80",
          )}
        >
          {eventLabel}
        </p>

        {sender.name && (
          <div className="flex min-w-0 items-center gap-1.5">
            <Avatar size="sm" className="shrink-0">
              {sender.avatar && (
                <AvatarImage src={sender.avatar} alt={sender.name} />
              )}
              <AvatarFallback size="sm" className="text-[10px] font-semibold">
                {initials ?? (
                  <IconRenderer name="user_outlined" className="size-3" />
                )}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-sm font-medium text-foreground/80">
              {sender.name}
            </span>
          </div>
        )}

        <p className="text-sm wrap-break-word text-muted-foreground">
          {notification.body}
        </p>
      </div>

      {/* Wider screens: single truncated line - label, avatar, "name: body". */}
      <div className="hidden min-w-0 flex-1 sm:flex sm:items-center sm:gap-3">
        <p
          className={cn(
            "w-40 shrink-0 truncate text-sm",
            isUnread
              ? "font-semibold text-foreground"
              : "font-medium text-foreground/80",
          )}
        >
          {eventLabel}
        </p>

        <Avatar size="sm" className="shrink-0">
          {sender.avatar && (
            <AvatarImage src={sender.avatar} alt={sender.name ?? ""} />
          )}
          <AvatarFallback size="sm" className="text-[10px] font-semibold">
            {initials ?? (
              <IconRenderer name="user_outlined" className="size-3" />
            )}
          </AvatarFallback>
        </Avatar>

        <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
          {sender.name && (
            <span
              title={sender.name}
              className="font-medium text-foreground/80"
            >
              {sender.name}
            </span>
          )}
          {sender.name && ": "}
          {notification.body}
        </p>
      </div>

      {/* Absolutely positioned so the unread dot / time badge / mark-read action never eat flex space. Mark-read stays visible (not hover-only) since this is primarily a touch UI without a mouse. */}
      <div className="absolute inset-e-3 top-3 flex items-center gap-1 sm:static sm:inset-e-auto sm:top-auto sm:shrink-0">
        {isUnread && (
          <span className="size-1.5 shrink-0 rounded-full bg-primary" />
        )}

        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] whitespace-nowrap text-muted-foreground tabular-nums sm:rounded-none sm:bg-transparent sm:px-0 sm:py-0 sm:text-xs">
          {formatRelativeTime(new Date(notification.created_at))}
        </span>

        {isUnread && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="inline-flex"
            title="تحديد كمقروء"
            onClick={(event) => {
              event.stopPropagation();
              onMarkRead(notification.id);
            }}
          >
            <IconRenderer name="tick_outlined" className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function NotificationsSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="flex items-start gap-3 border-b px-4 py-3 last:border-b-0"
        >
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3.5 w-2/3" />
          </div>
          <Skeleton className="h-3 w-10 shrink-0" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <IconRenderer name="notification_outlined" className="size-6" />
      </span>
      <p className="text-sm text-muted-foreground">لا توجد إشعارات حتى الآن</p>
    </div>
  );
}

function InboxZeroState() {
  const [quote] = React.useState(
    () => QUOTES[Math.floor(Math.random() * QUOTES.length)],
  );
  const confettiDots = React.useMemo(
    () => [
      "top-2 start-8 bg-primary/60",
      "top-10 start-2 bg-orange-400/70",
      "top-4 end-6 bg-green-500/60",
      "top-14 end-2 bg-primary/40",
      "bottom-6 start-10 bg-orange-400/50",
      "bottom-2 end-10 bg-green-500/50",
      "top-1/2 start-1 bg-primary/50",
      "top-1/2 end-1 bg-orange-400/60",
    ],
    [],
  );

  return (
    <div className="flex w-full flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <div className="relative flex size-20 items-center justify-center">
        {confettiDots.map((position, index) => (
          <span
            key={index}
            aria-hidden
            className={cn("absolute size-1.5 rounded-full", position)}
          />
        ))}
        <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <IconRenderer name="mail_outlined" className="size-7" />
        </span>
      </div>

      <h2 className="text-base font-bold text-foreground">
        لا شيء ينتظرك الآن
      </h2>
      <p className="max-w-xs text-sm text-muted-foreground">
        أحسنت! لقد اطّلعت على جميع الإشعارات المهمة
      </p>

      <div className="mt-4 flex max-w-sm flex-col items-center gap-2 rounded-xl bg-muted/50 px-5 py-4">
        <Badge variant="secondary">اقتباس ملهم</Badge>
        <p className="text-sm leading-6 text-foreground/90">«{quote.text}»</p>
        <p className="text-xs text-muted-foreground">— {quote.author}</p>
      </div>
    </div>
  );
}

export function NotificationsView() {
  const router = useRouter();
  const [status, setStatus] = React.useState<ReadStatus>("unread");
  const [eventKeyFilter, setEventKeyFilter] = React.useState<string[]>([]);
  const [page, setPage] = React.useState(1);
  const [items, setItems] = React.useState<Notification[]>([]);
  const [confirmClearOpen, setConfirmClearOpen] = React.useState(false);

  const { data, isLoading, isFetching } = useNotificationsQuery({
    unread: status === "unread",
    event_key: eventKeyFilter.length ? eventKeyFilter.join(",") : undefined,
    page,
  });

  // The query only holds one page at a time — accumulate pages 2+ onto the
  // first page's results instead of replacing the visible list on "load more".
  // Adjusted directly during render (this project's established pattern for
  // deriving state from a changing prop, see the notification-list-based
  // implementation this file replaces) rather than in an effect, since
  // react-hooks/set-state-in-effect flags a plain setState-in-useEffect here.
  const [lastSeenData, setLastSeenData] = React.useState(data);
  if (data !== lastSeenData) {
    setLastSeenData(data);
    const fetched = data?.data.notifications;
    if (fetched) {
      setItems((prev) => (page === 1 ? fetched : [...prev, ...fetched]));
    }
  }

  const handleStatusChange = (value: ReadStatus) => {
    setStatus(value);
    setPage(1);
  };

  const toggleEventFilter = (eventKey: string) => {
    setEventKeyFilter((prev) =>
      prev.includes(eventKey)
        ? prev.filter((key) => key !== eventKey)
        : [...prev, eventKey],
    );
    setPage(1);
  };

  const clearEventFilter = () => {
    setEventKeyFilter([]);
    setPage(1);
  };

  const unreadCount = data?.data.unread_count ?? 0;
  const totalPages = data?.data.pagination.total_pages ?? 1;
  const hasMore = page < totalPages;

  const { mutate: markRead } = useMarkNotificationReadMutation();
  const { mutate: markAllRead, isPending: isMarkingAllRead } =
    useMarkAllNotificationsReadMutation();

  const openNotification = (notification: Notification) => {
    if (!notification.is_read) markRead(notification.id);
    router.push(resolveNotificationUrl(notification.event_key));
  };

  const handleConfirmClear = () => {
    markAllRead(undefined, {
      onSuccess: () => {
        setConfirmClearOpen(false);
        toast.success("تم تحديد جميع الإشعارات كمقروءة");
      },
      onError: (error) => {
        const axiosError = error as AxiosError<ApiErrorResponse>;
        toast.error(
          axiosError.response?.data?.message ||
            "تعذّر تحديد جميع الإشعارات كمقروءة",
        );
      },
    });
  };

  const groups = groupByDate(items);
  const isInboxZero = status === "unread" && !isLoading && items.length === 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Not made sticky: the app shell's <main> (app/(potected)/layout.tsx) has no
          overflow-auto ancestor of its own — the page scrolls with AppHeader, which
          is already "sticky top-0" at a higher z-index. Stacking a second sticky
          header at top-0 here would render underneath/behind AppHeader instead of
          below it, so this section just scrolls normally with the page. */}
      <div className="bg-card">
        <div
          role="tablist"
          className="flex border-b [&>button:not(:last-child)]:border-e"
        >
          <StatusTab
            icon="mail_outlined"
            label="غير مقروء"
            count={unreadCount}
            loading={isLoading && status === "unread"}
            active={status === "unread"}
            onClick={() => handleStatusChange("unread")}
          />
          <StatusTab
            icon="tick_outlined"
            label="مقروء"
            active={status === "read"}
            onClick={() => handleStatusChange("read")}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-b py-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <Popover>
              <PopoverTrigger>
                <Button
                  type="button"
                  variant={eventKeyFilter.length ? "secondary" : "outline"}
                  size="sm"
                  className="shrink-0 gap-1.5 rounded-full"
                >
                  <IconRenderer name="filter_outlined" className="size-3.5" />
                  تصفية
                  {eventKeyFilter.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="rounded-full px-1.5 font-normal"
                    >
                      {eventKeyFilter.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="start">
                <Command>
                  <CommandInput placeholder="ابحث عن نوع الإشعار..." />
                  <CommandList>
                    <CommandEmpty>لا توجد نتائج</CommandEmpty>
                    <CommandGroup>
                      {Object.entries(EVENT_CONFIG).map(
                        ([eventKey, config]) => (
                          <CommandItem
                            key={eventKey}
                            value={`${config.label} ${eventKey}`}
                            onSelect={() => toggleEventFilter(eventKey)}
                            className="gap-2"
                          >
                            <Checkbox
                              checked={eventKeyFilter.includes(eventKey)}
                            />
                            <IconRenderer
                              name={config.icon}
                              className="size-4"
                            />
                            <span className="text-sm font-normal">
                              {config.label}
                            </span>
                          </CommandItem>
                        ),
                      )}
                    </CommandGroup>
                    {eventKeyFilter.length > 0 && (
                      <CommandGroup>
                        <CommandItem
                          onSelect={clearEventFilter}
                          className="justify-center text-center text-sm font-normal text-muted-foreground"
                        >
                          مسح الفلتر
                        </CommandItem>
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {eventKeyFilter.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={clearEventFilter}
                title="مسح الفلتر"
                className="shrink-0"
              >
                <IconRenderer name="close_outlined" className="size-3.5" />
              </Button>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            disabled={!unreadCount || isMarkingAllRead}
            onClick={() => setConfirmClearOpen(true)}
            title="تحديد الكل كمقروء"
            className="shrink-0 gap-1.5"
          >
            <IconRenderer name="tick_outlined" className="size-4" />
            <span className="hidden sm:inline">تحديد الكل كمقروء</span>
          </Button>
        </div>
      </div>

      <div>
        {isLoading ? (
          <NotificationsSkeleton />
        ) : isInboxZero ? (
          <InboxZeroState />
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
              {groups.map((group) => (
                <div key={group.label}>
                  <div className="bg-muted/50 px-4 py-1.5 text-xs font-medium text-muted-foreground">
                    {group.label}
                  </div>
                  <div className="divide-y divide-border">
                    {group.items.map((notification) => (
                      <NotificationRow
                        key={notification.id}
                        notification={notification}
                        onOpen={openNotification}
                        onMarkRead={markRead}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {hasMore && (
              <Button
                variant="outline"
                size="sm"
                disabled={isFetching}
                onClick={() => setPage((p) => p + 1)}
                className="mt-3 w-full"
              >
                {isFetching ? "جارٍ التحميل..." : "تحميل المزيد"}
              </Button>
            )}
          </>
        )}
      </div>

      <Dialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تحديد كل الإشعارات كمقروءة؟</DialogTitle>
            <DialogDescription>
              سيتم تحديد جميع الإشعارات ({unreadCount}) كمقروءة، ويمكنك الاطلاع
              عليها لاحقاً من تبويب «مقروء».
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setConfirmClearOpen(false)}
            >
              تراجع
            </Button>
            <Button disabled={isMarkingAllRead} onClick={handleConfirmClear}>
              {isMarkingAllRead ? "جارٍ التحديد..." : "تحديد الكل كمقروء"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
