import { expect, test } from "@playwright/test";

const removedAccountRoutes = [
  "/signin",
  "/signup",
  "/auth",
  "/emailverified",
  "/forgotpassword",
  "/resetpassword",
];

for (const route of removedAccountRoutes) {
  test(`${route} no longer exposes account functionality`, async ({ page }) => {
    const response = await page.goto(route);

    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { name: "This page could not be found." }),
    ).toBeVisible();
    await expect(page.locator('input[type="email"]')).toHaveCount(0);
    await expect(page.locator('input[type="password"]')).toHaveCount(0);
    await expect(
      page.getByRole("button", {
        name: /sign in|sign up|create account|reset password/i,
      }),
    ).toHaveCount(0);
  });
}
