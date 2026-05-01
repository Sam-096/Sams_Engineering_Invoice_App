interface Row {
  label: string;
  value: string;
}

interface Props {
  rows: Row[];
  total: { label: string; value: string };
}

/** Read-only summary card used by Invoice and Proforma forms. */
export function TaxSummaryCard({ rows, total }: Props) {
  return (
    <div className="tax-summary">
      <div className="tax-summary__header">Tax Summary</div>
      <div className="tax-summary__body">
        {rows.map(({ label, value }) => (
          <div key={label} className="tax-summary__row">
            <span className="tax-summary__key">{label}</span>
            <span className="tax-summary__val">{value}</span>
          </div>
        ))}
        <div className="tax-summary__row tax-summary__row--total">
          <span>{total.label}</span>
          <span>{total.value}</span>
        </div>
      </div>
    </div>
  );
}
