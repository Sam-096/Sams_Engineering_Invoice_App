/**
 * Multi-page layout math for the item-table print templates (Invoice, Proforma).
 *
 * The old templates rendered every line item into one continuously-growing
 * `.pt-doc` and padded the bottom with a fixed 40mm filler row. Once a
 * document had enough items (or long wrapped descriptions) to exceed one A4
 * page, that filler pushed the totals block past the page boundary and the
 * PDF exporter sliced the resulting canvas at an arbitrary pixel offset —
 * cutting rows in half and sometimes leaving the grand-total row stranded
 * alone on page 2.
 *
 * `packRows` fixes this at the data level: given the real measured height of
 * every row plus the fixed chrome around it, it decides exactly which items
 * belong on which page, and keeps the totals/footer block glued to the last
 * page that has room for it (never printed alone).
 */

/** CSS mm→px is a fixed constant per spec (96px/in ÷ 25.4mm/in) — reliable regardless of device DPI. */
export const MM_PX = 96 / 25.4;

const PAGE_HEIGHT_MM = 297;
const PAGE_PADDING_MM = 6; // `.pt-doc` padding, top + bottom
const PAGE_SAFETY_MM = 3; // margin of error so content never kisses the page edge

/** Usable height (px) inside one printed page, after `.pt-doc` padding and a safety margin. */
export const PAGE_BUDGET_PX = (PAGE_HEIGHT_MM - PAGE_PADDING_MM * 2 - PAGE_SAFETY_MM) * MM_PX;

/** Default hard cap on the cosmetic filler row so it never grows taller than the original fixed-height look. */
export const MAX_FILLER_PX = 40 * MM_PX;

export interface PackedPages {
  /** Item indices grouped per page, in order. Always has at least one (possibly empty) page. */
  pages: number[][];
  /** Height (px) to give the filler row on the final page so it visually fills the sheet. 0 if none fits. */
  fillerPx: number;
}

/**
 * Greedily bin-packs item rows into pages, then applies a "keep totals with
 * the last item(s)" rule: if the footer block doesn't fit alongside the rows
 * already assigned to the last page, rows are pushed onto a fresh page
 * instead of letting the footer print by itself.
 */
export function packRows(
  rowHeights: number[],
  page1Budget: number,
  contBudget: number,
  footerHeight: number,
  maxFillerPx: number = MAX_FILLER_PX,
): PackedPages {
  const pages: number[][] = [[]];
  let used = 0;
  let budget = page1Budget;

  rowHeights.forEach((h, i) => {
    if (pages[pages.length - 1].length > 0 && used + h > budget) {
      pages.push([]);
      used = 0;
      budget = contBudget;
    }
    pages[pages.length - 1].push(i);
    used += h;
  });

  // Keep-with-next: push trailing rows onto a fresh page until the footer
  // fits alongside whatever remains on the last page (or that page is empty).
  let guard = 0;
  while (guard++ < rowHeights.length + 2) {
    const last = pages[pages.length - 1];
    const lastBudget = pages.length === 1 ? page1Budget : contBudget;
    const lastUsed = last.reduce((sum, i) => sum + rowHeights[i], 0);
    if (last.length === 0 || lastUsed + footerHeight <= lastBudget) {
      return { pages, fillerPx: clampFiller(lastBudget - lastUsed - footerHeight, maxFillerPx) };
    }
    const moved = last.pop()!;
    if (last.length === 0) pages.pop(); // drop the now-empty page instead of leaving a gap
    pages.push([moved]);
  }
  return { pages, fillerPx: 0 };
}

function clampFiller(px: number, maxPx: number): number {
  if (!Number.isFinite(px) || px <= 0) return 0;
  return Math.min(px, maxPx);
}
