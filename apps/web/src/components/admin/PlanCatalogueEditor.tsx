import { useEffect, useMemo, useState } from 'react';
import {
  formatEntitlementValueForInput,
  listCapabilities,
  parseEntitlementInputValue,
  removePlanEntitlement,
  updatePlanCatalogueEntry,
  updatePlanEntitlement,
  type CapabilityDefinition,
  type PlanWithEntitlements,
} from '@bandie/data';

type PlanCatalogueEditorProps = {
  plans: PlanWithEntitlements[];
  loading: boolean;
  changeReason: string;
  onChanged: () => Promise<void>;
  onError: (message: string | null) => void;
};

type PlanMetaDraft = {
  name: string;
  description: string;
  status: 'draft' | 'active' | 'retired';
  displayOrder: string;
};

type EntitlementDraft = {
  value: string;
};

type AddEntitlementDraft = {
  capabilityKey: string;
  value: string;
};

type PlanScopeGroup = 'player' | 'organiser';

function entitlementKey(planId: string, capabilityKey: string): string {
  return `${planId}:${capabilityKey}`;
}

function planScopeGroup(code: string): PlanScopeGroup {
  return code.startsWith('organiser_') ? 'organiser' : 'player';
}

function scopeGroupLabel(scope: PlanScopeGroup): string {
  return scope === 'organiser' ? 'Organiser plans' : 'Player plans';
}

function formatBillingLabel(interval: string): string {
  if (interval === 'free') {
    return 'Free';
  }
  if (interval === 'monthly') {
    return 'Monthly';
  }
  return interval;
}

function buildEntitlementDrafts(plans: PlanWithEntitlements[]): Record<string, EntitlementDraft> {
  const drafts: Record<string, EntitlementDraft> = {};

  for (const plan of plans) {
    for (const entitlement of plan.entitlements) {
      drafts[entitlementKey(plan.id, entitlement.capability_key)] = {
        value: formatEntitlementValueForInput(entitlement.value, entitlement.value_type),
      };
    }
  }

  return drafts;
}

function buildPlanMetaDrafts(plans: PlanWithEntitlements[]): Record<string, PlanMetaDraft> {
  return Object.fromEntries(
    plans.map((plan) => [
      plan.id,
      {
        name: plan.name,
        description: plan.description ?? '',
        status: plan.status as PlanMetaDraft['status'],
        displayOrder: String(plan.display_order),
      },
    ]),
  );
}

function EntitlementValueField({
  valueType,
  value,
  onChange,
}: {
  valueType: string;
  value: string;
  onChange: (next: string) => void;
}) {
  if (valueType === 'boolean') {
    return (
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="true">true</option>
        <option value="false">false</option>
      </select>
    );
  }

  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={valueType === 'integer' ? 'e.g. 6' : valueType === 'text' ? 'e.g. basic' : 'JSON value'}
    />
  );
}

export function PlanCatalogueEditor({
  plans,
  loading,
  changeReason,
  onChanged,
  onError,
}: PlanCatalogueEditorProps) {
  const [capabilities, setCapabilities] = useState<CapabilityDefinition[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [planMetaDrafts, setPlanMetaDrafts] = useState<Record<string, PlanMetaDraft>>({});
  const [entitlementDrafts, setEntitlementDrafts] = useState<Record<string, EntitlementDraft>>({});
  const [addDraft, setAddDraft] = useState<AddEntitlementDraft>({ capabilityKey: '', value: '' });
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    listCapabilities()
      .then(setCapabilities)
      .catch(() => setCapabilities([]));
  }, []);

  useEffect(() => {
    setPlanMetaDrafts(buildPlanMetaDrafts(plans));
    setEntitlementDrafts(buildEntitlementDrafts(plans));
    setAddDraft({ capabilityKey: '', value: '' });
  }, [plans]);

  useEffect(() => {
    if (plans.length === 0) {
      setSelectedPlanId(null);
      return;
    }

    if (!selectedPlanId || !plans.some((plan) => plan.id === selectedPlanId)) {
      setSelectedPlanId(plans[0].id);
    }
  }, [plans, selectedPlanId]);

  const groupedPlans = useMemo(
    () => ({
      player: plans.filter((plan) => planScopeGroup(plan.code) === 'player'),
      organiser: plans.filter((plan) => planScopeGroup(plan.code) === 'organiser'),
    }),
    [plans],
  );

  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId);
  const metaDraft = selectedPlan ? planMetaDrafts[selectedPlan.id] : undefined;

  const capabilityByKey = useMemo(
    () => new Map(capabilities.map((capability) => [capability.key, capability])),
    [capabilities],
  );

  const availableCapabilities = selectedPlan
    ? capabilities.filter(
        (capability) =>
          !selectedPlan.entitlements.some(
            (entitlement) => entitlement.capability_key === capability.key,
          ),
      )
    : [];

  function handleSelectPlan(planId: string) {
    setSelectedPlanId(planId);
    setAddDraft({ capabilityKey: '', value: '' });
    onError(null);
  }

  async function handleSavePlanMeta(plan: PlanWithEntitlements) {
    const draft = planMetaDrafts[plan.id];
    if (!draft) {
      return;
    }

    const key = `plan-meta:${plan.id}`;
    setSavingKey(key);
    onError(null);

    try {
      await updatePlanCatalogueEntry({
        planId: plan.id,
        planCode: plan.code,
        name: draft.name,
        description: draft.description,
        status: draft.status,
        displayOrder: Number(draft.displayOrder),
        reason: changeReason || undefined,
      });
      await onChanged();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Unable to save plan details.');
    } finally {
      setSavingKey(null);
    }
  }

  async function handleSaveEntitlement(
    plan: PlanWithEntitlements,
    capabilityKey: string,
    valueType: string,
    oldValue: unknown,
  ) {
    const draft = entitlementDrafts[entitlementKey(plan.id, capabilityKey)];
    if (!draft) {
      return;
    }

    const key = entitlementKey(plan.id, capabilityKey);
    setSavingKey(key);
    onError(null);

    try {
      const parsed = parseEntitlementInputValue(draft.value, valueType);
      await updatePlanEntitlement({
        planId: plan.id,
        planCode: plan.code,
        capabilityKey,
        value: parsed,
        oldValue,
        reason: changeReason || undefined,
      });
      await onChanged();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Unable to save entitlement.');
    } finally {
      setSavingKey(null);
    }
  }

  async function handleRemoveEntitlement(
    plan: PlanWithEntitlements,
    capabilityKey: string,
    oldValue: unknown,
  ) {
    if (!window.confirm(`Remove ${capabilityKey} from ${plan.name}?`)) {
      return;
    }

    const key = `remove:${entitlementKey(plan.id, capabilityKey)}`;
    setSavingKey(key);
    onError(null);

    try {
      await removePlanEntitlement({
        planId: plan.id,
        planCode: plan.code,
        capabilityKey,
        oldValue,
        reason: changeReason || undefined,
      });
      await onChanged();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Unable to remove entitlement.');
    } finally {
      setSavingKey(null);
    }
  }

  async function handleAddEntitlement(plan: PlanWithEntitlements) {
    if (!addDraft.capabilityKey) {
      onError('Choose a capability to add.');
      return;
    }

    const capability = capabilityByKey.get(addDraft.capabilityKey);
    if (!capability) {
      onError('Unknown capability.');
      return;
    }

    const key = `add:${plan.id}:${addDraft.capabilityKey}`;
    setSavingKey(key);
    onError(null);

    try {
      const parsed = parseEntitlementInputValue(
        addDraft.value || formatEntitlementValueForInput(capability.default_value, capability.value_type),
        capability.value_type,
      );
      await updatePlanEntitlement({
        planId: plan.id,
        planCode: plan.code,
        capabilityKey: addDraft.capabilityKey,
        value: parsed,
        reason: changeReason || undefined,
      });
      setAddDraft({ capabilityKey: '', value: '' });
      await onChanged();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Unable to add entitlement.');
    } finally {
      setSavingKey(null);
    }
  }

  if (loading) {
    return <p className="workspace-empty-note">Loading plans…</p>;
  }

  if (plans.length === 0) {
    return <p className="workspace-empty-note">No plans found in the catalogue.</p>;
  }

  return (
    <div className="admin-plan-catalogue">
      <div className="admin-plan-picker">
        {(['player', 'organiser'] as const).map((scope) => {
          const scopePlans = groupedPlans[scope];
          if (scopePlans.length === 0) {
            return null;
          }

          return (
            <div key={scope} className="admin-plan-picker-group">
              <p className="admin-plan-picker-label">{scopeGroupLabel(scope)}</p>
              <div className="admin-plan-picker-options" role="tablist" aria-label={scopeGroupLabel(scope)}>
                {scopePlans.map((plan) => {
                  const isSelected = plan.id === selectedPlanId;
                  const label = planMetaDrafts[plan.id]?.name ?? plan.name;

                  return (
                    <button
                      key={plan.id}
                      type="button"
                      role="tab"
                      aria-selected={isSelected}
                      className={`admin-plan-pill${isSelected ? ' is-selected' : ''}`}
                      onClick={() => handleSelectPlan(plan.id)}
                    >
                      <span className="admin-plan-pill-name">{label}</span>
                      <span className={`admin-plan-status-badge status-${plan.status}`}>
                        {plan.status}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {selectedPlan && metaDraft ? (
        <section
          className="admin-plan-detail"
          role="tabpanel"
          aria-label={`Edit ${metaDraft.name}`}
        >
          <header className="admin-plan-detail-header">
            <div>
              <h4 className="admin-plan-detail-title">{metaDraft.name}</h4>
              <p className="admin-plan-detail-meta">
                <span className="admin-plan-code" title="Internal plan code">
                  {selectedPlan.code}
                </span>
                <span aria-hidden="true"> · </span>
                <span>{formatBillingLabel(selectedPlan.billing_interval)}</span>
                <span aria-hidden="true"> · </span>
                <span>{selectedPlan.entitlements.length} entitlements</span>
              </p>
            </div>
          </header>

          <div className="admin-plan-meta-grid">
            <div className="auth-field">
              <label htmlFor={`plan-name-${selectedPlan.id}`}>Plan name</label>
              <input
                id={`plan-name-${selectedPlan.id}`}
                value={metaDraft.name}
                onChange={(event) =>
                  setPlanMetaDrafts((current) => ({
                    ...current,
                    [selectedPlan.id]: { ...metaDraft, name: event.target.value },
                  }))
                }
              />
            </div>
            <div className="auth-field">
              <label htmlFor={`plan-status-${selectedPlan.id}`}>Status</label>
              <select
                id={`plan-status-${selectedPlan.id}`}
                value={metaDraft.status}
                onChange={(event) =>
                  setPlanMetaDrafts((current) => ({
                    ...current,
                    [selectedPlan.id]: {
                      ...metaDraft,
                      status: event.target.value as PlanMetaDraft['status'],
                    },
                  }))
                }
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="retired">Retired</option>
              </select>
            </div>
            <div className="auth-field">
              <label htmlFor={`plan-order-${selectedPlan.id}`}>Display order</label>
              <input
                id={`plan-order-${selectedPlan.id}`}
                type="number"
                value={metaDraft.displayOrder}
                onChange={(event) =>
                  setPlanMetaDrafts((current) => ({
                    ...current,
                    [selectedPlan.id]: { ...metaDraft, displayOrder: event.target.value },
                  }))
                }
              />
            </div>
            <div className="auth-field admin-plan-description-field">
              <label htmlFor={`plan-description-${selectedPlan.id}`}>Description</label>
              <textarea
                id={`plan-description-${selectedPlan.id}`}
                rows={3}
                value={metaDraft.description}
                onChange={(event) =>
                  setPlanMetaDrafts((current) => ({
                    ...current,
                    [selectedPlan.id]: { ...metaDraft, description: event.target.value },
                  }))
                }
              />
            </div>
            <div className="admin-plan-meta-actions">
              <button
                type="button"
                className="auth-button"
                disabled={savingKey === `plan-meta:${selectedPlan.id}`}
                onClick={() => void handleSavePlanMeta(selectedPlan)}
              >
                {savingKey === `plan-meta:${selectedPlan.id}` ? 'Saving…' : 'Save plan details'}
              </button>
            </div>
          </div>

          <div className="admin-plan-entitlements">
            <h5>Capabilities</h5>
            {selectedPlan.entitlements.length === 0 ? (
              <p className="workspace-empty-note">No capabilities assigned to this plan yet.</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Capability</th>
                    <th>Value</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {selectedPlan.entitlements.map((entitlement) => {
                    const rowKey = entitlementKey(selectedPlan.id, entitlement.capability_key);
                    const draft = entitlementDrafts[rowKey];
                    const currentValue = formatEntitlementValueForInput(
                      entitlement.value,
                      entitlement.value_type,
                    );
                    const isDirty = draft?.value !== currentValue;

                    return (
                      <tr key={entitlement.capability_key}>
                        <td>
                          <strong>{entitlement.capability_name}</strong>
                          <div className="admin-capability-key" title={entitlement.capability_key}>
                            {entitlement.capability_key}
                          </div>
                        </td>
                        <td>
                          {draft ? (
                            <EntitlementValueField
                              valueType={entitlement.value_type}
                              value={draft.value}
                              onChange={(next) =>
                                setEntitlementDrafts((current) => ({
                                  ...current,
                                  [rowKey]: { value: next },
                                }))
                              }
                            />
                          ) : null}
                        </td>
                        <td className="admin-plan-row-actions">
                          <button
                            type="button"
                            className="auth-button auth-button-secondary"
                            disabled={!isDirty || savingKey === rowKey}
                            onClick={() =>
                              void handleSaveEntitlement(
                                selectedPlan,
                                entitlement.capability_key,
                                entitlement.value_type,
                                entitlement.value,
                              )
                            }
                          >
                            {savingKey === rowKey ? 'Saving…' : 'Save'}
                          </button>
                          <button
                            type="button"
                            className="auth-button auth-button-secondary"
                            disabled={savingKey === `remove:${rowKey}`}
                            onClick={() =>
                              void handleRemoveEntitlement(
                                selectedPlan,
                                entitlement.capability_key,
                                entitlement.value,
                              )
                            }
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="admin-plan-add-entitlement">
            <h5>Add capability</h5>
            <div className="admin-plan-add-entitlement-fields">
              <div className="auth-field">
                <label htmlFor={`add-capability-${selectedPlan.id}`}>Capability</label>
                <select
                  id={`add-capability-${selectedPlan.id}`}
                  value={addDraft.capabilityKey}
                  onChange={(event) => {
                    const capabilityKey = event.target.value;
                    const capability = capabilityByKey.get(capabilityKey);
                    setAddDraft({
                      capabilityKey,
                      value: capability
                        ? formatEntitlementValueForInput(
                            capability.default_value,
                            capability.value_type,
                          )
                        : '',
                    });
                  }}
                >
                  <option value="">Select capability</option>
                  {availableCapabilities.map((capability) => (
                    <option key={capability.key} value={capability.key}>
                      {capability.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="auth-field">
                <label htmlFor={`add-value-${selectedPlan.id}`}>Initial value</label>
                {addDraft.capabilityKey ? (
                  <EntitlementValueField
                    valueType={capabilityByKey.get(addDraft.capabilityKey)?.value_type ?? 'text'}
                    value={addDraft.value}
                    onChange={(next) => setAddDraft((current) => ({ ...current, value: next }))}
                  />
                ) : (
                  <input disabled placeholder="Choose a capability first" />
                )}
              </div>
              <button
                type="button"
                className="auth-button"
                disabled={
                  !addDraft.capabilityKey ||
                  savingKey === `add:${selectedPlan.id}:${addDraft.capabilityKey}`
                }
                onClick={() => void handleAddEntitlement(selectedPlan)}
              >
                {savingKey === `add:${selectedPlan.id}:${addDraft.capabilityKey}`
                  ? 'Adding…'
                  : 'Add capability'}
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
