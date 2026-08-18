import { expect, test } from "@playwright/test";

import {
  LEARNING_PROGRESS_STORAGE_KEY,
  LEARNING_PROGRESS_VERSION,
  advanceLearningProgress,
  createDefaultLearningProgress,
  loadLearningProgress,
  markLearningIntroSeen,
  restartLearningProgress,
  saveLearningProgress,
} from "../src/app/progress/learningProgress";

import type { LearningProgressStorage } from "../src/app/progress/learningProgress";

class MemoryStorage implements LearningProgressStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

test.describe("anonymous learning progress", () => {
  test("uses fresh-browser defaults and loads valid saved state", () => {
    const storage = new MemoryStorage();

    expect(loadLearningProgress(storage)).toEqual({
      version: LEARNING_PROGRESS_VERSION,
      currentModule: 1,
      introSeen: false,
    });

    const savedProgress = {
      version: LEARNING_PROGRESS_VERSION,
      currentModule: 6,
      introSeen: true,
    } as const;

    expect(saveLearningProgress(savedProgress, storage)).toBe(true);
    expect(loadLearningProgress(storage)).toEqual(savedProgress);
  });

  test("falls back for corrupt, invalid, or unsupported saved data", () => {
    const storage = new MemoryStorage();
    const invalidValues = [
      "not-json",
      JSON.stringify({ version: 2, currentModule: 7, introSeen: true }),
      JSON.stringify({ version: 1, currentModule: 0, introSeen: true }),
      JSON.stringify({ version: 1, currentModule: 11, introSeen: true }),
      JSON.stringify({ version: 1, currentModule: 7.5, introSeen: true }),
      JSON.stringify({ version: 1, currentModule: 7, introSeen: "yes" }),
    ];

    for (const value of invalidValues) {
      storage.setItem(LEARNING_PROGRESS_STORAGE_KEY, value);
      expect(loadLearningProgress(storage)).toEqual(createDefaultLearningProgress());
    }
  });

  test("advances monotonically through modules 7, 8, and the final test", () => {
    const moduleSeven = { ...createDefaultLearningProgress(), currentModule: 7 };
    const moduleEight = advanceLearningProgress(moduleSeven, 8);
    const moduleNine = advanceLearningProgress(moduleEight, 9);
    const moduleTen = advanceLearningProgress(moduleNine, 10);

    expect(moduleEight.currentModule).toBe(8);
    expect(advanceLearningProgress(moduleEight, 3).currentModule).toBe(8);
    expect(moduleNine.currentModule).toBe(9);
    expect(moduleTen.currentModule).toBe(10);
    expect(advanceLearningProgress(moduleTen, 11).currentModule).toBe(10);
  });

  test("marks the intro seen and restarts only eRide course progress", () => {
    const storage = new MemoryStorage();
    storage.setItem("unrelated-setting", "keep-me");

    const progressed = markLearningIntroSeen({
      ...createDefaultLearningProgress(),
      currentModule: 8,
    });
    saveLearningProgress(progressed, storage);

    expect(progressed.introSeen).toBe(true);
    expect(restartLearningProgress(storage)).toEqual(createDefaultLearningProgress());
    expect(storage.getItem(LEARNING_PROGRESS_STORAGE_KEY)).toBeNull();
    expect(storage.getItem("unrelated-setting")).toBe("keep-me");
  });

  test("keeps in-memory progress usable when storage operations fail", () => {
    const unavailableStorage: LearningProgressStorage = {
      getItem: () => {
        throw new Error("storage unavailable");
      },
      setItem: () => {
        throw new Error("storage unavailable");
      },
      removeItem: () => {
        throw new Error("storage unavailable");
      },
    };

    const loaded = loadLearningProgress(unavailableStorage);
    const advanced = advanceLearningProgress(loaded, 8);

    expect(loaded).toEqual(createDefaultLearningProgress());
    expect(advanced.currentModule).toBe(8);
    expect(saveLearningProgress(advanced, unavailableStorage)).toBe(false);
    expect(restartLearningProgress(unavailableStorage)).toEqual(createDefaultLearningProgress());
  });
});
