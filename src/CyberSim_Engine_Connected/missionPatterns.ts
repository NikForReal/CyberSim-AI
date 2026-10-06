import type { MissionDifficulty, MissionPhase, ToolId } from "./missionTypes";

/**
 * CyberSim AI — Mission Generation Patterns
 *
 * These patterns are scenario constraints, not complete missions.
 * A backend AI service can select one and generate a MissionDefinition.
 *
 * All scenarios are fictional/simulated and intended for defensive
 * cybersecurity education.
 */

export interface MissionPattern {
  id: string;
  category: string;
  attackType: string;
  description: string;
  difficultyRange: MissionDifficulty[];
  preferredTools: ToolId[];
  phases: MissionPhase[];
  learningGoals: string[];
  safetyConstraints: string[];
}

export const MISSION_PATTERNS: MissionPattern[] = [
  {
    id: "phishing-investigation",
    category: "Phishing",
    attackType: "Phishing",
    description: "Investigate a suspicious simulated message and contain the simulated threat.",
    difficultyRange: ["beginner", "easy", "medium"],
    preferredTools: ["email", "browser", "files", "intel", "terminal"],
    phases: ["briefing", "investigate", "identify", "solve", "verify", "complete"],
    learningGoals: [
      "recognize social-engineering indicators",
      "collect evidence before making a diagnosis",
      "perform simulated containment",
      "verify defensive controls"
    ],
    safetyConstraints: [
      "use fictional identities and domains",
      "do not use real credentials or real targets",
      "keep all actions inside the CyberSim simulation"
    ]
  },
  {
    id: "brute-force-investigation",
    category: "Authentication Security",
    attackType: "Brute Force",
    description: "Investigate simulated authentication anomalies and apply defensive controls.",
    difficultyRange: ["easy", "medium", "hard"],
    preferredTools: ["terminal"],
    phases: ["briefing", "investigate", "identify", "solve", "verify", "complete"],
    learningGoals: [
      "recognize abnormal authentication patterns",
      "correlate simulated login evidence",
      "apply account and access controls",
      "verify simulated defensive changes"
    ],
    safetyConstraints: [
      "use reserved/documentation-only example addresses",
      "never attempt real authentication",
      "never expose or request real passwords"
    ]
  },
  {
    id: "web-application-incident",
    category: "Web Security",
    attackType: "Web Application Attack",
    description: "Investigate a simulated web application security incident using logs and defensive telemetry.",
    difficultyRange: ["medium", "hard", "expert"],
    preferredTools: ["browser", "terminal", "intel"],
    phases: ["briefing", "investigate", "identify", "solve", "verify", "complete"],
    learningGoals: [
      "interpret simulated web telemetry",
      "correlate multiple evidence sources",
      "choose a defensive mitigation",
      "validate the mitigation"
    ],
    safetyConstraints: [
      "use fictional applications and data",
      "never provide executable exploit payloads",
      "simulate requests and defensive controls"
    ]
  },
  {
    id: "malware-investigation",
    category: "Endpoint Security",
    attackType: "Malware Infection",
    description: "Investigate a simulated endpoint alert and contain the affected training workstation.",
    difficultyRange: ["medium", "hard", "expert"],
    preferredTools: ["files", "intel", "terminal"],
    phases: ["briefing", "investigate", "identify", "solve", "verify", "complete"],
    learningGoals: [
      "interpret endpoint indicators",
      "distinguish evidence from assumptions",
      "contain a simulated endpoint",
      "verify remediation"
    ],
    safetyConstraints: [
      "use fictional files and hosts",
      "do not generate functional malware",
      "do not execute code against real systems"
    ]
  },
  {
    id: "api-key-exposure",
    category: "Application Security",
    attackType: "Credential Exposure",
    description: "Investigate a simulated exposed application secret and remediate the training environment.",
    difficultyRange: ["medium", "hard"],
    preferredTools: ["files", "browser", "terminal", "intel"],
    phases: ["briefing", "investigate", "identify", "solve", "verify", "complete"],
    learningGoals: [
      "recognize secret-exposure indicators",
      "trace evidence to its source",
      "rotate or revoke simulated secrets",
      "verify that the exposure is contained"
    ],
    safetyConstraints: [
      "use synthetic credentials only",
      "never display real API keys",
      "simulate rotation and revocation"
    ]
  }
];

export function getMissionPattern(id: string): MissionPattern | undefined {
  return MISSION_PATTERNS.find((pattern) => pattern.id === id);
}

export function getRandomPattern(
  difficulty?: MissionDifficulty
): MissionPattern {
  const candidates = difficulty
    ? MISSION_PATTERNS.filter((pattern) =>
        pattern.difficultyRange.includes(difficulty)
      )
    : MISSION_PATTERNS;

  const pool = candidates.length ? candidates : MISSION_PATTERNS;
  return pool[Math.floor(Math.random() * pool.length)];
}
