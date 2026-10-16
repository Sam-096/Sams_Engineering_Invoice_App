import type { CustomerMaster } from '../types';

export const customers: CustomerMaster[] = [
  {
    id: 'cyient-dlm-sez',
    displayName: 'M/s. CYIENT DLM LIMITED - SEZ UNIT',
    billingName: 'M/s. CYIENT DLM LIMITED - SEZ UNIT',
    shippingName: 'M/s. CYIENT DLM LIMITED - SEZ UNIT',
    addressLines: [
      'PLOT NO : 5G, SURVEY NO 99/1, MAMIDIPALLI VILLAGE,',
      'GMR AERO & IND. PARK, GMR HYD AVIATION SEZ LTD, RGIA,',
      'SHAMSHABAD, HYDERABAD - 500108, TELANGANA'
    ],
    state: 'Telangana',
    stateCode: '36',
    gstin: '36AAACR8750R1ZM',
    tags: ['invoice', 'sez', 'cyient']
  },
  {
    id: 'veer-chemie',
    displayName: 'M/s. VEER CHEMIE & AROMATICS PVT LTD',
    billingName: 'Ms. VEER CHEMIE AROMATICS PVT LTD',
    shippingName: 'Ms. VEER CHEMIE AROMATICS PVT LTD',
    addressLines: [
      'A-4, CO OPERATIVE INDUSTRIAL ESTATE',
      'BALANAGAR',
      'HYDERABAD - 500037, TELANGANA'
    ],
    state: 'Telangana',
    stateCode: '36',
    gstin: '36AAACV8052G1ZA',
    tags: ['invoice', 'veer']
  },
  {
    id: 'triovision-unit-2',
    displayName: 'TRIOVISION Composite Technologies Pvt Ltd. Unit - 2',
    billingName: 'TRIOVISION Composite Technologies Pvt Ltd. Unit - 2',
    shippingName: 'TRIOVISION Composite Technologies Pvt Ltd. Unit - 2',
    addressLines: [
      'Plot No :165, Jagananna Mega Industrial Hub,',
      'Kopparty (V), Chintha Komma Dinne (M)',
      'Kadapa, Andhra Pradesh - 516003, India'
    ],
    state: 'Andhra Pradesh',
    stateCode: '37',
    gstin: '37AAFCT4716N1ZV',
    tags: ['proforma', 'triovision']
  },
  {
    id: 'lamtuf-limited',
    displayName: 'LAMTUF LIMITED',
    billingName: 'LAMTUF LIMITED',
    shippingName: 'LAMTUF LIMITED',
    addressLines: [
      'Plot no 81P 91P-94P PHASAMYLARAM INDUSTRIAL AREA SANGAREDDY DISTRICT -502325.TELANGANA'
    ],
    state: 'Telangana',
    stateCode: '36',
    gstin: '36AAACL1804C1Z6',
    tags: ['invoice', 'LAMTUF']
  }
];
