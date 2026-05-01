import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Persistent state hook backed by `localStorage`.
 * Falls back to in-memory state if storage is unavailable (private mode, quota).
 */
export function useLocalStorage<T>(key: string, initial: T): [T, (next: T | ((prev: T) => T)) => void, () => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? initial : (JSON.parse(raw) as T);
    } catch {
      return initial;
    }
  });

  // Avoid persisting the initial value on the very first render — only on real changes.
  const isFirstRun = useRef(true);
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* no-op: quota exceeded or storage unavailable */
    }
  }, [key, value]);

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch {
      /* no-op */
    }
    setValue(initial);
  }, [key, initial]);

  return [value, setValue, clear];
}
