import admin from "firebase-admin";

function getPrivateKey() {
  const key = process.env.FIREBASE_PRIVATE_KEY;
  return key ? key.replace(/\n/g, "\n") : undefined;
}

function getServiceAccountConfig() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = getPrivateKey();

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin env qiymatlari to‘liq emas. FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL va FIREBASE_PRIVATE_KEY ni tekshiring."
    );
  }

  return { projectId, clientEmail, privateKey };
}

export function getAdminApp() {
  if (admin.apps.length) {
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
