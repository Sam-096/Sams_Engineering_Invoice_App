import { taxRules } from '../data/taxRules';
import type { LineItem } from '../types';

export const calculateTaxes = (
  customerStateCode: string,
  lineItems: LineItem[],
  taxModeOverride?: 'CGST_SGST' | 'IGST' | 'SEZ_ZERO_OR_SPECIAL'
) => {
  const basicAmount = lineItems.reduce((acc, item) => acc + item.amount, 0);
  
  let taxMode = taxModeOverride;
  if (!taxMode) {
    if (customerStateCode === taxRules.sellerStateCode) {
      taxMode = 'CGST_SGST';
    } else {
      taxMode = 'IGST';
    }
  }

  let cgstPercent = 0;
  let sgstPercent = 0;
  let igstPercent = 0;

  if (taxMode === 'CGST_SGST') {
    cgstPercent = 9;
    sgstPercent = 9;
  } else if (taxMode === 'IGST') {
    igstPercent = 18;
  }

  const round2 = (n: number) => Number(n.toFixed(2));
  const cgstAmount = round2((basicAmount * cgstPercent) / 100);
  const sgstAmount = round2((basicAmount * sgstPercent) / 100);
  const igstAmount = round2((basicAmount * igstPercent) / 100);

  const taxAmount = round2(cgstAmount + sgstAmount + igstAmount);
  const grandTotal = round2(basicAmount + taxAmount);

  return {
    taxMode,
    basicAmount,
    cgstPercent,
    sgstPercent,
    igstPercent,
    cgstAmount,
    sgstAmount,
    igstAmount,
    taxAmount,
    grandTotal
  };
};
