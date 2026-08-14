import { expect, Locator, Page, TestInfo } from "@playwright/test";

type MonitorOptions = {
  allowResponse?: (url: string, status: number) => boolean;
};

function isVercelToolbarRequest(url: string): boolean {
  try {
    const { pathname } = new URL(url);
    return (
      pathname.startsWith("/.well-known/vercel/") ||
      /^\/[a-f0-9]{12,}\/script\.js$/i.test(pathname)
    );
  } catch {
    return false;
  }
}

export async function fillSecret(locator: Locator, value: string) {
  await locator.evaluate((element, secret) => {
    const input = element as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;

    setter?.call(input, secret);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}

export function monitorScreenErrors(page: Page, options: MonitorOptions = {}) {
  const errors: string[] = [];

  page.on("pageerror", (error) => {
    errors.push(`Browser exception: ${error.message}`);
  });

  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      !isVercelToolbarRequest(message.location().url)
    ) {
      errors.push(`console.error: ${message.text()}`);
    }
  });

  page.on("requestfailed", (request) => {
    const failure = request.failure()?.errorText ?? "unknown";
    if (
      failure.includes("ERR_ABORTED") ||
      isVercelToolbarRequest(request.url())
    ) {
      return;
    }

    errors.push(
      `Request failed: ${request.method()} ${request.url()} - ${failure}`,
    );
  });

  page.on("response", (response) => {
    if (
      response.status() >= 400 &&
      !isVercelToolbarRequest(response.url()) &&
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
