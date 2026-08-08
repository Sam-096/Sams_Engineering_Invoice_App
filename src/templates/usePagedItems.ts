import { useLayoutEffect, useRef, useState, type DependencyList } from 'react';
import { packRows, PAGE_BUDGET_PX, type PackedPages } from './pagination';

/**
 * Measures the real rendered height of every item row plus the fixed chrome
 * around the items table (header, table head, totals/footer block), then
 * decides how many A4 pages the document needs and which rows go on which
 * page. Recomputes whenever `deps` changes (item list, customer, tax mode,
 * remarks/SEZ note — anything that can change a block's height).
 *
 * Two-phase render: the first paint for any given `deps` change uses a naive
 * "everything on one page" layout so nothing is ever missing from the DOM;
 * `useLayoutEffect` measures that DOM and — if it doesn't fit — swaps in the
 * real multi-page grouping before the browser paints, so there's no visible
 * flash.
 */
export function usePagedItems(itemCount: number, deps: DependencyList, maxFillerPx?: number) {
  const chromeRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const theadRef = useRef<HTMLTableSectionElement>(null);
  const totalsRef = useRef<HTMLTableSectionElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Array<HTMLTableRowElement | null>>([]);

  const [packed, setPacked] = useState<PackedPages>(() => ({
    pages: [Array.from({ length: itemCount }, (_, i) => i)],
    fillerPx: 0,
  }));

  useLayoutEffect(() => {
    const chromeH = chromeRef.current?.getBoundingClientRect().height ?? 0;
    const infoH = infoRef.current?.getBoundingClientRect().height ?? 0;
    const theadH = theadRef.current?.getBoundingClientRect().height ?? 0;
    const totalsH = totalsRef.current?.getBoundingClientRect().height ?? 0;
    const postH = footerRef.current?.getBoundingClientRect().height ?? 0;
    const rowHeights = rowRefs.current.map((el) => el?.getBoundingClientRect().height ?? 0);

    const page1Budget = PAGE_BUDGET_PX - chromeH - infoH - theadH;
    const contBudget = PAGE_BUDGET_PX - chromeH - theadH;
    const footerHeight = totalsH + postH;

    setPacked(packRows(rowHeights, page1Budget, contBudget, footerHeight, maxFillerPx));
    // deps intentionally controlled by the caller — it knows what affects layout.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const rowRef = (i: number) => (el: HTMLTableRowElement | null) => {
    rowRefs.current[i] = el;
  };

  // Guard against a stale grouping from a previous item count momentarily
  // omitting rows (e.g. an item was just added/removed) — always show every
  // item; the effect above will correct the grouping on the next commit.
  const coveredCount = packed.pages.reduce((sum, p) => sum + p.length, 0);
  const isStale = coveredCount !== itemCount;
  const pages = isStale ? [Array.from({ length: itemCount }, (_, i) => i)] : packed.pages;
  const fillerPx = isStale ? 0 : packed.fillerPx;

  return { chromeRef, infoRef, theadRef, totalsRef, footerRef, rowRef, pages, fillerPx };
}
