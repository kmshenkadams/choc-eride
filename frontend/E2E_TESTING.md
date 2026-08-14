# eBike browser test scripts

These Playwright tests run against the stable Vercel preview and do not record video.

## One-time setup on Windows

Open PowerShell:

```powershell
cd C:\Users\kriss\GitHub\eRide
git checkout deployment/vercel-baseline
git pull origin deployment/vercel-baseline
cd frontend
Copy-Item .env.e2e.example .env.e2e
notepad .env.e2e
npm install
npx playwright install chromium
```

Put test-only email addresses and a test password in `.env.e2e`. Never commit that file.

## 1. Create a new login

```powershell
npm run test:e2e:create
```

The script always enters `Test` as the last name. After it passes, open the verification email and verify the account. Then set `E2E_TEST_EMAIL` in `.env.e2e` to that verified address.

## 2. Login

```powershell
npm run test:e2e:login
```

This signs in and saves the authenticated browser session locally for the next script.

## 3. Authenticated happy path

```powershell
npm run test:e2e:happy
```

This opens the authenticated course homepage, verifies the test account, sidebar, course map, and logout. It fails and logs evidence for JavaScript exceptions, console errors, failed requests, HTTP 4xx/5xx responses, and visible error/toast messages.

## Results

- Console: immediate pass/fail result
- Failure screenshot and trace: `frontend/test-results`
- HTML report:

```powershell
npm run test:e2e:report
```

The first phase intentionally excludes video playback and video recording.
