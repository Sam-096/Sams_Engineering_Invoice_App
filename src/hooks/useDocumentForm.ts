import { useCallback, useState } from 'react';
import type { CustomerMaster } from '../types';
import { customers } from '../data/customers';
import { useLocalStorage } from './useLocalStorage';

interface Options {
  /** When set, the form data is persisted to localStorage under this key. */
  persistKey?: string;
}

/**
 * Generic form state container shared by Invoice / Proforma / DC pages.
 * Persists drafts to `localStorage` so a refresh or accidental close
 * does not lose work.
 */
export function useDocumentForm<T>(initialState: T, options: Options = {}) {
  const { persistKey } = options;

  const [persisted, setPersisted, clearPersisted] = useLocalStorage<T>(
    persistKey ?? '__noop__',
    initialState,
  );
  const [memoryOnly, setMemoryOnly] = useState<T>(initialState);

  const formData = persistKey ? persisted : memoryOnly;
  const setFormData = persistKey ? setPersisted : setMemoryOnly;

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerMaster | null>(() => {
    const initialCustomerId = (formData as unknown as { customerId?: string }).customerId;
    if (!initialCustomerId) return null;
    return customers.find((c) => c.id === initialCustomerId) ?? null;
  });

  const updateField = useCallback(
    (field: keyof T, value: T[keyof T]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [setFormData],
  );

  const handleCustomerSelect = useCallback((customerId: string) => {
    setSelectedCustomer(customers.find((c) => c.id === customerId) ?? null);
  }, []);

  const resetForm = useCallback(() => {
    if (!window.confirm('Are you sure you want to clear the form?')) return;
    if (persistKey) clearPersisted();
    else setMemoryOnly(initialState);
    setSelectedCustomer(null);
  }, [persistKey, clearPersisted, initialState]);

  return {
    formData,
    setFormData,
    updateField,
    selectedCustomer,
    handleCustomerSelect,
    resetForm,
  };
}
