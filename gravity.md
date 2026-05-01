PROJECT NAME:
SAMS Engineering Documents App

PROJECT TYPE:
React + TypeScript static web application

PRIMARY GOAL:
Build a very user-friendly web app for SAMS Engineering to create Tax Invoice, Proforma Invoice, and Delivery Challan documents on mobile and desktop, replacing the current manual Excel-to-PDF workflow.[file:9][file:10][file:11][file:12]

NON-NEGOTIABLES:
- No backend
- No database
- Single-user login only
- All master data stored in TypeScript source files
- PDF output must closely match the current Excel/PDF layouts
- Mobile-first UI for an older non-technical user
- Same seller details reused across all documents
- Customer master dropdown with ability to add new companies in code-driven architecture
- Final app must feel simple, fast, and production-clean.[file:9][file:10][file:11][file:12]

BUSINESS CONTEXT:
The user currently creates bills manually in Excel and exports them as PDF. The app must remove this manual process and let the user generate the same business documents from simple forms. Layout fidelity matters more than flashy UI. The printed output must remain very close to the existing business formats.[file:9][file:10][file:11][file:12][file:13]

PRIMARY USERS:
1. Father / business operator using mobile phone
2. Family/admin user using desktop browser

LOGIN:
- Single fixed username/password
- Credentials stored in src/data/auth.ts
- No roles
- No multi-user auth
- No backend authentication

TECH STACK:
- React
- TypeScript
- Static app
- Client-side routing only
- No server APIs
- PDF/print export from browser

APP MODULES:
1. Login page
2. Home/dashboard
3. Create Tax Invoice
4. Create Proforma Invoice
5. Create Delivery Challan
6. Customer master selector
7. Add new company form
8. Reusable line item editor
9. Live print preview
10. Download PDF / Print

UX PRINCIPLES:
- Large inputs and buttons
- Minimal typing
- Smart defaults
- Searchable customer dropdown
- Sticky bottom action bar on mobile
- Left form / right preview on desktop
- Real print preview, not simplified mock preview
- Friendly validation
- Quick duplicate row
- Quick clear/reset with confirmation
- Quick create from previous document
- Shipping same as billing toggle

SELLER MASTER DATA:
Company Name: SAMS ENGINEERING
GSTIN: 36ATKPK1000F1Z9
PAN: ATKPK1000F
Bank Name: BANK OF INDIA
Account Number: 864020100111160
IFSC Code: BKID0008640
Branch: Balanagar, Hyderabad. Telangana.[file:10][file:11][file:12][file:15]

CUSTOMER MASTER SEED DATA:
1. CYIENT DLM LIMITED - SEZ UNIT
   Address:
   PLOT NO : 5G, SURVEY NO 99/1, MAMIDIPALLI VILLAGE,
   GMR AERO & IND. PARK, GMR HYD AVIATION SEZ LTD, RGIA,
   SHAMSHABAD, HYDERABAD - 500108, TELANGANA
   GSTIN: 36AAACR8750R1ZM
   State Code: 36.[file:13]

2. VEER CHEMIE & AROMATICS PVT LTD
   Address:
   A-4, CO OPERATIVE INDUSTRIAL ESTATE,
   BALANAGAR,
   HYDERABAD - 500037, TELANGANA
   GSTIN: 36AAACV8052G1ZA
   State Code: 36.[file:17]

3. TRIOVISION Composite Technologies Pvt Ltd. Unit - 2
   Address:
   Plot No :165, Jagananna Mega Industrial Hub,
   Kopparty (V), Chintha Komma Dinne (M),
   Kadapa, Andhra Pradesh - 516003, India
   GSTIN: 37AAFCT4716N1ZV
   State Code: 37.[file:10][file:15]

4. TECH CNC SOLUTIONS
   Address:
   NO: 103, 4th Cross, 2nd Main Road,
   Pragathi Layout, Janapriya Township,
   Kadabagere, Bangaluru, Karnataka - 562130. India
   GSTIN: 29AIZPN8763G1Z6
   State Code: 29.[file:11][file:12]

DOCUMENT TYPES:
1. Tax Invoice
2. Proforma Invoice
3. Delivery Challan

TAX LOGIC:
- Seller state code is 36
- Same-state customer => CGST + SGST
- Different-state customer => IGST
- Support special SEZ note / LUT note for invoice cases where needed.[file:11][file:13][file:15]

==================================================
DOCUMENT SPECIFICATION: TAX INVOICE
==================================================

Purpose:
Generate a Tax Invoice matching current printed business layout.[file:11][file:12][file:13]

Header:
- Title: TAX INVOICE
- Subtitle: Original For Recipent
- Seller GSTIN and PAN row

Left blocks:
- Billing Address
- Goods Shipped Address

Right meta fields:
- Invoice No
- Date
- DC No
- DC Date
- Our Ref. No.
- Our Ref. Date
- Transport Mode
- Transport Reg.No
- E-Challan Number
- Date of Dispatch
- P.O. No.
- P.O. Date
- Remarks
- Optional LUT No for SEZ cases.[file:11][file:12][file:13]

Line item table columns:
- SL.NO.
- Part No / Part Item No
- Description
- HSN/SAC CODE
- QTY
- UNIT
- RATE
- Amount.[file:11][file:12][file:13]

Totals block:
- BASIC AMOUNT
- ADD CGST
- ADD SGST
- ADD IGST
- TAX AMOUNT
- GRAND TOTAL AMOUNT
- Amount in words.[file:11][file:12][file:13]

Footer:
- Bank details on left
- “For SAMS ENGINEERING” and Authorised Signature on right
- Declaration text
- “Please note this is Computer genarated Copy.”[file:11][file:12][file:13]

Invoice sample behaviors to support:
- Used machinery invoice with IGST for Karnataka customer.[file:11][file:12]
- VEER CHEMIE invoice with CGST + SGST for Telangana customer.[file:17]
- CYIENT invoice with LUT / SEZ note and zero-tax style behavior when required.[file:13]

==================================================
DOCUMENT SPECIFICATION: PROFORMA INVOICE
==================================================

Purpose:
Generate a Proforma Invoice matching current business format.[file:10][file:15]

Header:
- Title: PROFORMA INVOICE
- Seller GSTIN and PAN row

Left blocks:
- Billing Address
- Goods Shipping Address

Right/meta fields:
- QTN.NO
- Date
- YOUR REF. No.
- Date
- CONTACT PERSON DETAILS
- TERMS CONDITIONS
- DELIVERY PERIOD
- PAYMENT TERMS
- VALIDITY
- DESCRIPTION summary.[file:10][file:15]

Line item table columns:
- SL.NO.
- Part No
- Description
- HSN/SAC CODE
- QTY
- UNIT
- RATE
- Amount.[file:10][file:15]

Totals block:
- BASIC AMOUNT
- ADD CGST
- ADD SGST
- ADD IGST
- TOTAL TAX AMOUNT
- TRANSPORTATION AMOUNT
- GRAND TOTAL AMOUNT
- Amount in words.[file:10][file:15]

Footer:
- Bank details
- Authorised Signature
- Note: “Please note this is Computer genarated Copy. Signature is Not Necessary.”[file:10][file:15]

Proforma sample behaviors to support:
- Andhra customer with CGST + SGST structure in one sample.[file:10]
- Andhra customer with IGST structure in another sample.[file:15]
- Contact person, payment terms, validity, and description summary must be editable fields.[file:10][file:15]

==================================================
DOCUMENT SPECIFICATION: DELIVERY CHALLAN
==================================================

Purpose:
Generate a Delivery Challan with very high print fidelity to the provided template.[file:9]

Header:
- Title: DELIVERY CHALLAN
- Returnable / Non Returnable indicator
- Original For Recipent
- Seller branding header
- Seller GSTIN and PAN.[file:9]

Body layout:
- Left billing address block
- Left shipping address block
- Right-side boxed meta table

Right-side meta table fields:
- D.C. No
- Date
- YOUR REF.NO
- Date
- Transport Reg.No
- E-Way Bill Number
- Date of Dispatch
- Remarks
- P.O No
- Contact No.[file:9]

Line item grid columns:
- SL.NO.
- Part No
- Description
- QTY
- UNIT
- HSN / SAC CODE
- REMARKS.[file:9]

Special requirement:
- Must support grouped section rows like EX-1200 and EX-2500 in the table.[file:9]

Footer/signature row:
- Receiver’s Name
- Contact No
- Receiver’s Sign With Stamp
- For Sam’s Engineerings
- Authorised Signature.[file:9]

PRINT FIDELITY RULES:
- Do not heavily redesign the documents
- Preserve boxed borders
- Preserve table density
- Preserve left/right section placements
- Keep current business terminology exactly
- Use A4 portrait
- Screen preview should visually match PDF preview closely
- Separate screen CSS and print CSS
- Prevent broken row splitting where possible
- Delivery Challan template must be treated as the strictest print layout.[file:9][file:11][file:13]

CODE ARCHITECTURE:
Use this folder structure:

src/
  components/
  data/
  hooks/
  pages/
  templates/
  types/
  utils/

SUGGESTED FILES:
src/data/auth.ts
src/data/seller.ts
src/data/customers.ts
src/data/documentSequences.ts
src/data/units.ts
src/data/transportModes.ts

src/types/common.ts
src/types/customer.ts
src/types/lineItem.ts
src/types/invoice.ts
src/types/proforma.ts
src/types/deliveryChallan.ts

src/components/LoginForm.tsx
src/components/CustomerSelector.tsx
src/components/AddressEditor.tsx
src/components/LineItemsEditor.tsx
src/components/TotalsPanel.tsx
src/components/DocumentActions.tsx
src/components/PreviewPane.tsx

src/pages/LoginPage.tsx
src/pages/DashboardPage.tsx
src/pages/CreateInvoicePage.tsx
src/pages/CreateProformaPage.tsx
src/pages/CreateDeliveryChallanPage.tsx

src/templates/InvoicePrintTemplate.tsx
src/templates/ProformaPrintTemplate.tsx
src/templates/DeliveryChallanPrintTemplate.tsx

src/hooks/useDocumentForm.ts
src/hooks/usePdfExport.ts
src/hooks/useCustomerMaster.ts

src/utils/tax.ts
src/utils/amountToWords.ts
src/utils/formatDate.ts
src/utils/print.ts

DATA MODEL EXPECTATIONS:
Create TypeScript interfaces for:
- SellerProfile
- Address
- Customer
- LineItem
- InvoiceDocument
- ProformaDocument
- DeliveryChallanDocument
- DocumentType
- TaxMode

STATE + DATA BEHAVIOR:
- Seller data fixed from src/data/seller.ts
- Customer dropdown reads from src/data/customers.ts
- User can add company through UI
- Keep an abstraction layer so customer data can later move to local storage or API
- Sequence numbers configurable in src/data/documentSequences.ts
- Use in-memory state for current session drafts
- Build “create from previous document” support

PDF / PRINT IMPLEMENTATION:
- Prefer browser print or a high-fidelity React print strategy over loose PDF screenshots if it preserves layout better
- If using html2canvas/jsPDF, ensure border sharpness and A4 consistency
- Lazy-load PDF export code to keep app light

ACCESSIBILITY + PERFORMANCE:
- Semantic labels for every field
- Good contrast
- Keyboard friendly
- Big tap targets
- Low bundle size
- Fast initial load
- Smooth on low-end mobile
- Lighthouse-focused implementation

IMPLEMENTATION PRIORITY ORDER:
1. Source data and types
2. Shared form infrastructure
3. Invoice print template
4. Proforma print template
5. Delivery Challan print template
6. PDF/print export
7. Login and dashboard polish
8. UX shortcuts and mobile optimization

IMPORTANT:
This is a practical business app, not a fancy dashboard product. Prioritize reliability, form clarity, and print accuracy over decorative design.[file:9][file:10][file:11][file:12][file:13][file:15]