import type { Workbook, Worksheet, Cell, Borders } from 'exceljs';
import type {
  CustomerMaster,
  DeliveryChallanDocument,
  InvoiceDocument,
  ProformaDocument,
} from '../types';
import { sellerProfile } from '../data/seller';
import { formatDate } from './formatDate';

/**
 * Editable Excel (.xlsx) export for Invoice / Proforma / Delivery Challan.
 *
 * Mirrors the A4 print layout (letterhead, info block, items table, totals,
 * bank + signature footer) but keeps the numbers live: line amounts are
 * `QTY × RATE`, BASIC AMOUNT is a `SUM`, tax rows are `BASIC × %`, so editing
 * a quantity or rate in Excel recalculates the bill. Amount-in-words is
 * static text (Excel has no built-in rupee-words function) — update it by
 * hand if totals are changed.
 *
 * `exceljs` is loaded lazily so it never weighs on the initial page load.
 */

const THIN = { style: 'thin' as const, color: { argb: 'FF000000' } };
const MEDIUM = { style: 'medium' as const, color: { argb: 'FF000000' } };
const ALL_THIN: Partial<Borders> = { top: THIN, left: THIN, bottom: THIN, right: THIN };
const NUM = '#,##0.00';
const PCT = '0"%"';
const GREY = 'FFE6E6E6';
const RED = 'FFC0392B';

/* ─── public API ──────────────────────────────────────────────── */

export async function exportInvoiceXlsx(data: InvoiceDocument, customer: CustomerMaster, filename: string) {
  const { wb, b } = await setup('Tax Invoice', 8, [6, 13, 38, 11, 7, 7, 12, 14]);

  b.titleRow('TAX INVOICE', 'Original For Recipent');
  await b.letterhead();
  b.taxStrip();

  const transport = data.transportRegNo ? `${data.transportMode} / ${data.transportRegNo}` : data.transportMode;
  const meta: MetaRow[] = [
    { label: 'Invoice No.', value: data.invoiceNo, date: formatDate(data.date) },
    { label: 'DC No.', value: data.dcNo, date: formatDate(data.dcDate) },
    { label: 'Our Ref. No.', value: data.ourRefNo, date: formatDate(data.ourRefDate) },
    { label: 'Transport Mode :', value: transport },
    { label: 'E- Challan Number :', value: data.eChallanNumber },
    { label: 'Date of Dispatch :', value: formatDate(data.dateOfDispatch) },
    { label: 'P.O. No. :', value: data.poNo, date: formatDate(data.poDate) },
    { divider: `Remarks : ${data.remarks}` },
  ];
  if (data.lutNo) meta.push({ divider: `LUT NO : ${data.lutNo}` });
  if (data.taxMode === 'SEZ_ZERO_OR_SPECIAL' && data.sezNote) meta.push({ divider: data.sezNote });
  b.infoBlock(customer, meta, 'BILLING ADDRESS:', 'GOODS SHIPPED ADDRESS:');

  const { first, last } = b.itemsTable(
    ['SL.NO.', 'Part/ Item No', 'Description', 'HSN/SAC\nCODE', 'QTY', 'UNIT', 'RATE', 'Amount'],
    data.lineItems.map((it) => [
      it.slNo, it.partNo, descText(it.description, it.extraDescription), it.hsnSacCode,
      Number(it.qty), it.unit, Number(it.rate), null,
    ]),
  );

  const isSez = data.taxMode === 'SEZ_ZERO_OR_SPECIAL';
  const isIgst = data.taxMode === 'IGST';
  const isCgstSgst = data.taxMode === 'CGST_SGST';
  const basic = b.totalRow('BASIC AMOUNT', null, sumFormula(first, last));
  const taxCells: string[] = [];
  if (isCgstSgst || isSez) {
    taxCells.push(b.totalRow(isSez ? 'ADD CGST ( NON SET OFF )' : 'ADD CGST', data.cgstPercent, pctOf(basic)));
    taxCells.push(b.totalRow('ADD SGST', data.sgstPercent, pctOf(basic)));
  }
  if (isIgst || isSez) {
    taxCells.push(b.totalRow('ADD IGST', isIgst ? data.igstPercent : null, isIgst ? pctOf(basic) : null));
  }
  const tax = b.totalRow('TAX AMOUNT', null, taxCells.length ? `ROUND(${taxCells.join('+')},2)` : '0');
  b.totalRow('GRAND TOTAL AMOUNT', null, `ROUND(${basic}+${tax},2)`, true);

  b.wordsRow(data.amountInWords);
  b.bankAndSignature();
  b.textRow(`DECLARATION : ${sellerProfile.defaultFooterNotes.invoiceDeclaration}`, { size: 9 });
  b.textRow(sellerProfile.defaultFooterNotes.computerCopyInvoice, { italic: true, size: 9 });
  b.closeFrame();

  await save(wb, filename);
}

export async function exportProformaXlsx(data: ProformaDocument, customer: CustomerMaster, filename: string) {
  const { wb, b } = await setup('Proforma Invoice', 8, [6, 13, 38, 11, 7, 7, 12, 14]);

  b.titleRow('PROFORMA INVOICE');
  await b.letterhead();
  b.taxStrip();

  b.infoBlock(customer, [
    { label: 'QTN.NO', value: data.quotationNo, date: formatDate(data.date) },
    { label: 'YOUR REF. No.', value: data.yourRefNo, date: formatDate(data.yourRefDate) },
    { label: 'CONTACT PERSON DETAILS', value: data.contactPersonDetails },
    { divider: 'TERMS & CONDITIONS:' },
    { label: 'DELIVERY PERIOD', value: data.deliveryPeriod },
    { label: 'PAYMENT TERMS', value: data.paymentTerms },
    { label: 'VALIDITY', value: data.validity },
    { divider: 'DESCRIPTION' },
    { label: '', value: data.descriptionSummary },
  ], 'BILLING ADDRESS:', 'GOODS SHIPPING ADDRESS:');

  const { first, last } = b.itemsTable(
    ['SL.NO.', 'Part No', 'Description', 'HSN/SAC\nCODE', 'QTY', 'UNIT', 'RATE', 'Amount'],
    data.lineItems.map((it) => [
      it.slNo, it.partNo, descText(it.description, it.extraDescription), it.hsnSacCode,
      Number(it.qty), it.unit, Number(it.rate), null,
    ]),
  );

  const useIgst = data.igstPercent > 0;
  const basic = b.totalRow('BASIC AMOUNT', null, sumFormula(first, last));
  const cgst = b.totalRow('ADD CGST', useIgst ? '-' : data.cgstPercent, useIgst ? '-' : pctOf(basic));
  const sgst = b.totalRow('ADD SGST', useIgst ? '-' : data.sgstPercent, useIgst ? '-' : pctOf(basic));
  const igst = b.totalRow('ADD IGST', useIgst ? data.igstPercent : '-', useIgst ? pctOf(basic) : '-');
  const tax = b.totalRow('TOTAL TAX AMOUNT', null, useIgst ? `ROUND(${igst},2)` : `ROUND(${cgst}+${sgst},2)`);
  b.totalRow('TRANSPORTATION AMOUNT', null, String(data.transportationAmount ?? ''), false, true);
  b.totalRow('GRAND TOTAL AMOUNT', null, `ROUND(${basic}+${tax},2)`, true);

  b.wordsRow(data.amountInWords);
  b.bankAndSignature();
  b.textRow(sellerProfile.defaultFooterNotes.computerCopyProforma, { size: 9 });
  b.closeFrame();

  await save(wb, filename);
}

export async function exportDeliveryChallanXlsx(
  data: DeliveryChallanDocument,
  customer: CustomerMaster,
  filename: string,
) {
  const { wb, b } = await setup('Delivery Challan', 7, [6, 13, 46, 8, 8, 12, 12]);

  b.titleRow('DELIVERY CHALLAN', 'Original For Recipent');
  b.textRow(
    data.challanType === 'Returnable' ? '( Returnable )' : '( Non Returnable )',
    { italic: true, bold: true },
  );
  await b.letterhead();
  b.taxStrip();

  b.infoBlock(customer, [
    { label: 'D.C. No', value: data.dcNo, date: formatDate(data.date) },
    { label: 'YOUR REF.NO', value: data.yourRefNo, date: formatDate(data.yourRefDate) },
    { label: 'Transport Reg.No :', value: data.transportRegNo },
    { label: 'E-Way Bill Number :', value: data.eWayBillNumber },
    { label: 'Date of Dispatch :', value: formatDate(data.dateOfDispatch) },
    { divider: `Remarks : ${data.remarks || '-'}` },
    { label: 'P.O No :', value: data.poNo },
  ], 'Billing Address :', 'Shipping Address:');

  b.itemsTable(
    ['SL.NO.', 'Part No', 'Description', 'QTY', 'UNIT', 'HSN / SAC\nCODE', 'REMARKS'],
    data.groupedLineItems.map((it) =>
      it.type === 'group'
        ? { group: it.label }
        : [it.slNo, it.partNo, descText(it.description, it.extraDescription), it.qty, it.unit, it.hsnSacCode, it.remarks ?? ''],
    ),
    { amountFormula: false },
  );

  b.dcFooter(data.contactNo);
  b.closeFrame();

  await save(wb, filename);
}

/* ─── sheet builder ───────────────────────────────────────────── */

type MetaRow =
  | { label: string; value: string; date?: string; divider?: undefined }
  | { divider: string; label?: undefined; value?: undefined; date?: undefined };

type ItemRow = Array<string | number | null> | { group: string };

async function setup(sheetName: string, cols: number, widths: number[]) {
  const { default: ExcelJS } = await import('exceljs');
  const wb = new ExcelJS.Workbook();
  wb.creator = sellerProfile.companyName;
  wb.created = new Date();
  const ws = wb.addWorksheet(sheetName, {
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.25, right: 0.25, top: 0.3, bottom: 0.3, header: 0, footer: 0 },
    },
    views: [{ showGridLines: false }],
  });
  ws.columns = widths.map((width) => ({ width }));
  ws.properties.defaultRowHeight = 16;
  return { wb, ws, b: new SheetBuilder(wb, ws, cols) };
}

class SheetBuilder {
  private row = 1;
  private frameTop = 1;
  private readonly wb: Workbook;
  private readonly ws: Worksheet;
  private readonly cols: number;

  constructor(wb: Workbook, ws: Worksheet, cols: number) {
    this.wb = wb;
    this.ws = ws;
    this.cols = cols;
  }

  /** Column letter for a 1-based index. */
  private L(c: number) {
    return String.fromCharCode(64 + c);
  }

  private merge(r1: number, c1: number, r2: number, c2: number) {
    if (r1 !== r2 || c1 !== c2) this.ws.mergeCells(r1, c1, r2, c2);
    return this.ws.getCell(r1, c1);
  }

  /** Thin border around every cell in the rectangle (merged ranges included). */
  private box(r1: number, c1: number, r2: number, c2: number) {
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        const cell = this.ws.getCell(r, c);
        cell.border = {
          ...cell.border,
          ...(r === r1 ? { top: THIN } : {}),
          ...(r === r2 ? { bottom: THIN } : {}),
          ...(c === c1 ? { left: THIN } : {}),
          ...(c === c2 ? { right: THIN } : {}),
        };
      }
    }
  }

  private style(cell: Cell, opts: { bold?: boolean; italic?: boolean; size?: number; align?: 'left' | 'center' | 'right'; color?: string; underline?: boolean } = {}) {
    cell.font = {
      name: 'Arial',
      size: opts.size ?? 10,
      bold: opts.bold,
      italic: opts.italic,
      underline: opts.underline,
      color: opts.color ? { argb: opts.color } : undefined,
    };
    cell.alignment = { vertical: 'middle', horizontal: opts.align ?? 'left', wrapText: true };
  }

  titleRow(title: string, copy?: string) {
    const r = this.row++;
    this.frameTop = r;
    const titleEnd = copy ? this.cols - 2 : this.cols;
    const cell = this.merge(r, 1, r, titleEnd);
    cell.value = title;
    this.style(cell, { bold: true, italic: true, underline: true, size: 13, align: 'center' });
    if (copy) {
      const c = this.merge(r, titleEnd + 1, r, this.cols);
      c.value = copy;
      this.style(c, { bold: true, italic: true, size: 9, align: 'center' });
    }
    this.ws.getRow(r).height = 22;
    this.box(r, 1, r, this.cols);
  }

  async letterhead() {
    const r = this.row++;
    this.merge(r, 1, r, this.cols);
    const img = await loadLogo();
    if (img) {
      // Column widths are in characters (~7px each at the default font).
      const widthPx = (this.ws.columns ?? []).reduce((s, c) => s + (c.width ?? 8) * 7, 0);
      const heightPx = Math.round(widthPx * (img.height / img.width));
      this.ws.getRow(r).height = heightPx * 0.75; // px → points
      const id = this.wb.addImage({ buffer: img.buffer, extension: 'png' });
      this.ws.addImage(id, { tl: { col: 0, row: r - 1 }, ext: { width: widthPx, height: heightPx } });
    } else {
      const cell = this.ws.getCell(r, 1);
      cell.value = sellerProfile.companyName;
      this.style(cell, { bold: true, size: 18, align: 'center' });
      this.ws.getRow(r).height = 30;
    }
    this.box(r, 1, r, this.cols);
  }

  taxStrip() {
    const r = this.row++;
    const mid = Math.floor(this.cols / 2);
    const left = this.merge(r, 1, r, mid);
    left.value = `GSTIN NUMBER : ${sellerProfile.gstin}`;
    this.style(left, { bold: true, italic: true, color: RED, size: 11 });
    const right = this.merge(r, mid + 1, r, this.cols);
    right.value = `PAN NO : ${sellerProfile.pan}`;
    this.style(right, { bold: true, italic: true, color: RED, size: 11, align: 'right' });
    this.box(r, 1, r, this.cols);
  }

  infoBlock(customer: CustomerMaster, meta: MetaRow[], billingHeading: string, shippingHeading: string) {
    const top = this.row;
    const n = Math.max(meta.length, 4);
    const half = Math.ceil(n / 2);
    const mid = this.cols === 8 ? 4 : 3; // address columns end here
    const lc = mid + 1; // meta label column

    // Right: meta key/value rows.
    meta.forEach((m, i) => {
      const r = top + i;
      if (m.divider !== undefined) {
        const cell = this.merge(r, lc, r, this.cols);
        cell.value = m.divider;
        this.style(cell, { bold: true, italic: true, underline: true });
      } else if (m.date !== undefined && this.cols - lc >= 3) {
        const label = this.ws.getCell(r, lc);
        label.value = m.label;
        this.style(label, { bold: true });
        const valEnd = this.cols - 2;
        const val = this.merge(r, lc + 1, r, valEnd);
        val.value = m.value;
        this.style(val, { bold: true, align: 'center' });
        const dl = this.ws.getCell(r, valEnd + 1);
        dl.value = 'Date :';
        this.style(dl, { bold: true });
        const dv = this.ws.getCell(r, this.cols);
        dv.value = m.date;
        this.style(dv, { align: 'center' });
        this.box(r, lc, r, lc);
        this.box(r, lc + 1, r, valEnd);
        this.box(r, valEnd + 1, r, valEnd + 1);
      } else {
        const label = this.ws.getCell(r, lc);
        label.value = m.label;
        this.style(label, { bold: true });
        const val = this.merge(r, lc + 1, r, this.cols);
        val.value = m.value ?? '';
        this.style(val, { bold: true, align: 'center' });
        this.box(r, lc, r, lc);
      }
      this.box(r, lc, r, this.cols);
      this.ws.getRow(r).height = 18;
    });
    for (let i = meta.length; i < n; i++) this.box(top + i, lc, top + i, this.cols);

    // Left: billing (top half) + shipping (bottom half) address blocks.
    const addr = (heading: string, name: string, lines: string[]) =>
      [heading, name, ...lines, `GSTIN NUMBER : ${customer.gstin}     STATE CODE : ${customer.stateCode}`].join('\n');
    const billing = this.merge(top, 1, top + half - 1, mid);
    billing.value = addr(billingHeading, customer.billingName, customer.addressLines);
    this.style(billing, { size: 9.5 });
    billing.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
    this.box(top, 1, top + half - 1, mid);

    const shipping = this.merge(top + half, 1, top + n - 1, mid);
    shipping.value = addr(
      shippingHeading,
      customer.shippingName || customer.billingName,
      customer.shippingAddressLines || customer.addressLines,
    );
    this.style(shipping, { size: 9.5 });
    shipping.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
    this.box(top + half, 1, top + n - 1, mid);

    // Give the merged address blocks enough height for their text.
    const needLines = Math.max(
      customer.addressLines.length + 3,
      (customer.shippingAddressLines || customer.addressLines).length + 3,
    );
    const perRow = Math.max(18, Math.ceil((needLines * 13) / half));
    for (let i = 0; i < n; i++) this.ws.getRow(top + i).height = perRow;

    this.row = top + n;
  }

  /**
   * Header + item rows. When `amountFormula` is on, the last column is
   * `QTY × RATE` (columns 5 × 7) so edits in Excel recalculate.
   */
  itemsTable(headers: string[], rows: ItemRow[], { amountFormula = true } = {}) {
    const hr = this.row++;
    headers.forEach((h, i) => {
      const cell = this.ws.getCell(hr, i + 1);
      cell.value = h;
      this.style(cell, { bold: true, align: 'center' });
      cell.border = ALL_THIN;
    });
    this.ws.getRow(hr).height = 28;

    const first = this.row;
    rows.forEach((row) => {
      const r = this.row++;
      if (!Array.isArray(row)) {
        const cell = this.merge(r, 3, r, this.cols);
        cell.value = row.group;
        this.style(cell, { bold: true, underline: true });
      } else {
        row.forEach((v, i) => {
          const c = i + 1;
          const cell = this.ws.getCell(r, c);
          const isAmount = amountFormula && c === this.cols;
          if (isAmount) {
            cell.value = { formula: `ROUND(${this.L(5)}${r}*${this.L(7)}${r},2)` };
          } else {
            cell.value = v ?? '';
          }
          this.style(cell, { align: c === 3 ? 'left' : isAmount || (amountFormula && (c === 5 || c === 7)) ? 'right' : 'center', bold: isAmount });
          cell.alignment = { ...cell.alignment, vertical: 'top' };
          if (amountFormula && (c === 7 || isAmount)) cell.numFmt = NUM;
        });
        const desc = String(row[2] ?? '');
        const lines = desc.split('\n').reduce((s, l) => s + Math.max(1, Math.ceil(l.length / 42)), 0);
        this.ws.getRow(r).height = Math.max(18, lines * 13 + 4);
      }
    });
    // A few blank rows so the sheet has room to add items by hand — column
    // borders only, like the printed filler.
    const spare = Math.max(3, 12 - rows.length);
    for (let i = 0; i < spare; i++) {
      const r = this.row++;
      if (amountFormula) {
        const cell = this.ws.getCell(r, this.cols);
        cell.value = { formula: `IF(AND(${this.L(5)}${r}="",${this.L(7)}${r}=""),"",ROUND(${this.L(5)}${r}*${this.L(7)}${r},2))` };
        cell.numFmt = NUM;
        this.style(cell, { align: 'right', bold: true });
        this.ws.getCell(r, 7).numFmt = NUM;
      }
    }
    const last = this.row - 1;
    for (let r = first; r <= last; r++) {
      for (let c = 1; c <= this.cols; c++) {
        const cell = this.ws.getCell(r, c);
        cell.border = { ...cell.border, left: THIN, right: THIN };
      }
    }
    return { first, last };
  }

  /**
   * Full-width totals row: label over columns 1..6, percent in 7, amount in 8.
   * Returns the amount cell address for use in later formulas.
   */
  totalRow(label: string, percent: number | string | null, amount: string | null, grand = false, literal = false) {
    const r = this.row++;
    const lab = this.merge(r, 1, r, this.cols - 2);
    lab.value = label;
    this.style(lab, { bold: true, italic: true, size: 11, align: 'right' });

    const p = this.ws.getCell(r, this.cols - 1);
    p.value = percent ?? '';
    if (typeof percent === 'number') p.numFmt = PCT;
    this.style(p, { bold: true, align: 'center' });

    const a = this.ws.getCell(r, this.cols);
    if (amount === null || amount === '-' || literal) {
      a.value = amount === null ? '' : amount;
    } else {
      a.value = { formula: amount.replace('{PCT}', `${this.L(this.cols - 1)}${r}`) };
      a.numFmt = NUM;
    }
    this.style(a, { bold: true, align: 'right' });

    this.box(r, 1, r, this.cols - 2);
    this.box(r, this.cols - 1, r, this.cols - 1);
    this.box(r, this.cols, r, this.cols);
    if (grand) {
      for (let c = 1; c <= this.cols; c++) {
        this.ws.getCell(r, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREY } };
      }
    }
    this.ws.getRow(r).height = 18;
    return `${this.L(this.cols)}${r}`;
  }

  wordsRow(words: string) {
    const r = this.row++;
    const lab = this.merge(r, 1, r, 2);
    lab.value = 'Amount in words';
    this.style(lab, { bold: true });
    const val = this.merge(r, 3, r, this.cols);
    val.value = words;
    this.style(val, { bold: true, italic: true });
    this.box(r, 1, r, 2);
    this.box(r, 3, r, this.cols);
    this.ws.getRow(r).height = 22;
  }

  bankAndSignature() {
    const top = this.row;
    const rows: Array<[string, string]> = [
      ['NAME OF THE BANK', sellerProfile.bankName],
      ['ACCOUNT NUMBER', sellerProfile.accountNumber],
      ['IFSC CODE', sellerProfile.ifsc],
      ['BRANCH', sellerProfile.branch],
    ];
    rows.forEach(([k, v], i) => {
      const r = top + i;
      const key = this.merge(r, 1, r, 2);
      key.value = k;
      this.style(key, { bold: true });
      const val = this.merge(r, 3, r, 4);
      val.value = v;
      this.style(val, { bold: true });
      this.box(r, 1, r, 2);
      this.box(r, 3, r, 4);
      this.ws.getRow(r).height = 18;
    });
    const signTop = this.merge(top, 5, top + 1, this.cols);
    signTop.value = `For ${sellerProfile.companyName}`;
    this.style(signTop, { bold: true, italic: true, size: 11, align: 'center' });
    signTop.alignment = { ...signTop.alignment, vertical: 'top' };
    const signBottom = this.merge(top + 2, 5, top + 3, this.cols);
    signBottom.value = 'Authorised Signature';
    this.style(signBottom, { italic: true, align: 'center' });
    signBottom.alignment = { ...signBottom.alignment, vertical: 'bottom' };
    this.box(top, 5, top + 3, this.cols);
    this.row = top + rows.length;
  }

  dcFooter(contactNo: string) {
    const top = this.row;
    const bottom = top + 4;
    const recv = this.merge(top, 1, bottom, 3);
    recv.value = "Receiver's Name\n\n\n\nReceiver's Sign With Stamp";
    this.style(recv, { bold: true, italic: true });
    recv.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
    const contact = this.merge(top, 4, bottom, 5);
    contact.value = `Contact No : ${contactNo}`;
    this.style(contact, { bold: true, italic: true });
    contact.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
    const sign = this.merge(top, 6, bottom, this.cols);
    sign.value = `For ${sellerProfile.companyName}\n\n\n\nAuthorised Signature`;
    this.style(sign, { bold: true, italic: true, align: 'center' });
    sign.alignment = { vertical: 'top', horizontal: 'center', wrapText: true };
    this.box(top, 1, bottom, 3);
    this.box(top, 4, bottom, 5);
    this.box(top, 6, bottom, this.cols);
    for (let r = top; r <= bottom; r++) this.ws.getRow(r).height = 18;
    this.row = bottom + 1;
  }

  textRow(text: string, opts: { bold?: boolean; italic?: boolean; size?: number } = {}) {
    const r = this.row++;
    const cell = this.merge(r, 1, r, this.cols);
    cell.value = text;
    this.style(cell, { ...opts, align: 'center' });
    this.box(r, 1, r, this.cols);
    this.ws.getRow(r).height = Math.max(18, Math.ceil(text.length / 110) * 14 + 4);
  }

  /** Thick outer frame around everything, like the printed `.pt-frame`, and the print area. */
  closeFrame() {
    const top = this.frameTop;
    const bottom = this.row - 1;
    for (let c = 1; c <= this.cols; c++) {
      const t = this.ws.getCell(top, c);
      t.border = { ...t.border, top: MEDIUM };
      const b = this.ws.getCell(bottom, c);
      b.border = { ...b.border, bottom: MEDIUM };
    }
    for (let r = top; r <= bottom; r++) {
      const l = this.ws.getCell(r, 1);
      l.border = { ...l.border, left: MEDIUM };
      const rt = this.ws.getCell(r, this.cols);
      rt.border = { ...rt.border, right: MEDIUM };
    }
    this.ws.pageSetup.printArea = `A${top}:${this.L(this.cols)}${bottom}`;
  }
}

/* ─── helpers ─────────────────────────────────────────────────── */

const descText = (description: string, extra?: string) => (extra ? `${description}\n${extra}` : description);

const sumFormula = (first: number, last: number) => (last >= first ? `SUM(H${first}:H${last})` : '0');

/** Tax amount = BASIC × the percent cell on the same totals row (`{PCT}` is resolved by `totalRow`). */
const pctOf = (basicCell: string) => `ROUND(${basicCell}*{PCT}/100,2)`;

async function loadLogo(): Promise<{ buffer: ArrayBuffer; width: number; height: number } | null> {
  try {
    const res = await fetch('/logo.png');
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const bitmap = await createImageBitmap(new Blob([buffer], { type: 'image/png' }));
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return { buffer, ...size };
  } catch {
    return null;
  }
}

async function save(wb: Workbook, filename: string) {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
