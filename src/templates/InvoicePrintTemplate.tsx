import type { InvoiceDocument, CustomerMaster } from '../types';
import { sellerProfile } from '../data/seller';
import { formatDate } from '../utils/formatDate';
import {
  PrintBankBlock,
  PrintCustomerAddresses,
  PrintDeclaration,
  PrintEmptyPreview,
  PrintKvDivider,
  PrintKvNote,
  PrintKvRow,
  PrintKvRowWithDate,
  PrintLetterhead,
  PrintSignatureBlock,
  PrintTaxStrip,
  PrintTitleBar,
  PrintTotalRow,
  PrintWordsRow,
} from './parts';

interface Props {
  data: InvoiceDocument;
  customer: CustomerMaster | null;
}

const COLS = 8; // SL, Part, Desc, HSN, QTY, UNIT, RATE, Amount
const LABEL_SPAN = 6; // labels span SL..UNIT, leaving RATE for percent and Amount for value

const fmt = (n: number) => n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const pct = (n: number) => `${n}%`;

export function InvoicePrintTemplate({ data, customer }: Props) {
  if (!customer) return <PrintEmptyPreview />;

  const transport = data.transportRegNo
    ? `${data.transportMode} / ${data.transportRegNo}`
    : data.transportMode;

  const isSez = data.taxMode === 'SEZ_ZERO_OR_SPECIAL';
  const isIgst = data.taxMode === 'IGST';
  const isCgstSgst = data.taxMode === 'CGST_SGST';

  return (
    <div className="pt-doc">
      <div className="pt-frame">
        <PrintTitleBar title="TAX INVOICE" copy="Original For Recipent" />
        <PrintLetterhead />
        <PrintTaxStrip />

        <div className="pt-info">
          <div className="pt-info__addresses">
            <PrintCustomerAddresses customer={customer} />
          </div>
          <div className="pt-info__meta">
            <PrintKvRowWithDate
              label="Invoice No."
              value={data.invoiceNo}
              dateValue={formatDate(data.date)}
            />
            <PrintKvRowWithDate
              label="DC No."
              value={data.dcNo}
              dateValue={formatDate(data.dcDate)}
            />
            <PrintKvRowWithDate
              label="Our Ref. No."
              value={data.ourRefNo}
              dateValue={formatDate(data.ourRefDate)}
            />
            <PrintKvRow label="Transport Mode :" value={transport} />
            <PrintKvRow label="E- Challan Number :" value={data.eChallanNumber} />
            <PrintKvRow label="Date of Dispatch :" value={formatDate(data.dateOfDispatch)} />
            <PrintKvRowWithDate
              label="P.O. No. :"
              value={data.poNo}
              dateValue={formatDate(data.poDate)}
            />
            <PrintKvDivider>Remarks : {data.remarks}</PrintKvDivider>
            {data.lutNo && <PrintKvNote>LUT NO : {data.lutNo}</PrintKvNote>}
            {isSez && data.sezNote && <PrintKvNote>{data.sezNote}</PrintKvNote>}
          </div>
        </div>

        <table className="pt-items">
          <thead>
            <tr>
              <th style={{ width: '7%' }}>SL.NO.</th>
              <th style={{ width: '13%' }}>Part/ Item No</th>
              <th style={{ width: '38%' }}>Description</th>
              <th style={{ width: '10%' }}>HSN/SAC<br />CODE</th>
              <th style={{ width: '6%' }}>QTY</th>
              <th style={{ width: '6%' }}>UNIT</th>
              <th style={{ width: '10%' }}>RATE</th>
              <th style={{ width: '10%' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.lineItems.map((item, i) => (
              <tr key={i}>
                <td>{item.slNo}</td>
                <td>{item.partNo}</td>
                <td className="pt-items__desc">
                  {item.description}
                  {item.extraDescription && (
                    <span className="pt-items__desc-extra pt-items__desc-extra--right">
                      {item.extraDescription}
                    </span>
                  )}
                </td>
                <td>{item.hsnSacCode}</td>
                <td>{String(item.qty).padStart(2, '0')}</td>
                <td>{item.unit}</td>
                <td>{fmt(Number(item.rate))}</td>
                <td className="pt-items__amount">{fmt(Number(item.amount))}</td>
              </tr>
            ))}
            <tr className="pt-items__filler">
              {Array.from({ length: COLS }).map((_, i) => (
                <td key={i} style={{ height: '40mm' }} />
              ))}
            </tr>

            <PrintTotalRow
              label="BASIC AMOUNT"
              labelSpan={LABEL_SPAN}
              amount={fmt(data.basicAmount)}
            />
            {(isCgstSgst || isSez) && (
              <PrintTotalRow
                label={isSez ? 'ADD CGST ( NON SET OFF )' : 'ADD CGST'}
                labelSpan={LABEL_SPAN}
                percent={pct(data.cgstPercent)}
                amount={fmt(data.cgstAmount)}
              />
            )}
            {(isCgstSgst || isSez) && (
              <PrintTotalRow
                label="ADD SGST"
                labelSpan={LABEL_SPAN}
                percent={pct(data.sgstPercent)}
                amount={fmt(data.sgstAmount)}
              />
            )}
            {(isIgst || isSez) && (
              <PrintTotalRow
                label="ADD IGST"
                labelSpan={LABEL_SPAN}
                percent={isIgst ? pct(data.igstPercent) : undefined}
                amount={isIgst ? fmt(data.igstAmount) : undefined}
              />
            )}
            <PrintTotalRow
              label="TAX AMOUNT"
              labelSpan={LABEL_SPAN}
              amount={fmt(data.taxAmount)}
            />
            <PrintTotalRow
              label="GRAND TOTAL AMOUNT"
              labelSpan={LABEL_SPAN}
              amount={fmt(data.grandTotal)}
              variant="grand"
            />
          </tbody>
        </table>

        <PrintWordsRow words={`${data.amountInWords}`} />

        <div className="pt-footer">
          <PrintBankBlock />
          <PrintSignatureBlock />
        </div>

        <PrintDeclaration
          declaration={sellerProfile.defaultFooterNotes.invoiceDeclaration}
          note={sellerProfile.defaultFooterNotes.computerCopyInvoice}
        />
      </div>
    </div>
  );
}
