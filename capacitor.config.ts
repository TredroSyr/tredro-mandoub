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
  },
};

export default config;
