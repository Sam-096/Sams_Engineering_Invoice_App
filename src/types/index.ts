export type DocumentType = 'invoice' | 'proforma' | 'deliveryChallan';

export interface Address {
  lines: string[];
}

export interface CustomerMaster {
  id: string;
  displayName: string;
  billingName: string;
  shippingName: string;
  addressLines: string[];
  shippingAddressLines?: string[];
  state: string;
  stateCode: string;
  gstin: string;
  tags: string[];
}

export interface SellerProfile {
  companyName: string;
  gstin: string;
  pan: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  branch: string;
  defaultFooterNotes: {
    invoiceDeclaration: string;
    computerCopyInvoice: string;
    computerCopyProforma: string;
  };
}

export interface LineItem {
  slNo: number;
  partNo: string;
  description: string;
  hsnSacCode: string;
  qty: number;
  unit: string;
  rate: number;
  amount: number;
  extraDescription?: string;
  remarks?: string;
}

export interface InvoiceDocument {
  id: string;
  type: 'invoice';
  customerId: string;
  invoiceNo: string;
  date: string;
  dcNo: string;
  dcDate: string;
  ourRefNo: string;
  ourRefDate: string;
  transportMode: string;
  transportRegNo: string;
  eChallanNumber: string;
  dateOfDispatch: string;
  poNo: string;
  poDate: string;
  remarks: string;
  lutNo: string;
  lineItems: LineItem[];
  /** UI intent. `AUTO` derives from state codes; the others force a specific mode. */
  taxModeOverride: 'AUTO' | 'CGST_SGST' | 'IGST' | 'SEZ_ZERO_OR_SPECIAL';
  /** Computed mode actually applied to this invoice. */
  taxMode: 'CGST_SGST' | 'IGST' | 'SEZ_ZERO_OR_SPECIAL';
  cgstPercent: number;
  sgstPercent: number;
  igstPercent: number;
  basicAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  taxAmount: number;
  grandTotal: number;
  amountInWords: string;
  sezNote?: string;
}

export interface ProformaDocument {
  id: string;
  type: 'proforma';
  customerId: string;
  quotationNo: string;
  date: string;
  yourRefNo: string;
  yourRefDate: string;
  contactPersonDetails: string;
  termsConditions: string;
  deliveryPeriod: string;
  paymentTerms: string;
  validity: string;
  descriptionSummary: string;
  lineItems: LineItem[];
  basicAmount: number;
  cgstPercent: number;
  sgstPercent: number;
  igstPercent: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTaxAmount: number;
  transportationAmount: string | number;
  grandTotal: number;
  amountInWords: string;
}

export type DeliveryChallanGroupedItem = 
  | { type: 'group'; label: string }
  | ({ type: 'item' } & LineItem);

export interface DeliveryChallanDocument {
  id: string;
  type: 'deliveryChallan';
  challanType: 'Returnable' | 'Non Returnable';
  dcNo: string;
  date: string;
  yourRefNo: string;
  yourRefDate: string;
  transportRegNo: string;
  eWayBillNumber: string;
  dateOfDispatch: string;
  remarks: string;
  poNo: string;
  contactNo: string;
  customerId: string;
  groupedLineItems: DeliveryChallanGroupedItem[];
}
