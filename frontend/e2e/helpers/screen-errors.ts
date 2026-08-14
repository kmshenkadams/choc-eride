import { expect, Page, TestInfo } from "@playwright/test";

type MonitorOptions = {
  allowResponse?: (url: string, status: number) => boolean;
};

export function monitorScreenErrors(page: Page, options: MonitorOptions = {}) {
  const errors: string[] = [];

  page.on("pageerror", (error) => {
    errors.push(`Browser exception: ${error.message}`);
  });

  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(`console.error: ${message.text()}`);
    }
  });

  page.on("requestfailed", (request) => {
    errors.push(
      `Request failed: ${request.method()} ${request.url()} - ${request.failure()?.errorText ?? "unknown"}`,
    );
  });

  page.on("response", (response) => {
    if (
      response.status() >= 400 &&
      !options.allowResponse?.(response.url(), response.status())
    ) {
      errors.push(
        `HTTP ${response.status()}: ${response.request().method()} ${response.url()}`,
      );
    }
  });

  return {
    async assertNoErrors(testInfo: TestInfo) {
      const visibleErrors = await page
        .locator('[role="alert"], [class*="error"], [class*="toast"]')
        .evaluateAll((elements) =>
          elements
            .filter((element) => {
              const style = window.getComputedStyle(element);
              return (
                style.display !== "none" &&
                style.visibility !== "hidden" &&
                element.textContent?.trim()
              );
            })
            .map((element) => `Visible screen error: ${element.textContent?.trim()}`),
        );

      errors.push(...visibleErrors);

      if (errors.length > 0) {
        await testInfo.attach("screen-errors", {
          body: Buffer.from(JSON.stringify(errors, null, 2)),
          contentType: "application/json",
        });
      }

      expect(errors, errors.join("\n")).toEqual([]);
    },
  };
}

export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Add it to frontend/.env.e2e before running this test.`);
  }
  return value;
}
