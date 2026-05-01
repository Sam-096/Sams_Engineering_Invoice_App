import { Link } from 'react-router-dom';

interface QuickAccessItem {
  label: string;
  desc: string;
  path: string;
}

const quickAccess: QuickAccessItem[] = [
  { label: 'Tax Invoice', desc: 'GST-compliant invoices with CGST/SGST or IGST', path: '/invoice' },
  { label: 'Proforma Invoice', desc: 'Quotation and proforma with terms and conditions', path: '/proforma' },
  { label: 'Delivery Challan', desc: 'Returnable or non-returnable goods dispatch', path: '/challan' },
];

export function Dashboard() {
  return (
    <div className="dashboard">
      <div className="dashboard__body">
        <span className="dashboard__badge">SAMS Engineering · Document System</span>

        <h1 className="dashboard__title">
          Engineering<br />Documents
        </h1>

        <p className="dashboard__subtitle">
          Generate print-ready Tax Invoices, Proforma Invoices, and Delivery Challans.
          Select a document type from the sidebar to begin.
        </p>

        <div className="dashboard__cards">
          {quickAccess.map((item) => (
            <Link key={item.path} to={item.path} className="dashboard__card">
              <span className="dashboard__card-text">
                <span className="dashboard__card-label">{item.label}</span>
                <span className="dashboard__card-desc">{item.desc}</span>
              </span>
              <span className="dashboard__card-arrow">→</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="dashboard__footer">
        Zero backend · Hardcoded master data · Print-ready A4 output
      </div>
    </div>
  );
}
