import { expect, test } from "@playwright/test";

import type { Page } from "@playwright/test";

const PROGRESS_KEY = "eride:learning-progress:v1";

type StoredProgress = {
  version: 1;
  currentModule: number;
  introSeen: boolean;
};

const forbiddenRequestPattern =
  /\/api\/user|identitytoolkit|securetoken|firebaseinstallations|firebaseio|firebaseapp/i;

function monitorLearnerRequests(page: Page): string[] {
  const forbiddenRequests: string[] = [];

  page.on("request", (request) => {
    if (forbiddenRequestPattern.test(request.url())) {
      forbiddenRequests.push(request.url());
    }
  });

  return forbiddenRequests;
}

async function seedProgress(page: Page, currentModule: number, introSeen = true) {
  await page.addInitScript(
    ({ key, progress }: { key: string; progress: StoredProgress }) => {
      window.localStorage.setItem(key, JSON.stringify(progress));
    },
    {
      key: PROGRESS_KEY,
      progress: { version: 1 as const, currentModule, introSeen },
    },
  );
}

async function readProgress(page: Page): Promise<StoredProgress | null> {
  return page.evaluate((key) => {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as StoredProgress) : null;
  }, PROGRESS_KEY);
}

async function chooseAnswer(page: Page, questionText: string, answerText: string) {
  const question = page.locator("span").filter({ hasText: questionText }).first();
  await expect(question).toBeVisible();
  const questionContainer = question.locator("xpath=..");
  await questionContainer.getByText(answerText, { exact: true }).click();
}

async function submitQuiz(page: Page) {
  await page.getByRole("button", { name: "Submit Quiz" }).click();
  await page.getByRole("button", { name: /^Submit$/ }).click();
}

test.describe("connected anonymous learner journey", () => {
  test("fresh anonymous learners reach and complete the introduction without signin", async ({
    page,
  }) => {
    const forbiddenRequests = monitorLearnerRequests(page);

    await page.goto("/");
    await expect(page).toHaveURL(/\/intro-video\/?$/);
    await expect(
      page.getByRole("heading", { name: "Welcome to the E Bike Safety Course!" }),
    ).toBeVisible();
    await expect(page).not.toHaveURL(/\/signin/);

    const startButton = page.getByRole("button", { name: "Let's get started!" });
    await expect(startButton).toBeEnabled({ timeout: 15_000 });
    await startButton.click();

    await expect(page).toHaveURL(/\/$/);
    await expect
      .poll(() => readProgress(page))
      .toEqual({
        version: 1,
        currentModule: 1,
        introSeen: true,
      });
    expect(forbiddenRequests).toEqual([]);
  });

  test("locked modules cannot be skipped", async ({ page }) => {
    const forbiddenRequests = monitorLearnerRequests(page);
    await seedProgress(page, 1);

    await page.goto("/module2");

    await expect(page).toHaveURL(/\/$/);
    expect(forbiddenRequests).toEqual([]);
  });

  test("Quiz 7 scores 100 percent and advances from module 7 to 8", async ({ page }) => {
    const forbiddenRequests = monitorLearnerRequests(page);
    await seedProgress(page, 7);

    await page.goto("/quiz/7");
    await chooseAnswer(
      page,
      "Parental or guardian models influence child and teen behavior patterns.",
      "True",
    );
    await chooseAnswer(
      page,
      "Which behavior best demonstrates positive role modeling",
      "Wearing a helmet and practicing safe riding habits.",
    );
    await submitQuiz(page);

    await expect(page.getByText("100%", { exact: true })).toBeVisible();
    await expect.poll(() => readProgress(page)).toMatchObject({ currentModule: 8 });
    expect(forbiddenRequests).toEqual([]);
  });

  test("Module 8 opens the final test and advances from 8 to 9", async ({ page }) => {
    const forbiddenRequests = monitorLearnerRequests(page);
    await seedProgress(page, 8);

    await page.goto("/module8");
    await page.getByRole("button", { name: "Start Quiz" }).click();

    await expect(page).toHaveURL(/\/final-test\/?$/);
    await expect.poll(() => readProgress(page)).toMatchObject({ currentModule: 9 });
    expect(forbiddenRequests).toEqual([]);
  });

  test("passing the final test advances from 9 to 10 and opens the certificate", async ({
    page,
  }) => {
    const forbiddenRequests = monitorLearnerRequests(page);
    await seedProgress(page, 9);

    await page.goto("/final-test");

    const correctAnswers = [
      ["Which class of E Bike is the fastest", "Class 3"],
      ["driver's license to ride", "False"],
      ["modify an E Bike to go faster", "True"],
      ["What should you check before every ride", "Air in your tires, brakes, and chain"],
      ["wear bright or reflective clothing", "At night or dusk"],
      ["makes a weird noise", "Check your bike or take it to a mechanic"],
      ["best way to charge your E Bike battery", "Follow the manufacturer's instructions"],
      ['What does "ABC" stand for', "Air, Brakes, Chain"],
      ["roll up your pant leg", "To avoid getting it caught in the chain"],
      ["helmet can prevent serious brain injuries", "True"],
      ["keep your tires properly inflated", "It makes your ride safer and smoother"],
      ["battery dies while riding", "Ride it like a normal bike if possible or call for help"],
    ] as const;

    for (const [question, answer] of correctAnswers) {
      // eslint-disable-next-line no-await-in-loop -- Quiz answers must be selected in rendered order.
      await chooseAnswer(page, question, answer);
    }

    await submitQuiz(page);

    await expect(page.getByText("100%", { exact: true })).toBeVisible();
    await expect.poll(() => readProgress(page)).toMatchObject({ currentModule: 10 });

    await page.getByRole("button", { name: "Open Certificate" }).click();
    await expect(page).toHaveURL(/\/certificate\/?$/);
    await expect(page.getByLabel("Name for your certificate")).toBeVisible();
    expect(forbiddenRequests).toEqual([]);
  });

  test("certificate eligibility is local and its name is never persisted or transmitted", async ({
    context,
    page,
  }) => {
    await seedProgress(page, 9);
    await page.goto("/certificate");
    await expect(page).toHaveURL(/\/$/);

    await seedProgress(page, 10);
    const forbiddenRequests = monitorLearnerRequests(page);
    const requestBodies: string[] = [];
    page.on("request", (request) => {
      const body = request.postData();
      if (body) requestBodies.push(body);
    });

    await page.goto("/certificate");
    const nameInput = page.getByLabel("Name for your certificate");
    await expect(nameInput).toBeVisible();

    const privateName = "Private Learner Name";
    await nameInput.fill(privateName);
    await expect(nameInput).toHaveValue(privateName);

    const storageValues = await page.evaluate(() => ({
      local: Object.values(window.localStorage),
      session: Object.values(window.sessionStorage),
    }));
    const cookies = await context.cookies();

    expect(storageValues.local.join(" ")).not.toContain(privateName);
    expect(storageValues.session.join(" ")).not.toContain(privateName);
    expect(JSON.stringify(cookies)).not.toContain(privateName);
    expect(requestBodies.join(" ")).not.toContain(privateName);
    expect(forbiddenRequests).toEqual([]);

    await page.getByRole("button", { name: "Map" }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/certificate\/?$/);
    await expect(page.getByLabel("Name for your certificate")).toHaveValue("");

    await page.getByLabel("Name for your certificate").fill(privateName);
    await page.reload();
    await expect(page.getByLabel("Name for your certificate")).toHaveValue("");
  });

  test("restart resets only eRide progress and storage failure keeps the session usable", async ({
    page,
  }) => {
    await page.addInitScript(
      ({ key }) => {
        window.localStorage.setItem(
          key,
          JSON.stringify({ version: 1, currentModule: 10, introSeen: true }),
        );
        window.localStorage.setItem("unrelated-setting", "keep-me");
      },
      { key: PROGRESS_KEY },
    );

    await page.goto("/");
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Restart Course" }).click();

    await expect(page).toHaveURL(/\/intro-video\/?$/);
    expect(await readProgress(page)).toBeNull();
    expect(await page.evaluate(() => window.localStorage.getItem("unrelated-setting"))).toBe(
      "keep-me",
    );

    await page.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        configurable: true,
        get() {
          throw new Error("storage unavailable");
        },
      });
    });
    await page.goto("/");

    await expect(page).toHaveURL(/\/intro-video\/?$/);
    const startButton = page.getByRole("button", { name: "Let's get started!" });
    await expect(startButton).toBeEnabled({ timeout: 15_000 });
    await startButton.click();
    await expect(page).toHaveURL(/\/$/);
  });
});
