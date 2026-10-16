/**
 * Multi-page layout math for the item-table print templates (Invoice,
 * Proforma, Delivery Challan).
 *
 * `packRows` decides which items belong on which A4 page, given the real
 * measured height of every row plus the fixed chrome around it, and keeps the
 * totals/footer block glued to the last page that has room for it (never
 * printed alone).
 *
 * The empty "filler" row that pushes the totals/bank/signature block down to
 * the bottom of each sheet is NOT computed here — `usePagedItems` sizes it
 * from the actually-rendered page, so it always fills exactly the leftover
 * space (shrinking to nothing as items are added) instead of relying on
 * estimates or a fixed cap.
 */

/** CSS mm→px is a fixed constant per spec (96px/in ÷ 25.4mm/in) — reliable regardless of device DPI. */
export const MM_PX = 96 / 25.4;

const PAGE_HEIGHT_MM = 297;
const PAGE_PADDING_MM = 6; // `.pt-doc` padding, top + bottom
const PAGE_SAFETY_MM = 3; // margin of error so content never kisses the page edge

/** Height (px) inside one `.pt-doc` sheet, after its padding. The frame must never exceed this. */
export const PAGE_INNER_PX = (PAGE_HEIGHT_MM - PAGE_PADDING_MM * 2) * MM_PX;

/** Usable height (px) for packing rows, keeping a safety margin below `PAGE_INNER_PX`. */
export const PAGE_BUDGET_PX = PAGE_INNER_PX - PAGE_SAFETY_MM * MM_PX;

/**
 * Greedily bin-packs item rows into pages, then applies a "keep totals with
 * the last item(s)" rule: if the footer block doesn't fit alongside the rows
 * already assigned to the last page, rows are pushed onto a fresh page
 * instead of letting the footer print by itself.
 *
 * Returns item indices grouped per page, in order. Always has at least one
 * (possibly empty) page.
 */
export function packRows(
  rowHeights: number[],
  page1Budget: number,
  contBudget: number,
  footerHeight: number,
): number[][] {
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
    if (last.length === 0 || lastUsed + footerHeight <= lastBudget) return pages;
    const moved = last.pop()!;
    if (last.length === 0) pages.pop(); // drop the now-empty page instead of leaving a gap
    pages.push([moved]);
  }
  return pages;
}
