import type { MissionDefinition } from "./missionTypes";
import { getMissionPattern } from "./missionPatterns";

export interface MissionValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateMission(
  mission: MissionDefinition
): MissionValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!mission || typeof mission !== "object") {
    return { valid: false, errors: ["Mission must be an object."], warnings };
  }

  if (!ID_PATTERN.test(mission.id)) {
    errors.push("Mission id must use lowercase kebab-case.");
  }

  if (!Number.isInteger(mission.level) || mission.level < 1) {
    errors.push("Mission level must be a positive integer.");
  }

  if (!mission.title?.trim()) errors.push("Mission title is required.");
  if (!mission.subtitle?.trim()) errors.push("Mission subtitle is required.");
  if (!mission.category?.trim()) errors.push("Mission category is required.");

  if (!mission.briefing?.summary?.trim()) {
    errors.push("Mission briefing summary is required.");
  }

  if (!Array.isArray(mission.briefing?.story) || mission.briefing.story.length === 0) {
    errors.push("Mission briefing must contain at least one story item.");
  }

  if (!Array.isArray(mission.availableTools) || mission.availableTools.length === 0) {
    errors.push("Mission must expose at least one tool.");
  }

  if (!Array.isArray(mission.evidence) || mission.evidence.length === 0) {
    errors.push("Mission must contain evidence.");
  }

  if (!Array.isArray(mission.objectives) || mission.objectives.length === 0) {
    errors.push("Mission must contain objectives.");
  }

  if (!Array.isArray(mission.diagnoses) || mission.diagnoses.length < 2) {
    errors.push("Mission must contain at least two diagnosis choices.");
  }

  if (!mission.primaryDiagnosis || !mission.diagnoses?.includes(mission.primaryDiagnosis)) {
    errors.push("Primary diagnosis must exist in diagnoses.");
  }

  if (!Array.isArray(mission.actions) || mission.actions.length === 0) {
    errors.push("Mission must contain at least one action.");
  }

  if (!Array.isArray(mission.verification) || mission.verification.length === 0) {
    errors.push("Mission must contain at least one verification.");
  }

  if (!mission.rewards || mission.rewards.xp <= 0 || mission.rewards.coins < 0) {
    errors.push("Mission rewards are invalid.");
  }

  const evidenceIds = new Set<string>();
  for (const evidence of mission.evidence ?? []) {
    if (!evidence.id || evidenceIds.has(evidence.id)) {
      errors.push(`Duplicate or missing evidence id: ${evidence.id || "<empty>"}`);
    }
    evidenceIds.add(evidence.id);

    if (!evidence.title?.trim()) errors.push(`Evidence ${evidence.id} has no title.`);
    if (!evidence.description?.trim()) {
      errors.push(`Evidence ${evidence.id} has no description.`);
    }

    if (!mission.availableTools.includes(evidence.tool)) {
      errors.push(`Evidence ${evidence.id} references unavailable tool ${evidence.tool}.`);
    }
  }

  const actionIds = new Set<string>();
  for (const action of mission.actions ?? []) {
    if (!action.id || actionIds.has(action.id)) {
      errors.push(`Duplicate or missing action id: ${action.id || "<empty>"}`);
    }
    actionIds.add(action.id);

    for (const requirement of action.requires ?? []) {
      if (requirement !== "correct-diagnosis" && !mission.objectives.some((o) => o.id === requirement)) {
        errors.push(`Action ${action.id} references unknown objective ${requirement}.`);
      }
    }
  }

  for (const check of mission.verification ?? []) {
    if (!check.id || !check.successMessage?.trim()) {
      errors.push(`Verification ${check.id || "<empty>"} is incomplete.`);
    }

    for (const actionId of check.requiresActions) {
      if (!actionIds.has(actionId)) {
        errors.push(`Verification ${check.id} references unknown action ${actionId}.`);
      }
    }
  }

  const requiredActions = mission.actions.filter((action) => action.required);
  if (requiredActions.length === 0) {
    errors.push("Mission needs at least one required remediation action.");
  }

  if (mission.ai?.generated) {
    if (!mission.ai.scenarioSeed) {
      errors.push("Generated missions require a scenario seed.");
    }
    if (!mission.ai.generatedAt) {
      warnings.push("Generated mission has no generatedAt timestamp.");
    }
  }

  const pattern = mission.ai?.sourcePattern
    ? getMissionPattern(mission.ai.sourcePattern)
    : undefined;

  if (mission.ai?.sourcePattern && !pattern) {
    warnings.push(`Unknown source pattern: ${mission.ai.sourcePattern}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

export function assertValidMission(mission: MissionDefinition): MissionDefinition {
  const result = validateMission(mission);

  if (!result.valid) {
    throw new Error(
      `Invalid CyberSim mission:\n${result.errors.map((error) => `- ${error}`).join("\n")}`
    );
  }

  return mission;
}
