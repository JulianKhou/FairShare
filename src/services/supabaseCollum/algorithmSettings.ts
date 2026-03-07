import { supabase } from "./client";
import {
  DEFAULT_RESOLVED_ALGORITHM_SETTINGS,
  resolveAlgorithmSettings,
  type AlgorithmSettingsRow,
  type NicheRpmOverrides,
  type PricingConfig,
  type ResolvedAlgorithmSettings,
  type UsagePolicyConfig,
} from "@/types/algorithmSettings";
import type { SimpleShareConfig } from "@/services/simpleShareAlgo";

const DEFAULT_SETTINGS_ID = "default";

export const getAlgorithmSettings = async (): Promise<ResolvedAlgorithmSettings> => {
  const { data, error } = await supabase
    .from("algorithm_settings")
    .select(
      "id, simple_share_config, pricing_config, niche_rpm_overrides, usage_policy_config, updated_at, updated_by",
    )
    .eq("id", DEFAULT_SETTINGS_ID)
    .maybeSingle();

  if (error) {
    console.warn(
      "Could not load algorithm settings from DB, falling back to defaults.",
      error,
    );
    return DEFAULT_RESOLVED_ALGORITHM_SETTINGS;
  }

  if (!data) {
    return DEFAULT_RESOLVED_ALGORITHM_SETTINGS;
  }

  return resolveAlgorithmSettings(data as AlgorithmSettingsRow);
};

export interface UpdateAlgorithmSettingsInput {
  simpleShareConfig: Partial<SimpleShareConfig>;
  pricingConfig: Partial<PricingConfig>;
  nicheRpmOverrides: NicheRpmOverrides;
  usagePolicyConfig: Partial<UsagePolicyConfig>;
}

export interface AlgorithmSettingsAuditEntry {
  id: number;
  settings_id: string;
  changed_at: string;
  changed_by: string | null;
  changed_fields: string[];
  changed_by_profile?: {
    full_name: string | null;
  } | null;
}

export const updateAlgorithmSettings = async (
  input: UpdateAlgorithmSettingsInput,
): Promise<ResolvedAlgorithmSettings> => {
  const payload = {
    simple_share_config: input.simpleShareConfig,
    pricing_config: input.pricingConfig,
    niche_rpm_overrides: input.nicheRpmOverrides,
    usage_policy_config: input.usagePolicyConfig,
  };

  const { data, error } = await supabase
    .from("algorithm_settings")
    .update(payload)
    .eq("id", DEFAULT_SETTINGS_ID)
    .select(
      "id, simple_share_config, pricing_config, niche_rpm_overrides, usage_policy_config, updated_at, updated_by",
    )
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    throw new Error(
      "Algorithm settings row not found. Please run latest DB migrations.",
    );
  }

  return resolveAlgorithmSettings(data as AlgorithmSettingsRow);
};

export const getAlgorithmSettingsAudit = async (
  limit = 15,
): Promise<AlgorithmSettingsAuditEntry[]> => {
  const safeLimit = Math.max(1, Math.min(100, Math.round(limit)));

  const { data, error } = await supabase
    .from("algorithm_settings_audit")
    .select(
      "id, settings_id, changed_at, changed_by, changed_fields, changed_by_profile:profiles!algorithm_settings_audit_changed_by_fkey(full_name)",
    )
    .order("changed_at", { ascending: false })
    .limit(safeLimit);

  if (error) {
    console.warn("Could not load algorithm settings audit.", error);
    return [];
  }

  const normalized = (data ?? []).map((entry: any) => ({
    ...entry,
    changed_by_profile: Array.isArray(entry.changed_by_profile)
      ? entry.changed_by_profile[0] ?? null
      : entry.changed_by_profile ?? null,
  }));

  return normalized as AlgorithmSettingsAuditEntry[];
};
