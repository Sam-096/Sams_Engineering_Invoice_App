export const taxRules = {
  sellerStateCode: '36',
  logic: {
    intraState: {
      apply: ['cgst', 'sgst'],
      igst: 0
    },
    interState: {
      apply: ['igst'],
      cgst: 0,
      sgst: 0
    },
    sez: {
      optionalNoteSupported: true,
      sampleLutText: 'Supply to SEZ Unit or SEZ Developer For Authorized Operations Under Bond Or Letter Of Undertaking without Payment of Integrated Taxes.'
    }
  }
};
