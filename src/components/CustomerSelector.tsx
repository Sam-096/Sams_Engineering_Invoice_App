import { useState } from 'react';
import { getAllCustomers, addCustomer, updateCustomer } from '../data/customerStore';
import { Field } from './Field';
import type { CustomerMaster } from '../types';

interface Props {
  selectedId: string;
  onSelect: (id: string) => void;
  error?: string;
}

const NEW_CUSTOMER_VALUE = '__new__';

type DraftFields = {
  displayName: string;
  billingName: string;
  shippingName: string;
  addressLines: string;
  state: string;
  stateCode: string;
  gstin: string;
};

const emptyDraft: DraftFields = {
  displayName: '',
  billingName: '',
  shippingName: '',
  addressLines: '',
  state: '',
  stateCode: '',
  gstin: '',
};

function toDraft(c: CustomerMaster): DraftFields {
  return {
    displayName: c.displayName,
    billingName: c.billingName,
    shippingName: c.shippingName,
    addressLines: c.addressLines.join('\n'),
    state: c.state,
    stateCode: c.stateCode,
    gstin: c.gstin,
  };
}

export function CustomerSelector({ selectedId, onSelect, error }: Props) {
  const [customers, setCustomers] = useState<CustomerMaster[]>(() => getAllCustomers());
  const [mode, setMode] = useState<'none' | 'add' | 'edit'>('none');
  const [draft, setDraft] = useState<DraftFields>(emptyDraft);
  const [formError, setFormError] = useState<string | undefined>();

  const selectedCustomer = customers.find((c) => c.id === selectedId);

  const handleChange = (value: string) => {
    if (value === NEW_CUSTOMER_VALUE) {
      setDraft(emptyDraft);
      setFormError(undefined);
      setMode('add');
      return;
    }
    setMode('none');
    onSelect(value);
  };

  const handleEditClick = () => {
    if (!selectedCustomer) return;
    setDraft(toDraft(selectedCustomer));
    setFormError(undefined);
    setMode('edit');
  };

  const updateDraft = (field: keyof DraftFields, value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    setMode('none');
    setFormError(undefined);
  };

  const buildInput = () => ({
    displayName: draft.displayName.trim(),
    billingName: draft.billingName.trim() || draft.displayName.trim(),
    shippingName: draft.shippingName.trim() || draft.billingName.trim() || draft.displayName.trim(),
    addressLines: draft.addressLines.split('\n').map((l) => l.trim()).filter(Boolean),
    state: draft.state.trim(),
    stateCode: draft.stateCode.trim(),
    gstin: draft.gstin.trim().toUpperCase(),
  });

  const handleSave = () => {
    if (!draft.displayName.trim() || !draft.state.trim() || !draft.stateCode.trim() || !draft.gstin.trim()) {
      setFormError('Name, State, State Code and GSTIN are required');
      return;
    }

    const saved = mode === 'edit' && selectedCustomer
      ? updateCustomer(selectedCustomer.id, buildInput())
      : addCustomer(buildInput());

    setCustomers(getAllCustomers());
    setMode('none');
    onSelect(saved.id);
  };

  return (
    <div className="customer-selector sw-field">
      <label className="sw-label" htmlFor="customer-select">Customer</label>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <select
          id="customer-select"
          className={`sw-select${error ? ' sw-input--error' : ''}`}
          style={{ flex: 1 }}
          value={mode === 'add' ? NEW_CUSTOMER_VALUE : selectedId}
          onChange={(e) => handleChange(e.target.value)}
        >
          <option value="">— Select a customer —</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.displayName}
            </option>
          ))}
          <option value={NEW_CUSTOMER_VALUE}>+ Add New Customer…</option>
        </select>
        {selectedCustomer && mode === 'none' && (
          <button type="button" className="sw-btn" onClick={handleEditClick}>Edit</button>
        )}
      </div>
      {error && <span className="sw-field__error">{error}</span>}

      {(mode === 'add' || mode === 'edit') && (
        <div className="sw-section" style={{ marginTop: '0.75rem' }}>
          <div className="sw-section-heading">{mode === 'edit' ? 'Edit Customer' : 'New Customer'}</div>
          <div className="sw-grid-2">
            <Field label="Display Name" fullWidth value={draft.displayName} onChange={(v) => updateDraft('displayName', v)} />
            <Field label="Billing Name" value={draft.billingName} onChange={(v) => updateDraft('billingName', v)} placeholder="Defaults to Display Name" />
            <Field label="Shipping Name" value={draft.shippingName} onChange={(v) => updateDraft('shippingName', v)} placeholder="Defaults to Billing Name" />
            <Field label="State" value={draft.state} onChange={(v) => updateDraft('state', v)} />
            <Field label="State Code" value={draft.stateCode} onChange={(v) => updateDraft('stateCode', v)} placeholder="e.g. 36" />
            <Field label="GSTIN" value={draft.gstin} onChange={(v) => updateDraft('gstin', v)} />
            <div className="sw-field sw-col-2">
              <label className="sw-label">Address (one line per row)</label>
              <textarea
                className="sw-input"
                rows={3}
                value={draft.addressLines}
                onChange={(e) => updateDraft('addressLines', e.target.value)}
              />
            </div>
          </div>
          {formError && <span className="sw-field__error">{formError}</span>}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button type="button" className="sw-btn sw-btn--primary" onClick={handleSave}>
              {mode === 'edit' ? 'Save Changes' : 'Save Customer'}
            </button>
            <button type="button" className="sw-btn" onClick={handleCancel}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
