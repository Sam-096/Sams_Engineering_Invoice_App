import type { DeliveryChallanDocument, CustomerMaster } from '../types';
import { formatDate } from '../utils/formatDate';
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
  if (!customer) return <PrintEmptyPreview />;

  const isReturnable = data.challanType === 'Returnable';
  const subtitle = (
    <span>
      ( <strong style={{ textDecoration: isReturnable ? 'underline' : 'none' }}>Returnable</strong>
      &nbsp;/&nbsp;
      <strong style={{ textDecoration: isReturnable ? 'none' : 'underline' }}>Non Returnable</strong> )
    </span>
  );

  return (
    <div className="pt-doc">
      <div className="pt-frame">
        <PrintTitleBar
          title="DELIVERY CHALLAN"
          copy="Original For Recipent"
          subtitle={subtitle}
        />
        <PrintLetterhead />
        <PrintTaxStrip />

        <div className="pt-info">
          <div className="pt-info__addresses">
            <PrintCustomerAddresses
              customer={customer}
              billingHeading="Billing Address :"
              shippingHeading="Shipping Address:"
            />
          </div>
          <div className="pt-info__meta">
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

        <table className="pt-items">
          <thead>
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
            {data.groupedLineItems.map((item, i) => item.type === 'group' ? (
              <tr key={`g-${i}`} className="pt-items__group">
                <td />
                <td />
                <td colSpan={5}>{item.label}</td>
              </tr>
            ) : (
              <tr key={`i-${i}`}>
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
            ))}
            <tr className="pt-items__filler">
              {Array.from({ length: COLS }).map((_, i) => (
                <td key={i} style={{ height: '90mm' }} />
              ))}
            </tr>
          </tbody>
        </table>

        <div className="pt-dc-footer">
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
      </div>
    </div>
  );
}
