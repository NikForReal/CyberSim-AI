import { MISSION_CATALOG as SEEDED_MISSIONS } from "./missionData";
import type { MissionDefinition } from "./missionTypes";

/**
 * Single mission loading entry point.
 * Later this can consume missions returned by the AI/backend.
 */
export const MISSION_CATALOG: MissionDefinition[] = SEEDED_MISSIONS;

export function getMissionById(id: string): MissionDefinition | undefined {
  return MISSION_CATALOG.find((mission) => mission.id === id);
}

export function getMissionByLevel(level: number): MissionDefinition | undefined {
  return MISSION_CATALOG.find((mission) => mission.level === level);
}

export function getAvailableMissions(): MissionDefinition[] {
  return [...MISSION_CATALOG].sort((a, b) => a.level - b.level);
}
