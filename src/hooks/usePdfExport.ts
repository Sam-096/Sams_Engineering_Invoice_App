import { useCallback } from 'react';

const EXPORT_ROOT_ID = 'document-preview-root';

interface PdfTarget {
  /** Filename without extension. e.g. `SAMS-INVOICE-001`. */
  filename: string;
}

/**
 * Print: opens the browser print dialog. The `@media print` rules in
 * `index.css` already isolate `.form-shell__preview-paper` for printing.
 *
 * Save PDF: rasterises the off-screen `#document-preview-root` (mounted by
 * `DocumentFormShell` via portal at fixed A4 width) and assembles A4 pages.
 *
 * Mobile-specific failures handled here:
 *
 *  1. **Visible preview is `display: none` on mobile** until the user opens
 *     the overlay. Capturing the visible node returned a 0×0 canvas → blank
 *     PDF. Fix: capture the dedicated `.pdf-export-root` portal which is
 *     always rendered at fixed A4 size regardless of viewport.
 *
 *  2. **Mobile memory limits (especially iOS Safari)**: scale 2 on a tall
 *     A4 element produced ~14 megapixel canvases that sometimes returned
 *     blank on iPhones. Cap scale at 1.5 on mobile.
 *
 *  3. **Capture before fonts/logo loaded** → text rendered as fallback or
 *     letterhead missing. Wait for `document.fonts.ready` and any `<img>`
 *     inside the export root before capturing.
 *
 *  4. **iOS Safari blob download** silently fails for some users. Open the
 *     generated PDF in a new tab on iOS so the native share sheet picks it
 *     up; fall back to `pdf.save()` if the popup is blocked.
 *
 *  5. **Duplicate page from slight A4 overflow**: see in-file comments.
 */
export const usePdfExport = () => {
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleDownloadPdf = useCallback(async ({ filename }: PdfTarget) => {
    const node = document.getElementById(EXPORT_ROOT_ID);
    if (!node) {
      window.print();
      return;
    }

    // Wait for fonts (Inter via Google Fonts) so text renders crisp.
    if ('fonts' in document) {
      try { await (document as Document).fonts.ready; } catch { /* ignore */ }
    }

    // Wait for the letterhead image — html2canvas would otherwise draw
    // an empty box for an unloaded <img>.
    await waitForImages(node);

    // One animation frame to let any pending layout settle.
    await nextFrame();

    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import('jspdf'),
      import('html2canvas'),
    ]);

    const isMobile = isMobileViewport();
    const captureScale = isMobile ? 1.5 : 2;

    let canvas = await html2canvas(node, {
      scale: captureScale,
      useCORS: true,
      backgroundColor: '#ffffff',
      width: node.offsetWidth,
      height: node.offsetHeight,
      windowWidth: node.offsetWidth,
      windowHeight: node.offsetHeight,
    });

    // Blank-canvas guard: occasionally on mobile the first capture
    // produces a near-empty bitmap (race with layout). Retry once.
    if (isCanvasBlank(canvas)) {
      await nextFrame();
      await nextFrame();
      canvas = await html2canvas(node, {
        scale: captureScale,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: node.offsetWidth,
        height: node.offsetHeight,
        windowWidth: node.offsetWidth,
        windowHeight: node.offsetHeight,
      });
      if (isCanvasBlank(canvas)) {
        // eslint-disable-next-line no-console
        console.warn('[pdf] capture returned a blank canvas; aborting save.');
        alert('Could not generate PDF — please try again. If the issue persists, use Print instead.');
        return;
      }
    }

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const naturalHeight = (canvas.height * pageWidth) / canvas.width;
    const imgData = canvas.toDataURL('image/png');

    if (naturalHeight <= pageHeight) {
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, naturalHeight);
    } else if (naturalHeight <= pageHeight * 1.15) {
      // Slight overflow: squeeze to one page rather than spilling a second
      // near-duplicate page (the original "invoice appears twice" bug).
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
    } else {
      // Genuine multi-page: slice the canvas into A4-height pixel chunks
      // and emit each as its own page image — no overlap.
      const pxPerMm = canvas.width / pageWidth;
      const slicePxHeight = Math.floor(pageHeight * pxPerMm);
      let renderedPx = 0;
      let isFirstPage = true;

      while (renderedPx < canvas.height) {
        const slicePx = Math.min(slicePxHeight, canvas.height - renderedPx);
        const slice = document.createElement('canvas');
        slice.width = canvas.width;
        slice.height = slicePx;
        const ctx = slice.getContext('2d');
        if (!ctx) break;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, slice.width, slice.height);
        ctx.drawImage(canvas, 0, -renderedPx);

        if (!isFirstPage) pdf.addPage();
        isFirstPage = false;

        pdf.addImage(
          slice.toDataURL('image/png'),
          'PNG',
          0,
          0,
          pageWidth,
          slicePx / pxPerMm,
        );
        renderedPx += slicePx;
      }
    }

    deliverPdf(pdf, filename);
  }, []);

  return { handlePrint, handleDownloadPdf };
};

/* ─── helpers ──────────────────────────────────────────────────── */

function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 767.98px)').matches;
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  // iPadOS 13+ reports as Mac; sniff for touch points to disambiguate.
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function waitForImages(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll('img'));
  await Promise.all(
    imgs.map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const done = () => resolve();
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
        // Safety timeout so a stuck asset doesn't block forever.
        setTimeout(done, 3000);
      });
    }),
  );
}

function isCanvasBlank(canvas: HTMLCanvasElement): boolean {
  if (canvas.width < 50 || canvas.height < 50) return true;
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;
  // Sample a small area at the centre; if every pixel is fully transparent
  // or pure white, treat as blank.
  try {
    const x = Math.floor(canvas.width / 2);
    const y = Math.floor(canvas.height / 2);
    const data = ctx.getImageData(Math.max(0, x - 25), Math.max(0, y - 25), 50, 50).data;
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      if (a === 0) continue;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      if (r < 250 || g < 250 || b < 250) return false;
    }
    return true;
  } catch {
    // CORS-tainted canvas — assume not blank.
    return false;
  }
}

interface JsPdfLike {
  save: (filename: string) => void;
  output: (type: 'bloburl') => string | URL;
}

/**
 * iOS Safari sometimes silently drops `pdf.save()` (anchor-click downloads
 * are blocked from background promises). Open the blob URL in a new tab on
 * iOS so the share sheet handles it; fall back to save if popup is blocked.
 */
function deliverPdf(pdf: JsPdfLike, filename: string): void {
  const fullName = `${filename}.pdf`;
  if (isIOS()) {
    try {
      const blobUrl = pdf.output('bloburl').toString();
      const win = window.open(blobUrl, '_blank');
      if (!win) pdf.save(fullName);
      return;
    } catch {
      pdf.save(fullName);
      return;
    }
  }
  pdf.save(fullName);
}
