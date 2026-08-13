import "dotenv/config";

import cors from "cors";
import express from "express";

import userRoutes from "./routes/user.js";
import { connectMongo } from "./util/db.js";

const app = express();
const port = process.env.PORT || 5001;

connectMongo();

app.use(express.json());
app.use(cors());

app.use("/api/user", userRoutes);

app.get("/ping", (req, res) => {
  res.status(200).send("pong");
});

if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Backend running at http://localhost:${port}`);
  });
}

export default app;
