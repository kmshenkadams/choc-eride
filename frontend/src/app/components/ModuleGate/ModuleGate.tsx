"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useLearningProgress } from "../../contexts/LearningProgressContext";

export default function ModuleGate({
  children,
  module,
}: {
  children: React.ReactNode;
  module: number;
}) {
  const { currentModule, initialized, introSeen } = useLearningProgress();
  const pathname = usePathname();
  const router = useRouter();

  const isIntroRoute = pathname === "/intro-video" || pathname === "/intro-video/";
  useEffect(() => {
    if (!initialized) return;

    if (!introSeen && !isIntroRoute) {
      router.replace("/intro-video");
      return;
    }

    if (module > currentModule) {
      router.replace("/");
    }
  }, [currentModule, initialized, introSeen, isIntroRoute, module, router]);

  if (!initialized) return null;
  if (!introSeen && !isIntroRoute) return null;
  if (module > currentModule) return null;

  return <>{children}</>;
}
