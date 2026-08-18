export const LEARNING_PROGRESS_VERSION = 1 as const;
export const LEARNING_PROGRESS_STORAGE_KEY = "eride:learning-progress:v1";
export const MAX_MODULE = 10;

export type LearningProgress = {
  version: typeof LEARNING_PROGRESS_VERSION;
  currentModule: number;
  introSeen: boolean;
};

export type LearningProgressStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function createDefaultLearningProgress(): LearningProgress {
  return {
    version: LEARNING_PROGRESS_VERSION,
    currentModule: 1,
    introSeen: false,
  };
}

function getBrowserStorage(): LearningProgressStorage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isLearningProgress(value: unknown): value is LearningProgress {
  if (!value || typeof value !== "object") {
    return false;
  }

  const progress = value as Partial<LearningProgress>;

  return (
    progress.version === LEARNING_PROGRESS_VERSION &&
    Number.isInteger(progress.currentModule) &&
    typeof progress.currentModule === "number" &&
    progress.currentModule >= 1 &&
    progress.currentModule <= MAX_MODULE &&
    typeof progress.introSeen === "boolean"
  );
}

export function loadLearningProgress(
  storage: LearningProgressStorage | null = getBrowserStorage(),
): LearningProgress {
  if (!storage) {
    return createDefaultLearningProgress();
  }

  try {
    const storedProgress = storage.getItem(LEARNING_PROGRESS_STORAGE_KEY);
    if (!storedProgress) {
      return createDefaultLearningProgress();
    }

    const parsedProgress: unknown = JSON.parse(storedProgress);
    return isLearningProgress(parsedProgress) ? parsedProgress : createDefaultLearningProgress();
  } catch {
    return createDefaultLearningProgress();
  }
}

export function saveLearningProgress(
  progress: LearningProgress,
  storage: LearningProgressStorage | null = getBrowserStorage(),
): boolean {
  if (!storage) {
    return false;
  }

  try {
    storage.setItem(LEARNING_PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

export function advanceLearningProgress(
  progress: LearningProgress,
  requestedModule: number,
): LearningProgress {
  if (!Number.isFinite(requestedModule)) {
    return progress;
  }

  const nextModule = Math.min(MAX_MODULE, Math.max(1, Math.trunc(requestedModule)));
  if (nextModule <= progress.currentModule) {
    return progress;
  }

  return { ...progress, currentModule: nextModule };
}

export function markLearningIntroSeen(progress: LearningProgress): LearningProgress {
  if (progress.introSeen) {
    return progress;
  }

  return { ...progress, introSeen: true };
}

export function restartLearningProgress(
  storage: LearningProgressStorage | null = getBrowserStorage(),
): LearningProgress {
  try {
    storage?.removeItem(LEARNING_PROGRESS_STORAGE_KEY);
  } catch {
    // In-memory progress can still restart when browser storage is unavailable.
  }

  return createDefaultLearningProgress();
}
