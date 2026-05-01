import { useEffect } from 'react';
import { CustomerSelector } from '../components/CustomerSelector';
import { GroupedLineItemsEditor } from '../components/GroupedLineItemsEditor';
import { DocumentFormShell } from '../components/DocumentFormShell';
import { Field, SelectField } from '../components/Field';
import { DeliveryChallanPrintTemplate } from '../templates/DeliveryChallanPrintTemplate';
import { useDocumentForm } from '../hooks/useDocumentForm';
import { usePdfExport } from '../hooks/usePdfExport';
import { useNextDocNumber } from '../hooks/useNextDocNumber';
import { validateDeliveryChallan, hasErrors } from '../utils/validate';
import type { DeliveryChallanDocument } from '../types';

type ChallanType = DeliveryChallanDocument['challanType'];

const initialChallan: DeliveryChallanDocument = {
  id: '', type: 'deliveryChallan', challanType: 'Non Returnable',
  customerId: '', dcNo: '',
  date: new Date().toISOString().split('T')[0],
  yourRefNo: '', yourRefDate: '', transportRegNo: '',
  eWayBillNumber: '', dateOfDispatch: '', remarks: '',
  poNo: '', contactNo: '', groupedLineItems: [],
};

const challanTypeOptions: ReadonlyArray<{ value: ChallanType; label: string }> = [
  { value: 'Non Returnable', label: 'Non Returnable' },
  { value: 'Returnable', label: 'Returnable' },
];

export function CreateDeliveryChallan() {
  const { formData, updateField, selectedCustomer, handleCustomerSelect, resetForm } =
    useDocumentForm<DeliveryChallanDocument>(initialChallan, { persistKey: 'sams.draft.deliveryChallan' });
  const { handlePrint, handleDownloadPdf } = usePdfExport();
  const { peekNext, commitIfMatches } = useNextDocNumber('deliveryChallan');

  useEffect(() => {
    if (!formData.dcNo) updateField('dcNo', peekNext());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedCustomer) updateField('customerId', selectedCustomer.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCustomer]);

  const errors = validateDeliveryChallan(formData);
  const errorCount = Object.keys(errors).length;
  const disabledReason = hasErrors(errors)
    ? `Cannot generate document — ${errorCount} field${errorCount > 1 ? 's' : ''} need${errorCount === 1 ? 's' : ''} attention`
    : undefined;

  return (
    <DocumentFormShell
      title="Delivery Challan"
      subtitle="New Document"
      onPrint={handlePrint}
      onDownloadPdf={async () => {
        const base = formData.dcNo?.trim() || 'SAMS-DC-draft';
        const filename = base.startsWith('SAMS-DC') ? base : `SAMS-DC-${base}`;
        await handleDownloadPdf({ filename });
        commitIfMatches(formData.dcNo);
      }}
      onReset={resetForm}
      disabledReason={disabledReason}
      preview={<DeliveryChallanPrintTemplate data={formData} customer={selectedCustomer} />}
    >
      <CustomerSelector
        selectedId={formData.customerId}
        onSelect={handleCustomerSelect}
        error={errors.customerId}
      />

      <div className="sw-section">
        <div className="sw-section-heading">Challan Details</div>
        <div className="sw-grid-2">
          <SelectField<ChallanType>
            label="Challan Type"
            htmlFor="challan-type"
            value={formData.challanType}
            onChange={(v) => updateField('challanType', v)}
            options={challanTypeOptions}
          />
          <Field label="DC No" value={formData.dcNo} onChange={(v) => updateField('dcNo', v)} error={errors.dcNo} />
          <Field label="Date" type="date" value={formData.date} onChange={(v) => updateField('date', v)} error={errors.date} />
          <Field label="Your Ref No" value={formData.yourRefNo} onChange={(v) => updateField('yourRefNo', v)} />
          <Field label="Your Ref Date" type="date" value={formData.yourRefDate} onChange={(v) => updateField('yourRefDate', v)} />
          <Field label="PO No" value={formData.poNo} onChange={(v) => updateField('poNo', v)} />
        </div>
      </div>

      <div className="sw-section">
        <div className="sw-section-heading">Dispatch Details</div>
        <div className="sw-grid-2">
          <Field label="Transport / Vehicle Reg No" value={formData.transportRegNo} onChange={(v) => updateField('transportRegNo', v)} />
          <Field label="E-Way Bill Number" value={formData.eWayBillNumber} onChange={(v) => updateField('eWayBillNumber', v)} />
          <Field label="Date of Dispatch" type="date" value={formData.dateOfDispatch} onChange={(v) => updateField('dateOfDispatch', v)} />
          <Field label="Contact No" value={formData.contactNo} onChange={(v) => updateField('contactNo', v)} />
          <Field label="Remarks" fullWidth value={formData.remarks} onChange={(v) => updateField('remarks', v)} />
        </div>
      </div>

      <GroupedLineItemsEditor
        items={formData.groupedLineItems}
        onChange={(items) => updateField('groupedLineItems', items)}
        error={errors.groupedLineItems}
      />
    </DocumentFormShell>
  );
}
