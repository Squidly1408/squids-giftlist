import { initializeApp, getApps } from 'firebase/app'
import { connectAuthEmulator, getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth'
import {
  connectFirestoreEmulator,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore'

// All values come from Vite env vars (see .env.example). Never commit real values to source control.
// Only Auth + Firestore are used: this app deliberately targets Firebase's free Spark plan, which
// doesn't include Cloud Functions or Cloud Storage (both now require the paid Blaze plan).
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

/**
 * `getAuth()` throws synchronously (crashing the whole module graph, and therefore the whole
 * app, with a blank white screen) if the API key isn't at least well-formed. So we only touch
 * the Firebase SDKs when config looks present, and let main.tsx show a friendly setup screen
 * instead of the real app otherwise.
 */
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId)

if (!isFirebaseConfigured) {
  // eslint-disable-next-line no-console
  console.error(
    'Firebase config is missing. Copy web/.env.example to web/.env.local and fill in your Firebase project settings.'
  )
}

const existingApp = getApps()[0]
export const app = existingApp ?? initializeApp(firebaseConfig)

export const auth = (isFirebaseConfigured ? getAuth(app) : null) as Auth
export const googleProvider = new GoogleAuthProvider()

// Offline persistence with multi-tab support makes claim/unclaim feel instant and keeps
// the app usable on flaky connections. Only valid on the app's first initialization.
export const db = (
  isFirebaseConfigured
    ? existingApp
      ? getFirestore(app)
      : initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) })
    : null
) as Firestore

// Trial / local-dev mode: point Auth + Firestore at the local Firebase Emulator Suite instead of
// a real project, so the app can be tried with zero setup and no billing plan at all. Never
// active in a production build. See README.md's "Try it locally" section.
const useEmulators = import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === 'true'

if (isFirebaseConfigured && useEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
  // eslint-disable-next-line no-console
  console.info('Squids-GiftList is running against the local Firebase Emulator Suite (trial mode).')
}
