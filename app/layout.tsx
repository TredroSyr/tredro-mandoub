import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import AppDownloadDrawer from "@/layout/app-download-drawer";
import { thmanyahSans } from "@/lib/fonts";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/provider/QueryClientProvider";
import ErudaLoader from "@/components/tredro/ErudaLoader";
import NetworkControlPing from "@/components/tredro/NetworkControlPing";

export const metadata: Metadata = {
  title: "Tredro | إدارة مندوبي المبيعات، الطلبات، والعملاء",
  description:
    "منصة متكاملة لإدارة مندوبي المبيعات تربط الشركات بالمندوبين والعملاء في تطبيق واحد. إدارة الطلبات، المخزون، الفواتير، وتتبع زيارات المندوبين بسهولة عبر لوحة تحكم للشركة وتطبيقات جوال للمندوبين والعملاء.",
  keywords: [
    "إدارة مندوبي المبيعات",
    "تطبيق مندوبين",
    "إدارة الطلبات",
    "إدارة العملاء",
    "نظام إدارة مبيعات",
    "تتبع المخزون",
    "فواتير المبيعات",
    "تطبيق B2B",
  ],
  authors: [{ name: "اسم الشركة أو الفريق" }],
  metadataBase: new URL("https://example.com"),
  alternates: {
    canonical: "/",
    languages: {
      ar: "/",
    },
  },
  openGraph: {
    title: "منصة إدارة المندوبين",
    description:
      "منصة متكاملة تربط الشركات بمندوبي المبيعات والعملاء — إدارة الطلبات، المخزون، والفواتير في مكان واحد.",
    url: "https://example.com",
    siteName: "منصة إدارة المندوبين",
    locale: "ar_SA",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "منصة إدارة المندوبين",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "منصة إدارة المندوبين",
    description:
      "إدارة مندوبي المبيعات، الطلبات، والعملاء في منصة واحدة متكاملة.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={` ${thmanyahSans.variable}  h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_BASE_URL} />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_BASE_URL} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const stored = localStorage.getItem('theme-storage');
                const theme = stored ? JSON.parse(stored).state.theme : 'light';
                if (theme === 'dark') document.documentElement.classList.add('dark');
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-thmanyah">
        <QueryProvider>
          {children}
          <AppDownloadDrawer />

          <ErudaLoader />
          <NetworkControlPing />
          <Toaster
            position="bottom-center"
            dir="rtl"
            offset={{ bottom: "calc(var(--bottom-nav-height) + 12px)" }}
            mobileOffset={{ bottom: "calc(var(--bottom-nav-height) + 12px)" }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}
