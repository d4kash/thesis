interface ExportActionsProps {
  enabled: boolean;
  onCopy: () => void;
  onDownload: () => void;
  status: string;
}

export function ExportActions({ enabled, onCopy, onDownload, status }: ExportActionsProps) {
  return (
    <section className="export-actions" aria-label="Draft export">
      <div>
        <p className="eyebrow">EXPORT</p>
        <p>
          Exports include a demonstration watermark and quality-review summary. They are working drafts, not submission-ready theses.
        </p>
      </div>
      <div className="export-actions__buttons">
        <button className="button button--secondary" onClick={onCopy} type="button">
          Copy markdown
        </button>
        <button className="button" disabled={!enabled} onClick={onDownload} type="button">
          Download draft
        </button>
        <span aria-live="polite" className="export-status">
          {status}
        </span>
      </div>
    </section>
  );
}
