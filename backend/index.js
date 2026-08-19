import { pathToFileURL } from "node:url";

import express from "express";

const app = express();
const port = process.env.PORT || 5001;

const serviceStatus = Object.freeze({
  status: "ok",
  service: "eride-backend",
  learnerAccountDataService: "retired",
});

const retiredLearnerAccountDataResponse = Object.freeze({
  status: "gone",
  message: "The server-side learner account and data service has been retired.",
});

app.get(["/", "/health", "/ping"], (req, res) => {
  res.status(200).json(serviceStatus);
});

app.all(["/api/user", "/api/user/*"], (req, res) => {
  res.status(410).json(retiredLearnerAccountDataResponse);
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (!process.env.VERCEL && isDirectRun) {
  app.listen(port, () => {
    console.log("Backend running at http://localhost:" + port);
  });
}

export default app;
