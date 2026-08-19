"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

import { LearningProgressProvider } from "./LearningProgressContext";

const AuthProvider = dynamic(() => import("./AuthContext").then((module) => module.AuthProvider), {
  ssr: false,
});

const ACCOUNT_ROUTE_PREFIXES = [
  "/auth",
  "/emailverified",
  "/forgotpassword",
  "/resetpassword",
  "/signin",
  "/signup",
];

function isAccountRoute(pathname: string): boolean {
  return ACCOUNT_ROUTE_PREFIXES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const accountRoute = isAccountRoute(pathname);

  return (
    <LearningProgressProvider>
      {accountRoute ? <AuthProvider>{children}</AuthProvider> : children}
    </LearningProgressProvider>
  );
}
