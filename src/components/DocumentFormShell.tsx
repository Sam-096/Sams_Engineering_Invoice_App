import { useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Printer, RotateCcw, Eye, X, Download } from 'lucide-react';

interface Props {
  title: string;
  subtitle?: string;
  onPrint: () => void;
  onDownloadPdf?: () => void;
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
  title, subtitle, onPrint, onDownloadPdf, onReset, preview, children, disabledReason,
}: Props) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const disabled = Boolean(disabledReason);

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
              disabled={disabled}
              title={disabledReason}
            >
              <Printer size={14} />
              Print
            </button>
            {onDownloadPdf && (
              <button
                type="button"
                onClick={onDownloadPdf}
                className="sw-btn-primary"
                disabled={disabled}
                title={disabledReason}
              >
                <Download size={14} />
                Save PDF
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
          <div className="form-shell__preview-paper">{preview}</div>
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
