/**
 * lib/firebase-admin.ts
 * ─────────────────────
 * Singleton initializer for Firebase Admin SDK.
 * Uses the modular import pattern for firebase-admin v12+.
 *
 * Usage:
 *   import { getAdminApp, getMessaging } from "@/lib/firebase-admin";
 */

import { initializeApp, getApps, getApp, App, cert, ServiceAccount } from "firebase-admin/app";
import { getMessaging as getAdminMessaging, Messaging } from "firebase-admin/messaging";

let messagingInstance: Messaging | null = null;

function initializeFirebaseAdmin(): App {
  // Return existing app if already initialized (Next.js hot-reload / serverless warm)
  if (getApps().length > 0) {
    return getApp();
  }

  const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!serviceAccountEnv) {
    throw new Error(
      "[FirebaseAdmin] FIREBASE_SERVICE_ACCOUNT env variable is not set. FCM will not work."
    );
  }

  let serviceAccount: ServiceAccount;
  if (serviceAccountEnv.trimStart().startsWith("{")) {
    serviceAccount = JSON.parse(serviceAccountEnv) as ServiceAccount;
  } else {
    // Base64 encoded
    const decoded = Buffer.from(serviceAccountEnv, "base64").toString("utf-8");
    serviceAccount = JSON.parse(decoded) as ServiceAccount;
  }

  const app = initializeApp({ credential: cert(serviceAccount) });
  console.log("[FirebaseAdmin] Initialized successfully.");
  return app;
}

export function getAdminApp(): App {
  return initializeFirebaseAdmin();
}

export function getMessaging(): Messaging {
  if (!messagingInstance) {
    const app = initializeFirebaseAdmin();
    messagingInstance = getAdminMessaging(app);
  }
  return messagingInstance;
}
