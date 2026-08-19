"use client";

import { LearningProgressProvider } from "./LearningProgressContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <LearningProgressProvider>{children}</LearningProgressProvider>;
}
