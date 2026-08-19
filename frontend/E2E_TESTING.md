# eRide anonymous browser tests

The Playwright suite covers the anonymous learner journey, browser-local progress,
Quiz 7 progression, and the removed legacy account routes. It does not require
Firebase credentials, a test account, or saved authentication state.

## One-time setup

From PowerShell, install the frontend dependencies and Playwright Chromium:

```powershell
cd C:\Users\kriss\GitHub\eRide\frontend
npm install
npx playwright install chromium
```

## Choose the application URL

Playwright reads `.env.e2e` and uses `E2E_BASE_URL` when it is set. The variable is
optional; when it is absent, Playwright uses the default URL in
`playwright.config.ts`.

To keep a local target without committing it, copy the ignored example file and
change only `E2E_BASE_URL`:

```powershell
Copy-Item .env.e2e.example .env.e2e
```

You can also set the URL for only the current PowerShell process. For example, to
test a Vercel preview:

```powershell
$env:E2E_BASE_URL = "https://your-preview.vercel.app"
npm run test:e2e
```

To test a local production build, start it in one PowerShell window:

```powershell
npm run build
npm run start -- -p 3100
```

Then run the tests from a second PowerShell window:

```powershell
$env:E2E_BASE_URL = "http://127.0.0.1:3100"
npm run test:e2e
```

## Run the tests

Run all browser tests:

```powershell
npm run test:e2e
```

Run only the anonymous learner-flow tests:

```powershell
npx playwright test e2e/anonymous-learner-flow.spec.ts
```

Run the learning-progress and Quiz 7 regressions:

```powershell
npx playwright test e2e/learning-progress.spec.ts e2e/quiz7.spec.ts
```

Run the removed-account-route tests:

```powershell
npx playwright test e2e/removed-account-routes.spec.ts
```

## Results and reports

Playwright prints the immediate pass or failure result in the console. Failure
screenshots and traces are written to `frontend/test-results`. The HTML report is
written to `frontend/playwright-report/index.html`.

Open the HTML report viewer with:

```powershell
npm run test:e2e:report
```
