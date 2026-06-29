import { getBandieClient } from './context';
import { getCurrentSession } from './auth';
import { logAdminAuditEvent } from './adminPortal';

export type PlanWithEntitlements = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: string;
  subject_type: string;
  billing_interval: string;
  display_order: number;
  entitlements: Array<{
    capability_key: string;
    value: unknown;
    capability_name: string;
    value_type: string;
  }>;
};

export type CapabilityDefinition = {
  key: string;
  name: string;
  value_type: string;
  default_value: unknown;
};

export type EntitlementDraft = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_by: string;
  published_by: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type EntitlementDraftItem = {
  id: string;
  draft_id: string;
  plan_id: string;
  capability_key: string;
  old_value: unknown;
  new_value: unknown;
  change_type: string;
  created_at: string;
};

export type EntitlementOverride = {
  id: string;
  subject_type: string;
  subject_id: string;
  capability_key: string;
  value: unknown;
  reason: string | null;
  expires_at: string | null;
  created_by: string;
  created_at: string;
};

export async function listPlansWithEntitlements(): Promise<PlanWithEntitlements[]> {
  const client = getBandieClient();

  const { data: plans, error: plansError } = await client
    .from('bandie_plans')
    .select('id, code, name, description, status, subject_type, billing_interval, display_order')
    .order('display_order', { ascending: true });

  if (plansError) {
    throw new Error(plansError.message);
  }

  const { data: entitlements, error: entitlementsError } = await client
    .from('bandie_plan_entitlements')
    .select('plan_id, capability_key, value, bandie_capabilities!inner(name, value_type)');

  if (entitlementsError) {
    throw new Error(entitlementsError.message);
  }

  const byPlan = new Map<string, PlanWithEntitlements['entitlements']>();
  for (const row of entitlements ?? []) {
    const planId = row.plan_id as string;
    const capability = row.bandie_capabilities as unknown as { name: string; value_type: string };
    const items = byPlan.get(planId) ?? [];
    items.push({
      capability_key: row.capability_key as string,
      value: row.value,
      capability_name: capability.name,
      value_type: capability.value_type,
    });
    byPlan.set(planId, items);
  }

  return (plans ?? []).map((plan) => ({
    id: plan.id as string,
    code: plan.code as string,
    name: plan.name as string,
    description: (plan.description as string | null) ?? null,
    status: plan.status as string,
    subject_type: plan.subject_type as string,
    billing_interval: plan.billing_interval as string,
    display_order: plan.display_order as number,
    entitlements: byPlan.get(plan.id as string) ?? [],
  }));
}

export async function listCapabilities(): Promise<CapabilityDefinition[]> {
  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_capabilities')
    .select('key, name, value_type, default_value')
    .order('category', { ascending: true })
    .order('key', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    key: row.key as string,
    name: row.name as string,
    value_type: row.value_type as string,
    default_value: row.default_value,
  }));
}

export function formatEntitlementValueForInput(value: unknown, valueType: string): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (valueType === 'boolean') {
    return value === true || value === 'true' ? 'true' : 'false';
  }

  if (valueType === 'text' && typeof value === 'string') {
    return value;
  }

  if (typeof value === 'string') {
    return value;
  }

  return JSON.stringify(value);
}

export function parseEntitlementInputValue(raw: string, valueType: string): unknown {
  const trimmed = raw.trim();

  if (!trimmed) {
    throw new Error('Value is required.');
  }

  switch (valueType) {
    case 'boolean':
      if (trimmed === 'true') {
        return true;
      }
      if (trimmed === 'false') {
        return false;
      }
      throw new Error('Boolean values must be true or false.');
    case 'integer': {
      const parsed = Number(trimmed);
      if (!Number.isInteger(parsed)) {
        throw new Error('Enter a whole number.');
      }
      return parsed;
    }
    case 'text':
      if (trimmed.startsWith('"')) {
        return JSON.parse(trimmed) as unknown;
      }
      return trimmed;
    default:
      return JSON.parse(trimmed) as unknown;
  }
}

export async function updatePlanCatalogueEntry(input: {
  planId: string;
  planCode: string;
  name?: string;
  description?: string | null;
  status?: 'draft' | 'active' | 'retired';
  displayOrder?: number;
  reason?: string;
}): Promise<void> {
  const updates: Record<string, unknown> = {};

  if (input.name !== undefined) {
    updates.name = input.name.trim();
  }
  if (input.description !== undefined) {
    updates.description = input.description?.trim() || null;
  }
  if (input.status !== undefined) {
    updates.status = input.status;
  }
  if (input.displayOrder !== undefined) {
    updates.display_order = input.displayOrder;
  }

  if (!Object.keys(updates).length) {
    return;
  }

  const client = getBandieClient();
  const { error } = await client.from('bandie_plans').update(updates).eq('id', input.planId);

  if (error) {
    throw new Error(error.message);
  }

  await logAdminAuditEvent({
    eventType: 'plan_catalogue.updated',
    subjectType: 'plan',
    subjectId: input.planId,
    metadata: {
      plan_code: input.planCode,
      updates,
      reason: input.reason ?? null,
    },
  });
}

export async function updatePlanEntitlement(input: {
  planId: string;
  planCode: string;
  capabilityKey: string;
  value: unknown;
  oldValue?: unknown;
  reason?: string;
}): Promise<void> {
  const client = getBandieClient();
  const { error } = await client.from('bandie_plan_entitlements').upsert(
    {
      plan_id: input.planId,
      capability_key: input.capabilityKey,
      value: input.value,
    },
    { onConflict: 'plan_id,capability_key' },
  );

  if (error) {
    throw new Error(error.message);
  }

  await logAdminAuditEvent({
    eventType: 'plan_entitlement.updated',
    subjectType: 'plan',
    subjectId: input.planId,
    metadata: {
      plan_code: input.planCode,
      capability_key: input.capabilityKey,
      old_value: input.oldValue ?? null,
      new_value: input.value,
      reason: input.reason ?? null,
    },
  });
}

export async function removePlanEntitlement(input: {
  planId: string;
  planCode: string;
  capabilityKey: string;
  oldValue?: unknown;
  reason?: string;
}): Promise<void> {
  const client = getBandieClient();
  const { error } = await client
    .from('bandie_plan_entitlements')
    .delete()
    .eq('plan_id', input.planId)
    .eq('capability_key', input.capabilityKey);

  if (error) {
    throw new Error(error.message);
  }

  await logAdminAuditEvent({
    eventType: 'plan_entitlement.removed',
    subjectType: 'plan',
    subjectId: input.planId,
    metadata: {
      plan_code: input.planCode,
      capability_key: input.capabilityKey,
      old_value: input.oldValue ?? null,
      reason: input.reason ?? null,
    },
  });
}

export async function listEntitlementDrafts(): Promise<EntitlementDraft[]> {
  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_entitlement_drafts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as EntitlementDraft[];
}

export async function listEntitlementDraftItems(draftId: string): Promise<EntitlementDraftItem[]> {
  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_entitlement_draft_items')
    .select('*')
    .eq('draft_id', draftId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as EntitlementDraftItem[];
}

export async function createEntitlementDraft(input: {
  name: string;
  description?: string;
}): Promise<EntitlementDraft> {
  const session = await getCurrentSession();
  if (!session?.user) {
    throw new Error('Must be signed in.');
  }

  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_entitlement_drafts')
    .insert({
      name: input.name.trim(),
      description: input.description?.trim() || null,
      created_by: session.user.id,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await logAdminAuditEvent({
    eventType: 'entitlement_draft.created',
    subjectType: 'entitlement_draft',
    subjectId: data.id as string,
    metadata: { name: input.name },
  });

  return data as EntitlementDraft;
}

export async function addEntitlementDraftItem(input: {
  draftId: string;
  planId: string;
  capabilityKey: string;
  newValue: unknown;
  oldValue?: unknown;
  changeType?: 'create' | 'update' | 'delete';
}): Promise<void> {
  const client = getBandieClient();
  const { error } = await client.from('bandie_entitlement_draft_items').insert({
    draft_id: input.draftId,
    plan_id: input.planId,
    capability_key: input.capabilityKey,
    old_value: input.oldValue ?? null,
    new_value: input.newValue,
    change_type: input.changeType ?? 'update',
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function publishEntitlementDraft(draftId: string, reason?: string): Promise<void> {
  const client = getBandieClient();
  const { error } = await client.rpc('bandie_publish_entitlement_draft', {
    p_draft_id: draftId,
    p_reason: reason ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function listEntitlementOverrides(limit = 100): Promise<EntitlementOverride[]> {
  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_entitlement_overrides')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as EntitlementOverride[];
}

export async function createEntitlementOverride(input: {
  subjectType: string;
  subjectId: string;
  capabilityKey: string;
  value: unknown;
  reason?: string;
  expiresAt?: string | null;
}): Promise<void> {
  const session = await getCurrentSession();
  if (!session?.user) {
    throw new Error('Must be signed in.');
  }

  const reason = input.reason?.trim();
  if (!reason) {
    throw new Error('Override reason is required.');
  }

  let parsedValue: unknown = input.value;
  if (typeof input.value === 'string') {
    try {
      parsedValue = JSON.parse(input.value);
    } catch {
      parsedValue = input.value;
    }
  }

  const client = getBandieClient();
  const { error } = await client.from('bandie_entitlement_overrides').insert({
    subject_type: input.subjectType,
    subject_id: input.subjectId,
    capability_key: input.capabilityKey,
    value: parsedValue,
    reason,
    expires_at: input.expiresAt ?? null,
    created_by: session.user.id,
  });

  if (error) {
    throw new Error(error.message);
  }

  await logAdminAuditEvent({
    eventType: 'entitlement_override.created',
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    metadata: {
      capability_key: input.capabilityKey,
      reason: input.reason ?? null,
    },
  });
}

export async function deleteEntitlementOverride(overrideId: string): Promise<void> {
  const client = getBandieClient();
  const { error } = await client
    .from('bandie_entitlement_overrides')
    .delete()
    .eq('id', overrideId);

  if (error) {
    throw new Error(error.message);
  }

  await logAdminAuditEvent({
    eventType: 'entitlement_override.removed',
    subjectType: 'entitlement_override',
    subjectId: overrideId,
  });
}

export type EntitlementImpactPreview = {
  capabilityKey: string;
  planCode: string;
  currentValue: unknown;
  newValue: unknown;
};

export function buildEntitlementImpactPreview(
  plans: PlanWithEntitlements[],
  draftItems: EntitlementDraftItem[],
): EntitlementImpactPreview[] {
  const planCodeById = new Map(plans.map((plan) => [plan.id, plan.code]));

  return draftItems.map((item) => {
    const plan = plans.find((entry) => entry.id === item.plan_id);
    const current = plan?.entitlements.find(
      (entitlement) => entitlement.capability_key === item.capability_key,
    );

    return {
      capabilityKey: item.capability_key,
      planCode: planCodeById.get(item.plan_id) ?? item.plan_id,
      currentValue: current?.value ?? item.old_value,
      newValue: item.new_value,
    };
  });
}
