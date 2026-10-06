import type { MissionDefinition } from "./missionTypes";

/**
 * CyberSim AI — Level 02 seed mission
 *
 * This is a fully simulated brute-force investigation.
 * All accounts, IPs and logs are fictional game data.
 */
export const LEVEL_2_MISSION: MissionDefinition = {
  id: "level-02-locked-account",
  level: 2,

  title: "THE LOCKED ACCOUNT",
  subtitle: "BRUTE-FORCE INVESTIGATION",
  category: "Authentication Security",
  difficulty: "easy",

  briefing: {
    summary: "A user account is showing an unusual burst of failed logins.",
    story: [
      "The simulated SOC has received an alert for repeated failed authentication attempts against a single employee account.",
      "Your job is to investigate the authentication activity, identify the attack pattern, contain the simulated threat and verify that the account is secured."
    ],
    warning:
      "Treat the authentication activity as suspicious until the available evidence has been reviewed."
  },

  availableTools: ["terminal", "intel", "browser"],

  evidence: [
    {
      id: "auth-log",
      type: "log",
      title: "REPEATED FAILED LOGINS",
      description:
        "The authentication log shows a concentrated burst of failed login attempts against the same account.",
      tool: "terminal",
      data: {
        account: "alex.morgan",
        failedAttempts: 47,
        timeWindow: "6 minutes"
      }
    },
    {
      id: "source-ip",
      type: "network",
      title: "SUSPICIOUS SOURCE",
      description:
        "The simulated login attempts originate from an unfamiliar external source.",
      tool: "terminal",
      data: {
        sourceIp: "198.51.100.42",
        source: "Unfamiliar external host"
      }
    },
    {
      id: "account-risk",
      type: "account",
      title: "ACCOUNT UNDER ATTACK",
      description:
        "The targeted account is active and has received an abnormal number of failed authentication events.",
      tool: "browser",
      data: {
        account: "alex.morgan",
        status: "Active",
        risk: "Elevated"
      }
    },
    {
      id: "ip-reputation",
      type: "reputation",
      title: "SUSPICIOUS IP REPUTATION",
      description:
        "The simulated threat-intelligence record flags the source as suspicious.",
      tool: "intel",
      data: {
        reputation: "Suspicious",
        confidence: "High"
      }
    }
  ],

  objectives: [
    {
      id: "obj-investigate",
      title: "Investigate authentication activity",
      description: "Review the simulated login events and collect evidence.",
      phase: "investigate",
      completionKey: "all-evidence"
    },
    {
      id: "obj-identify",
      title: "Identify the attack",
      description: "Determine whether the activity represents a brute-force attack.",
      phase: "identify",
      completionKey: "correct-diagnosis"
    },
    {
      id: "obj-disable",
      title: "Disable the targeted account",
      description: "Temporarily disable the simulated account while the incident is contained.",
      phase: "solve",
      completionKey: "action-disable"
    },
    {
      id: "obj-block",
      title: "Block the suspicious source",
      description: "Block the simulated source IP from further authentication attempts.",
      phase: "solve",
      completionKey: "action-block"
    },
    {
      id: "obj-reset",
      title: "Reset the account credentials",
      description: "Force a simulated credential reset for the targeted account.",
      phase: "solve",
      completionKey: "action-reset"
    },
    {
      id: "obj-verify",
      title: "Verify account security",
      description: "Run the simulated authentication containment check.",
      phase: "verify",
      completionKey: "verification"
    }
  ],

  diagnoses: [
    "Normal Login Activity",
    "Password Reset",
    "Brute Force Attack",
    "Account Misconfiguration"
  ],

  primaryDiagnosis: "Brute Force Attack",

  actions: [
    {
      id: "action-disable",
      type: "disable",
      title: "DISABLE THE TARGETED ACCOUNT",
      description:
        "Temporarily disable alex.morgan in the simulated identity system while the incident is contained.",
      required: true,
      requires: ["correct-diagnosis"]
    },
    {
      id: "action-block",
      type: "block",
      title: "BLOCK THE SUSPICIOUS SOURCE",
      description:
        "Add 198.51.100.42 to the simulated authentication block list.",
      required: true,
      requires: ["correct-diagnosis"]
    },
    {
      id: "action-reset",
      type: "reset",
      title: "FORCE A CREDENTIAL RESET",
      description:
        "Require a simulated password reset for the targeted account before access is restored.",
      required: true,
      requires: ["correct-diagnosis", "action-disable"]
    }
  ],

  verification: [
    {
      id: "verification-auth-containment",
      type: "containment",
      title: "RUN AUTHENTICATION CHECK",
      description:
        "Check whether the account is secured, the suspicious source is blocked and credential reset is enforced.",
      requiresActions: [
        "action-disable",
        "action-block",
        "action-reset"
      ],
      successMessage: "ACCOUNT SECURITY VERIFIED"
    }
  ],

  rewards: {
    xp: 650,
    coins: 125
  },

  ai: {
    generated: false,
    sourcePattern: "brute-force-authentication"
  }
};
