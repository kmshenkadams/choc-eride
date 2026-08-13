import { User } from "../models/user.js";
import { getFirebaseAdmin } from "../util/firebaseAdmin.js";

export const requireSignedIn = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split("Bearer ")[1];
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const admin = getFirebaseAdmin();
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.userUid = decodedToken.uid;
    req.userEmail = decodedToken.email;

    const user = await User.findOne({ email: decodedToken.email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid auth token" });
  }
};
