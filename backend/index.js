import "dotenv/config";

import cors from "cors";
import express from "express";

import userRoutes from "./routes/user.js";
import { connectMongo } from "./util/db.js";

const app = express();
const port = process.env.PORT || 5001;

app.use(express.json());
app.use(cors());

app.get("/ping", (req, res) => {
  res.status(200).send("pong");
});

app.use("/api/user", async (req, res, next) => {
  try {
    await connectMongo();
    next();
  } catch (err) {
    console.error("MongoDB unavailable:", err.message);
    res.status(503).json({ error: "Database unavailable" });
  }
});

app.use("/api/user", userRoutes);

if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Backend running at http://localhost:${port}`);
  });
}

export default app;
