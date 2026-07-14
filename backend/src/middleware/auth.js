import { getFirebaseAuth } from "../config/firebaseAdmin.js";
import User from "../models/User.js";
import ApiError from "../utils/apiError.js";

const getTokenFromHeader = (authorizationHeader = "") => {
  if (!authorizationHeader.startsWith("Bearer ")) {
    return null;
  }

  return authorizationHeader.slice("Bearer ".length).trim();
};

const getAuthError = (error) => {
  if (error?.code === "auth/id-token-expired") {
    return new ApiError(401, "Firebase ID token expired", "AUTH_TOKEN_EXPIRED");
  }

  return new ApiError(401, "Firebase ID token invalid", "AUTH_TOKEN_INVALID");
};

export const requireAuth = async (req, res, next) => {
  try {
    const token = getTokenFromHeader(req.headers.authorization);

    if (!token) {
      throw new ApiError(401, "Authorization bearer token is required", "AUTH_TOKEN_MISSING");
    }

    let decodedToken;

    try {
      decodedToken = await getFirebaseAuth().verifyIdToken(token);
    } catch (error) {
      throw getAuthError(error);
    }

    const email = decodedToken.email || `${decodedToken.uid}@firebase.local`;

    const user = await User.findOneAndUpdate(
      { firebaseUid: decodedToken.uid },
      {
        $setOnInsert: {
          firebaseUid: decodedToken.uid,
          email,
          name: decodedToken.name || email,
          avatarUrl: decodedToken.picture || "",
          brainDumpCredits: 5,
        },
      },
      {
        returnDocument: "after",
        upsert: true,
        setDefaultsOnInsert: true,
        projection: "firebaseUid name email phoneNumber avatarUrl brainDumpCredits unlimitedBrainDumpsUntil billingPlan workspace settings createdAt",
      }
    ).lean();

    req.user = user;
    req.firebaseToken = decodedToken;
    next();
  } catch (error) {
    next(error);
  }
};
