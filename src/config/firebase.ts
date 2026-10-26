import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously as firebaseSignInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
  Auth,
  NextOrObserver
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

const isApiKeyValid = Boolean(firebaseConfig.apiKey && firebaseConfig.apiKey.trim().length > 5);

let authInstance: Auth | null = null;

if (isApiKeyValid) {
  try {
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    authInstance = getAuth(app);
  } catch (error) {
    console.warn('Firebase initialization error:', error);
  }
} else {
  console.warn('VITE_FIREBASE_API_KEY is missing or unconfigured in .env file.');
}

export const auth = authInstance as Auth;
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export function onAuthStateChanged(
  authObj: Auth,
  nextOrObserver: NextOrObserver<FirebaseUser>,
  errorCb?: (error: Error) => void
) {
  if (!authObj) {
    if (typeof nextOrObserver === 'function') {
      nextOrObserver(null);
    }
    return () => {};
  }
  return firebaseOnAuthStateChanged(authObj, nextOrObserver, errorCb);
}

export async function checkRedirectResult() {
  if (!auth) return null;
  try {
    const result = await getRedirectResult(auth);
    return result?.user || null;
  } catch (error) {
    console.error('Error during Google Sign-In redirect result:', error);
    throw error;
  }
}

export async function signInWithGooglePopup() {
  if (!auth) {
    throw new Error('Firebase API Key is missing. Please add VITE_FIREBASE_API_KEY to your .env file.');
  }

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  if (isMobile) {
    try {
      await signInWithRedirect(auth, googleProvider);
      return null;
    } catch (rErr) {
      console.error('Error during Google Sign-In redirect:', rErr);
      throw rErr;
    }
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.warn('Google Sign-In popup warning, attempting redirect fallback:', error?.code || error);
    if (
      error?.code === 'auth/popup-blocked' || 
      error?.code === 'auth/popup-closed-by-user' || 
      error?.code === 'auth/cancelled-popup-request'
    ) {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw error;
  }
}


export async function signUpWithEmailPassword(email: string, pass: string, name?: string) {
  if (!auth) {
    throw new Error('Firebase API Key is missing. Please add VITE_FIREBASE_API_KEY to your .env file.');
  }
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  if (name && name.trim()) {
    try {
      await updateProfile(result.user, { displayName: name.trim() });
    } catch (err) {
      console.warn('Failed to update displayName on user profile:', err);
    }
  }
  return result.user;
}

export async function signInWithEmailPassword(email: string, pass: string) {
  if (!auth) {
    throw new Error('Firebase API Key is missing. Please add VITE_FIREBASE_API_KEY to your .env file.');
  }
  const result = await signInWithEmailAndPassword(auth, email, pass);
  return result.user;
}

export async function signInAnonymouslyUser() {
  if (!auth) {
    throw new Error('Firebase API Key is missing. Please add VITE_FIREBASE_API_KEY to your .env file.');
  }
  const result = await firebaseSignInAnonymously(auth);
  return result.user;
}

export async function signOutUser() {
  if (!auth) return;
  return firebaseSignOut(auth);
}

export { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  type FirebaseUser 
};
