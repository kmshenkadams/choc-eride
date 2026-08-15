import { Analytics } from "@vercel/analytics/next";
import localFont from "next/font/local";

import { AuthProvider } from "./contexts/AuthContext";
import ToastProvider from "./utils/ToastProvider";

import type { Metadata } from "next";

import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "RideReadySD | E Bike Safety",
  description: " RideReadySD E Bike Safety Certification Website.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AuthProvider>
          <ToastProvider />
          {children}
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}
