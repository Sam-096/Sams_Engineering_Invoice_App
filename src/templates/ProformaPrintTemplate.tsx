import type { ProformaDocument, CustomerMaster } from '../types';
import { sellerProfile } from '../data/seller';
import { formatDate } from '../utils/formatDate';
import {
  PrintBankBlock,
  PrintCustomerAddresses,
  PrintDeclaration,
  PrintEmptyPreview,
  PrintKvDivider,
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
  data: ProformaDocument;
  customer: CustomerMaster | null;
}

const COLS = 8;
const LABEL_SPAN = 6;

const fmt = (n: number) => n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const pct = (n: number) => `${n}%`;

export function ProformaPrintTemplate({ data, customer }: Props) {
  if (!customer) return <PrintEmptyPreview />;

  const useIgst = data.igstPercent > 0;

  return (
    <div className="pt-doc">
      <div className="pt-frame">
        <PrintTitleBar title="PROFORMA INVOICE" />
        <PrintLetterhead />
        <PrintTaxStrip />

        <div className="pt-info">
          <div className="pt-info__addresses">
            <PrintCustomerAddresses customer={customer} shippingHeading="GOODS SHIPPING ADDRESS:" />
          </div>
          <div className="pt-info__meta">
            <PrintKvRowWithDate
              label="QTN.NO"
              value={data.quotationNo}
              dateValue={formatDate(data.date)}
            />
            <PrintKvRowWithDate
              label="YOUR REF. No."
              value={data.yourRefNo}
              dateValue={formatDate(data.yourRefDate)}
            />
            <PrintKvRow label="CONTACT PERSON DETAILS" value={data.contactPersonDetails} />
            <PrintKvDivider>TERMS &amp; CONDITIONS:</PrintKvDivider>
            <PrintKvRow label="DELIVERY PERIOD" value={data.deliveryPeriod} />
            <PrintKvRow label="PAYMENT TERMS" value={data.paymentTerms} />
            <PrintKvRow label="VALIDITY" value={data.validity} />
            <PrintKvDivider>DESCRIPTION</PrintKvDivider>
            <PrintKvRow label="" value={<em>{data.descriptionSummary}</em>} variant="grow" />
          </div>
        </div>

        <table className="pt-items">
          <thead>
            <tr>
              <th style={{ width: '7%' }}>SL.NO.</th>
              <th style={{ width: '13%' }}>Part No</th>
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
                <td>{Number(item.qty).toFixed(2)}</td>
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
            <PrintTotalRow
              label="ADD CGST"
              labelSpan={LABEL_SPAN}
              percent={useIgst ? '-' : pct(data.cgstPercent)}
              amount={useIgst ? '-' : fmt(data.cgstAmount)}
            />
            <PrintTotalRow
              label="ADD SGST"
              labelSpan={LABEL_SPAN}
              percent={useIgst ? '-' : pct(data.sgstPercent)}
              amount={useIgst ? '-' : fmt(data.sgstAmount)}
            />
            <PrintTotalRow
              label="ADD IGST"
              labelSpan={LABEL_SPAN}
              percent={useIgst ? pct(data.igstPercent) : '-'}
              amount={useIgst ? fmt(data.igstAmount) : '-'}
            />
            <PrintTotalRow
              label="TOTAL TAX AMOUNT"
              labelSpan={LABEL_SPAN}
              amount={fmt(data.totalTaxAmount)}
            />
            <PrintTotalRow
              label="TRANSPORTATION AMOUNT"
              labelSpan={LABEL_SPAN}
              amount={String(data.transportationAmount)}
            />
            <PrintTotalRow
              label="GRAND TOTAL AMOUNT"
              labelSpan={LABEL_SPAN}
              amount={fmt(data.grandTotal)}
              variant="grand"
            />
          </tbody>
        </table>

        <PrintWordsRow words={data.amountInWords} />

        <div className="pt-footer">
          <PrintBankBlock />
          <PrintSignatureBlock />
        </div>

        <PrintDeclaration note={sellerProfile.defaultFooterNotes.computerCopyProforma} />
      </div>
    </div>
  );
}
