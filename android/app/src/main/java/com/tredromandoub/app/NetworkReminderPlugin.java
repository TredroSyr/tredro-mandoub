package com.tredromandoub.app;

import androidx.core.app.NotificationManagerCompat;
import androidx.work.Constraints;
import androidx.work.Data;
import androidx.work.ExistingWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.OneTimeWorkRequest;
import androidx.work.WorkManager;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Asks Android to run NetworkReminderWorker as soon as a working network
 * connection is available — even if the app has been closed by then. WorkManager
 * persists the request across the app being killed and across reboots.
 *
 * `schedule` should only be called while the device is offline (otherwise the
 * constraint is already met and it fires immediately); JS cancels it again when
 * the connection returns while the app is open.
 */
@CapacitorPlugin(name = "NetworkReminder")
public class NetworkReminderPlugin extends Plugin {

    private static final String WORK_NAME = "network-reminder";

    @PluginMethod
    public void schedule(PluginCall call) {
        int count = call.getInt("count", 0);

        Constraints constraints = new Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build();
        Data input = new Data.Builder().putInt(NetworkReminderWorker.KEY_COUNT, count).build();
        OneTimeWorkRequest request = new OneTimeWorkRequest.Builder(NetworkReminderWorker.class)
            .setConstraints(constraints)
            .setInputData(input)
            .build();

        // REPLACE: a newer count supersedes the previous request instead of stacking.
        WorkManager.getInstance(getContext()).enqueueUniqueWork(WORK_NAME, ExistingWorkPolicy.REPLACE, request);
        call.resolve();
    }

    @PluginMethod
    public void cancel(PluginCall call) {
        WorkManager.getInstance(getContext()).cancelUniqueWork(WORK_NAME);
        // Also take an already-delivered notification out of the shade.
        NotificationManagerCompat.from(getContext()).cancel(NetworkReminderWorker.NOTIFICATION_ID);
        call.resolve();
    }
}
