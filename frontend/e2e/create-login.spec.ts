import { expect, test } from "@playwright/test";

import { fillSecret, monitorScreenErrors, requiredEnv } from "./helpers/screen-errors";

test("create a new login with Test as the last name", async ({ page }, testInfo) => {
  const email = requiredEnv("E2E_NEW_USER_EMAIL");
  const password = requiredEnv("E2E_TEST_PASSWORD");
  const monitor = monitorScreenErrors(page, {
    allowResponse: (url, status) =>
      status === 404 && url.includes("/api/user/get/"),
  });

  await page.goto("/signup/");

  await page.getByPlaceholder("Jane", { exact: true }).fill(process.env.E2E_TEST_FIRST_NAME ?? "Automated");
  await page.getByPlaceholder("Doe", { exact: true }).fill("Test");
  await page.locator('input[name="username"]').fill(email);
  await fillSecret(page.locator('input[name="password"]'), password);

  await page.getByRole("button", { name: "Sign Up" }).click();

  await expect(page.getByRole("heading", { name: "Verify Your Email" })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText(email)).toBeVisible();

  await monitor.assertNoErrors(testInfo);
});
