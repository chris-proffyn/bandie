import type { ReactNode } from 'react';

type WorkspaceEditButtonProps = {
  label?: string;
  onClick: () => void;
};

export function WorkspaceEditButton({ label = 'Edit', onClick }: WorkspaceEditButtonProps) {
  return (
    <button type="button" className="workspace-edit-button" onClick={onClick}>
      {label}
    </button>
  );
}

type WorkspaceEditActionsProps = {
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
  saveLabel?: string;
};

export function WorkspaceEditActions({
  onSave,
  onCancel,
  saving = false,
  saveLabel = 'Save',
}: WorkspaceEditActionsProps) {
  return (
    <div className="workspace-edit-actions">
      <button type="button" className="auth-button" onClick={onSave} disabled={saving}>
        {saving ? 'Saving…' : saveLabel}
      </button>
      <button
        type="button"
        className="auth-button auth-button-secondary"
        onClick={onCancel}
        disabled={saving}
      >
        Cancel
      </button>
    </div>
  );
}

type WorkspaceEditableSectionProps = {
  title: string;
  canEdit: boolean;
  isEditing: boolean;
  onEdit: () => void;
  editLabel?: string;
  className?: string;
  children: ReactNode;
};

export function WorkspaceEditableSection({
  title,
  canEdit,
  isEditing,
  onEdit,
  editLabel,
  className = '',
  children,
}: WorkspaceEditableSectionProps) {
  return (
    <div
      className={`workspace-field-row${isEditing ? ' workspace-field-row-editing' : ''} ${className}`.trim()}
    >
      <div className="workspace-field-header">
        <h3 className="workspace-field-title">{title}</h3>
        {canEdit && !isEditing ? (
          <WorkspaceEditButton label={editLabel} onClick={onEdit} />
        ) : null}
      </div>
      <div className="workspace-field-body">{children}</div>
    </div>
  );
}

type WorkspaceSectionBlockProps = {
  title: string;
  canEdit: boolean;
  isEditing: boolean;
  onEdit: () => void;
  editLabel?: string;
  id?: string;
  className?: string;
  children: ReactNode;
};

export function WorkspaceSectionBlock({
  title,
  canEdit,
  isEditing,
  onEdit,
  editLabel,
  id,
  className = '',
  children,
}: WorkspaceSectionBlockProps) {
  return (
    <section className={`band-profile-section workspace-section-block ${className}`.trim()} id={id}>
      <div className="workspace-field-header">
        <h2 className="workspace-section-title">{title}</h2>
        {canEdit && !isEditing ? (
          <WorkspaceEditButton label={editLabel} onClick={onEdit} />
        ) : null}
      </div>
      <div className="workspace-field-body">{children}</div>
    </section>
  );
}
