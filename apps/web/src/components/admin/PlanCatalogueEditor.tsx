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

function entitlementKey(planId: string, capabilityKey: string): string {
  return `${planId}:${capabilityKey}`;
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
  const [planMetaDrafts, setPlanMetaDrafts] = useState<Record<string, PlanMetaDraft>>({});
  const [entitlementDrafts, setEntitlementDrafts] = useState<Record<string, EntitlementDraft>>({});
  const [addDrafts, setAddDrafts] = useState<Record<string, AddEntitlementDraft>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    listCapabilities()
      .then(setCapabilities)
      .catch(() => setCapabilities([]));
  }, []);

  useEffect(() => {
    setPlanMetaDrafts(buildPlanMetaDrafts(plans));
    setEntitlementDrafts(buildEntitlementDrafts(plans));
    setAddDrafts({});
  }, [plans]);

  const capabilityByKey = useMemo(
    () => new Map(capabilities.map((capability) => [capability.key, capability])),
    [capabilities],
  );

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
    const draft = addDrafts[plan.id] ?? { capabilityKey: '', value: '' };
    if (!draft.capabilityKey) {
      onError('Choose a capability to add.');
      return;
    }

    const capability = capabilityByKey.get(draft.capabilityKey);
    if (!capability) {
      onError('Unknown capability.');
      return;
    }

    const key = `add:${plan.id}:${draft.capabilityKey}`;
    setSavingKey(key);
    onError(null);

    try {
      const parsed = parseEntitlementInputValue(
        draft.value || formatEntitlementValueForInput(capability.default_value, capability.value_type),
        capability.value_type,
      );
      await updatePlanEntitlement({
        planId: plan.id,
        planCode: plan.code,
        capabilityKey: draft.capabilityKey,
        value: parsed,
        reason: changeReason || undefined,
      });
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

  return (
    <div className="admin-plan-catalogue">
      {plans.map((plan) => {
        const metaDraft = planMetaDrafts[plan.id];
        const addDraft = addDrafts[plan.id] ?? { capabilityKey: '', value: '' };
        const availableCapabilities = capabilities.filter(
          (capability) =>
            !plan.entitlements.some((entitlement) => entitlement.capability_key === capability.key),
        );

        return (
          <details key={plan.id} className="admin-plan-block" open>
            <summary>
              {metaDraft?.name ?? plan.name} <code>{plan.code}</code>
            </summary>

            {metaDraft ? (
              <div className="admin-plan-meta-grid">
                <div className="auth-field">
                  <label htmlFor={`plan-name-${plan.id}`}>Plan name</label>
                  <input
                    id={`plan-name-${plan.id}`}
                    value={metaDraft.name}
                    onChange={(event) =>
                      setPlanMetaDrafts((current) => ({
                        ...current,
                        [plan.id]: { ...metaDraft, name: event.target.value },
                      }))
                    }
                  />
                </div>
                <div className="auth-field">
                  <label htmlFor={`plan-status-${plan.id}`}>Status</label>
                  <select
                    id={`plan-status-${plan.id}`}
                    value={metaDraft.status}
                    onChange={(event) =>
                      setPlanMetaDrafts((current) => ({
                        ...current,
                        [plan.id]: {
                          ...metaDraft,
                          status: event.target.value as PlanMetaDraft['status'],
                        },
                      }))
                    }
                  >
                    <option value="draft">draft</option>
                    <option value="active">active</option>
                    <option value="retired">retired</option>
                  </select>
                </div>
                <div className="auth-field">
                  <label htmlFor={`plan-order-${plan.id}`}>Display order</label>
                  <input
                    id={`plan-order-${plan.id}`}
                    type="number"
                    value={metaDraft.displayOrder}
                    onChange={(event) =>
                      setPlanMetaDrafts((current) => ({
                        ...current,
                        [plan.id]: { ...metaDraft, displayOrder: event.target.value },
                      }))
                    }
                  />
                </div>
                <div className="auth-field admin-plan-description-field">
                  <label htmlFor={`plan-description-${plan.id}`}>Description</label>
                  <textarea
                    id={`plan-description-${plan.id}`}
                    rows={2}
                    value={metaDraft.description}
                    onChange={(event) =>
                      setPlanMetaDrafts((current) => ({
                        ...current,
                        [plan.id]: { ...metaDraft, description: event.target.value },
                      }))
                    }
                  />
                </div>
                <div className="admin-plan-meta-actions">
                  <button
                    type="button"
                    className="auth-button auth-button-secondary"
                    disabled={savingKey === `plan-meta:${plan.id}`}
                    onClick={() => void handleSavePlanMeta(plan)}
                  >
                    {savingKey === `plan-meta:${plan.id}` ? 'Saving…' : 'Save plan details'}
                  </button>
                </div>
              </div>
            ) : null}

            <table className="admin-table">
              <thead>
                <tr>
                  <th>Capability</th>
                  <th>Value</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {plan.entitlements.map((entitlement) => {
                  const rowKey = entitlementKey(plan.id, entitlement.capability_key);
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
                        <div className="admin-capability-key">
                          <code>{entitlement.capability_key}</code>
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
                              plan,
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
                              plan,
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

            <div className="admin-plan-add-entitlement">
              <div className="auth-field">
                <label htmlFor={`add-capability-${plan.id}`}>Add capability</label>
                <select
                  id={`add-capability-${plan.id}`}
                  value={addDraft.capabilityKey}
                  onChange={(event) => {
                    const capabilityKey = event.target.value;
                    const capability = capabilityByKey.get(capabilityKey);
                    setAddDrafts((current) => ({
                      ...current,
                      [plan.id]: {
                        capabilityKey,
                        value: capability
                          ? formatEntitlementValueForInput(
                              capability.default_value,
                              capability.value_type,
                            )
                          : '',
                      },
                    }));
                  }}
                >
                  <option value="">Select capability</option>
                  {availableCapabilities.map((capability) => (
                    <option key={capability.key} value={capability.key}>
                      {capability.name} ({capability.key})
                    </option>
                  ))}
                </select>
              </div>
              <div className="auth-field">
                <label htmlFor={`add-value-${plan.id}`}>Initial value</label>
                {addDraft.capabilityKey ? (
                  <EntitlementValueField
                    valueType={capabilityByKey.get(addDraft.capabilityKey)?.value_type ?? 'text'}
                    value={addDraft.value}
                    onChange={(next) =>
                      setAddDrafts((current) => ({
                        ...current,
                        [plan.id]: { ...addDraft, value: next },
                      }))
                    }
                  />
                ) : (
                  <input disabled placeholder="Choose a capability first" />
                )}
              </div>
              <button
                type="button"
                className="auth-button"
                disabled={!addDraft.capabilityKey || savingKey === `add:${plan.id}:${addDraft.capabilityKey}`}
                onClick={() => void handleAddEntitlement(plan)}
              >
                {savingKey === `add:${plan.id}:${addDraft.capabilityKey}` ? 'Adding…' : 'Add entitlement'}
              </button>
            </div>
          </details>
        );
      })}
    </div>
  );
}
