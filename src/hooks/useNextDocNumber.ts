import { useCallback } from 'react';
import { masters } from '../data/masters';

const COUNTER_KEYS = {
  invoice: 'sams.counter.invoice',
  proforma: 'sams.counter.proforma',
  deliveryChallan: 'sams.counter.deliveryChallan',
} as const;

const PREFIXES = {
  invoice: masters.sequenceConfig.invoicePrefix,
  proforma: masters.sequenceConfig.proformaPrefix,
  deliveryChallan: masters.sequenceConfig.deliveryChallanPrefix,
} as const;

type Kind = keyof typeof COUNTER_KEYS;

const readCounter = (kind: Kind): number => {
  try {
    const raw = localStorage.getItem(COUNTER_KEYS[kind]);
    if (!raw) return 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
};

const writeCounter = (kind: Kind, value: number) => {
  try {
    localStorage.setItem(COUNTER_KEYS[kind], String(value));
  } catch {
    /* no-op */
  }
};

const pad = (n: number) => String(n).padStart(3, '0');

/**
 * Numbering helper.
 * - `peekNext()` shows the next number that would be issued (no side effect).
 * - `commitIfMatches(value)` advances the counter only if `value` is the one
 *   peeked. Call this after a successful PDF/print so users who manually edit
 *   the number don't accidentally double-bump the counter.
 */
export function useNextDocNumber(kind: Kind) {
  const prefix = PREFIXES[kind];

  const peekNext = useCallback((): string => {
    const next = readCounter(kind) + 1;
    return `${prefix}-${pad(next)}`;
  }, [kind, prefix]);

  const commitIfMatches = useCallback(
    (value: string): void => {
      const next = readCounter(kind) + 1;
      const expected = `${prefix}-${pad(next)}`;
      if (value === expected) writeCounter(kind, next);
    },
    [kind, prefix],
  );

  return { peekNext, commitIfMatches };
}
