import { useEffect, useMemo, useState } from 'react';
import {
  addEntitlementDraftItem,
  buildEntitlementImpactPreview,
  createEntitlementDraft,
  createEntitlementOverride,
  deleteEntitlementOverride,
  isEntitlementsEnforcedOnPlatform,
  listEntitlementDraftItems,
  listEntitlementDrafts,
  listEntitlementOverrides,
  listGateDecisionLogs,
  listPlansWithEntitlements,
  publishEntitlementDraft,
  setEntitlementsEnforced,
  type EntitlementDraft,
  type EntitlementDraftItem,
  type EntitlementOverride,
  type GateDecisionLog,
  type PlanWithEntitlements,
} from '@bandie/data';

export function AdminEntitlementsPage() {
  const [plans, setPlans] = useState<PlanWithEntitlements[]>([]);
  const [drafts, setDrafts] = useState<EntitlementDraft[]>([]);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [draftItems, setDraftItems] = useState<EntitlementDraftItem[]>([]);
  const [overrides, setOverrides] = useState<EntitlementOverride[]>([]);
  const [gateLogs, setGateLogs] = useState<GateDecisionLog[]>([]);
  const [enforced, setEnforced] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [publishReason, setPublishReason] = useState('');

  const [overrideForm, setOverrideForm] = useState({
    subjectType: 'user',
    subjectId: '',
    capabilityKey: 'songs.max_count',
    value: '999',
    reason: '',
  });

  const [draftItemForm, setDraftItemForm] = useState({
    planCode: 'player_free',
    capabilityKey: 'songs.max_count',
    newValue: '6',
  });

  async function loadAll() {
    setLoading(true);
    setError(null);

    try {
      const [planRows, draftRows, overrideRows, logRows, enforcedOnPlatform] = await Promise.all([
        listPlansWithEntitlements(),
        listEntitlementDrafts(),
        listEntitlementOverrides(),
        listGateDecisionLogs(50),
        isEntitlementsEnforcedOnPlatform(),
      ]);
      setPlans(planRows);
      setDrafts(draftRows);
      setOverrides(overrideRows);
      setGateLogs(logRows);
      setEnforced(enforcedOnPlatform);
      if (!selectedDraftId && draftRows[0]) {
        setSelectedDraftId(draftRows[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load entitlement admin.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    if (!selectedDraftId) {
      setDraftItems([]);
      return;
    }

    listEntitlementDraftItems(selectedDraftId)
      .then(setDraftItems)
      .catch(() => setDraftItems([]));
  }, [selectedDraftId]);

  const impactPreview = useMemo(
    () => buildEntitlementImpactPreview(plans, draftItems),
    [plans, draftItems],
  );

  async function handleCreateDraft() {
    if (!draftName.trim()) {
      return;
    }

    try {
      const draft = await createEntitlementDraft({ name: draftName.trim() });
      setDraftName('');
      setSelectedDraftId(draft.id);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create draft.');
    }
  }

  async function handleAddDraftItem() {
    if (!selectedDraftId) {
      return;
    }

    const plan = plans.find((entry) => entry.code === draftItemForm.planCode);
    if (!plan) {
      return;
    }

    const current = plan.entitlements.find(
      (entry) => entry.capability_key === draftItemForm.capabilityKey,
    );

    try {
      await addEntitlementDraftItem({
        draftId: selectedDraftId,
        planId: plan.id,
        capabilityKey: draftItemForm.capabilityKey,
        oldValue: current?.value ?? null,
        newValue: draftItemForm.newValue,
      });
      const items = await listEntitlementDraftItems(selectedDraftId);
      setDraftItems(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add draft item.');
    }
  }

  async function handlePublishDraft() {
    if (!selectedDraftId) {
      return;
    }

    try {
      await publishEntitlementDraft(selectedDraftId, publishReason || undefined);
      setPublishReason('');
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to publish draft.');
    }
  }

  async function handleToggleEnforcement() {
    try {
      await setEntitlementsEnforced(!enforced);
      setEnforced(!enforced);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update enforcement.');
    }
  }

  async function handleCreateOverride() {
    try {
      await createEntitlementOverride({
        subjectType: overrideForm.subjectType,
        subjectId: overrideForm.subjectId,
        capabilityKey: overrideForm.capabilityKey,
        value: overrideForm.value,
        reason: overrideForm.reason,
      });
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create override.');
    }
  }

  return (
    <div className="admin-main">
      <section className="panel">
        <p className="my-bands-eyebrow">Entitlements</p>
        <h2>Plan catalogue and enforcement</h2>
        <p className="my-bands-lead">
          Review published entitlements, stage draft changes, inspect gate denials, and toggle
          platform enforcement (Phase 14.6).
        </p>
        <label className="communications-hide-resolved-toggle">
          <input type="checkbox" checked={enforced} onChange={() => void handleToggleEnforcement()} />
          Enforce entitlements on platform
        </label>
        {error ? <div className="auth-message auth-message-error">{error}</div> : null}
      </section>

      <section className="panel">
        <h3>Plan catalogue</h3>
        {loading ? <p className="workspace-empty-note">Loading plans…</p> : null}
        {plans.map((plan) => (
          <details key={plan.id} className="admin-plan-block">
            <summary>
              {plan.name} <code>{plan.code}</code>
            </summary>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Capability</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {plan.entitlements.map((entitlement) => (
                  <tr key={entitlement.capability_key}>
                    <td>{entitlement.capability_name}</td>
                    <td>
                      <code>{JSON.stringify(entitlement.value)}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        ))}
      </section>

      <section className="panel">
        <h3>Draft / publish workflow</h3>
        <div className="admin-search-bar">
          <input
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            placeholder="Draft name"
          />
          <button type="button" className="auth-button" onClick={() => void handleCreateDraft()}>
            Create draft
          </button>
        </div>
        <div className="auth-field">
          <label htmlFor="draft-select">Selected draft</label>
          <select
            id="draft-select"
            value={selectedDraftId ?? ''}
            onChange={(event) => setSelectedDraftId(event.target.value || null)}
          >
            <option value="">Select draft</option>
            {drafts
              .filter((draft) => draft.status === 'draft')
              .map((draft) => (
                <option key={draft.id} value={draft.id}>
                  {draft.name}
                </option>
              ))}
          </select>
        </div>
        <div className="gig-detail-grid">
          <div className="auth-field">
            <label htmlFor="draft-plan">Plan</label>
            <select
              id="draft-plan"
              value={draftItemForm.planCode}
              onChange={(event) =>
                setDraftItemForm((current) => ({ ...current, planCode: event.target.value }))
              }
            >
              {plans.map((plan) => (
                <option key={plan.id} value={plan.code}>
                  {plan.name}
                </option>
              ))}
            </select>
          </div>
          <div className="auth-field">
            <label htmlFor="draft-capability">Capability key</label>
            <input
              id="draft-capability"
              value={draftItemForm.capabilityKey}
              onChange={(event) =>
                setDraftItemForm((current) => ({ ...current, capabilityKey: event.target.value }))
              }
            />
          </div>
          <div className="auth-field">
            <label htmlFor="draft-value">New value (JSON)</label>
            <input
              id="draft-value"
              value={draftItemForm.newValue}
              onChange={(event) =>
                setDraftItemForm((current) => ({ ...current, newValue: event.target.value }))
              }
            />
          </div>
        </div>
        <div className="gig-detail-actions">
          <button type="button" className="auth-button auth-button-secondary" onClick={() => void handleAddDraftItem()}>
            Add draft change
          </button>
          <input
            value={publishReason}
            onChange={(event) => setPublishReason(event.target.value)}
            placeholder="Publish reason (audit)"
          />
          <button type="button" className="auth-button" onClick={() => void handlePublishDraft()}>
            Publish draft
          </button>
        </div>
        {impactPreview.length ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Capability</th>
                <th>Current</th>
                <th>New</th>
              </tr>
            </thead>
            <tbody>
              {impactPreview.map((row) => (
                <tr key={`${row.planCode}-${row.capabilityKey}`}>
                  <td>{row.planCode}</td>
                  <td>{row.capabilityKey}</td>
                  <td>
                    <code>{JSON.stringify(row.currentValue)}</code>
                  </td>
                  <td>
                    <code>{JSON.stringify(row.newValue)}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>

      <section className="panel">
        <h3>Manual overrides</h3>
        <div className="gig-detail-grid">
          <div className="auth-field">
            <label htmlFor="override-subject-type">Subject type</label>
            <input
              id="override-subject-type"
              value={overrideForm.subjectType}
              onChange={(event) =>
                setOverrideForm((current) => ({ ...current, subjectType: event.target.value }))
              }
            />
          </div>
          <div className="auth-field">
            <label htmlFor="override-subject-id">Subject ID</label>
            <input
              id="override-subject-id"
              value={overrideForm.subjectId}
              onChange={(event) =>
                setOverrideForm((current) => ({ ...current, subjectId: event.target.value }))
              }
            />
          </div>
          <div className="auth-field">
            <label htmlFor="override-capability">Capability</label>
            <input
              id="override-capability"
              value={overrideForm.capabilityKey}
              onChange={(event) =>
                setOverrideForm((current) => ({ ...current, capabilityKey: event.target.value }))
              }
            />
          </div>
          <div className="auth-field">
            <label htmlFor="override-value">Value</label>
            <input
              id="override-value"
              value={overrideForm.value}
              onChange={(event) =>
                setOverrideForm((current) => ({ ...current, value: event.target.value }))
              }
            />
          </div>
        </div>
        <div className="auth-field">
          <label htmlFor="override-reason">Reason</label>
          <input
            id="override-reason"
            value={overrideForm.reason}
            onChange={(event) =>
              setOverrideForm((current) => ({ ...current, reason: event.target.value }))
            }
          />
        </div>
        <button type="button" className="auth-button" onClick={() => void handleCreateOverride()}>
          Create override
        </button>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Capability</th>
              <th>Value</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {overrides.map((override) => (
              <tr key={override.id}>
                <td>
                  {override.subject_type}/{override.subject_id}
                </td>
                <td>{override.capability_key}</td>
                <td>
                  <code>{JSON.stringify(override.value)}</code>
                </td>
                <td>
                  <button
                    type="button"
                    className="auth-button auth-button-secondary"
                    onClick={() => void deleteEntitlementOverride(override.id).then(loadAll)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel">
        <h3>Gate decision logs</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Capability</th>
              <th>Plan</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {gateLogs.map((log) => (
              <tr key={log.id}>
                <td>{new Date(log.created_at).toLocaleString('en-GB')}</td>
                <td>{log.capability_key}</td>
                <td>{log.current_plan_code ?? '—'}</td>
                <td>{log.reason_code ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
