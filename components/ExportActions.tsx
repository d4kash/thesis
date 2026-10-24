interface ExportActionsProps {
  enabled: boolean;
  onCopy: () => void;
  onDownload: () => void;
  onSupervisorDownload: () => void;
  status: string;
}

export function ExportActions({ enabled, onCopy, onDownload, onSupervisorDownload, status }: ExportActionsProps) {
  return (
    <section className="export-actions" aria-label="Draft and supervisor export">
      <div>
        <p className="eyebrow">EXPORT</p>
        <p>
          The working draft includes a draft label and quality-review summary. The supervisor packet remains available to surface unresolved records, but neither export is a submission-ready thesis.
        </p>
      </div>
      <div className="export-actions__buttons">
        <button className="button button--secondary" disabled={!enabled} onClick={onCopy} type="button">
          Copy draft text
        </button>
        <button className="button" disabled={!enabled} onClick={onDownload} type="button">
          Download working draft
        </button>
        <button className="button button--secondary" onClick={onSupervisorDownload} type="button">
          Download supervisor review packet
        </button>
        <span aria-live="polite" className="export-status">
          {status}
        </span>
      </div>
    </section>
  );
}
