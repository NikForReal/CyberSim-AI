import type { MissionDefinition } from "./missionTypes";

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
  LEVEL_1_MISSION
];
