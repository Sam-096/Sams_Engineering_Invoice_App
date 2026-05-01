const a = [
  '', 'ONE ', 'TWO ', 'THREE ', 'FOUR ', 'FIVE ', 'SIX ', 'SEVEN ', 'EIGHT ', 'NINE ', 'TEN ', 'ELEVEN ', 'TWELVE ', 'THIRTEEN ', 'FOURTEEN ', 'FIFTEEN ', 'SIXTEEN ', 'SEVENTEEN ', 'EIGHTEEN ', 'NINETEEN '
];
const b = [
  '', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'
];

export const amountToWords = (num: number): string => {
  const rupees = Math.round(num);
  const numStr = rupees.toString();
  if (numStr.length > 9) return 'overflow';
  const paddedNum = ('000000000' + numStr).slice(-9);
  const n = paddedNum.match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  
  const getTens = (twoDigits: string) => {
    const numVal = Number(twoDigits);
    if (numVal === 0) return '';
    if (numVal < 20) return a[numVal];
    return b[Number(twoDigits[0])] + (twoDigits[1] !== '0' ? ' ' + a[Number(twoDigits[1])] : '');
  };

  str += (Number(n[1]) !== 0) ? getTens(n[1]) + 'CRORE ' : '';
  str += (Number(n[2]) !== 0) ? getTens(n[2]) + 'LAKH ' : '';
  str += (Number(n[3]) !== 0) ? getTens(n[3]) + 'THOUSAND ' : '';
  str += (Number(n[4]) !== 0) ? getTens('0' + n[4]) + 'HUNDRED ' : '';
  str += (Number(n[5]) !== 0) ? ((str !== '') ? 'AND ' : '') + getTens(n[5]) : '';
  
  if (str.trim() === '') {
    return 'ZERO RUPEES ONLY';
  }
  return `RUPEES ${str.trim()} ONLY.`;
};
