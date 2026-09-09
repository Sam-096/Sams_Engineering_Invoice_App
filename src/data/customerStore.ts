import type { CustomerMaster } from '../types';
import { customers as builtInCustomers } from './customers';

const STORAGE_KEY = 'sams.customers.custom';
const OVERRIDES_KEY = 'sams.customers.overrides';

function readCustom(): CustomerMaster[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CustomerMaster[]) : [];
  } catch {
    return [];
  }
}

function writeCustom(list: CustomerMaster[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* no-op: quota exceeded or storage unavailable */
  }
}

function readOverrides(): Record<string, CustomerMaster> {
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    return raw ? (JSON.parse(raw) as Record<string, CustomerMaster>) : {};
  } catch {
    return {};
  }
}

function writeOverrides(overrides: Record<string, CustomerMaster>) {
  try {
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
  } catch {
    /* no-op: quota exceeded or storage unavailable */
  }
}

/** Built-in customers (with any saved edits applied) plus customers added by the user. */
export function getAllCustomers(): CustomerMaster[] {
  const overrides = readOverrides();
  const builtIn = builtInCustomers.map((c) => overrides[c.id] ?? c);
  return [...builtIn, ...readCustom()];
}

function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return slug || 'customer';
}

export type NewCustomerInput = Omit<CustomerMaster, 'id' | 'tags'> & { tags?: string[] };

/** Adds a new customer to the master, persisting it to localStorage, and returns it. */
export function addCustomer(input: NewCustomerInput): CustomerMaster {
  const all = getAllCustomers();
  const baseId = slugify(input.displayName);
  let id = baseId;
  let suffix = 1;
  while (all.some((c) => c.id === id)) {
    id = `${baseId}-${suffix++}`;
  }

  const customer: CustomerMaster = { ...input, id, tags: input.tags ?? [] };
  writeCustom([...readCustom(), customer]);
  return customer;
}

/** Updates an existing customer (built-in or custom) and persists the change to localStorage. */
export function updateCustomer(id: string, input: NewCustomerInput): CustomerMaster {
  const updated: CustomerMaster = { ...input, id, tags: input.tags ?? [] };

  const custom = readCustom();
  const customIdx = custom.findIndex((c) => c.id === id);
  if (customIdx >= 0) {
    custom[customIdx] = updated;
    writeCustom(custom);
    return updated;
  }

  const overrides = readOverrides();
  overrides[id] = updated;
  writeOverrides(overrides);
  return updated;
}
