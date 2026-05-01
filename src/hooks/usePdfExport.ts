import { useCallback } from 'react';

const PREVIEW_ROOT_ID = 'document-preview-root';

interface PdfTarget {
  /** Filename without extension. e.g. `SAMS-INVOICE-001`. */
  filename: string;
}

/**
 * Print: opens the browser print dialog. The `@media print` rules in
 * `index.css` already isolate `.form-shell__preview-paper` for printing.
 *
 * Save PDF: rasterises `#document-preview-root` and assembles A4 pages.
 *
 * Two pitfalls handled here:
 *
 *  1. **Almost-fits content was rendering twice.** The previous algorithm
 *     placed the full image on every page at a shifting Y offset, so any
 *     overflow above 0 mm and below ~30 mm produced two pages with ~95%
 *     overlap (the user sees the invoice "twice"). We now slice the source
 *     canvas into page-sized chunks with zero overlap, and for small
 *     overflow we squeeze the image to one page instead of paginating.
 *
 *  2. **Mobile preview is `transform: scale(0.45)`.** html2canvas captures
 *     the post-transform size, which would yield a thumbnail-sized PDF on
 *     phones. We strip the transform on the captured node for the duration
 *     of the capture and restore it after.
 */
export const usePdfExport = () => {
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleDownloadPdf = useCallback(async ({ filename }: PdfTarget) => {
    const node = document.getElementById(PREVIEW_ROOT_ID);
    if (!node) {
      window.print();
      return;
    }

    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import('jspdf'),
      import('html2canvas'),
    ]);

    // Strip any active scale transform so html2canvas captures natural A4 size.
    const originalTransform = node.style.transform;
    const originalMarginBottom = node.style.marginBottom;
    node.style.transform = 'none';
    node.style.marginBottom = '0';

    let canvas: HTMLCanvasElement;
    try {
      canvas = await html2canvas(node, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: node.scrollWidth,
      });
    } finally {
      node.style.transform = originalTransform;
      node.style.marginBottom = originalMarginBottom;
    }

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const naturalHeight = (canvas.height * pageWidth) / canvas.width;
    const imgData = canvas.toDataURL('image/png');

    if (naturalHeight <= pageHeight) {
      // Fits comfortably on one page.
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, naturalHeight);
    } else if (naturalHeight <= pageHeight * 1.15) {
      // Slight overflow (≤15%): squeeze to one page rather than spilling
      // a near-duplicate page-2 with the same content.
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
    } else {
      // Genuine multi-page: slice the source canvas into A4-height pixel
      // chunks and emit each as its own page image — no overlap, no
      // re-positioning of the full image.
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

    pdf.save(`${filename}.pdf`);
  }, []);

  return { handlePrint, handleDownloadPdf };
};
