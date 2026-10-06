import "dotenv/config";
import OpenAI from "openai";
import type {
  MissionDefinition,
  MissionDifficulty,
} from "../src/CyberSim_Engine_Connected/missionTypes";
import { validateMission } from "../src/missionValidator";

const client = new OpenAI();

export interface AIMissionRequest {
  level: number;
  difficulty?: MissionDifficulty;
  patternId?: string;
  seed?: string;
}

const missionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: { type: "string" },
    level: { type: "integer" },
    title: { type: "string" },
    subtitle: { type: "string" },
    category: { type: "string" },
    difficulty: {
      type: "string",
      enum: ["beginner", "easy", "medium", "hard", "expert"],
    },

    briefing: {
      type: "object",
      additionalProperties: false,
      properties: {
        summary: { type: "string" },
        story: {
          type: "array",
          items: { type: "string" },
        },
        warning: { type: "string" },
      },
      required: ["summary", "story", "warning"],
    },

    availableTools: {
      type: "array",
      items: {
        type: "string",
        enum: ["email", "browser", "files", "intel", "terminal"],
      },
    },

    evidence: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          type: {
            type: "string",
            enum: [
              "sender",
              "domain",
              "reputation",
              "attachment",
              "log",
              "account",
              "network",
              "endpoint",
              "custom",
            ],
          },
          title: { type: "string" },
          description: { type: "string" },
          tool: {
            type: "string",
            enum: ["email", "browser", "files", "intel", "terminal"],
          },
          data: {
            type: "object",
            additionalProperties: false,
            properties: {},
          },
        },
        required: ["id", "type", "title", "description", "tool", "data"],
      },
    },

    objectives: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          phase: {
            type: "string",
            enum: [
              "briefing",
              "investigate",
              "identify",
              "solve",
              "verify",
              "complete",
            ],
          },
          completionKey: { type: "string" },
        },
        required: [
          "id",
          "title",
          "description",
          "phase",
          "completionKey",
        ],
      },
    },

    diagnoses: {
      type: "array",
      items: { type: "string" },
    },

    primaryDiagnosis: { type: "string" },

    actions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          type: {
            type: "string",
            enum: [
              "quarantine",
              "block",
              "disable",
              "reset",
              "isolate",
              "remove",
              "configure",
              "custom",
            ],
          },
          title: { type: "string" },
          description: { type: "string" },
          requires: {
            type: "array",
            items: { type: "string" },
          },
          required: { type: "boolean" },
        },
        required: [
          "id",
          "type",
          "title",
          "description",
          "requires",
          "required",
        ],
      },
    },

    verification: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          type: {
            type: "string",
            enum: [
              "containment",
              "configuration",
              "detection",
              "remediation",
              "custom",
            ],
          },
          title: { type: "string" },
          description: { type: "string" },
          requiresActions: {
            type: "array",
            items: { type: "string" },
          },
          successMessage: { type: "string" },
        },
        required: [
          "id",
          "type",
          "title",
          "description",
          "requiresActions",
          "successMessage",
        ],
      },
    },

    rewards: {
      type: "object",
      additionalProperties: false,
      properties: {
        xp: { type: "integer" },
        coins: { type: "integer" },
      },
      required: ["xp", "coins"],
    },

    ai: {
      type: "object",
      additionalProperties: false,
      properties: {
        generated: { type: "boolean" },
        scenarioSeed: { type: "string" },
        generatedAt: { type: "string" },
        sourcePattern: { type: "string" },
      },
      required: [
        "generated",
        "scenarioSeed",
        "generatedAt",
        "sourcePattern",
      ],
    },
  },

  required: [
    "id",
    "level",
    "title",
    "subtitle",
    "category",
    "difficulty",
    "briefing",
    "availableTools",
    "evidence",
    "objectives",
    "diagnoses",
    "primaryDiagnosis",
    "actions",
    "verification",
    "rewards",
    "ai",
  ],
} as const;

export async function generateAIMission(
  request: AIMissionRequest,
): Promise<MissionDefinition> {
  const level = request.level;
  const difficulty = request.difficulty ?? "medium";
  const pattern = request.patternId ?? "web-application-incident";
  const seed = request.seed ?? `level-${level}-${Date.now()}`;

  const response = await client.responses.create({
    model: "gpt-6-astra",
    input: [
      {
        role: "system",
        content: `
You are the CyberSim AI Mission Designer.

CyberSim AI is a single-player cybersecurity education simulator.

Generate ONE fictional and completely simulated cybersecurity training mission.

IMPORTANT SAFETY RULES:
- Never target real systems.
- Never use real credentials, real API keys, real victims, or real organizations.
- Use fictional domains, usernames, IP addresses and application names.
- Do not provide real exploit payloads.
- Do not provide instructions for attacking real systems.
- The mission must focus on investigation, diagnosis, simulated containment and verification.
- The player must solve the incident rather than the AI solving it for them.
- The mission must contain enough evidence for the player to reason toward the primary diagnosis.
- Actions must be defensive and simulated.

The mission must follow the supplied CyberSim MissionDefinition structure exactly.
`,
      },
      {
        role: "user",
        content: `
Generate Level ${level}.

Difficulty: ${difficulty}
Scenario pattern: ${pattern}
Scenario seed: ${seed}

Create a realistic cybersecurity learning incident with:
1. A mission briefing.
2. Multiple pieces of discoverable evidence.
3. Investigation objectives.
4. Diagnosis choices.
5. Defensive remediation actions.
6. Verification checks.
7. XP and coin rewards.

Make the mission feel like a real SOC/cybersecurity training scenario while remaining completely fictional and simulated.

Do not generate React code.
Return only the structured mission object.
`,
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "cybersim_mission",
        strict: true,
        schema: missionSchema,
      },
    },
  });

  const mission = JSON.parse(response.output_text) as MissionDefinition;

  const validation = validateMission(mission);

  if (!validation.valid) {
    throw new Error(
      `Generated mission failed validation: ${validation.errors.join("; ")}`,
    );
  }

  return mission;
}