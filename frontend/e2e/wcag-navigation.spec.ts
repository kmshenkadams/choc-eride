import { expect, test } from "@playwright/test";

import type { Locator, Page } from "@playwright/test";

const PROGRESS_KEY = "eride:learning-progress:v1";

const forbiddenRequestPattern =
  /\/api\/user|identitytoolkit|securetoken|firebaseinstallations|firebaseio|firebaseapp|\/_vercel\/insights\/script\.js|va\.vercel-scripts\.com\/v1\/script\.js/i;

type StoredProgress = {
  version: 1;
  currentModule: number;
  introSeen: boolean;
};

function monitorErrors(page: Page, pageErrors: string[]) {
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });
}

function monitorForbiddenRequests(page: Page, forbiddenRequests: string[]) {
  page.on("request", (request) => {
    if (forbiddenRequestPattern.test(request.url())) {
      forbiddenRequests.push(request.url());
    }
  });
}

async function seedProgress(page: Page, currentModule: number, introSeen = true) {
  await page.addInitScript(
    ({ key, progress }: { key: string; progress: StoredProgress }) => {
      window.localStorage.setItem(key, JSON.stringify(progress));
    },
    {
      key: PROGRESS_KEY,
      progress: {
        version: 1 as const,
        currentModule,
        introSeen,
      },
    },
  );
}

async function waitForBikeAnimation(page: Page) {
  await page.waitForFunction(() => {
    const bike = document.querySelector<SVGGElement>("#BIKE")?.parentElement;
    return bike?.getAnimations().every((animation) => animation.playState === "finished") ?? false;
  });
}

async function tabTo(page: Page, target: Locator, remainingTabs = 20): Promise<void> {
  if (remainingTabs === 0) {
    throw new Error(`Tab navigation did not reach ${await target.getAttribute("aria-label")}`);
  }

  await page.keyboard.press("Tab");
  if (await target.evaluate((element) => element === document.activeElement)) {
    return;
  }

  await tabTo(page, target, remainingTabs - 1);
}

test.describe("keyboard navigation and screen semantics", () => {
  test("map and sidebar module controls are keyboard-accessible", async ({ page }) => {
    const pageErrors: string[] = [];
    const forbiddenRequests: string[] = [];
    monitorErrors(page, pageErrors);
    monitorForbiddenRequests(page, forbiddenRequests);

    await seedProgress(page, 1);
    await page.goto("/");

    const moduleMap1 = page.getByRole("button", { name: /Module map marker 1/ });
    await expect(moduleMap1).toBeVisible();

    await tabTo(page, moduleMap1);
    await expect(moduleMap1, "module map marker 1 is keyboard-focusable").toBeFocused();
    await expect(moduleMap1).toHaveAttribute("aria-label", /current|available/);
    await waitForBikeAnimation(page);
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/module1\/?$/);

    await page.goto("/");
    const moduleMap2 = page.getByRole("button", { name: /Module map marker 2/ });
    await moduleMap2.focus();
    await expect(moduleMap2).toHaveAttribute("aria-disabled", "true");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText("This module is locked!", { exact: false })).toBeVisible();

    await page.keyboard.press("Tab");

    const sidebarModule1 = page.getByRole("button", {
      name: /What is an E Bike\? module 1/,
    });
    await sidebarModule1.focus();
    await expect(sidebarModule1).toBeFocused();
    await expect(sidebarModule1).toHaveAttribute("aria-current", "page");
    await expect(sidebarModule1).toHaveAttribute("aria-label", /current/);

    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/module1\/?$/);

    await page.goto("/");
    const sidebarModule2 = page.getByRole("button", {
      name: /Maintaining your eBike|Maintaining Your E Bike|module 2/,
    });
    await sidebarModule2.focus();
    await expect(sidebarModule2).toHaveAttribute("aria-disabled", "true");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText("This module is locked!", { exact: false })).toBeVisible();

    await seedProgress(page, 7);
    await page.goto("/");

    const module3 = page.getByRole("button", { name: /module 3, completed/i });
    await expect(module3).toHaveAttribute("aria-label", /completed/);
    const module7 = page.getByRole("button", { name: /module 7, current|current, module/ });
    await expect(module7).toHaveAttribute("aria-current", "page");

    const progressBar = page.getByRole("progressbar");
    await expect(progressBar).toHaveAttribute("aria-valuenow", "67");

    const collapseButton = page.getByRole("button", {
      name: /(Collapse sidebar|Expand sidebar)/,
    });
    await expect(collapseButton).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Tab");
    await collapseButton.focus();
    await expect(collapseButton).toBeFocused();
    await expect(collapseButton).toHaveAttribute("aria-label", /Collapse sidebar/);
    await collapseButton.focus();
    await page.keyboard.press("Enter");
    await expect(collapseButton).toHaveAttribute("aria-expanded", "false");

    await seedProgress(page, 5);
    await page.goto("/");
    await expect(progressBar).toHaveAttribute("aria-valuenow", "44");

    await seedProgress(page, 10);
    await page.goto("/");
    await expect(progressBar).toHaveAttribute("aria-valuenow", "100");

    await page.goto("/");
    const mouseModule3 = page.getByRole("button", {
      name: /Safety Equipment module 3/,
    });
    await mouseModule3.click();
    await expect(page).toHaveURL(/\/module3\/?$/);

    expect(pageErrors).toEqual([]);
    expect(forbiddenRequests).toEqual([]);
  });
});
