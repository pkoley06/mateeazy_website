import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPopup,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth';
import { ENV } from './env';

const app = getApps().length ? getApps()[0] : initializeApp(ENV.firebase);
export const firebaseAuth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function signInWithGoogleWeb(): Promise<string> {
  const result = await signInWithPopup(firebaseAuth, googleProvider);
  return result.user.getIdToken();
}

export function createPhoneRecaptcha(containerId: string): RecaptchaVerifier {
  return new RecaptchaVerifier(firebaseAuth, containerId, {
    size: 'invisible',
  });
}

export async function sendPhoneOtpWeb(
  phoneNumber: string,
  verifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  return signInWithPhoneNumber(firebaseAuth, phoneNumber, verifier);
}
