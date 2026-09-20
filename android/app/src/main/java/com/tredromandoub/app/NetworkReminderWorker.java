package com.tredromandoub.app;

import android.Manifest;
import android.app.ActivityManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;
import androidx.work.Worker;
import androidx.work.WorkerParameters;
import java.util.List;

/**
 * Runs when the device gets a working network connection (see
 * NetworkReminderPlugin, which schedules it with a CONNECTED constraint) and
 * posts a notification telling the rep to open the app so its waiting items
 * can be sent. It sends nothing itself and does not need the app to be running.
 */
public class NetworkReminderWorker extends Worker {

    static final String CHANNEL_ID = "network_reminder";
    static final int NOTIFICATION_ID = 424202;
    static final String KEY_COUNT = "count";

    public NetworkReminderWorker(@NonNull Context context, @NonNull WorkerParameters params) {
        super(context, params);
    }

    @NonNull
    @Override
    public Result doWork() {
        Context context = getApplicationContext();

        // The app is on screen: it syncs by itself, a notification would only be noise.
        if (isAppInForeground(context)) return Result.success();

        // Android 13+: without the permission the notification would be dropped anyway.
        if (
            Build.VERSION.SDK_INT >= 33 &&
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) !=
            PackageManager.PERMISSION_GRANTED
        ) {
            return Result.success();
        }

        ensureChannel(context);

        int count = getInputData().getInt(KEY_COUNT, 0);
        String text = count > 0
            ? "لديك " + describeCount(count) + " بانتظار الإرسال — اضغط للمزامنة."
            : "لديك عناصر بانتظار الإرسال — اضغط للمزامنة.";

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_notify)
            .setContentTitle("عاد الاتصال بالإنترنت")
            .setContentText(text)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(text))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setAutoCancel(true);

        Intent launch = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (launch != null) {
            builder.setContentIntent(
                PendingIntent.getActivity(context, 0, launch, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT)
            );
        }

        Notification notification = builder.build();
        NotificationManagerCompat.from(context).notify(NOTIFICATION_ID, notification);
        return Result.success();
    }

    /** Arabic counted-noun agreement: 1 عنصر واحد, 2 عنصران, 3-10 عناصر, 11+ عنصرًا. */
    private static String describeCount(int n) {
        if (n == 1) return "عنصر واحد";
        if (n == 2) return "عنصران";
        if (n >= 3 && n <= 10) return n + " عناصر";
        return n + " عنصرًا";
    }

    private static boolean isAppInForeground(Context context) {
        ActivityManager manager = (ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
        if (manager == null) return false;
        List<ActivityManager.RunningAppProcessInfo> processes = manager.getRunningAppProcesses();
        if (processes == null) return false;
        for (ActivityManager.RunningAppProcessInfo process : processes) {
            if (process.processName.equals(context.getPackageName())) {
                return process.importance <= ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND;
            }
        }
        return false;
    }

    private static void ensureChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager == null || manager.getNotificationChannel(CHANNEL_ID) != null) return;
        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID,
            "تذكير المزامنة",
            NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription("ينبّهك عند عودة الاتصال بالإنترنت وهناك عناصر لم تُرسل بعد");
        manager.createNotificationChannel(channel);
    }
}
