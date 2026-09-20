import { registerPlugin } from "@capacitor/core";
import { isNativeApp } from "@/lib/native";

/**
 * Bridge to the in-app Android plugin (android/app/.../NetworkReminderPlugin)
 * that has WorkManager post a "the connection is back" notification the moment
 * a working network appears — even if the app has been closed by then.
 */
interface NetworkReminderPlugin {
  schedule(options: { count: number }): Promise<void>;
  cancel(): Promise<void>;
}

const NetworkReminder = registerPlugin<NetworkReminderPlugin>("NetworkReminder");

/**
 * Arms the notification only while the device is OFFLINE with items waiting:
 * scheduling it while online would fire it immediately, and when the
 * connection returns with the app open the app syncs by itself, so it is
 * cancelled then.
 */
export async function updateNetworkReminder(
  waitingCount: number,
  connected: boolean,
): Promise<void> {
  if (!isNativeApp()) return;
  try {
    if (waitingCount > 0 && !connected) {
      await NetworkReminder.schedule({ count: waitingCount });
    } else {
      await NetworkReminder.cancel();
    }
  } catch (error) {
    // e.g. an APK built before this plugin existed — the timed reminder still works.
    console.error("[offline] network reminder unavailable", error);
  }
}
