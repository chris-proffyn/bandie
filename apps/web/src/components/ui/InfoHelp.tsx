import { useEffect, useId, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import '../../styles/infoHelp.css';

type InfoHelpButtonProps = {
  label: string;
  title?: string;
  children: ReactNode;
  className?: string;
};

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12 10v6M12 7h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function InfoHelpButton({ label, title, children, className }: InfoHelpButtonProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const dialogTitle = title ?? label;

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={['info-help-trigger', className].filter(Boolean).join(' ')}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <InfoIcon />
      </button>

      {open
        ? createPortal(
            <div className="info-help-backdrop" role="presentation" onClick={() => setOpen(false)}>
              <div
                className="info-help-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                onClick={(event) => event.stopPropagation()}
              >
                <header className="info-help-dialog-header">
                  <h3 id={titleId}>{dialogTitle}</h3>
                  <button
                    type="button"
                    className="info-help-dialog-close"
                    aria-label="Close"
                    onClick={() => setOpen(false)}
                  >
                    ×
                  </button>
                </header>
                <div className="info-help-dialog-body">{children}</div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

type HeadingWithHelpProps = {
  as?: 'h1' | 'h2' | 'h3' | 'h4';
  className?: string;
  helpLabel: string;
  helpTitle?: string;
  help: ReactNode;
  children: ReactNode;
};

export function HeadingWithHelp({
  as: Tag = 'h2',
  className,
  helpLabel,
  helpTitle,
  help,
  children,
}: HeadingWithHelpProps) {
  return (
    <div className="heading-with-help">
      <Tag className={className}>{children}</Tag>
      <InfoHelpButton label={helpLabel} title={helpTitle}>
        {help}
      </InfoHelpButton>
    </div>
  );
}
