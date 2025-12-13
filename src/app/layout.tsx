import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "QHLC - Quranic Learning and Exam Management Portal",
  description: "A comprehensive web platform for Quranic learning, exam management, and educational administration in Saudi Arabia.",
  keywords: "Quranic learning, exam management, Saudi Arabia, Islamic education, PWA",
  authors: [{ name: "QHLC Team" }],
  creator: "QHLC",
  publisher: "QHLC",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    title: "QHLC - Quranic Learning Portal",
    description: "Comprehensive Quranic learning and exam management platform",
    url: "/",
    siteName: "QHLC",
    images: [
      {
        url: "/icons/icon-512x512.svg",
        width: 512,
        height: 512,
        alt: "QHLC Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "QHLC - Quranic Learning Portal",
    description: "Comprehensive Quranic learning and exam management platform",
    images: ["/icons/icon-512x512.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "QHLC",
  },
  applicationName: "QHLC",
  category: "education",
  other: {
    "apple-mobile-web-app-title": "QHLC",
  },
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1e40af",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" dir="ltr">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
