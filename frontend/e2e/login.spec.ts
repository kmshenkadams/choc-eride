import fs from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

import { fillSecret, monitorScreenErrors, requiredEnv } from "./helpers/screen-errors";

test("login with a verified test account", async ({ page }, testInfo) => {
  const email = requiredEnv("E2E_TEST_EMAIL");
  const password = requiredEnv("E2E_TEST_PASSWORD");
  const monitor = monitorScreenErrors(page);

  await page.goto("/signin/");
  await page.locator('input[name="username"]').fill(email);
  await fillSecret(page.locator('input[name="password"]'), password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/(intro-video\/?)?$/, { timeout: 30_000 });
  await expect(page.getByText("Incorrect email or password.")).toHaveCount(0);
  await expect(page.getByText("Email is not verified!")).toHaveCount(0);

  const authDirectory = path.resolve("playwright/.auth");
  fs.mkdirSync(authDirectory, { recursive: true });
  await page.context().storageState({ path: path.join(authDirectory, "user.json") });

  await monitor.assertNoErrors(testInfo);
});
