import { useEffect } from 'react';
import { CustomerSelector } from '../components/CustomerSelector';
import { LineItemsEditor } from '../components/LineItemsEditor';
import { DocumentFormShell } from '../components/DocumentFormShell';
import { Field, TextareaField } from '../components/Field';
import { TaxSummaryCard } from '../components/TaxSummaryCard';
import { ProformaPrintTemplate } from '../templates/ProformaPrintTemplate';
import { useDocumentForm } from '../hooks/useDocumentForm';
import { calculateTaxes } from '../utils/tax';
import { amountToWords } from '../utils/amountToWords';
import { usePdfExport } from '../hooks/usePdfExport';
import { useNextDocNumber } from '../hooks/useNextDocNumber';
import { validateProforma, hasErrors } from '../utils/validate';
import type { ProformaDocument } from '../types';

const initialProforma: ProformaDocument = {
  id: '', type: 'proforma', customerId: '', quotationNo: '',
  date: new Date().toISOString().split('T')[0],
  yourRefNo: '', yourRefDate: '', contactPersonDetails: '',
  termsConditions: '', deliveryPeriod: '', paymentTerms: '',
  validity: '', descriptionSummary: '', lineItems: [],
  basicAmount: 0, cgstPercent: 0, sgstPercent: 0, igstPercent: 0,
  cgstAmount: 0, sgstAmount: 0, igstAmount: 0,
  totalTaxAmount: 0, transportationAmount: 'EXTRA',
  grandTotal: 0, amountInWords: '',
};

const inr = (n: number) => `₹ ${n.toFixed(2)}`;

export function CreateProforma() {
  const { formData, setFormData, updateField, selectedCustomer, handleCustomerSelect, resetForm } =
    useDocumentForm<ProformaDocument>(initialProforma, { persistKey: 'sams.draft.proforma' });
  const { handlePrint, handleDownloadPdf, handleShareWhatsApp } = usePdfExport();
  const { peekNext, commitIfMatches } = useNextDocNumber('proforma');

  const proformaFilename = () => {
    const base = formData.quotationNo?.trim() || 'SAMS-PROFORMA-draft';
    return base.startsWith('SAMS-PROFORMA') ? base : `SAMS-PROFORMA-${base}`;
  };

  useEffect(() => {
    if (!formData.quotationNo) updateField('quotationNo', peekNext());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedCustomer) return;
    updateField('customerId', selectedCustomer.id);
    const taxRes = calculateTaxes(selectedCustomer.stateCode, formData.lineItems);
    setFormData((prev) => ({
      ...prev,
      ...taxRes,
      totalTaxAmount: taxRes.taxAmount,
      amountInWords: amountToWords(taxRes.grandTotal),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.lineItems, selectedCustomer]);

  const errors = validateProforma(formData);
  const errorCount = Object.keys(errors).length;
  const disabledReason = hasErrors(errors)
    ? `Cannot generate document — ${errorCount} field${errorCount > 1 ? 's' : ''} need${errorCount === 1 ? 's' : ''} attention`
    : undefined;

  const taxRows = [
    { label: 'Basic Amount', value: inr(formData.basicAmount) },
    ...(formData.igstAmount > 0
      ? [{ label: 'IGST', value: inr(formData.igstAmount) }]
      : [
          { label: 'CGST', value: inr(formData.cgstAmount) },
          { label: 'SGST', value: inr(formData.sgstAmount) },
        ]),
    { label: 'Total Tax', value: inr(formData.totalTaxAmount) },
  ];

  return (
    <DocumentFormShell
      title="Proforma Invoice"
      subtitle="New Document"
      onPrint={handlePrint}
      onDownloadPdf={async () => {
        await handleDownloadPdf({ filename: proformaFilename() });
        commitIfMatches(formData.quotationNo);
      }}
      onShareWhatsApp={selectedCustomer ? async () => {
        await handleDownloadPdf({ filename: proformaFilename() });
        commitIfMatches(formData.quotationNo);
        handleShareWhatsApp(
          `Proforma Invoice ${formData.quotationNo} for ${selectedCustomer.billingName} — ` +
          `Grand Total ${inr(formData.grandTotal)}.\n` +
          `The PDF just downloaded to your device — please attach it to this chat.`,
        );
      } : undefined}
      onReset={resetForm}
      disabledReason={disabledReason}
      preview={<ProformaPrintTemplate data={formData} customer={selectedCustomer} />}
    >
      <CustomerSelector
        selectedId={formData.customerId}
        onSelect={handleCustomerSelect}
        error={errors.customerId}
      />

      <div className="sw-section">
        <div className="sw-section-heading">Document References</div>
        <div className="sw-grid-2">
          <Field label="Quotation No" value={formData.quotationNo} onChange={(v) => updateField('quotationNo', v)} error={errors.quotationNo} />
          <Field label="Date" type="date" value={formData.date} onChange={(v) => updateField('date', v)} error={errors.date} />
          <Field label="Your Ref No" value={formData.yourRefNo} onChange={(v) => updateField('yourRefNo', v)} />
          <Field label="Your Ref Date" type="date" value={formData.yourRefDate} onChange={(v) => updateField('yourRefDate', v)} />
          <Field
            label="Contact Person Details"
            fullWidth
            value={formData.contactPersonDetails}
            onChange={(v) => updateField('contactPersonDetails', v)}
            placeholder="Name, designation, phone…"
          />
        </div>
      </div>

      <div className="sw-section">
        <div className="sw-section-heading">Terms &amp; Conditions</div>
        <div className="sw-grid-2">
          <TextareaField
            label="Terms &amp; Conditions"
            fullWidth
            rows={3}
            value={formData.termsConditions}
            onChange={(v) => updateField('termsConditions', v)}
            placeholder="e.g. Goods once sold will not be taken back…"
          />
          <Field label="Delivery Period" value={formData.deliveryPeriod} onChange={(v) => updateField('deliveryPeriod', v)} />
          <Field label="Payment Terms" value={formData.paymentTerms} onChange={(v) => updateField('paymentTerms', v)} />
          <Field label="Validity" value={formData.validity} onChange={(v) => updateField('validity', v)} />
          <Field label="Transportation Amount" value={formData.transportationAmount} onChange={(v) => updateField('transportationAmount', v)} />
          <Field
            label="Description Summary"
            fullWidth
            value={formData.descriptionSummary}
            onChange={(v) => updateField('descriptionSummary', v)}
            placeholder="Brief summary of goods / services…"
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
