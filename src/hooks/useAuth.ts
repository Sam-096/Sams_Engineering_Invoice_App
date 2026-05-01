import { useCallback, useEffect, useState } from 'react';
import { authConfig } from '../data/auth';

const SESSION_KEY = 'sams.auth.session';

interface Session {
  username: string;
  loggedInAt: number;
}

const readSession = (): Session | null => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
};

/**
 * Single-user auth backed by `authConfig` and persisted to `localStorage`.
 * No backend; the credential check is local to the device.
 */
export function useAuth() {
  const [session, setSession] = useState<Session | null>(() => readSession());

  // Keep tabs in sync if the user logs out from another tab.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === SESSION_KEY) setSession(readSession());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const login = useCallback((username: string, password: string): boolean => {
    const u = username.trim();
    const ok = u === authConfig.user.username && password === authConfig.user.password;
    if (!ok) return false;
    const next: Session = { username: u, loggedInAt: Date.now() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    setSession(next);
    return true;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  }, []);

  return {
    session,
    isAuthenticated: session !== null,
    login,
    logout,
  };
}
