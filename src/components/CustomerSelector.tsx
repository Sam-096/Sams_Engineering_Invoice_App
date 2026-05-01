import { customers } from '../data/customers';

interface Props {
  selectedId: string;
  onSelect: (id: string) => void;
  error?: string;
}

export function CustomerSelector({ selectedId, onSelect, error }: Props) {
  return (
    <div className="customer-selector sw-field">
      <label className="sw-label" htmlFor="customer-select">Customer</label>
      <select
        id="customer-select"
        className={`sw-select${error ? ' sw-input--error' : ''}`}
        value={selectedId}
        onChange={(e) => onSelect(e.target.value)}
      >
        <option value="">— Select a customer —</option>
        {customers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.displayName}
          </option>
        ))}
      </select>
      {error && <span className="sw-field__error">{error}</span>}
    </div>
  );
}
