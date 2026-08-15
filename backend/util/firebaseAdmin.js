import { readFileSync } from "fs";

import admin from "firebase-admin";

const getServiceAccount = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const raw = readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, "utf8");
    return JSON.parse(raw);
  }

  throw new Error(
    "Firebase Admin credentials are not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON.",
  );
};

export const getFirebaseAdmin = () => {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(getServiceAccount()),
    });
  }

  return admin;
};
