import type { MissionDefinition } from "./missionTypes";

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



/**
 * CyberSim AI — Mission Catalog
 *
 * IMPORTANT:
 * This is temporary seed data.
 *
 * The game engine does NOT need to know whether a mission came
 * from this file, a database, or an AI generator.
 *
 * Later, AI-generated missions can be inserted into the same
 * MissionDefinition format.
 */

export const LEVEL_1_MISSION: MissionDefinition = {
  id: "level-01-suspicious-invoice",
  level: 1,

  title: "THE SUSPICIOUS INVOICE",
  subtitle: "PHISHING INVESTIGATION",
  category: "Phishing",
  difficulty: "beginner",

  briefing: {
    summary: "A suspicious invoice has been reported.",
    story: [
      "An employee has received an unexpected invoice email from an unfamiliar sender.",
      "Your job is to investigate the message, identify suspicious indicators, collect evidence and determine whether the email is legitimate or part of a phishing attack."
    ],
    warning:
      "Do not trust the message until you have investigated the available evidence."
  },

  availableTools: [
    "email",
    "browser",
    "files",
    "intel",
    "terminal"
  ],

  evidence: [
    {
      id: "sender",
      type: "sender",
      title: "SUSPICIOUS SENDER",
      description: "The sender address does not match a trusted business identity.",
      tool: "email",
      data: {
        sender: "billing@acme-invoices.com"
      }
    },
    {
      id: "domain",
      type: "domain",
      title: "SUSPICIOUS DOMAIN",
      description: "The sender domain was recently registered and is not trusted.",
      tool: "browser",
      data: {
        domain: "acme-invoices.com",
        age: "Recently registered"
      }
    },
    {
      id: "reputation",
      type: "reputation",
      title: "MALICIOUS REPUTATION",
      description: "Threat intelligence reports a malicious reputation for the domain.",
      tool: "intel",
      data: {
        reputation: "Malicious"
      }
    },
    {
      id: "attachment",
      type: "attachment",
      title: "MACRO ATTACHMENT",
      description: "The invoice contains a macro-enabled document attachment.",
      tool: "files",
      data: {
        filename: "invoice_4821.docm",
        type: "Macro-enabled document"
      }
    }
  ],

  objectives: [
    {
      id: "obj-investigate",
      title: "Investigate the suspicious email",
      description: "Review the message and available evidence.",
      phase: "investigate",
      completionKey: "all-evidence"
    },
    {
      id: "obj-identify",
      title: "Identify the threat",
      description: "Determine whether the message is a phishing attack.",
      phase: "identify",
      completionKey: "correct-diagnosis"
    },
    {
      id: "obj-email",
      title: "Quarantine the email",
      description: "Remove the suspicious email from the user's inbox.",
      phase: "solve",
      completionKey: "action-email"
    },
    {
      id: "obj-domain",
      title: "Block the malicious domain",
      description: "Block the simulated malicious domain.",
      phase: "solve",
      completionKey: "action-domain"
    },
    {
      id: "obj-attachment",
      title: "Quarantine the attachment",
      description: "Isolate the simulated malicious attachment.",
      phase: "solve",
      completionKey: "action-attachment"
    },
    {
      id: "obj-verify",
      title: "Verify containment",
      description: "Run the simulated containment verification.",
      phase: "verify",
      completionKey: "verification"
    }
  ],

  diagnoses: [
    "Legitimate Invoice",
    "Spam",
    "Phishing Attack",
    "Malware Infection"
  ],

  primaryDiagnosis: "Phishing Attack",

  actions: [
    {
      id: "action-email",
      type: "quarantine",
      title: "QUARANTINE THE EMAIL",
      description:
        "Move the suspicious invoice out of the user's inbox so it cannot be opened or acted on.",
      required: true,
      requires: ["correct-diagnosis"]
    },
    {
      id: "action-domain",
      type: "block",
      title: "BLOCK THE MALICIOUS DOMAIN",
      description:
        "Add acme-invoices.com to the simulated email/web block list.",
      required: true,
      requires: ["correct-diagnosis"]
    },
    {
      id: "action-attachment",
      type: "quarantine",
      title: "QUARANTINE THE ATTACHMENT",
      description:
        "Isolate invoice_4821.docm so the simulated macro cannot be opened.",
      required: true,
      requires: ["correct-diagnosis"]
    }
  ],

  verification: [
    {
      id: "verification-containment",
      type: "containment",
      title: "RUN CONTAINMENT CHECK",
      description:
        "Check whether all required containment actions have been completed.",
      requiresActions: [
        "action-email",
        "action-domain",
        "action-attachment"
      ],
      successMessage: "CONTAINMENT VERIFIED"
    }
  ],

  rewards: {
    xp: 500,
    coins: 100
  },

  ai: {
    generated: false,
    sourcePattern: "phishing-investigation"
  }
};

export const MISSION_CATALOG: MissionDefinition[] = [
  LEVEL_1_MISSION,
  LEVEL_2_MISSION
];
