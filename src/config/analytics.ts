import { initializeApp, getApps } from 'firebase/app';
import {
  getAnalytics,
  isSupported,
  logEvent,
  type Analytics,
} from 'firebase/analytics';
import { ENV } from './env';

let analyticsPromise: Promise<Analytics | null> | null = null;

function getWebAnalytics(): Promise<Analytics | null> {
  if (analyticsPromise) return analyticsPromise;
  if (!ENV.firebase.apiKey || !ENV.firebase.measurementId) {
    analyticsPromise = Promise.resolve(null);
    return analyticsPromise;
  }
  analyticsPromise = isSupported()
    .then((supported) => {
      if (!supported) return null;
      const app = getApps().length ? getApps()[0] : initializeApp(ENV.firebase);
      return getAnalytics(app);
    })
    .catch(() => null);
  return analyticsPromise;
}

export function trackPageView(path: string, title?: string): void {
  void getWebAnalytics().then((a) => {
    if (!a) return;
    logEvent(a, 'page_view', {
      page_path: path,
      page_location: window.location.href,
      page_title: title || document.title,
    });
  });
}

export function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean>
): void {
  void getWebAnalytics().then((a) => {
    if (!a) return;
    logEvent(a, name, params);
  });
}
