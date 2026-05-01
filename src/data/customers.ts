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
    id: 'tech-cnc-solutions',
    displayName: 'M/S. TECH CNC SOLUTIONS',
    billingName: 'MS.TECH CNC SOLUTIONS',
    shippingName: 'MS.TECH CNC SOLUTIONS',
    addressLines: [
      'NO: 103, 4th Cross, 2nd Main Road',
      'Pragathi Layout, Janapriya Township,',
      'Kadabagere, Bangaluru, Karnataka - 562130. India'
    ],
    state: 'Karnataka',
    stateCode: '29',
    gstin: '29AIZPN8763G1Z6',
    tags: ['invoice', 'tech-cnc']
  }
];
