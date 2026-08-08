import type { DeliveryChallanDocument, CustomerMaster } from '../types';
import { formatDate } from '../utils/formatDate';
import { usePagedItems } from './usePagedItems';
import { MM_PX } from './pagination';
import {
  PrintCustomerAddresses,
  PrintEmptyPreview,
  PrintKvDivider,
  PrintKvRow,
  PrintKvRowWithDate,
  PrintLetterhead,
  PrintTaxStrip,
  PrintTitleBar,
} from './parts';
import { sellerProfile } from '../data/seller';

interface Props {
  data: DeliveryChallanDocument;
  customer: CustomerMaster | null;
}

const COLS = 7; // SL, Part, Desc, QTY, UNIT, HSN, REMARKS

export function DeliveryChallanPrintTemplate({ data, customer }: Props) {
  const { chromeRef, infoRef, theadRef, footerRef, rowRef, pages, fillerPx } =
    usePagedItems(data.groupedLineItems.length, [
      data.groupedLineItems, customer, data.challanType, data.remarks, data.poNo, data.contactNo,
    ], 90 * MM_PX);

  if (!customer) return <PrintEmptyPreview />;

  const isReturnable = data.challanType === 'Returnable';
  const subtitle = (
    <span>
      ( <strong style={{ textDecoration: isReturnable ? 'underline' : 'none' }}>Returnable</strong>
      &nbsp;/&nbsp;
      <strong style={{ textDecoration: isReturnable ? 'none' : 'underline' }}>Non Returnable</strong> )
    </span>
  );

  const totalPages = pages.length;

  return (
    <>
      {pages.map((itemIdxs, pageIdx) => {
        const isFirst = pageIdx === 0;
        const isLast = pageIdx === totalPages - 1;
        const copy = totalPages > 1
          ? `Original For Recipent  ${pageIdx + 1}/${totalPages}`
          : 'Original For Recipent';

        return (
          <div className="pt-doc" key={pageIdx}>
            <div className="pt-frame">
              <div ref={isFirst ? chromeRef : undefined}>
                <PrintTitleBar title="DELIVERY CHALLAN" copy={copy} subtitle={subtitle} />
                <PrintLetterhead />
                <PrintTaxStrip />
              </div>

              {isFirst && (
                <div className="pt-info">
                  <div className="pt-info__addresses">
                    <PrintCustomerAddresses
                      customer={customer}
                      billingHeading="Billing Address :"
                      shippingHeading="Shipping Address:"
                    />
                  </div>
                  <div className="pt-info__meta" ref={infoRef}>
                    <PrintKvRowWithDate
                      label="D.C. No"
                      value={data.dcNo}
                      dateValue={formatDate(data.date)}
                    />
                    <PrintKvRowWithDate
                      label="YOUR REF.NO"
                      value={data.yourRefNo}
                      dateValue={formatDate(data.yourRefDate)}
                    />
                    <PrintKvRow label="Transport Reg.No :" value={data.transportRegNo} />
                    <PrintKvRow label="E-Way Bill Number :" value={data.eWayBillNumber} />
                    <PrintKvRow label="Date of Dispatch :" value={formatDate(data.dateOfDispatch)} />
                    <PrintKvDivider>Remarks : {data.remarks || '-'}</PrintKvDivider>
                    <PrintKvRow label="P.O No :" value={data.poNo} variant="grow" />
                  </div>
                </div>
              )}

              <table className="pt-items">
                <thead ref={isFirst ? theadRef : undefined}>
                  <tr>
                    <th style={{ width: '7%' }}>SL.NO.</th>
                    <th style={{ width: '13%' }}>Part No</th>
                    <th style={{ width: '46%' }}>Description</th>
                    <th style={{ width: '8%' }}>QTY</th>
                    <th style={{ width: '7%' }}>UNIT</th>
                    <th style={{ width: '11%' }}>HSN / SAC<br />CODE</th>
                    <th style={{ width: '8%' }}>REMARKS</th>
                  </tr>
                </thead>
                <tbody>
                  {itemIdxs.map((i) => {
                    const item = data.groupedLineItems[i];
                    return item.type === 'group' ? (
                      <tr key={`g-${i}`} className="pt-items__group" ref={rowRef(i)}>
                        <td />
                        <td />
                        <td colSpan={5}>{item.label}</td>
                      </tr>
                    ) : (
                      <tr key={`i-${i}`} ref={rowRef(i)}>
                        <td>{item.slNo}</td>
                        <td>{item.partNo}</td>
                        <td className="pt-items__desc">
                          {item.description}
                          {item.extraDescription && (
                            <div className="pt-items__desc-extra">{item.extraDescription}</div>
                          )}
                        </td>
                        <td>{item.qty}</td>
                        <td>{item.unit}</td>
                        <td>{item.hsnSacCode}</td>
                        <td>{item.remarks}</td>
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
              </table>

              {isLast && (
                <div ref={footerRef} className="pt-dc-footer">
                  <div className="pt-dc-receiver">
                    <div className="pt-dc-receiver__label">Receiver's Name</div>
                    <div className="pt-dc-receiver__sign">Receiver's Sign With Stamp</div>
                  </div>
                  <div className="pt-dc-receiver__contact">
                    <div className="pt-dc-receiver__contact-label">Contact No : {data.contactNo}</div>
                  </div>
                  <div className="pt-dc-sign">
                    <div className="pt-sign__top"><em>For {sellerProfile.companyName}</em></div>
                    <div className="pt-sign__bottom">Authorised Signature</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
