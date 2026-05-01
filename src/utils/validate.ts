import type {
  DeliveryChallanDocument,
  InvoiceDocument,
  LineItem,
  ProformaDocument,
} from '../types';

export type ValidationErrors = Record<string, string>;

const required = (value: string | undefined | null) =>
  typeof value === 'string' && value.trim().length > 0;

const validatePricedItem = (item: LineItem, index: number): ValidationErrors => {
  const e: ValidationErrors = {};
  if (!required(item.description)) e[`lineItems[${index}].description`] = 'Description required';
  if (!(Number(item.qty) > 0)) e[`lineItems[${index}].qty`] = 'Qty must be > 0';
  if (!(Number(item.rate) > 0)) e[`lineItems[${index}].rate`] = 'Rate must be > 0';
  return e;
};

const validateChallanItem = (item: LineItem, index: number): ValidationErrors => {
  const e: ValidationErrors = {};
  if (!required(item.description)) e[`lineItems[${index}].description`] = 'Description required';
  if (!(Number(item.qty) > 0)) e[`lineItems[${index}].qty`] = 'Qty must be > 0';
  return e;
};

export function validateInvoice(doc: InvoiceDocument): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!required(doc.customerId)) errors.customerId = 'Select a customer';
  if (!required(doc.invoiceNo)) errors.invoiceNo = 'Invoice No required';
  if (!required(doc.date)) errors.date = 'Date required';
  if (doc.lineItems.length === 0) errors.lineItems = 'Add at least one line item';
  doc.lineItems.forEach((item, i) => Object.assign(errors, validatePricedItem(item, i)));
  if (doc.taxMode === 'SEZ_ZERO_OR_SPECIAL' && !required(doc.sezNote)) {
    errors.sezNote = 'SEZ note is required when SEZ / zero-rated is selected';
  }
  return errors;
}

export function validateProforma(doc: ProformaDocument): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!required(doc.customerId)) errors.customerId = 'Select a customer';
  if (!required(doc.quotationNo)) errors.quotationNo = 'Quotation No required';
  if (!required(doc.date)) errors.date = 'Date required';
  if (doc.lineItems.length === 0) errors.lineItems = 'Add at least one line item';
  doc.lineItems.forEach((item, i) => Object.assign(errors, validatePricedItem(item, i)));
  return errors;
}

export function validateDeliveryChallan(doc: DeliveryChallanDocument): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!required(doc.customerId)) errors.customerId = 'Select a customer';
  if (!required(doc.dcNo)) errors.dcNo = 'DC No required';
  if (!required(doc.date)) errors.date = 'Date required';
  const items = doc.groupedLineItems.filter((i) => i.type === 'item') as Array<{ type: 'item' } & LineItem>;
  if (items.length === 0) errors.groupedLineItems = 'Add at least one line item';
  items.forEach((item, i) => Object.assign(errors, validateChallanItem(item, i)));
  return errors;
}

export const hasErrors = (errors: ValidationErrors): boolean =>
  Object.keys(errors).length > 0;
