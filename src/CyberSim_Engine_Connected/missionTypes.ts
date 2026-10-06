/**
 * CyberSim AI — Mission Engine Types
 *
 * These types define the contract between the game engine and future AI.
 * The AI will eventually generate MissionDefinition objects.
 * The React UI should only consume this structure.
 */

export type MissionDifficulty =
  | "beginner"
  | "easy"
  | "medium"
  | "hard"
  | "expert";

export type MissionPhase =
  | "briefing"
  | "investigate"
  | "identify"
  | "solve"
  | "verify"
  | "complete";

export type ToolId =
  | "email"
  | "browser"
  | "files"
  | "intel"
  | "terminal";

export type EvidenceType =
  | "sender"
  | "domain"
  | "reputation"
  | "attachment"
  | "log"
  | "account"
  | "network"
  | "endpoint"
  | "custom";

export type ActionType =
  | "quarantine"
  | "block"
  | "disable"
  | "reset"
  | "isolate"
  | "remove"
  | "configure"
  | "custom";

export type VerificationType =
  | "containment"
  | "configuration"
  | "detection"
  | "remediation"
  | "custom";

export interface MissionEvidence {
  id: string;
  type: EvidenceType;
  title: string;
  description: string;

  /**
   * Where the evidence can be discovered.
   * Example: email, browser, intel, files, terminal.
   */
  tool: ToolId;

  /**
   * Optional values shown by the simulator.
   * Example:
   * { sender: "billing@example.com" }
   */
  data?: Record<string, string | number | boolean>;
}

export interface MissionAction {
  id: string;
  type: ActionType;
  title: string;
  description: string;

  /**
   * Evidence or diagnosis that should already exist
   * before this action becomes available.
   */
  requires?: string[];

  /**
   * Whether this action is required to complete
   * the mission.
   */
  required: boolean;
}

export interface MissionVerification {
  id: string;
  type: VerificationType;
  title: string;
  description: string;

  /**
   * Required actions that must be completed before
   * this verification can pass.
   */
  requiresActions: string[];

  successMessage: string;
}

export interface MissionObjective {
  id: string;
  title: string;
  description: string;
  phase: MissionPhase;

  /**
   * Internal completion key used by the engine.
   */
  completionKey: string;
}

export interface MissionReward {
  xp: number;
  coins: number;
}

export interface MissionDefinition {
  id: string;
  level: number;

  title: string;
  subtitle: string;
  category: string;
  difficulty: MissionDifficulty;

  briefing: {
    summary: string;
    story: string[];
    warning?: string;
  };

  availableTools: ToolId[];

  evidence: MissionEvidence[];

  objectives: MissionObjective[];

  /**
   * Valid diagnosis/verdicts.
   * Usually one primary answer, but the engine can support
   * multiple acceptable answers later.
   */
  diagnoses: string[];
  primaryDiagnosis: string;

  actions: MissionAction[];

  verification: MissionVerification[];

  rewards: MissionReward;

  /**
   * Optional AI metadata. This is deliberately separated
   * from gameplay so the UI does not depend on AI details.
   */
  ai?: {
    generated: boolean;
    scenarioSeed?: string;
    generatedAt?: string;
    sourcePattern?: string;
  };
}
