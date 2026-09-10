import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.tredromandoub.app",
  appName: "Tredro Mandoub",
  webDir: "out",
  // Route fetch/XHR through Android's native OkHttp stack instead of the
  // WebView's own Chromium network stack. OkHttp does proper IPv4/IPv6
  // racing (fast fallback) instead of hanging on a broken IPv6 route, and
  // isn't subject to WebView CORS enforcement.
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    PushNotifications: {
      // Ensures Android/iOS show the system tray notification (with sound) even
      // while the app is in the foreground, instead of only firing the JS listener.
      presentationOptions: ["badge", "sound", "alert", "banner", "list"],
    },
  },
};

export default config;
