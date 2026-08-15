/* eslint-disable */
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

let connectionPromise;

export function connectMongo() {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve(mongoose);
  }

  if (!connectionPromise) {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      return Promise.reject(new Error("MONGODB_URI is not configured"));
    }

    connectionPromise = mongoose.connect(uri).catch((err) => {
      connectionPromise = undefined;
      console.error("MongoDB connection failed:", err.message);
      throw err;
    });
  }

  return connectionPromise;
}

export default mongoose;
