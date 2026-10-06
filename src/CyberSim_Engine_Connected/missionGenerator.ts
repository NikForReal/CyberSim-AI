import type { MissionDefinition, MissionDifficulty } from "./missionTypes";
import { getRandomPattern } from "./missionPatterns";
import { assertValidMission, validateMission } from "./missionValidator";

export interface MissionGenerationRequest {
  level: number;
  difficulty?: MissionDifficulty;
  patternId?: string;
  seed?: string;
  playerContext?: {
    completedLevels?: number;
    recentCategories?: string[];
  };
}

export interface MissionGenerationResponse {
  mission: MissionDefinition;
  source: "ai";
  requestId?: string;
}

/**
 * Client-side contract for the production backend.
 *
 * IMPORTANT:
 * The browser never receives an AI provider secret.
 * The real AI call belongs behind this API boundary.
 */
export interface MissionGenerator {
  generate(
    request: MissionGenerationRequest
  ): Promise<MissionGenerationResponse>;
}

/**
 * Production API implementation.
 *
 * Expected backend contract:
 * POST /api/missions/generate
 *
 * Request:
 * {
 *   level,
 *   difficulty,
 *   patternId,
 *   seed,
 *   playerContext
 * }
 *
 * Response:
 * {
 *   mission: MissionDefinition,
 *   requestId?: string
 * }
 *
 * The response is validated before the game can consume it.
 */
export class ApiMissionGenerator implements MissionGenerator {
  private readonly endpoint: string;

  constructor(endpoint = "/api/missions/generate") {
    this.endpoint = endpoint;
  }

  async generate(
    request: MissionGenerationRequest
  ): Promise<MissionGenerationResponse> {
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`Mission generation failed (${response.status}).`);
    }

    const payload = (await response.json()) as Partial<MissionGenerationResponse>;

    if (!payload.mission) {
      throw new Error("Mission generation response did not contain a mission.");
    }

    assertValidMission(payload.mission);

    return {
      mission: payload.mission,
      source: "ai",
      requestId: payload.requestId
    };
  }
}

/**
 * Development fallback only.
 *
 * This does NOT pretend to be AI. It creates a safe placeholder so the
 * frontend can be wired and tested before the backend AI endpoint exists.
 *
 * Remove this fallback from production deployment once the API is live.
 */
export function createDevelopmentMission(
  request: MissionGenerationRequest
): MissionDefinition {
  const pattern = getRandomPattern(request.difficulty);
  const seed = request.seed ?? `dev-${Date.now()}`;
  const difficulty = request.difficulty ?? pattern.difficultyRange[0];

  const mission: MissionDefinition = {
    id: `level-${String(request.level).padStart(2, "0")}-${pattern.id}`,
    level: request.level,
    title: `SIMULATED ${pattern.attackType.toUpperCase()} INCIDENT`,
    subtitle: `${pattern.category.toUpperCase()} INVESTIGATION`,
    category: pattern.category,
    difficulty,
    briefing: {
      summary: pattern.description,
      story: [
        "This is a development-generated CyberSim scenario.",
        "The environment, identities, evidence and defensive actions are simulated."
      ],
      warning: "Do not use this scenario as an instruction for interacting with real systems."
    },
    availableTools: pattern.preferredTools,
    evidence: [
      {
        id: "initial-indicator",
        type: "custom",
        title: "SIMULATED INDICATOR",
        description: "A synthetic indicator generated for engine integration testing.",
        tool: pattern.preferredTools[0] ?? "terminal",
        data: {
          scenario: pattern.attackType
        }
      }
    ],
    objectives: [
      {
        id: "obj-investigate",
        title: "Investigate the incident",
        description: "Review the available simulated evidence.",
        phase: "investigate",
        completionKey: "all-evidence"
      },
      {
        id: "obj-identify",
        title: "Identify the threat",
        description: "Determine the simulated incident type.",
        phase: "identify",
        completionKey: "correct-diagnosis"
      }
    ],
    diagnoses: [pattern.attackType, "Benign Activity"],
    primaryDiagnosis: pattern.attackType,
    actions: [
      {
        id: "action-contain",
        type: "isolate",
        title: "CONTAIN THE SIMULATED INCIDENT",
        description: "Apply the simulated containment control.",
        required: true,
        requires: ["correct-diagnosis"]
      }
    ],
    verification: [
      {
        id: "verification-containment",
        type: "containment",
        title: "VERIFY CONTAINMENT",
        description: "Confirm that the simulated containment control is active.",
        requiresActions: ["action-contain"],
        successMessage: "SIMULATED CONTAINMENT VERIFIED"
      }
    ],
    rewards: {
      xp: 700 + request.level * 50,
      coins: 120 + request.level * 10
    },
    ai: {
      generated: true,
      scenarioSeed: seed,
      generatedAt: new Date().toISOString(),
      sourcePattern: pattern.id
    }
  };

  const validation = validateMission(mission);
  if (!validation.valid) {
    throw new Error(validation.errors.join("\n"));
  }

  return mission;
}
