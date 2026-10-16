import { useCallback, useEffect, useLayoutEffect, useRef, useState, type DependencyList } from 'react';
import { packRows, PAGE_BUDGET_PX, PAGE_INNER_PX } from './pagination';

/** Leave a hair of room under the frame so sub-pixel rounding never spills onto a blank extra page. */
const FILLER_SLACK_PX = 2;

const allOnOnePage = (n: number) => [Array.from({ length: n }, (_, i) => i)];

/**
 * Measures the real rendered height of every item row plus the fixed chrome
 * around the items table (header, table head, totals/footer block), then
 * decides how many A4 pages the document needs and which rows go on which
 * page. Recomputes whenever `deps` changes (item list, customer, tax mode,
 * remarks/SEZ note — anything that can change a block's height), and whenever
 * the header chrome resizes (letterhead image / webfont finishing loading, or
 * the mobile preview overlay being revealed from `display: none`).
 *
 * Then sizes each page's empty filler row from the actually-rendered sheet so
 * it takes up exactly the leftover space: the totals, bank details and
 * signature footer sit at the bottom of the A4 page with 1 item, and the
 * filler shrinks to nothing as more items are added.
 *
 * All measurements use `offsetHeight` (layout size), not
 * `getBoundingClientRect` — the mobile preview is `transform: scale()`d, and
 * the scaled rect would make every block look ~half its real height.
 *
 * Two-phase render: the first paint for any given `deps` change uses a naive
 * "everything on one page" layout so nothing is ever missing from the DOM;
 * `useLayoutEffect` measures that DOM and swaps in the real grouping before
 * the browser paints, so there's no visible flash.
 */
export function usePagedItems(itemCount: number, deps: DependencyList) {
  const chromeElRef = useRef<HTMLDivElement | null>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const theadRef = useRef<HTMLTableSectionElement>(null);
  const totalsRef = useRef<HTMLTableSectionElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Array<HTMLTableRowElement | null>>([]);
  const frameRefs = useRef<Array<HTMLDivElement | null>>([]);

  const [packed, setPacked] = useState<number[][]>(() => allOnOnePage(itemCount));
  const [fillers, setFillers] = useState<number[]>([]);
  const [measureTick, setMeasureTick] = useState(0);
  const remeasure = useCallback(() => setMeasureTick((t) => t + 1), []);

  // Header chrome height changes when the letterhead image loads or when a
  // hidden preview becomes visible — both invalidate the page budget.
  const observerRef = useRef<ResizeObserver | null>(null);
  const chromeRef = useCallback((el: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    chromeElRef.current = el;
    if (!el || typeof ResizeObserver === 'undefined') return;
    let lastH = el.offsetHeight;
    const ro = new ResizeObserver(() => {
      const h = el.offsetHeight;
      if (h !== lastH) {
        lastH = h;
        remeasure();
      }
    });
    ro.observe(el);
    observerRef.current = ro;
  }, [remeasure]);

  // Webfont swap changes every row's line height.
  useEffect(() => {
    if (typeof document === 'undefined' || !('fonts' in document)) return;
    document.fonts.ready.then(remeasure).catch(() => { /* ignore */ });
  }, [remeasure]);

  useLayoutEffect(() => {
    const h = (el: HTMLElement | null | undefined) => el?.offsetHeight ?? 0;
    const chromeH = h(chromeElRef.current);
    // Not rendered, or inside a `display: none` preview — measuring now would
    // read zeros. The ResizeObserver above re-runs this once it's visible.
    if (chromeH === 0) return;

    const infoH = h(infoRef.current);
    const theadH = h(theadRef.current);
    const totalsH = h(totalsRef.current);
    const postH = h(footerRef.current);
    const rowHeights = rowRefs.current.slice(0, itemCount).map((el) => h(el));

    const page1Budget = PAGE_BUDGET_PX - chromeH - infoH - theadH;
    const contBudget = PAGE_BUDGET_PX - chromeH - theadH;
    const next = packRows(rowHeights, page1Budget, contBudget, totalsH + postH);
    setPacked((prev) => (samePages(prev, next) ? prev : next));
    // deps intentionally controlled by the caller — it knows what affects layout.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, itemCount, measureTick]);

  // Guard against a stale grouping from a previous item count momentarily
  // omitting rows (e.g. an item was just added/removed) — always show every
  // item; the effect above will correct the grouping on the next commit.
  const coveredCount = packed.reduce((sum, p) => sum + p.length, 0);
  const isStale = coveredCount !== itemCount;
  const pages = isStale ? allOnOnePage(itemCount) : packed;

  // Size each page's filler from the real rendered sheet. Runs after every
  // commit but only sets state when a value actually changes, so it settles
  // in one extra pass (the filler row's own height is subtracted back out).
  // Deliberately dep-less: a row can change height (edited description)
  // without the page grouping changing, and the filler must follow it.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (isStale) return;
    const next = pages.map((_, p) => {
      const frame = frameRefs.current[p];
      if (!frame || frame.offsetHeight === 0) return fillers[p] ?? 0;
      let content = frame.offsetHeight - frame.clientHeight; // frame borders
      for (const child of Array.from(frame.children)) {
        content += (child as HTMLElement).offsetHeight;
      }
      const currentFiller = frame.querySelector<HTMLElement>('.pt-items__filler')?.offsetHeight ?? 0;
      return Math.max(0, Math.floor(PAGE_INNER_PX - FILLER_SLACK_PX - (content - currentFiller)));
    });
    const changed = next.length !== fillers.length
      || next.some((v, i) => Math.abs(v - (fillers[i] ?? 0)) >= 1);
    if (changed) setFillers(next);
  });

  const rowRef = (i: number) => (el: HTMLTableRowElement | null) => {
    rowRefs.current[i] = el;
  };
  const frameRef = (p: number) => (el: HTMLDivElement | null) => {
    frameRefs.current[p] = el;
  };
  const fillerFor = (p: number) => (isStale ? 0 : fillers[p] ?? 0);

  return { chromeRef, infoRef, theadRef, totalsRef, footerRef, rowRef, frameRef, pages, fillerFor };
}

function samePages(a: number[][], b: number[][]): boolean {
  return a.length === b.length && a.every((p, i) => p.length === b[i].length && p.every((v, j) => v === b[i][j]));
}
