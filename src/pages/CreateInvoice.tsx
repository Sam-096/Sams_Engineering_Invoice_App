import { useEffect } from 'react';
import { CustomerSelector } from '../components/CustomerSelector';
import { LineItemsEditor } from '../components/LineItemsEditor';
import { DocumentFormShell } from '../components/DocumentFormShell';
import { Field, SelectField, TextareaField } from '../components/Field';
import { TaxSummaryCard } from '../components/TaxSummaryCard';
import { InvoicePrintTemplate } from '../templates/InvoicePrintTemplate';
import { useDocumentForm } from '../hooks/useDocumentForm';
import { calculateTaxes } from '../utils/tax';
import { amountToWords } from '../utils/amountToWords';
import { usePdfExport } from '../hooks/usePdfExport';
import { useNextDocNumber } from '../hooks/useNextDocNumber';
import { validateInvoice, hasErrors } from '../utils/validate';
import { taxRules } from '../data/taxRules';
import type { InvoiceDocument } from '../types';

type TaxMode = InvoiceDocument['taxMode'];
type TaxModeOverride = InvoiceDocument['taxModeOverride'];

const initialInvoice: InvoiceDocument = {
  id: '', type: 'invoice', customerId: '', invoiceNo: '',
  date: new Date().toISOString().split('T')[0],
  dcNo: '', dcDate: '', ourRefNo: '', ourRefDate: '',
  transportMode: 'BY ROAD', transportRegNo: '',
  eChallanNumber: '', dateOfDispatch: '', poNo: '', poDate: '',
  remarks: '', lutNo: '',
  lineItems: [], taxModeOverride: 'AUTO', taxMode: 'CGST_SGST',
  cgstPercent: 0, sgstPercent: 0, igstPercent: 0,
  basicAmount: 0, cgstAmount: 0, sgstAmount: 0, igstAmount: 0,
  taxAmount: 0, grandTotal: 0, amountInWords: '', sezNote: '',
};

const taxModeLabel: Record<TaxMode, string> = {
  CGST_SGST: 'CGST + SGST (Intra-state)',
  IGST: 'IGST (Inter-state)',
  SEZ_ZERO_OR_SPECIAL: 'SEZ / Special',
};

const taxModeOptions: ReadonlyArray<{ value: TaxModeOverride; label: string }> = [
  { value: 'AUTO', label: 'Auto (from customer state)' },
  { value: 'CGST_SGST', label: 'Force CGST + SGST (Intra-state)' },
  { value: 'IGST', label: 'Force IGST (Inter-state)' },
  { value: 'SEZ_ZERO_OR_SPECIAL', label: 'SEZ / Zero-rated' },
];

const inr = (n: number) => `₹ ${n.toFixed(2)}`;

export function CreateInvoice() {
  const { formData, setFormData, updateField, selectedCustomer, handleCustomerSelect, resetForm } =
    useDocumentForm<InvoiceDocument>(initialInvoice, { persistKey: 'sams.draft.invoice' });
  const { handlePrint, handleDownloadPdf, handleShareWhatsApp } = usePdfExport();
  const { peekNext, commitIfMatches } = useNextDocNumber('invoice');

  const invoiceFilename = () => {
    const base = formData.invoiceNo?.trim() || 'SAMS-INVOICE-draft';
    return base.startsWith('SAMS-INVOICE') ? base : `${base}`;
  };

  // Prefill the next sequential invoice number on a fresh form.
  useEffect(() => {
    if (!formData.invoiceNo) updateField('invoiceNo', peekNext());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedCustomer) return;
    const override = formData.taxModeOverride === 'AUTO' ? undefined : formData.taxModeOverride;
    const taxRes = calculateTaxes(selectedCustomer.stateCode, formData.lineItems, override);
    setFormData((prev) => ({
      ...prev,
      customerId: selectedCustomer.id,
      ...taxRes,
      amountInWords: amountToWords(taxRes.grandTotal),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.lineItems, formData.taxModeOverride, selectedCustomer]);

  const isSez = formData.taxMode === 'SEZ_ZERO_OR_SPECIAL';
  const errors = validateInvoice(formData);
  const errorCount = Object.keys(errors).length;
  const disabledReason = hasErrors(errors)
    ? `Cannot generate document — ${errorCount} field${errorCount > 1 ? 's' : ''} need${errorCount === 1 ? 's' : ''} attention`
    : undefined;

  const taxRows = [
    { label: 'Tax Mode', value: taxModeLabel[formData.taxMode] },
    { label: 'Basic Amount', value: inr(formData.basicAmount) },
    ...(formData.taxMode === 'CGST_SGST'
      ? [
          { label: 'CGST', value: inr(formData.cgstAmount) },
          { label: 'SGST', value: inr(formData.sgstAmount) },
        ]
      : formData.taxMode === 'IGST'
      ? [{ label: 'IGST', value: inr(formData.igstAmount) }]
      : []),
    { label: 'Tax Amount', value: inr(formData.taxAmount) },
  ];

  return (
    <DocumentFormShell
      title="Tax Invoice"
      subtitle="New Document"
      onPrint={handlePrint}
      onDownloadPdf={async () => {
        await handleDownloadPdf({ filename: invoiceFilename() });
        commitIfMatches(formData.invoiceNo);
      }}
      onShareWhatsApp={selectedCustomer ? async () => {
        await handleDownloadPdf({ filename: invoiceFilename() });
        commitIfMatches(formData.invoiceNo);
        handleShareWhatsApp(
          `Invoice ${formData.invoiceNo} for ${selectedCustomer.billingName} — ` +
          `Grand Total ${inr(formData.grandTotal)}.\n` +
          `The PDF just downloaded to your device — please attach it to this chat.`,
        );
      } : undefined}
      onReset={resetForm}
      disabledReason={disabledReason}
      preview={<InvoicePrintTemplate data={formData} customer={selectedCustomer} />}
    >
      <CustomerSelector
        selectedId={formData.customerId}
        onSelect={handleCustomerSelect}
        error={errors.customerId}
      />

      <div className="sw-section">
        <div className="sw-section-heading">Document References</div>
        <div className="sw-grid-2">
          <Field label="Invoice No" value={formData.invoiceNo} onChange={(v) => updateField('invoiceNo', v)} error={errors.invoiceNo} />
          <Field label="Date" type="date" value={formData.date} onChange={(v) => updateField('date', v)} error={errors.date} />
          <Field label="DC No" value={formData.dcNo} onChange={(v) => updateField('dcNo', v)} />
          <Field label="DC Date" type="date" value={formData.dcDate} onChange={(v) => updateField('dcDate', v)} />
          <Field label="Our Ref No" value={formData.ourRefNo} onChange={(v) => updateField('ourRefNo', v)} />
          <Field label="Our Ref Date" type="date" value={formData.ourRefDate} onChange={(v) => updateField('ourRefDate', v)} />
          <Field label="PO No" value={formData.poNo} onChange={(v) => updateField('poNo', v)} />
          <Field label="PO Date" type="date" value={formData.poDate} onChange={(v) => updateField('poDate', v)} />
        </div>
      </div>

      <div className="sw-section">
        <div className="sw-section-heading">Dispatch Details</div>
        <div className="sw-grid-2">
          <Field label="Transport Mode" value={formData.transportMode} onChange={(v) => updateField('transportMode', v)} />
          <Field label="Vehicle / Reg No" value={formData.transportRegNo} onChange={(v) => updateField('transportRegNo', v)} />
          <Field label="E-Challan Number" value={formData.eChallanNumber} onChange={(v) => updateField('eChallanNumber', v)} />
          <Field label="Date of Dispatch" type="date" value={formData.dateOfDispatch} onChange={(v) => updateField('dateOfDispatch', v)} />
        </div>
      </div>

      <div className="sw-section">
        <div className="sw-section-heading">Tax Treatment</div>
        <div className="sw-grid-2">
          <SelectField<TaxModeOverride>
            label="Tax Mode"
            value={formData.taxModeOverride}
            onChange={(v) => updateField('taxModeOverride', v)}
            options={taxModeOptions}
          />
          <Field label="LUT No (Optional)" value={formData.lutNo} onChange={(v) => updateField('lutNo', v)} />
          {isSez && (
            <TextareaField
              label="SEZ Note (printed on invoice)"
              fullWidth
              rows={2}
              value={formData.sezNote ?? ''}
              onChange={(v) => updateField('sezNote', v)}
              placeholder={taxRules.logic.sez.sampleLutText}
              error={errors.sezNote}
            />
          )}
          <Field
            label="Remarks"
            fullWidth={!isSez}
            value={formData.remarks}
            onChange={(v) => updateField('remarks', v)}
          />
        </div>
      </div>

      <LineItemsEditor
        items={formData.lineItems}
        onChange={(items) => updateField('lineItems', items)}
        error={errors.lineItems}
      />

      {selectedCustomer && (
        <TaxSummaryCard
          rows={taxRows}
          total={{ label: 'Grand Total', value: inr(formData.grandTotal) }}
        />
      )}
    </DocumentFormShell>
  );
}
