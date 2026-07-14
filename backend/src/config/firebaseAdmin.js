import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const getFirebaseCredential = () => {
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;

  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    throw new Error("Firebase Admin env vars are required");
  }

  return cert({
    projectId: FIREBASE_PROJECT_ID,
    clientEmail: FIREBASE_CLIENT_EMAIL,
    privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  });
};

export const getFirebaseAdmin = () => {
  if (!getApps().length) {
    initializeApp({
      credential: getFirebaseCredential(),
    });
    console.log("Firebase Admin initialized");
  }

  return getApps()[0];
};

export const getFirebaseAuth = () => {
  getFirebaseAdmin();
  return getAuth();
};

export default getFirebaseAdmin;
