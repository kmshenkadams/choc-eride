import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { after, before, test } from "node:test";

const retiredEnvironmentVariables = [
  "FIREBASE_SERVICE_ACCOUNT_JSON",
  "GOOGLE_APPLICATION_CREDENTIALS",
  "MONGODB_URI",
];

for (const variable of retiredEnvironmentVariables) {
  delete process.env[variable];
}

const { default: app } = await import("../index.js");

let baseUrl;
let server;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      const address = server.address();
      baseUrl = "http://127.0.0.1:" + address.port;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("health endpoints report that the learner account and data service is retired", async () => {
  await Promise.all(
    ["/", "/health", "/ping"].map(async (path) => {
      const response = await fetch(baseUrl + path);

      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), {
        status: "ok",
        service: "eride-backend",
        learnerAccountDataService: "retired",
      });
    }),
  );
});

test("former learner endpoints return the same account-free gone response", async () => {
  const formerLearnerRequests = [
    { method: "POST", path: "/api/user/signup", body: { email: "person@example.test" } },
    { method: "GET", path: "/api/user/get/person%40example.test" },
    { method: "GET", path: "/api/user/get/not-an-email" },
    { method: "PUT", path: "/api/user/update/person%40example.test", body: { module: 8 } },
    { method: "DELETE", path: "/api/user/get/another%40example.test" },
    { method: "GET", path: "/api/user" },
  ];

  await Promise.all(
    formerLearnerRequests.map(async (request) => {
      const response = await fetch(baseUrl + request.path, {
        method: request.method,
        headers: request.body ? { "content-type": "application/json" } : undefined,
        body: request.body ? JSON.stringify(request.body) : undefined,
      });
      const responseBody = await response.json();

      assert.equal(response.status, 410);
      assert.deepEqual(responseBody, {
        status: "gone",
        message: "The server-side learner account and data service has been retired.",
      });
      assert.doesNotMatch(JSON.stringify(responseBody), /person|another|email|module/i);
    }),
  );
});

test("unknown routes return a generic account-free 404", async () => {
  const response = await fetch(baseUrl + "/not-a-service-route");

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: "Not found" });
});

test("retired persistence and identity modules are neither dependencies nor loaded modules", async () => {
  const packageJson = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  );
  const dependencyNames = Object.keys(packageJson.dependencies);

  assert.deepEqual(dependencyNames, ["express"]);

  const require = createRequire(import.meta.url);
  const loadedModules = Object.keys(require.cache).join("\n");

  assert.doesNotMatch(loadedModules, /firebase-admin|[\\/]mongodb[\\/]|[\\/]mongoose[\\/]/i);

  for (const variable of retiredEnvironmentVariables) {
    assert.equal(process.env[variable], undefined);
  }
});
