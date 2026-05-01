import type { DeliveryChallanGroupedItem, LineItem } from '../types';
import { masters } from '../data/masters';
import { Plus, Trash2, Copy, FolderPlus, ChevronUp, ChevronDown } from 'lucide-react';

interface Props {
  items: DeliveryChallanGroupedItem[];
  onChange: (items: DeliveryChallanGroupedItem[]) => void;
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

const renumber = (items: DeliveryChallanGroupedItem[]): DeliveryChallanGroupedItem[] => {
  let n = 0;
  return items.map((entry) => {
    if (entry.type === 'group') return entry;
    n += 1;
    return { ...entry, slNo: n };
  });
};

export function GroupedLineItemsEditor({ items, onChange, error }: Props) {
  const addItem = () => onChange(renumber([...items, { type: 'item', ...blankItem(0) }]));

  const addGroup = () => onChange([...items, { type: 'group', label: 'New Group' }]);

  const updateEntry = (index: number, next: DeliveryChallanGroupedItem) => {
    const copy = [...items];
    copy[index] = next;
    onChange(renumber(copy));
  };

  const removeEntry = (index: number) => {
    onChange(renumber(items.filter((_, i) => i !== index)));
  };

  const duplicateEntry = (index: number) => {
    const entry = items[index];
    const copy = [...items];
    copy.splice(index + 1, 0, { ...entry });
    onChange(renumber(copy));
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const copy = [...items];
    [copy[index], copy[target]] = [copy[target], copy[index]];
    onChange(renumber(copy));
  };

  return (
    <div className="line-items">
      <div className="sw-section-heading">Line Items &amp; Groups</div>
      {error && <div className="sw-field__error" style={{ marginBottom: 12 }}>{error}</div>}

      {items.map((entry, index) => entry.type === 'group' ? (
        <GroupCard
          key={`g-${index}`}
          label={entry.label}
          canMoveUp={index > 0}
          canMoveDown={index < items.length - 1}
          onChangeLabel={(label) => updateEntry(index, { type: 'group', label })}
          onRemove={() => removeEntry(index)}
          onMoveUp={() => move(index, -1)}
          onMoveDown={() => move(index, 1)}
        />
      ) : (
        <ChallanItemCard
          key={`i-${index}`}
          item={entry}
          canMoveUp={index > 0}
          canMoveDown={index < items.length - 1}
          onUpdate={(field, value) => {
            const updated = { ...entry, [field]: value };
            if (field === 'qty' || field === 'rate') {
              updated.amount = Number(updated.qty) * Number(updated.rate);
            }
            updateEntry(index, updated);
          }}
          onRemove={() => removeEntry(index)}
          onDuplicate={() => duplicateEntry(index)}
          onMoveUp={() => move(index, -1)}
          onMoveDown={() => move(index, 1)}
        />
      ))}

      <div className="line-items__actions">
        <button type="button" onClick={addGroup} className="add-item-btn">
          <FolderPlus size={14} />
          Add Group Heading
        </button>
        <button type="button" onClick={addItem} className="add-item-btn">
          <Plus size={14} />
          Add Line Item
        </button>
      </div>
    </div>
  );
}

interface GroupCardProps {
  label: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onChangeLabel: (label: string) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function GroupCard({ label, canMoveUp, canMoveDown, onChangeLabel, onRemove, onMoveUp, onMoveDown }: GroupCardProps) {
  return (
    <div className="line-item-card line-item-card--group">
      <div className="line-item-card__header">
        <span className="line-item-card__index">Group</span>
        <div className="line-item-card__actions">
          <button type="button" onClick={onMoveUp} disabled={!canMoveUp} className="sw-btn-icon" title="Move up">
            <ChevronUp size={14} />
          </button>
          <button type="button" onClick={onMoveDown} disabled={!canMoveDown} className="sw-btn-icon" title="Move down">
            <ChevronDown size={14} />
          </button>
          <button type="button" onClick={onRemove} className="sw-btn-icon sw-btn-icon--danger" title="Remove">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="line-item-card__body">
        <div className="sw-field">
          <label className="sw-label">Group Heading</label>
          <input
            type="text"
            className="sw-input"
            value={label}
            onChange={(e) => onChangeLabel(e.target.value)}
            placeholder="e.g. EX-1200"
          />
        </div>
      </div>
    </div>
  );
}

interface ChallanItemCardProps {
  item: LineItem;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onUpdate: (field: keyof LineItem, value: string | number) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function ChallanItemCard({
  item, canMoveUp, canMoveDown, onUpdate, onRemove, onDuplicate, onMoveUp, onMoveDown,
}: ChallanItemCardProps) {
  return (
    <div className="line-item-card">
      <div className="line-item-card__header">
        <span className="line-item-card__index">Item {item.slNo}</span>
        <div className="line-item-card__actions">
          <button type="button" onClick={onMoveUp} disabled={!canMoveUp} className="sw-btn-icon" title="Move up">
            <ChevronUp size={14} />
          </button>
          <button type="button" onClick={onMoveDown} disabled={!canMoveDown} className="sw-btn-icon" title="Move down">
            <ChevronDown size={14} />
          </button>
          <button type="button" onClick={onDuplicate} className="sw-btn-icon" title="Duplicate">
            <Copy size={14} />
          </button>
          <button type="button" onClick={onRemove} className="sw-btn-icon sw-btn-icon--danger" title="Remove">
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
      </div>
    </div>
  );
}
