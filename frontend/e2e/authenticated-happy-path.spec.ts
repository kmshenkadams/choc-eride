import fs from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

import { monitorScreenErrors, requiredEnv } from "./helpers/screen-errors";

const authState = path.resolve("playwright/.auth/user.json");

test.skip(!fs.existsSync(authState), "Run npm run test:e2e:login first.");

test.use({ storageState: authState });

test("authenticated happy path loads the course and logs screen errors", async ({
  page,
}, testInfo) => {
  const email = requiredEnv("E2E_TEST_EMAIL");
  const monitor = monitorScreenErrors(page);

  await page.goto("/");

  await expect(page).toHaveURL(/\/$/, { timeout: 30_000 });
  await expect(page.getByText(email)).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('svg[width="1151"][height="1024"]')).toBeVisible();
  await expect(page.getByRole("button", { name: /Log Out/i })).toBeVisible();

  await monitor.assertNoErrors(testInfo);

  await page.getByRole("button", { name: /Log Out/i }).click();
  await expect(page).toHaveURL(/\/signin\/?$/, { timeout: 15_000 });
});
