import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Printer, RotateCcw, Eye, X, Download, MessageCircle } from 'lucide-react';

interface Props {
  title: string;
  subtitle?: string;
  onPrint: () => void;
  onDownloadPdf?: () => void | Promise<void>;
  /** Shares via WhatsApp. Receives the PDF download as a prerequisite, so this
   * should download the PDF first, then open the WhatsApp share sheet. */
  onShareWhatsApp?: () => void | Promise<void>;
  onReset?: () => void;
  preview: ReactNode;
  children: ReactNode;
  /** When non-empty, the Print/PDF buttons are disabled and the message is shown above them. */
  disabledReason?: string;
}

/**
 * Two-column shell: editor on the left, A4 preview on the right.
 * On screens narrower than 768px the preview is hidden by default and revealed
 * via an in-editor "Preview" toggle that overlays the form.
 *
 * NOTE: PDF export captures from a dedicated off-screen `PdfExportRoot` (mounted
 * via portal to <body>) — NOT from the visible preview. This makes capture work
 * even when the mobile preview overlay is closed (display: none) and avoids
 * the mobile transform-scale that would otherwise shrink the captured output.
 */
export function DocumentFormShell({
  title, subtitle, onPrint, onDownloadPdf, onShareWhatsApp, onReset, preview, children, disabledReason,
}: Props) {
  const [previewOpen, setPreviewOpen] = useState(false);
  // Tracks which async action (if any) is in flight, so the buttons can show
  // a busy state and can't be double-tapped while a PDF is still rendering —
  // easy to trigger twice on mobile where generation takes a beat.
  const [busyAction, setBusyAction] = useState<'pdf' | 'whatsapp' | null>(null);
  const disabled = Boolean(disabledReason);
  const isBusy = busyAction !== null;

  // Mobile preview is scaled down with `transform: scale()`, which doesn't
  // shrink the element's layout box — so the scaled wrapper needs its real
  // (unscaled) height in px to size itself correctly, especially now that
  // multi-page invoices make the preview taller than a single A4 sheet.
  const paperRef = useRef<HTMLDivElement>(null);
  const scaleBoxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const paper = paperRef.current;
    const box = scaleBoxRef.current;
    if (!paper || !box) return;
    const ro = new ResizeObserver(([entry]) => {
      box.style.setProperty('--preview-content-h', `${entry.contentRect.height}px`);
    });
    ro.observe(paper);
    return () => ro.disconnect();
  }, []);

  const runBusy = async (action: 'pdf' | 'whatsapp', fn: () => void | Promise<void>) => {
    if (isBusy) return;
    setBusyAction(action);
    try {
      await fn();
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="form-shell">
      <section className="form-shell__editor">
        <header className="form-shell__header">
          {subtitle && <div className="form-shell__header-sup">{subtitle}</div>}
          <h1 className="form-shell__title">{title}</h1>
        </header>

        <div className="form-shell__body">{children}</div>

        <footer className="form-shell__footer">
          {disabledReason && (
            <div className="form-shell__error" role="status">{disabledReason}</div>
          )}
          <div className="form-shell__actions">
            {onReset && (
              <button type="button" onClick={onReset} className="sw-btn-ghost">
                <RotateCcw size={13} />
                Reset
              </button>
            )}
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="sw-btn-ghost form-shell__mobile-only"
            >
              <Eye size={13} />
              Preview
            </button>
            <div className="form-shell__footer-spacer" />
            <button
              type="button"
              onClick={onPrint}
              className="sw-btn-ghost"
              disabled={disabled || isBusy}
              title={disabledReason}
            >
              <Printer size={14} />
              Print
            </button>
            {onShareWhatsApp && (
              <button
                type="button"
                onClick={() => runBusy('whatsapp', onShareWhatsApp)}
                className="sw-btn-whatsapp"
                disabled={disabled || isBusy}
                title={disabledReason}
              >
                <MessageCircle size={14} />
                {busyAction === 'whatsapp' ? 'Preparing…' : 'Share'}
              </button>
            )}
            {onDownloadPdf && (
              <button
                type="button"
                onClick={() => runBusy('pdf', onDownloadPdf)}
                className="sw-btn-primary"
                disabled={disabled || isBusy}
                title={disabledReason}
              >
                <Download size={14} />
                {busyAction === 'pdf' ? 'Generating…' : 'Save PDF'}
              </button>
            )}
          </div>
        </footer>
      </section>

      <aside className={`form-shell__preview${previewOpen ? ' form-shell__preview--open' : ''}`}>
        <div className="form-shell__preview-bar">
          <span>Document Preview · A4</span>
          <button
            type="button"
            className="sw-btn-icon form-shell__preview-close"
            onClick={() => setPreviewOpen(false)}
            title="Close preview"
            aria-label="Close preview"
          >
            <X size={14} />
          </button>
        </div>
        <div className="form-shell__preview-scroll">
          <div className="form-shell__preview-scale-box" ref={scaleBoxRef}>
            <div className="form-shell__preview-paper" ref={paperRef}>{preview}</div>
          </div>
        </div>
      </aside>

      <PdfExportRoot>{preview}</PdfExportRoot>
    </div>
  );
}

/**
 * Off-screen, always-rendered, fixed A4-width copy of the preview. Captured by
 * `usePdfExport` so PDF generation is independent of the visible UI state
 * (mobile preview overlay open/closed, scaled, scrolled, etc.).
 *
 * Portal-mounted to <body> so no ancestor's `display:none`, transform, or
 * overflow can affect the capture.
 */
function PdfExportRoot({ children }: { children: ReactNode }) {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div id="document-preview-root" className="pdf-export-root" aria-hidden="true">
      {children}
    </div>,
    document.body,
  );
}
