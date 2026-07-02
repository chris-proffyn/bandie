import type { ReactNode } from 'react';

type ProfileCollapsibleSectionProps = {
  title: string;
  summary?: string;
  actions?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
};

export function ProfileCollapsibleSection({
  title,
  summary,
  actions,
  defaultOpen = false,
  children,
}: ProfileCollapsibleSectionProps) {
  return (
    <details className="profile-collapsible-section panel" open={defaultOpen ? true : undefined}>
      <summary className="profile-collapsible-summary">
        <div className="profile-collapsible-summary-text">
          <h2>{title}</h2>
          {summary ? <p>{summary}</p> : null}
        </div>
        <div className="profile-collapsible-summary-end">
          {actions ? (
            <div
              className="profile-collapsible-actions"
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              {actions}
            </div>
          ) : null}
          <span className="profile-collapsible-chevron" aria-hidden="true" />
        </div>
      </summary>
      <div className="profile-collapsible-body">{children}</div>
    </details>
  );
}
