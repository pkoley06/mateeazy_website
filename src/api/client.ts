import { ENV } from '../config/env';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const TOKEN_KEY = 'mateeazy_jwt';
const USER_ID_KEY = 'mateeazy_user_id';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredAuth(token: string, userId: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_ID_KEY, userId);
  } catch {
    // ignore storage errors
  }
}

export function clearStoredAuth(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_ID_KEY);
  } catch {
    // ignore
  }
}

let onUnauthorizedHandler: (() => void) | null = null;
export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorizedHandler = fn;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const { auth = true, headers, body, ...rest } = options;
  const reqHeaders = new Headers(headers);

  if (!(body instanceof FormData) && !reqHeaders.has('Content-Type')) {
    reqHeaders.set('Content-Type', 'application/json');
  }

  if (auth) {
    const token = getStoredToken();
    if (token) {
      reqHeaders.set('Authorization', `Bearer ${token}`);
    }
  }

  const url = path.startsWith('http') ? path : `${ENV.apiBaseUrl}${path}`;
  const res = await fetch(url, {
    ...rest,
    headers: reqHeaders,
    body,
  });

  if (res.status === 401 && auth && onUnauthorizedHandler) {
    onUnauthorizedHandler();
  }

  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const errJson = (await res.json()) as {
        message?: string;
        error?: string;
      };
      msg = errJson.message || errJson.error || msg;
    } catch {
      // ignore json parse error
    }
    throw new ApiError(res.status, msg);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}
