import type { ProformaDocument, CustomerMaster } from '../types';
import { sellerProfile } from '../data/seller';
import { formatDate } from '../utils/formatDate';
import { usePagedItems } from './usePagedItems';
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
  const { chromeRef, infoRef, theadRef, totalsRef, footerRef, rowRef, pages, fillerPx } =
    usePagedItems(data.lineItems.length, [
      data.lineItems, customer, data.igstPercent, data.transportationAmount,
      data.deliveryPeriod, data.paymentTerms, data.validity, data.descriptionSummary,
    ]);

  if (!customer) return <PrintEmptyPreview />;

  const useIgst = data.igstPercent > 0;
  const totalPages = pages.length;

  return (
    <>
      {pages.map((itemIdxs, pageIdx) => {
        const isFirst = pageIdx === 0;
        const isLast = pageIdx === totalPages - 1;

        return (
          <div className="pt-doc" key={pageIdx}>
            <div className="pt-frame">
              <div ref={isFirst ? chromeRef : undefined}>
                <PrintTitleBar
                  title="PROFORMA INVOICE"
                  copy={totalPages > 1 ? `${pageIdx + 1}/${totalPages}` : undefined}
                />
                <PrintLetterhead />
                <PrintTaxStrip />
              </div>

              {isFirst && (
                <div className="pt-info">
                  <div className="pt-info__addresses">
                    <PrintCustomerAddresses customer={customer} shippingHeading="GOODS SHIPPING ADDRESS:" />
                  </div>
                  <div className="pt-info__meta" ref={infoRef}>
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
              )}

              <table className="pt-items">
                <thead ref={isFirst ? theadRef : undefined}>
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
                  {itemIdxs.map((i) => {
                    const item = data.lineItems[i];
                    return (
                      <tr key={i} ref={rowRef(i)}>
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
                    );
                  })}
                  {isLast && fillerPx > 0 && (
                    <tr className="pt-items__filler">
                      {Array.from({ length: COLS }).map((_, i) => (
                        <td key={i} style={{ height: `${fillerPx}px` }} />
                      ))}
                    </tr>
                  )}
                </tbody>

                {isLast && (
                  <tbody ref={totalsRef}>
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
                )}
              </table>

              {isLast && (
                <div ref={footerRef}>
                  <PrintWordsRow words={data.amountInWords} />
                  <div className="pt-footer">
                    <PrintBankBlock />
                    <PrintSignatureBlock />
                  </div>
                  <PrintDeclaration note={sellerProfile.defaultFooterNotes.computerCopyProforma} />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
