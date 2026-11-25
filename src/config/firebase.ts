import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPopup,
  signInWithPhoneNumber,
  type Auth,
  type ConfirmationResult,
} from 'firebase/auth';
import { ENV } from './env';

let cachedAuth: Auth | null = null;

export function getFirebaseAuth(): Auth {
  if (cachedAuth) return cachedAuth;
  if (!ENV.firebase.apiKey) {
    throw new Error('Firebase Web API key is not configured (VITE_FIREBASE_API_KEY)');
  }
  const app = getApps().length ? getApps()[0] : initializeApp(ENV.firebase);
  cachedAuth = getAuth(app);
  return cachedAuth;
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function signInWithGoogleWeb(): Promise<string> {
  const result = await signInWithPopup(getFirebaseAuth(), googleProvider);
  return result.user.getIdToken();
}

export function createPhoneRecaptcha(containerId: string): RecaptchaVerifier {
  return new RecaptchaVerifier(getFirebaseAuth(), containerId, {
    size: 'invisible',
  });
}

export async function sendPhoneOtpWeb(
  phoneNumber: string,
  verifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  return signInWithPhoneNumber(getFirebaseAuth(), phoneNumber, verifier);
}
