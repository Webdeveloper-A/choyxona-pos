import admin from "firebase-admin";

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} environment variable topilmadi`);
  }

  return value;
}

function getPrivateKey() {
  const rawKey = getRequiredEnv("FIREBASE_PRIVATE_KEY");

  const unwrapped =
    rawKey.startsWith('"') && rawKey.endsWith('"')
      ? rawKey.slice(1, -1)
      : rawKey;

  return unwrapped.replace(/\\n/g, "\n");
}

function getServiceAccountConfig() {
  const projectId = getRequiredEnv("FIREBASE_PROJECT_ID");
  const clientEmail = getRequiredEnv("FIREBASE_CLIENT_EMAIL");
  const privateKey = getPrivateKey();

  return { projectId, clientEmail, privateKey };
}

export function getAdminApp() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  return admin.initializeApp({
    credential: admin.credential.cert(getServiceAccountConfig()),
  });
}

export function getAdminAuth() {
  return getAdminApp().auth();
}

export function getAdminDb() {
  return getAdminApp().firestore();
}

export default admin;
