import type { LineItem } from '../types';
import { masters } from '../data/masters';
import { Plus, Trash2, Copy } from 'lucide-react';

interface Props {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
  /** When true, hide the rate/amount columns and surface a per-item Remarks input. */
  variant?: 'priced' | 'challan';
  error?: string;
}

const blankItem = (slNo: number): LineItem => ({
  slNo,
  partNo: '',
  description: '',
  hsnSacCode: '',
  qty: 1,
  unit: 'Nos',
  rate: 0,
  amount: 0,
  extraDescription: '',
  remarks: '',
});

export function LineItemsEditor({ items, onChange, variant = 'priced', error }: Props) {
  const addItem = () => onChange([...items, blankItem(items.length + 1)]);

  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    const next = items.map((item, i) => {
      if (i !== index) return item;
      const updated = { ...item, [field]: value };
      if (field === 'qty' || field === 'rate') {
        updated.amount = Number(updated.qty) * Number(updated.rate);
      }
      return updated;
    });
    onChange(next);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index).map((item, i) => ({ ...item, slNo: i + 1 })));
  };

  const duplicateItem = (index: number) => {
    onChange([...items, { ...items[index], slNo: items.length + 1 }]);
  };

  return (
    <div className="line-items">
      <div className="sw-section-heading">Line Items</div>
      {error && <div className="sw-field__error" style={{ marginBottom: 12 }}>{error}</div>}

      {items.map((item, index) => (
        <LineItemCard
          key={index}
          item={item}
          variant={variant}
          onUpdate={(field, value) => updateItem(index, field, value)}
          onRemove={() => removeItem(index)}
          onDuplicate={() => duplicateItem(index)}
        />
      ))}

      <button type="button" onClick={addItem} className="add-item-btn">
        <Plus size={14} />
        Add Line Item
      </button>
    </div>
  );
}

interface CardProps {
  item: LineItem;
  variant: 'priced' | 'challan';
  onUpdate: (field: keyof LineItem, value: string | number) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

function LineItemCard({ item, variant, onUpdate, onRemove, onDuplicate }: CardProps) {
  return (
    <div className="line-item-card">
      <div className="line-item-card__header">
        <span className="line-item-card__index">Item {item.slNo}</span>
        <div className="line-item-card__actions">
          <button type="button" onClick={onDuplicate} className="sw-btn-icon" title="Duplicate">
            <Copy size={14} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="sw-btn-icon sw-btn-icon--danger"
            title="Remove"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="line-item-card__body">
        <div className="sw-field">
          <label className="sw-label">Description</label>
          <textarea
            className="sw-input"
            value={item.description}
            onChange={(e) => onUpdate('description', e.target.value)}
            rows={2}
            placeholder="Part description…"
          />
        </div>

        <div className="sw-field">
          <label className="sw-label">Extra Description (optional)</label>
          <input
            type="text"
            className="sw-input"
            value={item.extraDescription ?? ''}
            onChange={(e) => onUpdate('extraDescription', e.target.value)}
            placeholder="As per drawing, with packing, etc."
          />
        </div>

        <div className="sw-grid-2">
          <div className="sw-field">
            <label className="sw-label">Part No</label>
            <input
              type="text"
              className="sw-input"
              value={item.partNo}
              onChange={(e) => onUpdate('partNo', e.target.value)}
              placeholder="PART-001"
            />
          </div>
          <div className="sw-field">
            <label className="sw-label">HSN / SAC</label>
            <input
              type="text"
              className="sw-input"
              value={item.hsnSacCode}
              onChange={(e) => onUpdate('hsnSacCode', e.target.value)}
              placeholder="8466"
            />
          </div>
        </div>

        {variant === 'priced' ? (
          <div className="sw-grid-4">
            <div className="sw-field">
              <label className="sw-label">Qty</label>
              <input
                type="number"
                className="sw-input"
                min="0"
                step="any"
                value={item.qty}
                onChange={(e) => onUpdate('qty', e.target.value)}
              />
            </div>
            <div className="sw-field">
              <label className="sw-label">Unit</label>
              <select
                className="sw-select"
                value={item.unit}
                onChange={(e) => onUpdate('unit', e.target.value)}
              >
                {masters.units.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div className="sw-field">
              <label className="sw-label">Rate (₹)</label>
              <input
                type="number"
                className="sw-input"
                min="0"
                step="any"
                value={item.rate}
                onChange={(e) => onUpdate('rate', e.target.value)}
              />
            </div>
            <div className="sw-field">
              <label className="sw-label">Amount</label>
              <div className="sw-input sw-input--readonly">₹{item.amount.toFixed(2)}</div>
            </div>
          </div>
        ) : (
          <>
            <div className="sw-grid-2">
              <div className="sw-field">
                <label className="sw-label">Qty</label>
                <input
                  type="number"
                  className="sw-input"
                  min="0"
                  step="any"
                  value={item.qty}
                  onChange={(e) => onUpdate('qty', e.target.value)}
                />
              </div>
              <div className="sw-field">
                <label className="sw-label">Unit</label>
                <select
                  className="sw-select"
                  value={item.unit}
                  onChange={(e) => onUpdate('unit', e.target.value)}
                >
                  {masters.units.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="sw-field">
              <label className="sw-label">Remarks (optional)</label>
              <input
                type="text"
                className="sw-input"
                value={item.remarks ?? ''}
                onChange={(e) => onUpdate('remarks', e.target.value)}
                placeholder="—"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
