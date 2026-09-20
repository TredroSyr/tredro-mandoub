import { LocalNotifications } from "@capacitor/local-notifications";
import { Network } from "@capacitor/network";
import { listOutboxItems } from "@/lib/db/outbox";
import { isNativeApp } from "@/lib/native";
import { countItems } from "@/lib/arabic-count";
import { updateNetworkReminder } from "./network-reminder";

/**
 * A local reminder to open the app when writes are still waiting to be sent.
 *
 * The app can't sync while it is closed, so the reminder is the safety net:
 * it is scheduled with the OS (it survives the app being killed, and a
 * reboot) whenever items are waiting, and cancelled the moment they've all
 * been sent. It never sends anything itself — tapping it just opens the app,
 * where the launch sync and summary take over.
 */
const REMINDER_ID = 424201;
// First nudge this long after the oldest waiting item was saved...
const FIRST_REMINDER_DELAY_MS = 30 * 60_000;
// ...and if that moment has already passed (it fired and the items are still
// there), don't nag more often than this.
const REPEAT_REMINDER_DELAY_MS = 2 * 60 * 60_000;
const MIN_LEAD_MS = 60_000;

async function clearReminder(): Promise<void> {
  await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] });
  // If it already fired, take it out of the notification shade too.
  await LocalNotifications.removeDeliveredNotificationsById({ ids: [REMINDER_ID] });
}

/** Brings the scheduled reminder in line with what is currently waiting in the outbox. */
export async function reconcileSyncReminder(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    // Rejected items need the rep's decision and are shown at launch anyway;
    // the reminder is only for items that are simply waiting to be sent.
    const waiting = (await listOutboxItems()).filter((i) => i.status !== "failed");

    // "Connection is back" notification: armed only while offline with items waiting.
    const status = await Network.getStatus().catch(() => ({ connected: true }));
    await updateNetworkReminder(waiting.length, status.connected);

    if (waiting.length === 0) {
      await clearReminder();
      return;
    }

    // If the rep has declined notifications, respect it — no prompt loop.
    const permission = await LocalNotifications.checkPermissions();
    if (permission.display === "denied") return;

    const now = Date.now();
    const oldest = Math.min(...waiting.map((i) => Date.parse(i.createdAt)));
    let at = oldest + FIRST_REMINDER_DELAY_MS;
    if (Number.isNaN(at) || at < now + MIN_LEAD_MS) at = now + REPEAT_REMINDER_DELAY_MS;

    const count = waiting.length;
    await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] });
    await LocalNotifications.schedule({
      notifications: [
        {
          id: REMINDER_ID,
          title: "عناصر لم تُرسل بعد",
          body: `لديك ${countItems(count)} بانتظار الإرسال — اضغط للمزامنة.`,
          schedule: { at: new Date(at), allowWhileIdle: true },
          // The default is an exact alarm, which on Android 12+ sends the user
          // to a system settings screen to grant it. A reminder doesn't need
          // to be exact.
          isExactNotification: false,
          // The plugin's built-in fallback is a generic system icon; the app
          // already ships its own status-bar icon for push notifications.
          smallIcon: "ic_stat_notify",
        },
      ],
    });
  } catch (error) {
    // A reminder is a nicety — never let it break syncing.
    console.error("[offline] failed to update the sync reminder", error);
  }
}
