import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const APP_NAME = 'outage';

const config = {
  apiKey: import.meta.env.VITE_OUTAGE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_OUTAGE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_OUTAGE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_OUTAGE_FIREBASE_APP_ID,
};

function getOutageApp() {
  if (!config.projectId || !config.apiKey) return null;
  const existing = getApps().find((a) => a.name === APP_NAME);
  return existing || initializeApp(config, APP_NAME);
}

export function getOutageFirestore() {
  const app = getOutageApp();
  return app ? getFirestore(app) : null;
}
