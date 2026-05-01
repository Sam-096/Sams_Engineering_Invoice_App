# SAMS Engineering Documents — QA Test Plan

Test cases derived from the actual sample PDFs (`SAMS INVOICE 005.pdf`, `SAMS PROFORMA 002-26.pdf`, `SAMS DC 001.pdf`) and the static masters (`seller.ts`, `customers.ts`, `taxRules.ts`).

**Seller (must always appear)**
- Name: SAMS ENGINEERING · GSTIN `36ATKPK1000F1Z9` · PAN `ATKPK1000F`
- Bank: BANK OF INDIA · A/C `864020100111160` · IFSC `BKID0008640` · Branch `Balanagar, Hyderabad. Telangana`
- Seller state code: `36` (Telangana)

**Customer fixtures used in cases below**
- `tech-cnc-solutions` — state 29 (Karnataka) → IGST
- `veer-chemie` — state 36 (Telangana) → CGST+SGST
- `triovision-unit-2` — state 37 (Andhra Pradesh) → IGST
- `cyient-dlm-sez` — state 36 (Telangana) tagged `sez` → SEZ override expected

Severity: **Blocker** (ships broken) · **Critical** (data wrong / cannot save) · **Major** (UX broken, workaround exists) · **Minor** (polish).

---

## 1 · Authentication

| ID | Module | Scenario | Steps | Test Data | Expected Result | Severity |
|---|---|---|---|---|---|---|
| AUTH-P-01 | Login | Single-user login succeeds | 1. Open `/` 2. Redirected to `/login` 3. Enter creds 4. Submit | `admin / change-me` | Redirected to dashboard; sidebar footer shows username `admin`; localStorage holds `sams.auth` | Critical |
| AUTH-N-01 | Login | Wrong password rejected | Submit with bad password | `admin / wrong` | Inline error "Invalid username or password"; no navigation | Critical |
| AUTH-N-02 | Login | Empty submit blocked | Submit blank form | empty / empty | Required-field errors; no API call | Major |
| AUTH-B-01 | Login | Whitespace-only password | Trim test | `admin / "   "` | Treated as empty → required error | Minor |
| AUTH-P-02 | Session | Reload preserves session | Login → reload page | — | Stays on dashboard, no re-login prompt | Critical |
| AUTH-P-03 | Logout | Logout clears session | Click sidebar Logout | — | Redirected to `/login`; revisiting `/` redirects back to `/login` | Critical |
| AUTH-P-04 | Guard | Protected routes blocked | Visit `/invoice` while logged out | — | 302 to `/login` | Critical |

---

## 2 · Dashboard / Navigation

| ID | Module | Scenario | Steps | Test Data | Expected Result | Severity |
|---|---|---|---|---|---|---|
| NAV-P-01 | Dashboard | Three doc-type cards render | Open `/` | — | Cards: "Tax Invoice", "Proforma Invoice", "Delivery Challan" with descriptions | Major |
| NAV-P-02 | Dashboard | Card click routes correctly | Click each card | — | Routes to `/invoice`, `/proforma`, `/challan` | Critical |
| NAV-P-03 | Sidebar | Active link highlighted | Visit `/invoice` | — | "Tax Invoice" sidebar item shows accent border | Minor |
| NAV-P-04 | Sidebar | Mobile horizontal scroll | Resize <768px | — | Sidebar becomes top bar; nav scrolls horizontally; brand visible | Major |

---

## 3 · Tax Invoice (CGST+SGST — intra-state)

Reference: `Veer_Chemie_005.pdf` style. Customer in same state as seller (`36`).

| ID | Module | Scenario | Steps | Test Data | Expected Result | Severity |
|---|---|---|---|---|---|---|
| INV-P-01 | Tax mode | Same-state ⇒ CGST+SGST auto | Pick Veer Chemie; enter 1 line `HSN 7320, Qty 1, Rate 700` | state 36 | Tax Mode reads `CGST + SGST (Intra-state)`; CGST 9% = 63.00; SGST 9% = 63.00; IGST 0; tax 126.00; grand total `826.00` | Blocker |
| INV-P-02 | Auto-fill | Customer fills billing & shipping | Pick Veer Chemie | — | Both BILLING and GOODS SHIPPED blocks show `Ms. VEER CHEMIE AROMATICS PVT LTD`, address lines, GSTIN `36AAACV8052G1ZA`, state 36 | Critical |
| INV-P-03 | Words | amountInWords matches sample | Same as INV-P-01 | grand 826 | "RUPEES EIGHT HUNDRED AND TWENTY SIX ONLY." | Critical |
| INV-P-04 | Date format | Date renders DD-MMM-YYYY | Set date `2025-04-30` | — | Print shows `30-Apr-2025`; form input keeps native picker | Major |
| INV-P-05 | Letterhead | logo.png banner renders | Open preview after fonts load | — | Full letterhead image at top of frame; no broken-image icon | Critical |
| INV-P-06 | GSTIN strip | Seller GSTIN/PAN visible | Inspect strip below banner | — | `GSTIN NUMBER : 36ATKPK1000F1Z9` left; `PAN NO : ATKPK1000F` right | Critical |
| INV-P-07 | Footer | Bank + signature block | Inspect bottom of frame | — | Bank rows: BANK OF INDIA / 864020100111160 / BKID0008640 / Balanagar, Hyderabad. Telangana; right signature: `For SAMS ENGINEERING` and `Authorised Signature` | Critical |
| INV-P-08 | Declaration | Renders below footer | Inspect bottom | — | "DECLARATION : We declare that, This invoice shows the actual price of goods discribed and all that particulars are true and correct." centered; "Please note this is Computer genarated Copy." below | Major |

---

## 4 · Tax Invoice (IGST — inter-state)

Reference: TC3 from initial spec. Customer in different state (`29`).

| ID | Module | Scenario | Steps | Test Data | Expected Result | Severity |
|---|---|---|---|---|---|---|
| INV-P-10 | Tax mode | Inter-state ⇒ IGST auto | Pick Tech CNC Solutions; line `HSN 8479, Qty 1, Rate 110000` | state 29 | Tax Mode `IGST (Inter-state)`; IGST 18% = 19,800.00; CGST/SGST rows hidden; grand total `1,29,800.00` | Blocker |
| INV-P-11 | Words | amountInWords | grand 129800 | — | "RUPEES ONE LAKH TWENTY NINE THOUSAND EIGHT HUNDRED ONLY." | Critical |
| INV-P-12 | Print row | IGST percent shown | Inspect totals | — | "ADD IGST" row with `18%` in rate cell, `19,800.00` in amount cell | Critical |

---

## 5 · Tax Invoice (SEZ override)

Reference: `SAMS INVOICE 005.pdf` style.

| ID | Module | Scenario | Steps | Test Data | Expected Result | Severity |
|---|---|---|---|---|---|---|
| INV-P-20 | SEZ override | User picks SEZ-zero | Select Cyient DLM SEZ; Tax Mode = "SEZ / Zero-rated"; enter line `Rate 18100 + line 2 Rate 2000` | — | All percents 0; basic 20,100.00; grand total 20,100.00; CGST/SGST/IGST rows render with `0%` / empty / 0.00 | Critical |
| INV-P-21 | SEZ note | sezNote prints in totals | Enter SEZ note text | sample LUT text | Italic note appears under "Remarks :" in right meta column | Major |
| INV-P-22 | LUT | LUT NO renders | Enter LUT NO `AD360525013929S` | — | Shown as italic note `LUT NO : AD360525013929S` under Remarks | Major |
| INV-P-23 | CGST label | "(NON SET OFF)" qualifier | SEZ mode active | — | First totals row reads "ADD CGST ( NON SET OFF )" (matches sample) | Minor |
| INV-N-20 | SEZ validation | sezNote required when SEZ | Pick SEZ, leave note blank | — | Validation error blocks Save PDF | Major |

---

## 6 · Tax Invoice — line items

| ID | Module | Scenario | Steps | Test Data | Expected Result | Severity |
|---|---|---|---|---|---|---|
| INV-P-30 | Add | Add new line | Click "Add Line Item" | — | New row appended; slNo auto-increments | Major |
| INV-P-31 | Duplicate | Duplicate keeps values | Fill row; click Copy | — | Identical row appended with next slNo | Minor |
| INV-P-32 | Remove | Remove renumbers | Add 3, remove middle | — | Remaining rows are slNo 1, 2 (renumbered) | Critical |
| INV-P-33 | Compute | Amount = qty × rate | Type qty 5, rate 200 | — | Amount `1,000.00` (formatted with commas, 2 decimals) | Critical |
| INV-P-34 | Extra desc | Renders right-aligned italic on next line | Add "As per Drawing" | — | Below description, italic right-aligned | Major |
| INV-N-30 | Empty list | Save PDF blocked when no items | Validate | — | Inline error "Add at least one line item"; Save PDF disabled | Critical |
| INV-B-30 | Boundary | Zero quantity blocked | Set qty 0 | — | Validation error on qty field | Major |
| INV-B-31 | Boundary | Negative rate blocked | Set rate -1 | — | Validation error on rate field | Major |
| INV-B-32 | Boundary | Very long description | 500-char string | — | Word-wraps inside Description cell, no overflow | Minor |
| INV-B-33 | Boundary | Very large amount | qty 9999, rate 9999 | basic 99,980,001 | amountInWords renders correctly: "RUPEES NINE CRORE NINETY NINE LAKH EIGHTY THOUSAND ONE ONLY." | Major |

---

## 7 · Proforma Invoice

Reference: `SAMS PROFORMA 002-26.pdf`.

| ID | Module | Scenario | Steps | Test Data | Expected Result | Severity |
|---|---|---|---|---|---|---|
| PRO-P-01 | Inter-state | TRIOVISION (state 37) ⇒ IGST | Pick TRIOVISION; line `HSN 7208, Qty 2, Rate 29380` | — | basic 58,760.00; IGST 18% = 10,576.80; CGST/SGST rows show `-` / `-`; grand total 69,336.80 | Critical |
| PRO-P-02 | Multi-line | Multiple lines in sample | Add 4 items per `SAMS PROFORMA 002-26` | basic 138,660 | basic 1,38,660.00; IGST 24,958.80 (computed) — note sample shows 24,969 due to manual round; doc accepts auto figure unless user manually overrides | Major |
| PRO-P-03 | TERMS divider | Terms section divider in meta | Inspect right meta column | — | Italic underlined "TERMS & CONDITIONS:" divider; rows DELIVERY PERIOD, PAYMENT TERMS, VALIDITY below | Major |
| PRO-P-04 | DESC divider | Description summary in meta | Enter `PARTS MANUFACTURING` | — | Italic underlined "DESCRIPTION" divider; italic summary text below | Minor |
| PRO-P-05 | Transportation | EXTRA literal allowed | Set `transportationAmount = "EXTRA"` | — | Prints `EXTRA` in TRANSPORTATION AMOUNT row (string literal, not formatted as number) | Major |
| PRO-P-06 | Footer copy | Computer-copy notice | Inspect bottom | — | "Please note this is Computer genarated Copy. Signature is Not Necessary" centered (no DECLARATION line for proforma) | Major |
| PRO-P-07 | Words | Paise-aware words | grand 69,336.80 | — | "RUPEES SIXTY NINE THOUSAND THREE HUNDRED AND THIRTY SEVEN ONLY." (rounds to nearest rupee for words; paise shown numerically in Grand Total cell) | Major |
| PRO-N-01 | Validation | Quotation No required | Leave QTN.NO blank | — | Validation error; Save PDF disabled | Critical |

---

## 8 · Delivery Challan

Reference: `SAMS DC 001.pdf`.

| ID | Module | Scenario | Steps | Test Data | Expected Result | Severity |
|---|---|---|---|---|---|---|
| DC-P-01 | Title | Title bar inside frame | Inspect top | — | "DELIVERY CHALLAN" centered italic underlined; "Original For Recipent" right-aligned in bordered box | Critical |
| DC-P-02 | Subtitle | Returnable / Non Returnable line | Pick Returnable | — | Subtitle row reads `( Returnable / Non Returnable )` with the active option underlined | Major |
| DC-P-03 | Items table | 7 columns (no rate/amount) | Inspect header | — | SL.NO · Part No · Description · QTY · UNIT · HSN/SAC · REMARKS — no Rate/Amount columns | Critical |
| DC-P-04 | Group row | Group label spans desc area | Add group "EX-1200" | — | Row with empty SL/Part, "EX-1200" bold underlined left-aligned spanning Description through Remarks | Critical |
| DC-P-05 | Item under group | Items between groups stay numbered | Add group EX-1200 → 5 items → group EX-2500 → 5 items | — | Items numbered 1..10 (groups don't take a slNo); EX-2500 group row appears between item 5 and item 6 | Critical |
| DC-P-06 | Per-item remarks | Renders in REMARKS column | Item with remarks "—" | — | Cell shows the entered text; empty for unset items | Major |
| DC-P-07 | Footer | 3-column receiver footer | Inspect bottom | — | Left: "Receiver's Name" top + "Receiver's Sign With Stamp" bottom. Middle: "Contact No : XXX" italic. Right: italic "For SAMS ENGINEERING" top + "Authorised Signature" bottom. No bank rows. No declaration. | Critical |
| DC-P-08 | Customer | Customer billing & shipping | Pick any customer | — | Two address blocks render (Billing / Shipping) with GSTIN + state code rows | Critical |
| DC-P-09 | Persistence | Groups survive editing | Add group, edit an item | — | Group entries persist across re-render (regression check for the old adapter bug) | Blocker |
| DC-N-01 | Empty | DC No required | Leave dcNo blank | — | Validation error; Save PDF disabled | Critical |
| DC-N-02 | Empty | At least 1 item required | All items removed | — | Validation error "Add at least one line item" | Critical |

---

## 9 · Customer auto-fill

| ID | Module | Scenario | Steps | Test Data | Expected Result | Severity |
|---|---|---|---|---|---|---|
| CUST-P-01 | Switch | Changing customer refreshes preview | Pick A → B | — | All address blocks, GSTIN rows, tax mode (if applicable) update instantly | Critical |
| CUST-P-02 | Empty option | Selecting "—" clears | Pick a customer → pick "— Select a customer —" | — | Preview reverts to "Select a customer to preview" empty state | Major |
| CUST-N-01 | Validation | Customer required | Save PDF without picking | — | Validation error on Customer field | Critical |
| CUST-B-01 | Long name | Long billing name wraps | Customer with 80-char display | — | Wraps inside `pt-address__name` cell, no horizontal overflow | Minor |

---

## 10 · Tax engine

| ID | Module | Scenario | Steps | Test Data | Expected Result | Severity |
|---|---|---|---|---|---|---|
| TAX-P-01 | Auto IGST | State ≠ 36 ⇒ IGST 18% | basic 100, customer state 29 | — | igst 18.00, tax 18.00, grand 118.00 | Blocker |
| TAX-P-02 | Auto CGST/SGST | State = 36 ⇒ 9+9% | basic 100, customer state 36 | — | cgst 9.00, sgst 9.00, igst 0, tax 18.00, grand 118.00 | Blocker |
| TAX-P-03 | Override IGST | Force IGST on state-36 customer | Tax Mode = "Force IGST" | basic 100, state 36 | igst 18.00, no CGST/SGST | Major |
| TAX-P-04 | SEZ override | Zero all tax | Tax Mode = "SEZ / Zero-rated" | basic 100 | All percents 0; tax 0; grand = basic | Critical |
| TAX-B-01 | Paise precision | Paise preserved in grand total | basic 27,440 IGST 18% | — | igst 4,939.20; grand 32,379.20 (NOT 32,379.00 — regression check for old `Math.round` bug) | Blocker |
| TAX-B-02 | Per-row rounding | Each tax component is round-2 | basic 333.33, IGST | — | igst = 60.00 (not 59.9994); tax = 60.00 | Major |
| TAX-B-03 | Zero-amount line | Zero-rate line still computes | qty 1, rate 0 | basic 0 | tax 0; grand 0; words "ZERO RUPEES ONLY" | Minor |

---

## 11 · Amount in words

| ID | Module | Scenario | Test Data | Expected Result | Severity |
|---|---|---|---|---|---|
| WORDS-P-01 | Single rupee | grand 1 | — | "RUPEES ONE ONLY." | Critical |
| WORDS-P-02 | Hundred only | grand 100 | — | "RUPEES ONE HUNDRED ONLY." | Critical |
| WORDS-P-03 | Hundreds + tens | grand 826 | — | "RUPEES EIGHT HUNDRED AND TWENTY SIX ONLY." | Critical |
| WORDS-P-04 | Thousands | grand 20,100 | — | "RUPEES TWENTY THOUSAND ONE HUNDRED ONLY." | Critical |
| WORDS-P-05 | Lakh | grand 1,29,800 | — | "RUPEES ONE LAKH TWENTY NINE THOUSAND EIGHT HUNDRED ONLY." | Critical |
| WORDS-P-06 | Crore | grand 99,980,001 | — | "RUPEES NINE CRORE NINETY NINE LAKH EIGHTY THOUSAND ONE ONLY." | Major |
| WORDS-B-01 | With paise | grand 32,379.20 | — | Rounds to 32,379 for words: "RUPEES THIRTY TWO THOUSAND THREE HUNDRED AND SEVENTY NINE ONLY." | Major |
| WORDS-B-02 | Zero | grand 0 | — | "ZERO RUPEES ONLY" | Minor |
| WORDS-B-03 | Overflow | grand > 1e9 | — | Returns "overflow" — should not appear in real bills (validation guards against amounts this large) | Minor |

---

## 12 · Form persistence + auto-numbering

| ID | Module | Scenario | Steps | Expected Result | Severity |
|---|---|---|---|---|---|
| PER-P-01 | Draft | Refresh keeps form | Fill invoice → reload | All fields, line items, tax mode preserved | Major |
| PER-P-02 | Per-route key | Switching docs doesn't bleed | Fill invoice; visit proforma; visit invoice | Invoice retains its draft; proforma is empty | Major |
| PER-P-03 | Reset clears | Click Reset → confirm | localStorage entry removed; form blanks | Major |
| NUM-P-01 | Prefill | First invoice gets `SAMS-INVOICE-001` | Open `/invoice` on a fresh browser | invoiceNo defaults to `SAMS-INVOICE-001` | Major |
| NUM-P-02 | Increment after save | Counter advances only on PDF save | Save PDF; reset; open new invoice | Next prefill is `SAMS-INVOICE-002` | Major |
| NUM-P-03 | Manual override doesn't advance | Type custom number, save | Counter unchanged | Minor |

---

## 13 · PDF download (the formerly broken path)

| ID | Module | Scenario | Steps | Expected Result | Severity |
|---|---|---|---|---|---|
| PDF-P-01 | Desktop Invoice | Single-page A4 | Fill INV-P-01 data; Save PDF | One-page PDF named `SAMS-INVOICE-005.pdf` (or whatever invoiceNo); content matches preview pixel-for-pixel within capture tolerance | Blocker |
| PDF-P-02 | Desktop Proforma | Multi-line single-page | Fill PRO-P-02 data; Save PDF | One-page PDF; all 4 line items rendered with totals/bank/footer | Blocker |
| PDF-P-03 | Desktop DC | Grouped DC | Fill DC-P-05 data; Save PDF | One-page PDF; 2 group rows + 10 item rows + signature footer | Blocker |
| PDF-P-04 | Filename | No duplicate prefix | Use `SAMS-INVOICE-005` for invoiceNo | Filename `SAMS-INVOICE-005.pdf` (NOT `SAMS-INVOICE-SAMS-INVOICE-005.pdf` — regression check) | Critical |
| PDF-P-05 | Filename | Custom number gets prefix | Use `Veer-005` for invoiceNo | Filename `SAMS-INVOICE-Veer-005.pdf` | Minor |
| PDF-P-06 | Mobile Invoice | Capture from off-screen root works | On <768px viewport, fill invoice without opening preview overlay; Save PDF | PDF contains full document — NOT a blank white page (regression check for the off-screen export root fix) | Blocker |
| PDF-P-07 | Mobile Proforma | Same | On mobile viewport | Full proforma in PDF | Blocker |
| PDF-P-08 | Mobile DC | Same | On mobile viewport | Full DC including grouped rows | Blocker |
| PDF-P-09 | Mobile preview-open | Same with preview overlay open | Open preview, then Save PDF | PDF identical to PDF-P-06 (overlay state shouldn't affect output) | Critical |
| PDF-P-10 | Repeated saves | Save 5× in a row | Don't change anything | All 5 PDFs identical; no memory leak; no blank renders | Major |
| PDF-P-11 | Save after scroll | Scroll editor body, then save | — | PDF unaffected by scroll position | Major |
| PDF-P-12 | Save after orientation flip | Tablet/phone landscape → portrait → save | — | Same single-page A4 output | Minor |
| PDF-P-13 | Long item list | 25 line items | Save PDF | Either single-page squeeze (≤15% overflow) or proper multi-page split with NO overlap (regression check for the duplicate-page bug) | Critical |
| PDF-P-14 | Slight overflow | Items push content to ~305mm | Save PDF | Single-page output (squeeze fits content) — must NOT produce 2 near-identical pages | Blocker |
| PDF-P-15 | Letterhead present | logo.png loaded before capture | Save PDF on first visit | Letterhead banner is in PDF, not blank/missing | Critical |
| PDF-P-16 | Fonts loaded | Inter applied | Save PDF | Text rendered in Inter, not browser fallback | Major |
| PDF-N-01 | Invalid form | Save PDF disabled | Empty customer/items | Save PDF button disabled with hover tooltip listing errors; nothing downloads | Critical |
| PDF-N-02 | Blank-canvas guard | Capture returns empty | Force the export root width to 0 (devtools test) | One retry; if still blank, alert "Could not generate PDF — please try again." | Major |
| PDF-B-01 | iOS Safari | Open in new tab fallback | iPhone Safari → Save PDF | PDF opens in a new tab via blob URL (share sheet available); no silent failure | Critical |
| PDF-B-02 | iOS Safari popup blocked | Popup blocked → save fallback | Block popups → Save PDF | Falls back to `pdf.save()` direct download | Minor |
| PDF-B-03 | Android Chrome | Standard save | Save PDF | File downloads to Downloads folder | Critical |

---

## 14 · Print (`window.print`)

| ID | Module | Scenario | Steps | Expected Result | Severity |
|---|---|---|---|---|---|
| PRN-P-01 | Hide UI | Print hides sidebar/editor | Open print preview | Only `.form-shell__preview-paper` visible; sidebar, editor, footer hidden | Critical |
| PRN-P-02 | A4 portrait | `@page { size: A4 portrait }` | Open print preview | Page dimensions A4 portrait, margin 0 | Critical |
| PRN-P-03 | Mobile transform reset | Mobile preview scale stripped | On mobile, open print preview | Paper renders at 100% width, no scale | Major |
| PRN-P-04 | Hide export root | Off-screen root not in print | Open print preview | Only one document visible; off-screen root hidden via `@media print { display: none }` | Critical |

---

## 15 · Preview vs PDF parity

| ID | Module | Scenario | Steps | Expected Result | Severity |
|---|---|---|---|---|---|
| PARITY-P-01 | Layout | Visible preview matches PDF | Compare side-by-side | All sections in same positions; same column widths; same fonts | Critical |
| PARITY-P-02 | Borders | All frame/cell borders identical | — | No missing or shifted borders | Major |
| PARITY-P-03 | Letterhead | Banner same in both | — | logo.png renders identically (no scaling artefacts) | Major |
| PARITY-P-04 | Numbers | Same formatting | — | `1,38,660.00` (Indian grouping not naïve `138,660.00`); `2.00` qty for proforma; `01` qty for invoice | Major |
| PARITY-P-05 | Date | Same DD-MMM-YYYY format | — | Both show `12-Apr-2026` style | Major |
| PARITY-P-06 | Empty filler row | Same fixed height | — | Both show ~40mm gap above totals (90mm for DC) | Minor |

---

## 16 · Mobile usability

| ID | Module | Scenario | Steps | Expected Result | Severity |
|---|---|---|---|---|---|
| MOB-P-01 | Sidebar | Compact top bar on phones | <768px viewport | Brand left, nav scrollable middle, logout right; no full-height vertical nav | Major |
| MOB-P-02 | Forms | Single-column grids | <480px | sw-grid-2 single col; sw-grid-4 collapses to 2×2 | Major |
| MOB-P-03 | Preview overlay | Eye button opens overlay | Click Preview | Full-screen overlay; close (X) returns to editor | Major |
| MOB-P-04 | Preview scaled | Overlay paper scaled to fit | Open overlay | Paper visible without horizontal scroll on 360px viewport | Minor |
| MOB-P-05 | Footer buttons | Wrap, no overflow | Narrow viewport | Reset / Preview / Print / Save PDF wrap to two rows; no horizontal scroll | Major |
| MOB-P-06 | No double-scroll | Editor body scrolls cleanly | Long form | Only the editor body scrolls; the page itself doesn't scroll behind it | Major |
| MOB-P-07 | Touch targets | Minimum 32×32 px | Inspect buttons | All interactive controls meet touch-target size | Minor |
| MOB-P-08 | Keyboard | Date picker opens native UI | Tap a date input | Native date picker on iOS/Android | Minor |

---

## 17 · Boundary / data edges

| ID | Module | Scenario | Test Data | Expected Result | Severity |
|---|---|---|---|---|---|
| EDGE-B-01 | Items | 0 items | empty list | Save PDF disabled | Critical |
| EDGE-B-02 | Items | 1 item | min set | All sections render; filler row absorbs blank space | Major |
| EDGE-B-03 | Items | 50 items | Stress | Multi-page slicing; no overlap; totals on last page only | Major |
| EDGE-B-04 | Address | 1 line | Customer with single addressLine | Renders without breaking layout | Minor |
| EDGE-B-05 | Address | 6 long lines | Synthetic | Wraps inside cell; preview/PDF parity holds | Minor |
| EDGE-B-06 | Special chars | Accents/currency | Customer name `M/s. ÉOÄ — ₹` | Renders correctly in both preview and PDF; no broken glyphs | Minor |
| EDGE-B-07 | LUT no | Empty LUT | Skip LUT | LUT note row hidden in print | Minor |
| EDGE-B-08 | DC | Group with 0 items | Group "EX-9999" only, no items beneath | Group row prints; no slNo gap; warning not required | Minor |
| EDGE-B-09 | DC | Items without group | All items, no group rows | Renders normally; numbered 1..N | Major |
| EDGE-B-10 | Tax | Tiny amount | qty 0.01, rate 0.01, basic 0.0001 | Rounds to 0.00; tax 0; grand 0 | Minor |

---

## 18 · Negative / error handling

| ID | Module | Scenario | Steps | Expected Result | Severity |
|---|---|---|---|---|---|
| NEG-N-01 | Customer | None selected at save | Try Save PDF | Disabled with tooltip; inline error on Customer | Critical |
| NEG-N-02 | Doc number | Missing | Save with blank invoiceNo | Inline error; Save PDF disabled | Critical |
| NEG-N-03 | Date | Missing | Blank date | Inline error | Major |
| NEG-N-04 | Invalid qty | Non-numeric | Type "abc" | Native input rejects (type=number) | Minor |
| NEG-N-05 | Negative qty | Set qty -1 | — | Inline error; Save PDF disabled | Major |
| NEG-N-06 | SEZ note | SEZ mode + blank note | Force SEZ, leave note | Inline error | Major |
| NEG-N-07 | Reset | Cancel reset | Click Reset → Cancel in confirm | Form unchanged | Minor |
| NEG-N-08 | Group label | Empty group label | Add group, leave label empty | Validation error or auto-rejected | Minor |

---

## 19 · Regression checks (bugs found and fixed)

| ID | Bug | How to verify it's still fixed | Severity |
|---|---|---|---|
| REG-01 | "Invoice appeared twice in PDF" — slight overflow created near-duplicate page 2 | Fill invoice with content sized just over 1 page; Save PDF; expect single-page squeeze, not 2 pages | Blocker |
| REG-02 | Mobile blank PDF — visible preview was `display: none` so capture was 0×0 | On mobile viewport, Save PDF without opening preview overlay; PDF must contain full document | Blocker |
| REG-03 | Filename had duplicated prefix `SAMS-INVOICE-SAMS-INVOICE-005.pdf` | Use `peekNext()` value as invoiceNo; filename should be `SAMS-INVOICE-005.pdf` | Critical |
| REG-04 | Grand total stripped paise via `Math.round` | Compute grand 32,379.20; verify printed value is `32,379.20` not `32,379.00` | Blocker |
| REG-05 | DC groups silently deleted on item edit | Add group + items, edit any item, verify group row still renders | Blocker |
| REG-06 | Date printed in ISO `2026-04-12` instead of `12-Apr-2026` | Set any date field; check print output is DD-MMM-YYYY | Major |
| REG-07 | Mobile preview transform shrank captured PDF | On mobile, Save PDF; verify text is full-resolution, not thumbnail | Critical |
| REG-08 | Tailwind utilities not applying — broken layout | Open dashboard / forms; layout must render as designed (sidebar, two-column form, etc.) | Blocker |

---

## Run order suggestion

1. **Smoke** — AUTH-P-01, NAV-P-01, PDF-P-01 (5 min)
2. **Tax engine** — TAX-P-01..04, TAX-B-01..02, WORDS-P-01..06 (15 min)
3. **Per-doc happy path** — INV-P-01, INV-P-10, PRO-P-01, DC-P-05 with PDF download (20 min)
4. **PDF regressions** — PDF-P-04, PDF-P-06..08, PDF-P-13..14 (15 min)
5. **Mobile** — MOB-P-01..06, PDF-P-06..09 on real device (20 min)
6. **Boundary + negative** — full sections 17 + 18 (30 min)
7. **Regression sweep** — section 19 (15 min)

Total: ~2 hours for full pass.
