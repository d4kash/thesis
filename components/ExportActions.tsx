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
          Exports include a draft label and a quality-review summary. They are working drafts for you to review with your supervisor, not submission-ready theses.
        </p>
      </div>
      <div className="export-actions__buttons">
        <button className="button button--secondary" disabled={!enabled} onClick={onCopy} type="button">
          Copy draft text
        </button>
        <button className="button" disabled={!enabled} onClick={onDownload} type="button">
          Download working draft
        </button>
        <span aria-live="polite" className="export-status">
          {status}
        </span>
      </div>
    </section>
  );
}
