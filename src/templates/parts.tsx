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

interface KvRowProps {
  label: string;
  value: ReactNode;
  variant?: 'default' | 'tall' | 'grow';
}

/** Two-cell row: label | value. */
export function PrintKvRow({ label, value, variant = 'default' }: KvRowProps) {
  const cls = variant === 'tall' ? 'pt-kv pt-kv--tall'
    : variant === 'grow' ? 'pt-kv pt-kv--grow'
    : 'pt-kv';
  return (
    <div className={cls}>
      <div className="pt-kv__label">{label}</div>
      <div className="pt-kv__value">{value}</div>
    </div>
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
    <div className="pt-kv pt-kv--with-date">
      <div className="pt-kv__label">{label}</div>
      <div className="pt-kv__value">{value}</div>
      <div className="pt-kv__date-label">{dateLabel}</div>
      <div className="pt-kv__date-value">{dateValue}</div>
    </div>
  );
}

export function PrintKvDivider({ children }: { children: ReactNode }) {
  return <div className="pt-kv-divider">{children}</div>;
}

export function PrintKvNote({ children }: { children: ReactNode }) {
  return <div className="pt-kv-note">{children}</div>;
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
    <div className="pt-words">
      <div className="pt-words__label">Amount in words</div>
      <div className="pt-words__value">{words}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Bank + signature footer (Invoice + Proforma)
───────────────────────────────────────────────────────────── */

export function PrintBankBlock() {
  return (
    <div className="pt-bank">
      <BankRow label="NAME OF THE BANK" value={sellerProfile.bankName} />
      <BankRow label="ACCOUNT NUMBER" value={sellerProfile.accountNumber} />
      <BankRow label="IFSC CODE" value={sellerProfile.ifsc} />
      <BankRow label="BRANCH" value={sellerProfile.branch} />
    </div>
  );
}

function BankRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="pt-bank__row">
      <div className="pt-bank__key">{label}</div>
      <div className="pt-bank__val">{value}</div>
    </div>
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
