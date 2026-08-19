# Retired eRide Learner Account and Data Backend

This directory retains the minimum Express entry point required by the connected Vercel backend
project. Only the server-side learner account and data service has been retired. The anonymous
learner experience remains active, including all modules, quizzes, browser-local progress, and
certificates.

The application no longer stores identifiable learner accounts, progress, or results on the
server. This status service does not authenticate learners or connect to a database, and it
requires no environment variables or credentials. External Firebase users and MongoDB records
have not yet been deleted.

## Endpoints

- "GET /", "GET /health", and "GET /ping" return the same safe service-status response.
- Every method under "/api/user" returns HTTP "410 Gone" with a generic message confirming that
  the server-side learner account and data service has been retired.
- All other paths return an account-free HTTP "404 Not Found" response.

Former learner paths never reveal whether an email address, learner, or account existed.

## Local checks

```sh
npm ci
npm test
npm run check
npm run lint-check
```

Run the service locally with "npm start". "PORT" is optional and defaults to "5001".
