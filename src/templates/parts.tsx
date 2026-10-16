import type { ReactNode } from 'react';
import type { CustomerMaster } from '../types';
import { sellerProfile } from '../data/seller';

/**
 * Shared building blocks for the print templates.
 * Each component owns one section of the A4 document so individual
 * templates can compose them without duplicating structure or styles.
 */

export function PrintEmptyPreview() {
  return <div className="pt-empty">Select a customer to preview</div>;
}

interface TitleBarProps {
  title: string;
  /** Right-aligned copy label (e.g. "Original For Recipent" or "Original For Recipent  01/03"). */
  copy?: string;
  /** Optional centred subtitle row underneath the title (DC uses this for "( Returnable / Non Returnable )"). */
  subtitle?: ReactNode;
}

export function PrintTitleBar({ title, copy, subtitle }: TitleBarProps) {
  return (
    <>
      <div className="pt-title-bar">
        <div className="pt-title-bar__title">{title}</div>
        {copy && <div className="pt-title-bar__copy">{copy}</div>}
      </div>
      {subtitle && <div className="pt-title-bar__sub">{subtitle}</div>}
    </>
  );
}

/** Full-width letterhead banner. logo.png contains logo + name + address + contact baked-in. */
export function PrintLetterhead() {
  return (
    <div className="pt-letterhead">
      <img src="/logo.png" alt="SAMS Engineering" className="pt-letterhead__img" />
    </div>
  );
}

/** Seller GSTIN | PAN strip below the letterhead. */
export function PrintTaxStrip() {
  return (
    <div className="pt-tax-strip">
      <div className="pt-tax-strip__cell">GSTIN NUMBER : {sellerProfile.gstin}</div>
      <div className="pt-tax-strip__cell pt-tax-strip__cell--right">PAN NO : {sellerProfile.pan}</div>
    </div>
  );
}

interface CustomerAddressesProps {
  customer: CustomerMaster;
  billingHeading?: string;
  shippingHeading?: string;
}

export function PrintCustomerAddresses({
  customer,
  billingHeading = 'BILLING ADDRESS:',
  shippingHeading = 'GOODS SHIPPED ADDRESS:',
}: CustomerAddressesProps) {
  const shippingLines = customer.shippingAddressLines || customer.addressLines;
  const shippingName = customer.shippingName || customer.billingName;
  return (
    <>
      <div className="pt-address">
        <div className="pt-address__heading">{billingHeading}</div>
        <div className="pt-address__name">{customer.billingName}</div>
        {customer.addressLines.map((line, i) => (
          <div key={i} className="pt-address__line">{line}</div>
        ))}
        <div className="pt-address__row">
          <span>GSTIN NUMBER : {customer.gstin}</span>
          <span>STATE CODE : {customer.stateCode}</span>
        </div>
      </div>
      <div className="pt-address">
        <div className="pt-address__heading">{shippingHeading}</div>
        <div className="pt-address__name">{shippingName}</div>
        {shippingLines.map((line, i) => (
          <div key={i} className="pt-address__line">{line}</div>
        ))}
        <div className="pt-address__row">
          <span>GSTIN NUMBER : {customer.gstin}</span>
          <span>STATE CODE : {customer.stateCode}</span>
        </div>
      </div>
    </>
  );
}

/**
 * Right-hand meta column of the info block (invoice no., dates, refs…), as a
 * real 4-column table: Label | Value | "Date :" | Date Value. Rows without a
 * date span the value across the last three columns. Children are the
 * `PrintKv*` row components below.
 */
export function PrintKvTable({ children }: { children: ReactNode }) {
  return (
    <div className="pt-info__meta">
      <table className="pt-kv-table">
        <colgroup>
          <col style={{ width: '34%' }} />
          <col style={{ width: '20%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '34%' }} />
        </colgroup>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

interface KvRowProps {
  label: string;
  value: ReactNode;
  /** `grow` makes this row absorb any spare height so the column lines up with the address column. */
  variant?: 'default' | 'grow';
}

/** Two-cell row: label | value (value spans the date columns). */
export function PrintKvRow({ label, value, variant = 'default' }: KvRowProps) {
  return (
    <tr className={variant === 'grow' ? 'pt-kv-table__grow' : undefined}>
      <th scope="row" className="pt-kv-table__label">{label}</th>
      <td className="pt-kv-table__value" colSpan={3}>{value}</td>
    </tr>
  );
}

interface KvRowWithDateProps {
  label: string;
  value: ReactNode;
  dateLabel?: string;
  dateValue: ReactNode;
}

/** Four-cell row: Label | Value | "Date :" | Date Value (matches the right meta column in samples). */
export function PrintKvRowWithDate({ label, value, dateLabel = 'Date :', dateValue }: KvRowWithDateProps) {
  return (
    <tr>
      <th scope="row" className="pt-kv-table__label">{label}</th>
      <td className="pt-kv-table__value">{value}</td>
      <th scope="row" className="pt-kv-table__label">{dateLabel}</th>
      <td className="pt-kv-table__date">{dateValue}</td>
    </tr>
  );
}

/** Full-width section heading inside the meta table (e.g. "TERMS & CONDITIONS:"). */
export function PrintKvDivider({ children }: { children: ReactNode }) {
  return (
    <tr className="pt-kv-table__divider">
      <td colSpan={4}>{children}</td>
    </tr>
  );
}

/** Full-width small italic note row (LUT number, SEZ note). */
export function PrintKvNote({ children }: { children: ReactNode }) {
  return (
    <tr className="pt-kv-table__note">
      <td colSpan={4}>{children}</td>
    </tr>
  );
}

/* ─────────────────────────────────────────────────────────────
   Items table totals — full-width rows that sit inside <tbody>
───────────────────────────────────────────────────────────── */

interface TotalRowProps {
  label: string;
  /** Number of leading description-area columns to merge into the label cell (excludes percent + amount). */
  labelSpan: number;
  /** Number of empty filler cells between the label and the percent/amount cells. */
  fillerSpan?: number;
  /** Optional percent cell; when undefined the cell is rendered empty. */
  percent?: ReactNode;
  /** Right-aligned amount value. */
  amount?: ReactNode;
  variant?: 'default' | 'grand';
}

export function PrintTotalRow({
  label, labelSpan, fillerSpan = 0, percent, amount, variant = 'default',
}: TotalRowProps) {
  const trCls = variant === 'grand' ? 'pt-items__total pt-items__total--grand' : 'pt-items__total';
  return (
    <tr className={trCls}>
      <td colSpan={labelSpan} className="pt-items__total-label">{label}</td>
      {Array.from({ length: fillerSpan }).map((_, i) => <td key={i} />)}
      <td className="pt-items__total-percent">{percent ?? ''}</td>
      <td className="pt-items__total-amount">{amount ?? ''}</td>
    </tr>
  );
}

/** Amount-in-words row immediately below the items table. */
export function PrintWordsRow({ words }: { words: string }) {
  return (
    <table className="pt-words">
      <tbody>
        <tr>
          <th scope="row" className="pt-words__label">Amount in words</th>
          <td className="pt-words__value">{words}</td>
        </tr>
      </tbody>
    </table>
  );
}

/* ─────────────────────────────────────────────────────────────
   Bank + signature footer (Invoice + Proforma)
───────────────────────────────────────────────────────────── */

export function PrintBankBlock() {
  return (
    <table className="pt-bank">
      <tbody>
        <BankRow label="NAME OF THE BANK" value={sellerProfile.bankName} />
        <BankRow label="ACCOUNT NUMBER" value={sellerProfile.accountNumber} />
        <BankRow label="IFSC CODE" value={sellerProfile.ifsc} />
        <BankRow label="BRANCH" value={sellerProfile.branch} />
      </tbody>
    </table>
  );
}

function BankRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <th scope="row" className="pt-bank__key">{label}</th>
      <td className="pt-bank__val">{value}</td>
    </tr>
  );
}

export function PrintSignatureBlock() {
  return (
    <div className="pt-sign">
      <div className="pt-sign__top">For {sellerProfile.companyName}</div>
      <div className="pt-sign__bottom">Authorised Signature</div>
    </div>
  );
}

interface DeclarationProps {
  /** When omitted, only the computer-copy note is shown. */
  declaration?: string;
  note: string;
}

export function PrintDeclaration({ declaration, note }: DeclarationProps) {
  return (
    <>
      {declaration && (
        <div className="pt-decl">
          <span className="pt-decl__label">DECLARATION : </span>
          {declaration}
        </div>
      )}
      <div className={declaration ? 'pt-decl-note' : 'pt-decl'}>{note}</div>
    </>
  );
}
