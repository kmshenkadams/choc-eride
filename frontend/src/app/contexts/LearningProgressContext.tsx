"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import {
  advanceLearningProgress,
  createDefaultLearningProgress,
  loadLearningProgress,
  markLearningIntroSeen,
  restartLearningProgress,
  saveLearningProgress,
} from "../progress/learningProgress";

import type { LearningProgress } from "../progress/learningProgress";

type LearningProgressContextValue = {
  currentModule: number;
  introSeen: boolean;
  initialized: boolean;
  advanceTo: (module: number) => void;
  markIntroSeen: () => void;
  restart: () => void;
};

const LearningProgressContext = createContext<LearningProgressContextValue | null>(null);

export function LearningProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<LearningProgress>(createDefaultLearningProgress);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    setProgress(loadLearningProgress());
    setInitialized(true);
  }, []);

  const advanceTo = useCallback((module: number) => {
    setProgress((currentProgress) => {
      const nextProgress = advanceLearningProgress(currentProgress, module);
      saveLearningProgress(nextProgress);
      return nextProgress;
    });
  }, []);

  const markIntroSeen = useCallback(() => {
    setProgress((currentProgress) => {
      const nextProgress = markLearningIntroSeen(currentProgress);
      saveLearningProgress(nextProgress);
      return nextProgress;
    });
  }, []);

  const restart = useCallback(() => {
    setProgress(restartLearningProgress());
  }, []);

  const value = useMemo<LearningProgressContextValue>(
    () => ({
      currentModule: progress.currentModule,
      introSeen: progress.introSeen,
      initialized,
      advanceTo,
      markIntroSeen,
      restart,
    }),
    [advanceTo, initialized, markIntroSeen, progress.currentModule, progress.introSeen, restart],
  );

  return (
    <LearningProgressContext.Provider value={value}>{children}</LearningProgressContext.Provider>
  );
}

export function useLearningProgress(): LearningProgressContextValue {
  const context = useContext(LearningProgressContext);
  if (!context) {
    throw new Error("useLearningProgress must be used within a LearningProgressProvider");
  }

  return context;
}
