import { useEffect, useState } from "react";
import "../App.css";
import type { MissionDefinition } from "./missionTypes";

type Screen =
  | "login"
  | "home"
  | "briefing"
  | "workstation"
  | "complete";

type Tool =
  | "email"
  | "browser"
  | "files"
  | "intel"
  | "terminal"
  | "logs"
  | "ip"
  | "users"
  | "auth";

type EvidenceId =
  | "sender"
  | "domain"
  | "reputation"
  | "attachment";

type MissionPhase = "investigate" | "solve" | "verify";
type RemediationId = "email" | "domain" | "attachment";
type MissionId = number;
type Level2EvidenceId = "logs" | "ip" | "account" | "auth";
type Level2RemediationId = "block-ip" | "disable-account" | "rate-limit";

function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [operatorId, setOperatorId] = useState("");
  const [activeTool, setActiveTool] = useState<Tool>("email");
  const [missionPhase, setMissionPhase] = useState<MissionPhase>("investigate");
  const [missionId, setMissionId] = useState<MissionId>(1);
  const [completedLevels, setCompletedLevels] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem("cybersim_completed_levels");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const isLevelCompleted = (level: number) => completedLevels.includes(level);

  const markLevelCompleted = (level: number) => {
    setCompletedLevels((current) => {
      if (current.includes(level)) return current;
      const next = [...current, level].sort((a, b) => a - b);
      localStorage.setItem("cybersim_completed_levels", JSON.stringify(next));
      return next;
    });
  };

  const currentCampaignLevel = (() => {
    for (let level = 1; level <= 10; level += 1) {
      if (!completedLevels.includes(level)) return level;
    }
    return 10;
  })();
  // Safety net: whenever the mission-complete screen is reached, persist
  // that mission as completed even if the player navigated here from an
  // older session of the app.
  useEffect(() => {
    if (screen === "complete") {
      markLevelCompleted(missionId);
    }
  }, [screen, missionId]);

  const [level2Evidence, setLevel2Evidence] = useState<Level2EvidenceId[]>([]);
  const [level2Remediation, setLevel2Remediation] = useState<Level2RemediationId[]>([]);
  const [level2Verdict, setLevel2Verdict] = useState("");
  const [showLevel2Verdict, setShowLevel2Verdict] = useState(false);
  const [level2VerificationPassed, setLevel2VerificationPassed] = useState(false);
  const [level2VerificationRunning, setLevel2VerificationRunning] = useState(false);
  const [level2VerificationStep, setLevel2VerificationStep] = useState(0);

  const [evidence, setEvidence] = useState<EvidenceId[]>([]);
  const [showMentor, setShowMentor] = useState(false);
  const [showVerdict, setShowVerdict] = useState(false);
  const [selectedVerdict, setSelectedVerdict] = useState("");
  const [missionComplete, setMissionComplete] = useState(false);
  const [remediation, setRemediation] = useState<RemediationId[]>([]);
  const [verificationPassed, setVerificationPassed] = useState(false);
  const [verificationRunning, setVerificationRunning] = useState(false);
  const [verificationStep, setVerificationStep] = useState(0);

  const [xp, setXp] = useState(420);
  const [coins, setCoins] = useState(250);
  const [aiMission, setAiMission] = useState<MissionDefinition | null>(null);
  const [aiMissionLoading, setAiMissionLoading] = useState(false);
  const [aiMissionError, setAiMissionError] = useState("");
  const [aiEvidence, setAiEvidence] = useState<string[]>([]);
  const [aiActions, setAiActions] = useState<string[]>([]);
  const [aiDiagnosis, setAiDiagnosis] = useState("");
  const [aiVerified, setAiVerified] = useState(false);
  const [aiVerificationRunning, setAiVerificationRunning] = useState(false);
  const [showAiDiagnosis, setShowAiDiagnosis] = useState(false);
  const [showAiMentor, setShowAiMentor] = useState(false);
  const [aiMentorMode, setAiMentorMode] = useState<"hint" | "explain" | "guide">("hint");

  const AI_API_BASE = "http://localhost:3001";

  const getCachedAIMission = (level: number): MissionDefinition | null => {
    try {
      const raw = localStorage.getItem(`cybersim_ai_mission_${level}`);
      return raw ? (JSON.parse(raw) as MissionDefinition) : null;
    } catch {
      return null;
    }
  };

  const cacheAIMission = (mission: MissionDefinition) => {
    localStorage.setItem(`cybersim_ai_mission_${mission.level}`, JSON.stringify(mission));
  };

  const loadAIMission = async (level: number, forceRegenerate = false): Promise<MissionDefinition | null> => {
    if (level < 3) return null;

    setAiMissionError("");
    const cached = !forceRegenerate ? getCachedAIMission(level) : null;
    if (cached) {
      setAiMission(cached);
      return cached;
    }

    if (aiMissionLoading) return null;

    setAiMissionLoading(true);
    try {
      const response = await fetch(`${AI_API_BASE}/api/missions/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level,
          difficulty: level <= 4 ? "medium" : level <= 7 ? "hard" : "expert",
          patternId: level % 2 === 0 ? "brute-force-investigation" : "web-application-incident",
          seed: `cybersim-level-${level}`,
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload?.mission) {
        throw new Error(payload?.message || payload?.error || "Mission generation failed");
      }

      const mission = payload.mission as MissionDefinition;
      setAiMission(mission);
      cacheAIMission(mission);
      return mission;
    } catch (error) {
      console.error("AI mission loading error:", error);
      setAiMissionError(
        error instanceof Error ? error.message : "Unable to generate the mission.",
      );
      setAiMission(null);
      return null;
    } finally {
      setAiMissionLoading(false);
    }
  };

  // Prepare the current AI mission automatically when its level becomes unlocked.
  // This prevents Level 3+ from sitting on "MISSION PACK PENDING".
  useEffect(() => {
    if (screen === "home" && currentCampaignLevel >= 3) {
      void loadAIMission(currentCampaignLevel);
    }
  }, [screen, currentCampaignLevel]);

  const resetAIMissionProgress = () => {
    setAiEvidence([]);
    setAiActions([]);
    setAiDiagnosis("");
    setAiVerified(false);
    setAiVerificationRunning(false);
    setShowAiDiagnosis(false);
    setShowAiMentor(false);
  };

  const addAiEvidence = (id: string) => {
    setAiEvidence((current) => current.includes(id) ? current : [...current, id]);
  };

  const completeAiAction = (id: string) => {
    if (!aiMission || !aiDiagnosis || aiDiagnosis !== aiMission.primaryDiagnosis) return;
    setAiActions((current) => current.includes(id) ? current : [...current, id]);
  };

  const allAiRequiredActionsDone = !!aiMission &&
    aiMission.actions.filter((action) => action.required).every((action) =>
      aiActions.includes(action.id),
    );

  const canVerifyAiMission = !!aiMission &&
    aiMission.verification.some((check) =>
      check.requiresActions.every((actionId) => aiActions.includes(actionId)),
    );

  const verifyAiMission = () => {
    if (!aiMission || !canVerifyAiMission || aiVerificationRunning) return;

    setAiVerificationRunning(true);

    window.setTimeout(() => {
      setAiVerified(true);
      setAiVerificationRunning(false);
      setXp((current) => current + aiMission.rewards.xp);
      setCoins((current) => current + aiMission.rewards.coins);
      markLevelCompleted(aiMission.level);
      setScreen("complete");
    }, 1100);
  };


  const addEvidence = (id: EvidenceId) => {
    setEvidence((current) =>
      current.includes(id) ? current : [...current, id]
    );
  };

  const hasEvidence = (id: EvidenceId) =>
    evidence.includes(id);

  const addLevel2Evidence = (id: Level2EvidenceId) => {
    setLevel2Evidence((current) =>
      current.includes(id) ? current : [...current, id]
    );
  };

  const hasLevel2Evidence = (id: Level2EvidenceId) =>
    level2Evidence.includes(id);

  void missionComplete;
  void aiMissionLoading;
  void aiMissionError;
  void hasLevel2Evidence;

  const applyLevel2Remediation = (id: Level2RemediationId) => {
    setLevel2Remediation((current) =>
      current.includes(id) ? current : [...current, id]
    );
  };

  const hasLevel2Remediation = (id: Level2RemediationId) =>
    level2Remediation.includes(id);

  const handleLogin = () => {
    if (operatorId.trim() === "") {
      alert("Please enter your Operator ID");
      return;
    }

    setScreen("home");
  };

  const startMission = () => {
    setEvidence([]);
    setLevel2Evidence([]);
    setLevel2Remediation([]);
    setLevel2Verdict("");
    setShowLevel2Verdict(false);
    setLevel2VerificationPassed(false);
    setLevel2VerificationRunning(false);
    setLevel2VerificationStep(0);

    setMissionComplete(false);
    setSelectedVerdict("");
    setShowVerdict(false);
    setShowMentor(false);
    setActiveTool(missionId === 1 ? "email" : "logs");
    setMissionPhase("investigate");
    setRemediation([]);
    setVerificationPassed(false);
    setVerificationRunning(false);
    setVerificationStep(0);
    resetAIMissionProgress();
    if (missionId >= 3) {
      setActiveTool((aiMission?.availableTools[0] as Tool) || "browser");
    }
    setScreen("workstation");
  };

  const handleLevel2Verdict = () => {
    if (level2Verdict === "Brute Force Attack") {
      setShowLevel2Verdict(false);
      setLevel2Verdict("");
      setMissionPhase("solve");
      setActiveTool("terminal");
    } else {
      alert(
        "Incorrect diagnosis. Review the login activity, source IP and account evidence before deciding."
      );
    }
  };

  const runLevel2Verification = async () => {
    if (
      level2Remediation.length < 3 ||
      level2VerificationRunning ||
      level2VerificationPassed
    ) {
      return;
    }

    setLevel2VerificationRunning(true);
    setLevel2VerificationStep(0);

    for (let step = 1; step <= 3; step += 1) {
      await new Promise((resolve) => setTimeout(resolve, 700));
      setLevel2VerificationStep(step);
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
    setLevel2VerificationPassed(true);
    markLevelCompleted(2);
    setMissionComplete(true);
    setXp((current) => current + 600);
    setCoins((current) => current + 120);
    setLevel2VerificationRunning(false);
  };

  const handleVerdict = () => {
    if (selectedVerdict === "Phishing Attack") {
      setShowVerdict(false);
      setMissionPhase("solve");
      setSelectedVerdict("");
      setActiveTool("terminal");
    } else {
      alert(
        "Incorrect verdict. Review the collected evidence and investigate the incident again."
      );
    }
  };

  const applyRemediation = (id: RemediationId) => {
    setRemediation((current) =>
      current.includes(id) ? current : [...current, id]
    );
  };

  const hasRemediation = (id: RemediationId) =>
    remediation.includes(id);

  const remediationCount = remediation.length;

  const runVerification = async () => {
    if (remediationCount < 3 || verificationRunning || verificationPassed) {
      return;
    }

    setVerificationRunning(true);
    setVerificationStep(0);

    // Simulated verification sequence — no real systems are touched.
    for (let step = 1; step <= 3; step += 1) {
      await new Promise((resolve) => setTimeout(resolve, 700));
      setVerificationStep(step);
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
    setVerificationPassed(true);
    markLevelCompleted(1);
    setMissionComplete(true);
    setXp((current) => current + 500);
    setCoins((current) => current + 100);
    setVerificationRunning(false);
  };

  const finishMission = () => {
    setScreen("complete");
  };

  const evidenceCount = evidence.length;

  const objectiveCount =
    (hasEvidence("sender") ? 1 : 0) +
    (hasEvidence("domain") ? 1 : 0) +
    (hasEvidence("reputation") ? 1 : 0) +
    (hasEvidence("attachment") ? 1 : 0);

  /* =====================================================
     LOGIN
  ===================================================== */

  if (screen === "login") {
    return (
      <div className="login-page">
        <div className="login-container">

          <div className="logo-section">
            <div className="logo-icon">⌁</div>

            <h1>
              CYBERSIM<span> AI</span>
            </h1>

            <p>CYBERSECURITY SIMULATION PLATFORM</p>
          </div>

          <div className="login-card">

            <div className="card-header">
              <div className="status-dot"></div>
              <span>SECURE LOGIN</span>
            </div>

            <div className="input-group">
              <label>OPERATOR ID</label>

              <input
                type="text"
                placeholder="Enter your operator ID"
                value={operatorId}
                onChange={(e) => setOperatorId(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>ACCESS CODE</label>

              <input
                type="password"
                placeholder="Enter access code"
              />
            </div>

            <button
              className="login-button"
              onClick={handleLogin}
            >
              INITIALIZE SESSION
              <span>→</span>
            </button>

            <div className="security-info">
              <span>●</span>
              SECURE CONNECTION ESTABLISHED
            </div>

          </div>

          <div className="footer">
            CYBERSIM AI • TRAINING SIMULATION
          </div>

        </div>
      </div>
    );
  }

  if (screen === "complete" && missionId >= 3 && aiMission) {
    const verificationMessage =
      aiMission.verification.find((check) =>
        check.requiresActions.every((actionId) => aiActions.includes(actionId)),
      )?.successMessage || "MISSION VERIFIED";

    return (
      <div className="complete-page">
        <header className="top-bar">
          <div className="brand">
            <div className="mini-logo">⌁</div>
            <span>CYBERSIM <b>AI</b></span>
          </div>
          <div className="briefing-status">
            MISSION {missionId.toString().padStart(2, "0")} / COMPLETE
          </div>
        </header>

        <main className="complete-content">
          <div className="completion-icon">✓</div>
          <p className="eyebrow">MISSION COMPLETE</p>
          <h1>{aiMission.title}</h1>
          <p className="complete-message">{verificationMessage}</p>
          <div className="mission-stats">
            <div><span>XP REWARD</span><strong>+{aiMission.rewards.xp} XP</strong></div>
            <div><span>COINS</span><strong>+{aiMission.rewards.coins}</strong></div>
            <div><span>THREAT</span><strong>{aiMission.category.toUpperCase()}</strong></div>
            <div><span>STATUS</span><strong>VERIFIED</strong></div>
          </div>
          <button
            className="mission-button"
            style={{ margin: "35px auto 0" }}
            onClick={() => {
              setAiMission(null);
              setScreen("home");
            }}
          >
            RETURN TO GAME HUB <span>→</span>
          </button>
        </main>
      </div>
    );
  }

  /* =====================================================
     MISSION COMPLETE
  ===================================================== */

  if (screen === "complete") {
    return (
      <div className="briefing-page">

        <header className="top-bar">
          <div className="brand">
            <div className="mini-logo">⌁</div>

            <span>
              CYBERSIM <b>AI</b>
            </span>
          </div>

          <div className="briefing-status">
            MISSION {missionId.toString().padStart(2, "0")} / COMPLETE
          </div>
        </header>

        <main
          style={{
            width: "min(850px, 92%)",
            margin: "0 auto",
            padding: "100px 0",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 90,
              height: 90,
              margin: "0 auto 30px",
              border: "2px solid #00ffd5",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#00ffd5",
              fontSize: 42,
              boxShadow: "0 0 35px rgba(0,255,213,.2)",
            }}
          >
            ✓
          </div>

          <p
            style={{
              color: "#00ffd5",
              letterSpacing: 3,
              fontSize: 11,
            }}
          >
            MISSION COMPLETE
          </p>

          <h1
            style={{
              color: "#f2f6f7",
              fontSize: 48,
              margin: "15px 0",
            }}
          >
            INCIDENT
            <span style={{ color: "#00ffd5" }}>
              {" "}CONTAINED
            </span>
          </h1>

          <p
            style={{
              color: "#91a3aa",
              maxWidth: 600,
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            {missionId === 1
              ? "Excellent incident response. You investigated the simulated phishing attack, contained the affected components and successfully verified the defensive actions."
              : "Excellent incident response. You investigated the simulated brute-force incident, applied the defensive controls and successfully verified the simulated environment."}
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 12,
              marginTop: 40,
            }}
          >
            <div className="player-card">
              <p className="small-label">EVIDENCE</p>
              <h2 style={{ color: "#00ffd5" }}>
                {missionId === 1 ? evidenceCount : level2Evidence.length}/4
              </h2>
            </div>

            <div className="player-card">
              <p className="small-label">XP EARNED</p>
              <h2 style={{ color: "#00ffd5" }}>
                {missionId === 1 ? "+500" : "+600"}
              </h2>
            </div>

            <div className="player-card">
              <p className="small-label">COINS</p>
              <h2 style={{ color: "#ffd76a" }}>
                {missionId === 1 ? "+100" : "+120"}
              </h2>
            </div>

            <div className="player-card">
              <p className="small-label">VERIFICATION</p>
              <h2 style={{ color: "#00ffd5", fontSize: 18 }}>
                PASSED ✓
              </h2>
            </div>
          </div>

          <button
            className="mission-button"
            style={{
              margin: "35px auto 0",
            }}
            onClick={() => setScreen("home")}
          >
            RETURN TO GAME HUB
            <span>→</span>
          </button>
        </main>
      </div>
    );
  }

  /* =====================================================
     WORKSTATION
  ===================================================== */

  if (screen === "workstation" && missionId >= 3 && aiMission) {
    const toolEvidence = aiMission.evidence.filter((item) => item.tool === activeTool);
    const requiredActions = aiMission.actions.filter((action) => action.required);

    return (
      <div className="workstation-page">
        <header className="workstation-topbar">
          <div className="brand">
            <div className="mini-logo">⌁</div>
            <span>CYBERSIM <b>AI</b></span>
          </div>
          <button className="home-nav-button" onClick={() => setScreen("home")}>← HOME</button>
          <div className="mission-indicator">
            <span>MISSION {missionId.toString().padStart(2, "0")}</span>
            <strong>{aiMission.title}</strong>
          </div>
          <div className="workstation-resources">
            <span>{xp} XP</span>
            <span>🪙 {coins}</span>
          </div>
        </header>

        <div className="workstation-layout">
          <aside className="tool-sidebar">
            <div className="sidebar-title">WORKSTATION</div>

            {aiMission.availableTools.map((tool) => (
              <button
                key={tool}
                className={`tool-button ${activeTool === tool ? "active" : ""}`}
                onClick={() => setActiveTool(tool as Tool)}
              >
                <span>◈</span>
                <small>{tool.toUpperCase()}</small>
              </button>
            ))}

            <button className="tool-button" onClick={() => setShowAiMentor(true)}>
              <span>✦</span>
              <small>AI MENTOR</small>
            </button>
          </aside>

          <main className="workstation-main">
            <div className="workstation-heading">
              <div>
                <p className="eyebrow">{aiMission.category.toUpperCase()}</p>
                <h1>{aiMission.subtitle}</h1>
              </div>
              <div className="phase-indicator">
                {aiVerified ? "VERIFIED" : allAiRequiredActionsDone ? "VERIFY" : aiDiagnosis ? "SOLVE" : "INVESTIGATE"}
              </div>
            </div>

            <section className="evidence-panel">
              <div className="section-title">
                <div>
                  <p className="small-label">{activeTool.toUpperCase()}</p>
                  <h2>SIMULATED EVIDENCE</h2>
                </div>
                <span>{aiEvidence.length} / {aiMission.evidence.length} DISCOVERED</span>
              </div>

              {toolEvidence.length === 0 ? (
                <div className="empty-state">
                  <p>No evidence available in this tool yet.</p>
                  <small>Explore the other simulated tools to continue the investigation.</small>
                </div>
              ) : (
                <div className="evidence-grid">
                  {toolEvidence.map((item) => (
                    <button
                      key={item.id}
                      className="evidence-card"
                      onClick={() => addAiEvidence(item.id)}
                      style={{
                        borderColor: aiEvidence.includes(item.id) ? "#00ffd5" : undefined,
                        textAlign: "left",
                      }}
                    >
                      <span className="small-label">{item.type.toUpperCase()}</span>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                      {item.data && (
                        <div style={{ marginTop: 12, fontSize: 12, opacity: .8 }}>
                          {Object.entries(item.data).map(([key, value]) => (
                            <div key={key}><strong>{key}:</strong> {String(value)}</div>
                          ))}
                        </div>
                      )}
                      <small>{aiEvidence.includes(item.id) ? "EVIDENCE COLLECTED ✓" : "INSPECT EVIDENCE →"}</small>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="mission-card" style={{ marginTop: 18 }}>
              <div className="mission-header">
                <div>
                  <p className="small-label">MISSION OBJECTIVES</p>
                  <h2>INVESTIGATE → IDENTIFY → SOLVE → VERIFY</h2>
                </div>
              </div>

              <div style={{ display: "grid", gap: 9, marginTop: 16 }}>
                {aiMission.objectives.map((objective) => {
                  const done =
                    objective.completionKey === "all-evidence"
                      ? aiEvidence.length >= aiMission.evidence.length
                      : objective.completionKey === "correct-diagnosis"
                        ? aiDiagnosis === aiMission.primaryDiagnosis
                        : objective.completionKey === "verification"
                          ? aiVerified
                          : objective.completionKey.startsWith("action-")
                            ? aiActions.includes(objective.completionKey)
                            : false;

                  return (
                    <div key={objective.id} className="objective">
                      <span>{done ? "✓" : "○"}</span>
                      <p>{objective.title}</p>
                    </div>
                  );
                })}
              </div>
            </section>

            {!aiDiagnosis && aiEvidence.length >= aiMission.evidence.length && (
              <section className="mission-card" style={{ marginTop: 18 }}>
                <div className="section-title">
                  <div>
                    <p className="small-label">THREAT ANALYSIS</p>
                    <h2>IDENTIFY THE INCIDENT</h2>
                  </div>
                </div>
                <p className="mission-description">
                  Review the collected evidence and select the most likely diagnosis.
                </p>
                <button
                  className="mission-button"
                  onClick={() => setShowAiDiagnosis(true)}
                >
                  SUBMIT DIAGNOSIS <span>→</span>
                </button>
              </section>
            )}

            {aiDiagnosis && (
              <section className="mission-card" style={{ marginTop: 18 }}>
                <div className="section-title">
                  <div>
                    <p className="small-label">REMEDIATION</p>
                    <h2>CONTAIN THE INCIDENT</h2>
                  </div>
                </div>

                <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
                  {requiredActions.map((action) => {
                    const done = aiActions.includes(action.id);
                    return (
                      <button
                        key={action.id}
                        className="tool-button"
                        disabled={done}
                        onClick={() => completeAiAction(action.id)}
                        style={{
                          width: "100%",
                          minHeight: 64,
                          display: "block",
                          textAlign: "left",
                          padding: "14px 18px",
                          opacity: done ? .55 : 1,
                        }}
                      >
                        <strong>{done ? "✓ " : "→ "}{action.title}</strong>
                        <div style={{ fontSize: 12, marginTop: 5, opacity: .75 }}>
                          {action.description}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {canVerifyAiMission && !aiVerified && (
                  <button
                    className="deploy-button"
                    onClick={verifyAiMission}
                    disabled={aiVerificationRunning}
                    style={{ marginTop: 20 }}
                  >
                    {aiVerificationRunning ? "VERIFYING..." : "RUN VERIFICATION →"}
                  </button>
                )}
              </section>
            )}

            {showAiMentor && (
              <div className="modal-overlay" onClick={() => setShowAiMentor(false)}>
                <div className="modal-card" onClick={(event) => event.stopPropagation()}>
                  <div className="section-title">
                    <div>
                      <p className="small-label">CYBERSIM AI</p>
                      <h2>MISSION MENTOR</h2>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, margin: "18px 0" }}>
                    {(["hint", "explain", "guide"] as const).map((mode) => (
                      <button key={mode} className="tool-button" onClick={() => setAiMentorMode(mode)}>
                        <small>{mode.toUpperCase()}</small>
                      </button>
                    ))}
                  </div>
                  <p className="mission-description">
                    {aiMentorMode === "hint"
                      ? "Start by examining every piece of evidence available through the simulated tools. Look for indicators that do not belong together."
                      : aiMentorMode === "explain"
                        ? `Your current mission is a ${aiMission.category} scenario. Evidence should be correlated before selecting a diagnosis.`
                        : aiDiagnosis
                          ? "Diagnosis selected. Now complete the required defensive remediation actions and then run verification."
                          : "Inspect the available tools one by one, collect the evidence, correlate the indicators, and then submit your diagnosis."}
                  </p>
                  <button className="abort-button" onClick={() => setShowAiMentor(false)}>CLOSE</button>
                </div>
              </div>
            )}

            {showAiDiagnosis && (
              <div className="modal-overlay" onClick={() => setShowAiDiagnosis(false)}>
                <div className="modal-card" onClick={(event) => event.stopPropagation()}>
                  <p className="small-label">DIAGNOSIS</p>
                  <h2>WHAT IS HAPPENING?</h2>
                  <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
                    {aiMission.diagnoses.map((diagnosis) => (
                      <button
                        key={diagnosis}
                        className="tool-button"
                        style={{ width: "100%", textAlign: "left", padding: 16 }}
                        onClick={() => {
                          setAiDiagnosis(diagnosis);
                          setShowAiDiagnosis(false);
                        }}
                      >
                        ○ {diagnosis}
                      </button>
                    ))}
                  </div>
                  <button className="abort-button" onClick={() => setShowAiDiagnosis(false)} style={{ marginTop: 18 }}>
                    CANCEL
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    );
  }

  if (screen === "workstation") {
    return (
      <div className="workstation-page">

        <header className="workstation-topbar">

          <div className="brand">
            <div className="mini-logo">⌁</div>

            <span>
              CYBERSIM <b>AI</b>
            </span>
          </div>

          <button
            className="home-nav-button"
            onClick={() => setScreen("home")}
            title="Return to Game Hub"
          >
            ← HOME
          </button>

          <div className="mission-indicator">
            <span>MISSION {missionId.toString().padStart(2, "0")}</span>
            <strong>
              {missionId === 1 ? "THE SUSPICIOUS INVOICE" : "SUSPICIOUS LOGIN ACTIVITY"}
            </strong>
          </div>

          <div className="workstation-resources">
            <span>{xp} XP</span>
            <span>🪙 {coins}</span>
          </div>

        </header>

        <div className="workstation-layout">

          {/* LEFT TOOLBAR */}

          <aside className="tool-sidebar">

            <div className="sidebar-title">
              WORKSTATION
            </div>

            {missionId === 1 ? (
              <>
                <button
                  className={`tool-button ${
                    activeTool === "email" ? "active" : ""
                  }`}
                  onClick={() => {
                    setActiveTool("email");
                    addEvidence("sender");
                  }}
                >
                  <span>✉</span>
                  <small>EMAIL</small>
                </button>

                <button
                  className={`tool-button ${
                    activeTool === "browser" ? "active" : ""
                  }`}
                  onClick={() => {
                    setActiveTool("browser");
                    addEvidence("domain");
                  }}
                >
                  <span>◎</span>
                  <small>BROWSER</small>
                </button>

                <button
                  className={`tool-button ${
                    activeTool === "files" ? "active" : ""
                  }`}
                  onClick={() => {
                    setActiveTool("files");
                    addEvidence("attachment");
                  }}
                >
                  <span>▣</span>
                  <small>FILES</small>
                </button>

                <button
                  className={`tool-button ${
                    activeTool === "intel" ? "active" : ""
                  }`}
                  onClick={() => {
                    setActiveTool("intel");
                    addEvidence("reputation");
                  }}
                >
                  <span>⌕</span>
                  <small>THREAT INTEL</small>
                </button>

                <button
                  className={`tool-button ${
                    activeTool === "terminal" ? "active" : ""
                  }`}
                  onClick={() => setActiveTool("terminal")}
                >
                  <span>⌘</span>
                  <small>TERMINAL</small>
                </button>
              </>
            ) : (
              <>
                <button
                  className={`tool-button ${
                    activeTool === "logs" ? "active" : ""
                  }`}
                  onClick={() => {
                    setActiveTool("logs");
                    addLevel2Evidence("logs");
                  }}
                >
                  <span>▤</span>
                  <small>LOGIN LOGS</small>
                </button>

                <button
                  className={`tool-button ${
                    activeTool === "ip" ? "active" : ""
                  }`}
                  onClick={() => {
                    setActiveTool("ip");
                    addLevel2Evidence("ip");
                  }}
                >
                  <span>◎</span>
                  <small>IP INTEL</small>
                </button>

                <button
                  className={`tool-button ${
                    activeTool === "users" ? "active" : ""
                  }`}
                  onClick={() => {
                    setActiveTool("users");
                    addLevel2Evidence("account");
                  }}
                >
                  <span>♙</span>
                  <small>USER ADMIN</small>
                </button>

                <button
                  className={`tool-button ${
                    activeTool === "auth" ? "active" : ""
                  }`}
                  onClick={() => {
                    setActiveTool("auth");
                    addLevel2Evidence("auth");
                  }}
                >
                  <span>⌁</span>
                  <small>AUTH EVENTS</small>
                </button>

                <button
                  className={`tool-button ${
                    activeTool === "terminal" ? "active" : ""
                  }`}
                  onClick={() => setActiveTool("terminal")}
                >
                  <span>⌘</span>
                  <small>RESPONSE</small>
                </button>
              </>
            )}

            <div className="sidebar-divider"></div>

            <button
              className="ai-tool-button"
              onClick={() => setShowMentor(true)}
            >
              <span>🤖</span>
              <small>AI MENTOR</small>
            </button>

          </aside>

          {/* MAIN WORKSPACE */}

          <main className="main-workspace">

            <div className="workspace-header">

              <div>
                <p>VIRTUAL WORKSTATION</p>
                <h1>INVESTIGATION CONSOLE</h1>
              </div>

              <div className="connection-status">
                <span></span>
                SIMULATION ONLINE
              </div>

            </div>

            {missionId === 2 && (
              <>
                {missionPhase === "investigate" && (
                  <>
                    {activeTool === "logs" && (
                      <div className="app-window">
                        <div className="window-titlebar">
                          <span>▤ AUTHENTICATION LOGS</span>
                          <span className="window-status">SIMULATED SIEM</span>
                        </div>
                        <div style={{ padding: 24 }}>
                          <div style={{ color: "#91a3aa", fontSize: 11, marginBottom: 18 }}>
                            AUTHENTICATION EVENTS — LAST 30 MINUTES
                          </div>
                          <div style={{ display: "grid", gap: 8 }}>
                            {[
                              ["09:41:02", "admin", "203.0.113.42", "FAILED"],
                              ["09:41:04", "admin", "203.0.113.42", "FAILED"],
                              ["09:41:06", "admin", "203.0.113.42", "FAILED"],
                              ["09:41:08", "admin", "203.0.113.42", "FAILED"],
                              ["09:41:10", "admin", "203.0.113.42", "FAILED"],
                              ["09:41:12", "admin", "203.0.113.42", "FAILED"],
                            ].map(([time, user, ip, result]) => (
                              <div key={time} style={{
                                display: "grid",
                                gridTemplateColumns: "100px 1fr 1.5fr 100px",
                                gap: 12,
                                padding: "11px 13px",
                                background: "#0b141a",
                                border: "1px solid #253840",
                                borderRadius: 7,
                                fontSize: 10,
                              }}>
                                <span style={{ color: "#71858d" }}>{time}</span>
                                <span style={{ color: "#dce7ea" }}>{user}</span>
                                <span style={{ color: "#9cb0b7" }}>{ip}</span>
                                <strong style={{ color: "#ff7373" }}>{result}</strong>
                              </div>
                            ))}
                          </div>
                          <div style={{ marginTop: 18, color: "#00ffd5", fontSize: 10 }}>
                            ✓ Repeated failed authentication attempts detected
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTool === "ip" && (
                      <div className="app-window">
                        <div className="window-titlebar">
                          <span>◎ IP INTELLIGENCE</span>
                          <span className="window-status">LOCAL THREAT DATABASE</span>
                        </div>
                        <div style={{ padding: 26 }}>
                          <div style={{ color: "#71858d", fontSize: 8, letterSpacing: 2 }}>SOURCE IP</div>
                          <h2 style={{ color: "#edf4f6", margin: "8px 0 22px" }}>203.0.113.42</h2>
                          <div className="intel-grid">
                            <div><span>REPUTATION</span><strong className="danger">SUSPICIOUS</strong></div>
                            <div><span>FAILED ATTEMPTS</span><strong className="danger">48</strong></div>
                            <div><span>REGION</span><strong>SIMULATED</strong></div>
                            <div><span>THREAT TYPE</span><strong>LOGIN ABUSE</strong></div>
                          </div>
                          <div className="intel-alert" style={{ marginTop: 20 }}>
                            ⚠ Source generated repeated authentication failures against a privileged account.
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTool === "users" && (
                      <div className="app-window">
                        <div className="window-titlebar">
                          <span>♙ USER ADMINISTRATION</span>
                          <span className="window-status">SIMULATED DIRECTORY</span>
                        </div>
                        <div style={{ padding: 26 }}>
                          <div style={{ display: "grid", gap: 10 }}>
                            <div style={{ padding: 16, background: "#0b141a", border: "1px solid #304650", borderRadius: 9 }}>
                              <span style={{ color: "#71858d", fontSize: 8 }}>ACCOUNT</span>
                              <h3 style={{ color: "#edf4f6", margin: "7px 0" }}>admin</h3>
                              <span style={{ color: "#ff7373", fontSize: 10 }}>PRIVILEGED ACCOUNT • ABNORMAL LOGIN ACTIVITY</span>
                            </div>
                            <div style={{ padding: 16, background: "#0b141a", border: "1px solid #263840", borderRadius: 9 }}>
                              <span style={{ color: "#71858d", fontSize: 8 }}>LAST SUCCESSFUL LOGIN</span>
                              <strong style={{ display: "block", color: "#dce7ea", marginTop: 7 }}>08:55 AM • NORMAL OFFICE NETWORK</strong>
                            </div>
                          </div>
                          <div style={{ marginTop: 18, color: "#00ffd5", fontSize: 10 }}>
                            ✓ Target account evidence collected
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTool === "auth" && (
                      <div className="app-window">
                        <div className="window-titlebar">
                          <span>⌁ AUTHENTICATION EVENTS</span>
                          <span className="window-status">SECURITY MONITOR</span>
                        </div>
                        <div style={{ padding: 26 }}>
                          <div className="intel-grid">
                            <div><span>NORMAL LOGIN RATE</span><strong>2 / MIN</strong></div>
                            <div><span>CURRENT RATE</span><strong className="danger">24 / MIN</strong></div>
                            <div><span>FAILURE RATIO</span><strong className="danger">100%</strong></div>
                            <div><span>ACCOUNT TARGETED</span><strong>admin</strong></div>
                          </div>
                          <div className="intel-alert" style={{ marginTop: 20 }}>
                            ⚠ Authentication pattern is consistent with a simulated brute-force attempt.
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTool === "terminal" && (
                      <div className="app-window terminal-window">
                        <div className="window-titlebar">
                          <span>⌘ SIMULATED RESPONSE CONSOLE</span>
                          <span className="window-status">SANDBOX</span>
                        </div>
                        <div className="terminal-content">
                          <p>CyberSim Response Console v1.0</p>
                          <p>Investigation mode active.</p>
                          <p>Use the evidence tools to understand the authentication anomaly.</p>
                          <p className="terminal-note">No real accounts, credentials or network systems are accessed.</p>
                        </div>
                      </div>
                    )}
                  {level2Evidence.length === 4 && (
                    <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end" }}>
                      <button
                        className="deploy-button"
                        onClick={() => setShowLevel2Verdict(true)}
                      >
                        SUBMIT DIAGNOSIS →
                      </button>
                    </div>
                  )}
                  </>
                )}

                {missionPhase === "solve" && (
                  <div style={{
                    background: "linear-gradient(145deg, #101c25, #0b141b)",
                    border: "1px solid #304954",
                    borderRadius: 16,
                    padding: 28,
                  }}>
                    <p style={{ color: "#00ffd5", fontSize: 9, letterSpacing: 2 }}>PHASE 02 / INCIDENT RESPONSE</p>
                    <h2 style={{ color: "#edf4f6", margin: "8px 0" }}>CONTAIN THE BRUTE-FORCE INCIDENT</h2>
                    <p style={{ color: "#91a3aa", fontSize: 12, lineHeight: 1.6 }}>
                      Apply the simulated defensive controls. These actions affect only the CyberSim training environment.
                    </p>

                    <div style={{ display: "grid", gap: 12, marginTop: 22 }}>
                      {[
                        {
                          id: "block-ip" as Level2RemediationId,
                          icon: "◎",
                          title: "BLOCK THE SUSPICIOUS IP",
                          text: "Add 203.0.113.42 to the simulated authentication block list.",
                        },
                        {
                          id: "disable-account" as Level2RemediationId,
                          icon: "♙",
                          title: "DISABLE THE TARGET ACCOUNT",
                          text: "Temporarily disable the simulated admin account until the incident is reviewed.",
                        },
                        {
                          id: "rate-limit" as Level2RemediationId,
                          icon: "⌁",
                          title: "ENFORCE LOGIN RATE LIMITING",
                          text: "Apply a simulated authentication rate limit to reduce repeated login attempts.",
                        },
                      ].map((action) => {
                        const done = hasLevel2Remediation(action.id);
                        return (
                          <button
                            key={action.id}
                            onClick={() => applyLevel2Remediation(action.id)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 16,
                              width: "100%",
                              padding: "17px 18px",
                              textAlign: "left",
                              background: done ? "rgba(0,255,213,.07)" : "#0c151c",
                              border: `1px solid ${done ? "#00ffd5" : "#2d414a"}`,
                              borderRadius: 11,
                              color: "#dce7ea",
                              cursor: done ? "default" : "pointer",
                            }}
                          >
                            <span style={{ fontSize: 23, color: done ? "#00ffd5" : "#7e96a0", width: 30, textAlign: "center" }}>
                              {done ? "✓" : action.icon}
                            </span>
                            <span style={{ flex: 1 }}>
                              <strong style={{ display: "block", fontSize: 12, letterSpacing: .8, color: done ? "#00ffd5" : "#edf4f6" }}>
                                {action.title}
                              </strong>
                              <small style={{ display: "block", color: "#82959d", marginTop: 5, lineHeight: 1.5 }}>
                                {action.text}
                              </small>
                            </span>
                            <span style={{ fontSize: 9, color: done ? "#00ffd5" : "#61757e", letterSpacing: 1 }}>
                              {done ? "APPLIED" : "EXECUTE →"}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div style={{ marginTop: 20, padding: 15, borderRadius: 10, background: "#0a1218", border: "1px dashed #304650", color: "#91a3aa", fontSize: 11 }}>
                      Simulated controls only — no real authentication systems are changed.
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 22 }}>
                      <button
                        className="deploy-button"
                        disabled={level2Remediation.length < 3}
                        onClick={() => setMissionPhase("verify")}
                        style={{ opacity: level2Remediation.length === 3 ? 1 : .4 }}
                      >
                        PROCEED TO VERIFICATION →
                      </button>
                    </div>
                  </div>
                )}

                {missionPhase === "verify" && (
                  <div style={{
                    background: "linear-gradient(145deg, #101c25, #0b141b)",
                    border: "1px solid #304954",
                    borderRadius: 16,
                    padding: 30,
                    textAlign: "center",
                  }}>
                    <div style={{ width: 72, height: 72, margin: "0 auto 20px", borderRadius: "50%", border: "1px solid #00ffd5", display: "flex", alignItems: "center", justifyContent: "center", color: "#00ffd5", fontSize: 30 }}>
                      {level2VerificationPassed ? "✓" : "⌁"}
                    </div>
                    <p style={{ color: "#00ffd5", fontSize: 9, letterSpacing: 2 }}>PHASE 03 / VERIFY</p>
                    <h2 style={{ color: "#edf4f6", margin: "10px 0" }}>VERIFY DEFENSIVE CONTROLS</h2>
                    <p style={{ color: "#91a3aa", maxWidth: 560, margin: "0 auto", lineHeight: 1.7, fontSize: 12 }}>
                      Confirm that the simulated source IP is blocked, the target account is isolated and rate limiting is active.
                    </p>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 25 }}>
                      {[
                        ["IP BLOCK", hasLevel2Remediation("block-ip")],
                        ["ACCOUNT ISOLATION", hasLevel2Remediation("disable-account")],
                        ["RATE LIMIT", hasLevel2Remediation("rate-limit")],
                      ].map(([label, done]) => (
                        <div key={String(label)} style={{ padding: 14, borderRadius: 9, border: `1px solid ${done ? "#00ffd5" : "#744c4c"}`, background: done ? "rgba(0,255,213,.05)" : "rgba(255,80,80,.04)" }}>
                          <div style={{ color: "#71858d", fontSize: 8, letterSpacing: 1.3 }}>{label}</div>
                          <strong style={{ color: done ? "#00ffd5" : "#ff7373", display: "block", marginTop: 7, fontSize: 11 }}>
                            {done ? "READY" : "NOT APPLIED"}
                          </strong>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: 25, padding: 16, borderRadius: 10, background: "#0a1218", border: "1px solid #263b45", textAlign: "left" }}>
                      {["SOURCE IP BLOCK", "ACCOUNT ISOLATION", "RATE LIMIT POLICY"].map((label, index) => {
                        const complete = level2VerificationStep > index || level2VerificationPassed;
                        const active = level2VerificationRunning && level2VerificationStep === index;
                        return (
                          <div key={label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", color: complete ? "#00ffd5" : active ? "#ffd76a" : "#61757e", borderBottom: index < 2 ? "1px solid #1d2d35" : "none", fontSize: 10, letterSpacing: 1 }}>
                            <span style={{ width: 20, textAlign: "center" }}>{complete ? "✓" : active ? "◌" : "○"}</span>
                            <span style={{ flex: 1 }}>{label}</span>
                            <span style={{ fontSize: 8 }}>{complete ? "VERIFIED" : active ? "CHECKING..." : "PENDING"}</span>
                          </div>
                        );
                      })}
                      {level2VerificationPassed && (
                        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #29424b", color: "#00ffd5", fontSize: 10, letterSpacing: 1.4 }}>
                          ✓ DEFENSIVE CONTROLS VERIFIED — INCIDENT CONTAINED
                        </div>
                      )}
                    </div>

                    {!level2VerificationPassed ? (
                      <button
                        className="deploy-button"
                        onClick={runLevel2Verification}
                        disabled={level2VerificationRunning}
                        style={{ marginTop: 25, opacity: level2VerificationRunning ? .65 : 1 }}
                      >
                        {level2VerificationRunning ? "RUNNING SECURITY CHECK..." : "RUN VERIFICATION CHECK →"}
                      </button>
                    ) : (
                      <button
                        className="mission-button"
                        onClick={finishMission}
                        style={{ margin: "25px auto 0" }}
                      >
                        COMPLETE MISSION →
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            {missionId === 1 && (
              <>


            {missionPhase === "solve" && (
              <div
                style={{
                  background: "linear-gradient(145deg, #101c25, #0b141b)",
                  border: "1px solid #304954",
                  borderRadius: 16,
                  padding: 28,
                  boxShadow: "0 20px 60px rgba(0,0,0,.25)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 20,
                    marginBottom: 24,
                  }}
                >
                  <div>
                    <p style={{ color: "#00ffd5", fontSize: 9, letterSpacing: 2, margin: 0 }}>
                      PHASE 02 / INCIDENT RESPONSE
                    </p>
                    <h2 style={{ color: "#edf4f6", margin: "8px 0 6px", fontSize: 28 }}>
                      SOLVE THE INCIDENT
                    </h2>
                    <p style={{ color: "#91a3aa", margin: 0, lineHeight: 1.6, fontSize: 12 }}>
                      You identified a phishing attack. Now contain the simulated threat and prepare the environment for verification.
                    </p>
                  </div>
                  <div style={{ minWidth: 120, textAlign: "right" }}>
                    <div style={{ color: "#71858d", fontSize: 8, letterSpacing: 1.5 }}>
                      CONTAINMENT
                    </div>
                    <strong style={{ color: remediationCount === 3 ? "#00ffd5" : "#ffd76a", fontSize: 22 }}>
                      {remediationCount}/3
                    </strong>
                  </div>
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                  {[
                    {
                      id: "email" as RemediationId,
                      icon: "✉",
                      title: "QUARANTINE THE EMAIL",
                      text: "Move the suspicious invoice out of the user's inbox so it cannot be opened or acted on.",
                    },
                    {
                      id: "domain" as RemediationId,
                      icon: "◎",
                      title: "BLOCK THE MALICIOUS DOMAIN",
                      text: "Add acme-invoices.com to the simulated email/web block list.",
                    },
                    {
                      id: "attachment" as RemediationId,
                      icon: "▣",
                      title: "QUARANTINE THE ATTACHMENT",
                      text: "Disable access to invoice_4821.docm so the macro-enabled file cannot be executed.",
                    },
                  ].map((action) => {
                    const done = hasRemediation(action.id);
                    return (
                      <button
                        key={action.id}
                        onClick={() => applyRemediation(action.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 16,
                          width: "100%",
                          padding: "17px 18px",
                          textAlign: "left",
                          background: done ? "rgba(0,255,213,.07)" : "#0c151c",
                          border: `1px solid ${done ? "#00ffd5" : "#2d414a"}`,
                          borderRadius: 11,
                          color: "#dce7ea",
                          cursor: done ? "default" : "pointer",
                        }}
                      >
                        <span style={{ fontSize: 23, color: done ? "#00ffd5" : "#7e96a0", width: 30, textAlign: "center" }}>
                          {done ? "✓" : action.icon}
                        </span>
                        <span style={{ flex: 1 }}>
                          <strong style={{ display: "block", fontSize: 12, letterSpacing: .8, color: done ? "#00ffd5" : "#edf4f6" }}>
                            {action.title}
                          </strong>
                          <small style={{ display: "block", color: "#82959d", marginTop: 5, lineHeight: 1.5 }}>
                            {action.text}
                          </small>
                        </span>
                        <span style={{ fontSize: 9, color: done ? "#00ffd5" : "#61757e", letterSpacing: 1 }}>
                          {done ? "CONTAINED" : "EXECUTE →"}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div style={{ marginTop: 20, padding: 15, borderRadius: 10, background: "#0a1218", border: "1px dashed #304650" }}>
                  <div style={{ color: "#ffd76a", fontSize: 9, letterSpacing: 1.5, marginBottom: 7 }}>
                    OPERATOR NOTE
                  </div>
                  <div style={{ color: "#91a3aa", fontSize: 11, lineHeight: 1.6 }}>
                    These are simulated defensive actions. You are practicing the incident-response workflow without touching any real system.
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 22 }}>
                  <button
                    className="deploy-button"
                    disabled={remediationCount < 3}
                    onClick={() => setMissionPhase("verify")}
                    style={{ opacity: remediationCount === 3 ? 1 : .4 }}
                  >
                    PROCEED TO VERIFICATION →
                  </button>
                </div>
              </div>
            )}

            {/* VERIFICATION PHASE */}

            {missionPhase === "verify" && (
              <div
                style={{
                  background: "linear-gradient(145deg, #101c25, #0b141b)",
                  border: "1px solid #304954",
                  borderRadius: 16,
                  padding: 30,
                  textAlign: "center",
                }}
              >
                <div style={{ width: 72, height: 72, margin: "0 auto 20px", borderRadius: "50%", border: "1px solid #00ffd5", display: "flex", alignItems: "center", justifyContent: "center", color: "#00ffd5", fontSize: 30, boxShadow: "0 0 30px rgba(0,255,213,.12)" }}>
                  {verificationPassed ? "✓" : "⌁"}
                </div>
                <p style={{ color: "#00ffd5", fontSize: 9, letterSpacing: 2, margin: 0 }}>
                  PHASE 03 / VERIFY
                </p>
                <h2 style={{ color: "#edf4f6", margin: "10px 0" }}>
                  VERIFY CONTAINMENT
                </h2>
                <p style={{ color: "#91a3aa", maxWidth: 560, margin: "0 auto", lineHeight: 1.7, fontSize: 12 }}>
                  Run the simulated containment check. The system will confirm whether the suspicious email, domain and attachment are all isolated.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 25 }}>
                  {[
                    ["EMAIL", hasRemediation("email")],
                    ["DOMAIN", hasRemediation("domain")],
                    ["ATTACHMENT", hasRemediation("attachment")],
                  ].map(([label, done]) => (
                    <div key={String(label)} style={{ padding: 14, borderRadius: 9, border: `1px solid ${done ? "#00ffd5" : "#744c4c"}`, background: done ? "rgba(0,255,213,.05)" : "rgba(255,80,80,.04)" }}>
                      <div style={{ color: "#71858d", fontSize: 8, letterSpacing: 1.3 }}>{label}</div>
                      <strong style={{ color: done ? "#00ffd5" : "#ff7373", display: "block", marginTop: 7, fontSize: 11 }}>{done ? "ISOLATED" : "NOT ISOLATED"}</strong>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    marginTop: 25,
                    padding: 16,
                    borderRadius: 10,
                    background: "#0a1218",
                    border: "1px solid #263b45",
                    textAlign: "left",
                  }}
                >
                  {[
                    "EMAIL QUARANTINE",
                    "DOMAIN BLOCK",
                    "ATTACHMENT ISOLATION",
                  ].map((label, index) => {
                    const complete = verificationStep > index || verificationPassed;
                    const active = verificationRunning && verificationStep === index;

                    return (
                      <div
                        key={label}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "10px 0",
                          color: complete ? "#00ffd5" : active ? "#ffd76a" : "#61757e",
                          borderBottom: index < 2 ? "1px solid #1d2d35" : "none",
                          fontSize: 10,
                          letterSpacing: 1,
                        }}
                      >
                        <span style={{ width: 20, textAlign: "center" }}>
                          {complete ? "✓" : active ? "◌" : "○"}
                        </span>
                        <span style={{ flex: 1 }}>{label}</span>
                        <span style={{ fontSize: 8 }}>
                          {complete ? "VERIFIED" : active ? "CHECKING..." : "PENDING"}
                        </span>
                      </div>
                    );
                  })}

                  {verificationPassed && (
                    <div
                      style={{
                        marginTop: 14,
                        paddingTop: 14,
                        borderTop: "1px solid #29424b",
                        color: "#00ffd5",
                        fontSize: 10,
                        letterSpacing: 1.4,
                      }}
                    >
                      ✓ CONTAINMENT VERIFIED — ALL AFFECTED COMPONENTS ISOLATED
                    </div>
                  )}
                </div>

                {!verificationPassed ? (
                  <button
                    className="deploy-button"
                    onClick={runVerification}
                    disabled={verificationRunning}
                    style={{ marginTop: 25, opacity: verificationRunning ? 0.65 : 1 }}
                  >
                    {verificationRunning ? "RUNNING CONTAINMENT CHECK..." : "RUN CONTAINMENT CHECK →"}
                  </button>
                ) : (
                  <button
                    className="mission-button"
                    onClick={finishMission}
                    style={{ margin: "25px auto 0" }}
                  >
                    COMPLETE MISSION →
                  </button>
                )}
              </div>
            )}

            {missionPhase === "investigate" && (
              <>
            {/* EMAIL */}

            {activeTool === "email" && (
              <div className="app-window">

                <div className="window-titlebar">
                  <span>✉ EMAIL CLIENT</span>

                  <span className="window-status">
                    INBOX
                  </span>
                </div>

                <div className="email-content">

                  <div className="email-meta">

                    <div>
                      <span>FROM</span>
                      <strong>
                        billing@acme-invoices.com
                      </strong>
                    </div>

                    <div>
                      <span>SUBJECT</span>
                      <strong>
                        URGENT: Overdue Invoice
                      </strong>
                    </div>

                    <div>
                      <span>DATE</span>
                      <strong>
                        Today, 09:42 AM
                      </strong>
                    </div>

                  </div>

                  <div className="email-divider"></div>

                  <div className="email-body">

                    <p>Hello,</p>

                    <p>
                      Your invoice is overdue. Please review
                      the attached document and process the
                      payment immediately.
                    </p>

                    <p>
                      Failure to complete the payment may
                      result in account suspension.
                    </p>

                    <p>
                      Regards,
                      <br />
                      Billing Department
                    </p>

                  </div>

                  <div className="attachment">

                    <span>📎</span>

                    <div>
                      <strong>
                        invoice_4821.docm
                      </strong>

                      <small>
                        Microsoft Word Macro Document
                      </small>
                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* BROWSER */}

            {activeTool === "browser" && (
              <div className="app-window">

                <div className="window-titlebar">
                  <span>◎ SECURE BROWSER</span>

                  <span className="window-status">
                    SIMULATED WEB
                  </span>
                </div>

                <div className="browser-bar">

                  <span>https://</span>

                  <input
                    value="acme-invoices.com"
                    readOnly
                  />

                  <button
                    onClick={() => addEvidence("domain")}
                  >
                    SEARCH
                  </button>

                </div>

                <div className="browser-content">

                  <div className="browser-placeholder">

                    <div className="browser-icon">
                      ◎
                    </div>

                    <h2>
                      ACME INVOICES
                    </h2>

                    <p>
                      Simulated website environment
                    </p>

                    <div className="browser-warning">
                      ⚠ Website identity could not be verified.
                    </div>

                    <div
                      style={{
                        marginTop: 20,
                        color: "#00ffd5",
                        fontSize: 10,
                      }}
                    >
                      ✓ Domain investigation evidence collected
                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* FILES */}

            {activeTool === "files" && (
              <div className="app-window">

                <div className="window-titlebar">
                  <span>▣ FILE EXPLORER</span>

                  <span className="window-status">
                    ATTACHMENTS
                  </span>
                </div>

                <div className="file-list">

                  <div className="file-item selected">

                    <span className="file-icon">
                      📄
                    </span>

                    <div>
                      <strong>
                        invoice_4821.docm
                      </strong>

                      <small>
                        Microsoft Word Macro Document
                      </small>
                    </div>

                    <span className="file-warning">
                      SUSPICIOUS
                    </span>

                  </div>

                  <div className="file-details">

                    <p>
                      <span>FILE TYPE</span>
                      Microsoft Word Macro Document
                    </p>

                    <p>
                      <span>SIZE</span>
                      184 KB
                    </p>

                    <p>
                      <span>MACROS</span>
                      <strong className="danger">
                        ENABLED
                      </strong>
                    </p>

                    <div className="file-alert">
                      ⚠ This document contains executable
                      macros.
                    </div>

                    <div
                      style={{
                        marginTop: 15,
                        color: "#00ffd5",
                        fontSize: 10,
                      }}
                    >
                      ✓ Malicious attachment evidence collected
                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* THREAT INTELLIGENCE */}

            {activeTool === "intel" && (
              <div className="app-window">

                <div className="window-titlebar">
                  <span>⌕ THREAT INTELLIGENCE</span>

                  <span className="window-status">
                    LOCAL DATABASE
                  </span>
                </div>

                <div className="intel-content">

                  <div className="intel-search">

                    <input
                      value="acme-invoices.com"
                      readOnly
                    />

                    <button
                      onClick={() =>
                        addEvidence("reputation")
                      }
                    >
                      LOOKUP
                    </button>

                  </div>

                  <div className="intel-result">

                    <div className="intel-domain">

                      <span>DOMAIN</span>

                      <strong>
                        acme-invoices.com
                      </strong>

                    </div>

                    <div className="intel-grid">

                      <div>
                        <span>DOMAIN AGE</span>

                        <strong className="danger">
                          3 DAYS
                        </strong>
                      </div>

                      <div>
                        <span>REPUTATION</span>

                        <strong className="danger">
                          MALICIOUS
                        </strong>
                      </div>

                      <div>
                        <span>RELATED IP</span>

                        <strong>
                          185.xxx.xxx.xxx
                        </strong>
                      </div>

                      <div>
                        <span>THREAT TYPE</span>

                        <strong>
                          PHISHING
                        </strong>
                      </div>

                    </div>

                    <div className="intel-alert">
                      ⚠ Domain associated with
                      simulated phishing infrastructure.
                    </div>

                    <div
                      style={{
                        marginTop: 15,
                        color: "#00ffd5",
                        fontSize: 10,
                      }}
                    >
                      ✓ Malicious reputation evidence collected
                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* TERMINAL */}

            {activeTool === "terminal" && (
              <div className="app-window terminal-window">

                <div className="window-titlebar">
                  <span>⌘ SIMULATED TERMINAL</span>

                  <span className="window-status">
                    SANDBOX
                  </span>
                </div>

                <div className="terminal-content">

                  <p>
                    CyberSim Terminal v1.0
                  </p>

                  <p>
                    Simulation environment initialized.
                  </p>

                  <br />

                  <p>
                    operator@cybersim:~$
                    <span className="terminal-cursor">
                      _
                    </span>
                  </p>

                  <p className="terminal-note">
                    Terminal functionality will be added
                    in a later mission phase.
                  </p>

                </div>

              </div>
            )}

              </>
            )}

            {/* EVIDENCE PANEL */}

            <div
              style={{
                marginTop: 18,
                padding: "18px 20px",
                background: "#10181e",
                border: "1px solid #2a3c44",
                borderRadius: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 15,
                }}
              >
                <div>
                  <div
                    style={{
                      color: "#71858d",
                      fontSize: 8,
                      letterSpacing: 2,
                      marginBottom: 6,
                    }}
                  >
                    INVESTIGATION EVIDENCE
                  </div>

                  <strong
                    style={{
                      color:
                        evidenceCount === 4
                          ? "#00ffd5"
                          : "#e5edef",
                      fontSize: 14,
                    }}
                  >
                    {evidenceCount} / 4 COLLECTED
                  </strong>
                </div>

                {missionPhase === "investigate" && evidenceCount === 4 && (
                  <button
                    className="deploy-button"
                    onClick={() => setShowVerdict(true)}
                  >
                    SUBMIT VERDICT →
                  </button>
                )}

                {missionPhase === "solve" && (
                  <span style={{ color: "#ffd76a", fontSize: 9, letterSpacing: 1 }}>
                    CONTAINMENT IN PROGRESS
                  </span>
                )}

                {missionPhase === "verify" && (
                  <span style={{ color: "#b28cff", fontSize: 9, letterSpacing: 1 }}>
                    VERIFICATION READY
                  </span>
                )}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(4, 1fr)",
                  gap: 8,
                }}
              >

                {[
                  {
                    id: "sender" as EvidenceId,
                    title: "SUSPICIOUS SENDER",
                  },
                  {
                    id: "domain" as EvidenceId,
                    title: "SUSPICIOUS DOMAIN",
                  },
                  {
                    id: "reputation" as EvidenceId,
                    title: "MALICIOUS REPUTATION",
                  },
                  {
                    id: "attachment" as EvidenceId,
                    title: "MACRO ATTACHMENT",
                  },
                ].map((item) => {

                  const collected = hasEvidence(item.id);

                  return (
                    <div
                      key={item.id}
                      style={{
                        padding: "12px",
                        borderRadius: 7,
                        border: `1px solid ${
                          collected
                            ? "#00ffd5"
                            : "#263840"
                        }`,
                        background: collected
                          ? "rgba(0,255,213,.06)"
                          : "#0c141a",
                        color: collected
                          ? "#00ffd5"
                          : "#62767e",
                        fontSize: 8,
                        letterSpacing: 0.7,
                      }}
                    >
                      {collected ? "✓ " : "○ "}
                      {item.title}
                    </div>
                  );
                })}

              </div>
            </div>

              </>
            )}

          </main>
        </div>

        {/* BOTTOM STATUS */}

        {missionId === 1 ? (
          <footer className="investigation-footer">
            <div>
              <span>EVIDENCE</span>
              <strong>{evidenceCount} / 4</strong>
            </div>
            <div>
              <span>OBJECTIVES</span>
              <strong>{objectiveCount} / 4</strong>
            </div>
            <div>
              <span>MISSION</span>
              <strong>
                {missionPhase === "investigate"
                  ? evidenceCount === 4
                    ? "VERDICT READY"
                    : "INVESTIGATING"
                  : missionPhase === "solve"
                  ? remediationCount === 3
                    ? "READY TO VERIFY"
                    : "CONTAINING"
                  : verificationPassed
                  ? "CONTAINMENT VERIFIED"
                  : "VERIFICATION READY"}
              </strong>
            </div>
            <button className="exit-mission" onClick={() => setScreen("briefing")}>
              EXIT MISSION
            </button>
          </footer>
        ) : (
          <footer className="investigation-footer">
            <div>
              <span>EVIDENCE</span>
              <strong>{level2Evidence.length} / 4</strong>
            </div>
            <div>
              <span>OBJECTIVES</span>
              <strong>{level2Evidence.length + level2Remediation.length} / 7</strong>
            </div>
            <div>
              <span>MISSION</span>
              <strong>
                {missionPhase === "investigate"
                  ? level2Evidence.length === 4
                    ? "VERDICT READY"
                    : "INVESTIGATING"
                  : missionPhase === "solve"
                  ? level2Remediation.length === 3
                    ? "READY TO VERIFY"
                    : "CONTAINING"
                  : level2VerificationPassed
                  ? "CONTROLS VERIFIED"
                  : "VERIFICATION READY"}
              </strong>
            </div>
            <button className="exit-mission" onClick={() => setScreen("briefing")}>
              EXIT MISSION
            </button>
          </footer>
        )}

        {/* =================================================
            AI MENTOR
        ================================================= */}

        {showMentor && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,.65)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
              padding: 20,
            }}
            onClick={() => setShowMentor(false)}
          >
            <div
              style={{
                width: "min(500px, 100%)",
                background: "#10181e",
                border: "1px solid #7354a8",
                borderRadius: 14,
                padding: 25,
                boxShadow:
                  "0 25px 80px rgba(0,0,0,.5)",
              }}
              onClick={(e) => e.stopPropagation()}
            >

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <div>
                  <div
                    style={{
                      color: "#b28cff",
                      fontSize: 9,
                      letterSpacing: 2,
                    }}
                  >
                    CYBERMENTOR AI
                  </div>

                  <h2
                    style={{
                      color: "#edf4f6",
                      margin: "7px 0 0",
                    }}
                  >
                    Investigation Assistant
                  </h2>
                </div>

                <button
                  onClick={() => setShowMentor(false)}
                  style={{
                    background: "transparent",
                    border: "1px solid #39464d",
                    color: "#94a3a8",
                    borderRadius: 6,
                    padding: "7px 10px",
                  }}
                >
                  ✕
                </button>
              </div>

              <div
                style={{
                  padding: 18,
                  background: "#0b1319",
                  borderRadius: 9,
                  border: "1px solid #2d3d45",
                  color: "#b9c7cb",
                  fontSize: 12,
                  lineHeight: 1.7,
                }}
              >
                {missionId === 1 ? (
                  <>
                    {evidenceCount === 0 && (
                      <>
                        <strong style={{ color: "#00ffd5" }}>Hint:</strong>{" "}
                        Start with the suspicious email. Check who sent it, the urgency of the message, and the attachment.
                      </>
                    )}
                    {evidenceCount === 1 && (
                      <>
                        <strong style={{ color: "#00ffd5" }}>Hint:</strong>{" "}
                        Investigate the domain. Check whether it matches the claimed organization.
                      </>
                    )}
                    {evidenceCount === 2 && (
                      <>
                        <strong style={{ color: "#00ffd5" }}>Hint:</strong>{" "}
                        Use Threat Intelligence to examine domain age and reputation.
                      </>
                    )}
                    {evidenceCount === 3 && (
                      <>
                        <strong style={{ color: "#00ffd5" }}>Hint:</strong>{" "}
                        Inspect the attachment. Macro-enabled documents can contain executable content.
                      </>
                    )}
                    {missionPhase === "investigate" && evidenceCount === 4 && (
                      <>
                        <strong style={{ color: "#00ffd5" }}>Ready:</strong>{" "}
                        All four evidence items are collected. Review them and submit your verdict.
                      </>
                    )}
                    {missionPhase === "solve" && remediationCount < 3 && (
                      <>
                        <strong style={{ color: "#b28cff" }}>Mentor:</strong>{" "}
                        Identification is only half the job. Quarantine the email, block the malicious domain and isolate the attachment.
                      </>
                    )}
                    {missionPhase === "verify" && !verificationPassed && (
                      <>
                        <strong style={{ color: "#b28cff" }}>Verify:</strong>{" "}
                        Run the containment check and confirm every affected component is isolated.
                      </>
                    )}
                    {verificationPassed && (
                      <>
                        <strong style={{ color: "#00ffd5" }}>Success:</strong>{" "}
                        The simulated phishing incident is contained. Complete the mission.
                      </>
                    )}
                  </>
                ) : (
                  <>
                    {level2Evidence.length === 0 && (
                      <>
                        <strong style={{ color: "#00ffd5" }}>Hint:</strong>{" "}
                        Start with the authentication logs. Look for repeated failures from the same source.
                      </>
                    )}
                    {level2Evidence.length === 1 && (
                      <>
                        <strong style={{ color: "#00ffd5" }}>Hint:</strong>{" "}
                        Investigate the source IP. Compare its activity with the normal login pattern.
                      </>
                    )}
                    {level2Evidence.length === 2 && (
                      <>
                        <strong style={{ color: "#00ffd5" }}>Hint:</strong>{" "}
                        Check the targeted account and determine whether its login behavior is normal.
                      </>
                    )}
                    {level2Evidence.length === 3 && (
                      <>
                        <strong style={{ color: "#00ffd5" }}>Hint:</strong>{" "}
                        Review the authentication event rate and failure ratio before submitting your diagnosis.
                      </>
                    )}
                    {missionPhase === "investigate" && level2Evidence.length === 4 && (
                      <>
                        <strong style={{ color: "#00ffd5" }}>Ready:</strong>{" "}
                        You have enough evidence to classify the incident. Look for a repeated credential-guessing pattern.
                      </>
                    )}
                    {missionPhase === "solve" && level2Remediation.length < 3 && (
                      <>
                        <strong style={{ color: "#b28cff" }}>Mentor:</strong>{" "}
                        Contain the simulated incident by blocking the source IP, isolating the targeted account and applying login rate limiting.
                      </>
                    )}
                    {missionPhase === "verify" && !level2VerificationPassed && (
                      <>
                        <strong style={{ color: "#b28cff" }}>Verify:</strong>{" "}
                        Do not assume the controls worked. Run the verification check and confirm every control is active.
                      </>
                    )}
                    {level2VerificationPassed && (
                      <>
                        <strong style={{ color: "#00ffd5" }}>Success:</strong>{" "}
                        The simulated brute-force incident is contained. Complete the mission.
                      </>
                    )}
                  </>
                )}
              </div>

              <button
                className="mission-button"
                style={{
                  width: "100%",
                  marginTop: 20,
                }}
                onClick={() => setShowMentor(false)}
              >
                CONTINUE INVESTIGATION
              </button>

            </div>
          </div>
        )}

        {/* =================================================
            FINAL VERDICT
        ================================================= */}

        {showVerdict && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,.72)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
              padding: 20,
            }}
          >
            <div
              style={{
                width: "min(560px, 100%)",
                background: "#10181e",
                border: "1px solid #2f4650",
                borderRadius: 14,
                padding: 30,
              }}
            >

              <div
                style={{
                  color: "#00ffd5",
                  fontSize: 9,
                  letterSpacing: 2,
                }}
              >
                FINAL INVESTIGATION STEP
              </div>

              <h2
                style={{
                  color: "#edf4f6",
                  margin: "10px 0",
                }}
              >
                What is your final verdict?
              </h2>

              <p
                style={{
                  color: "#84979e",
                  fontSize: 12,
                  lineHeight: 1.6,
                }}
              >
                Review the evidence you collected and
                classify the incident.
              </p>

              <div
                style={{
                  display: "grid",
                  gap: 10,
                  marginTop: 22,
                }}
              >

                {[
                  "Legitimate Invoice",
                  "Spam",
                  "Phishing Attack",
                  "Malware Infection",
                ].map((option) => (

                  <button
                    key={option}
                    onClick={() =>
                      setSelectedVerdict(option)
                    }
                    style={{
                      padding: "15px",
                      textAlign: "left",
                      background:
                        selectedVerdict === option
                          ? "rgba(0,255,213,.08)"
                          : "#0c141a",
                      border: `1px solid ${
                        selectedVerdict === option
                          ? "#00ffd5"
                          : "#2d3f47"
                      }`,
                      borderRadius: 8,
                      color:
                        selectedVerdict === option
                          ? "#00ffd5"
                          : "#b7c5c9",
                      cursor: "pointer",
                    }}
                  >
                    {selectedVerdict === option
                      ? "◉ "
                      : "○ "}
                    {option}
                  </button>

                ))}

              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                  marginTop: 25,
                }}
              >

                <button
                  className="abort-button"
                  onClick={() => setShowVerdict(false)}
                >
                  CANCEL
                </button>

                <button
                  className="deploy-button"
                  disabled={!selectedVerdict}
                  onClick={handleVerdict}
                  style={{
                    opacity: selectedVerdict
                      ? 1
                      : 0.4,
                  }}
                >
                  SUBMIT VERDICT →
                </button>

              </div>

            </div>
          </div>
        )}

        {missionId === 2 && showLevel2Verdict && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,.72)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
              padding: 20,
            }}
            onClick={() => setShowLevel2Verdict(false)}
          >
            <div
              style={{
                width: "min(560px, 100%)",
                background: "#10181e",
                border: "1px solid #2f4650",
                borderRadius: 14,
                padding: 30,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ color: "#00ffd5", fontSize: 9, letterSpacing: 2 }}>
                FINAL INVESTIGATION STEP
              </div>
              <h2 style={{ color: "#edf4f6", margin: "10px 0" }}>
                What is your diagnosis?
              </h2>
              <p style={{ color: "#84979e", fontSize: 12, lineHeight: 1.6 }}>
                Review the authentication evidence and classify the simulated incident.
              </p>

              <div style={{ display: "grid", gap: 10, marginTop: 22 }}>
                {[
                  "Normal Login Activity",
                  "Password Reset Issue",
                  "Brute Force Attack",
                  "Account Misconfiguration",
                ].map((option) => (
                  <button
                    key={option}
                    onClick={() => setLevel2Verdict(option)}
                    style={{
                      padding: "15px",
                      textAlign: "left",
                      background: level2Verdict === option ? "rgba(0,255,213,.08)" : "#0c141a",
                      border: `1px solid ${level2Verdict === option ? "#00ffd5" : "#2d3f47"}`,
                      borderRadius: 8,
                      color: level2Verdict === option ? "#00ffd5" : "#b7c5c9",
                      cursor: "pointer",
                    }}
                  >
                    {level2Verdict === option ? "◉ " : "○ "}
                    {option}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 25 }}>
                <button className="abort-button" onClick={() => setShowLevel2Verdict(false)}>
                  CANCEL
                </button>
                <button
                  className="deploy-button"
                  disabled={!level2Verdict}
                  onClick={handleLevel2Verdict}
                  style={{ opacity: level2Verdict ? 1 : .4 }}
                >
                  SUBMIT DIAGNOSIS →
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }


  /* =====================================================
     MISSION BRIEFING
  ===================================================== */

  if (screen === "briefing" && missionId >= 3 && aiMission) {
    return (
      <div className="briefing-page">
        <header className="top-bar">
          <div className="brand">
            <div className="mini-logo">⌁</div>
            <span>CYBERSIM <b>AI</b></span>
          </div>
          <button className="home-nav-button briefing-home-button" onClick={() => setScreen("home")}>
            ← HOME
          </button>
          <div className="briefing-status">
            MISSION {missionId.toString().padStart(2, "0")} / BRIEFING
          </div>
        </header>

        <main className="briefing-content">
          <div className="mission-number">LEVEL {missionId.toString().padStart(2, "0")}</div>
          <h1 className="briefing-title">{aiMission.title}</h1>
          <p className="briefing-subtitle">{aiMission.subtitle}</p>

          <div className="briefing-layout">
            <section className="briefing-story">
              <div className="section-label">MISSION BRIEFING</div>
              <h2>{aiMission.briefing.summary}</h2>
              {aiMission.briefing.story.map((story) => (
                <p key={story}>{story}</p>
              ))}
              {aiMission.briefing.warning && (
                <div className="warning-box">
                  <span>⚠</span>
                  <div>
                    <strong>SECURITY INCIDENT</strong>
                    <p>{aiMission.briefing.warning}</p>
                  </div>
                </div>
              )}
            </section>

            <section className="objectives-card">
              <div className="section-label">OBJECTIVES</div>
              {aiMission.objectives.map((objective, index) => (
                <div className="objective" key={objective.id}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <p>{objective.title}</p>
                </div>
              ))}
            </section>
          </div>

          <div className="mission-stats">
            <div><span>XP REWARD</span><strong>+{aiMission.rewards.xp} XP</strong></div>
            <div><span>COINS</span><strong>+{aiMission.rewards.coins}</strong></div>
            <div><span>DIFFICULTY</span><strong>{aiMission.difficulty.toUpperCase()}</strong></div>
            <div><span>THREAT</span><strong>{aiMission.category.toUpperCase()}</strong></div>
          </div>

          <div className="briefing-actions">
            <button className="abort-button" onClick={() => setScreen("home")}>ABORT</button>
            <button
              className="deploy-button"
              onClick={() => {
                resetAIMissionProgress();
                startMission();
              }}
            >
              DEPLOY TO MISSION <span>→</span>
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (screen === "briefing") {
    return (
      <div className="briefing-page">

        <header className="top-bar">

          <div className="brand">
            <div className="mini-logo">⌁</div>

            <span>
              CYBERSIM <b>AI</b>
            </span>
          </div>

          <button
            className="home-nav-button briefing-home-button"
            onClick={() => setScreen("home")}
            title="Return to Game Hub"
          >
            ← HOME
          </button>

          <div className="briefing-status">
            MISSION {missionId.toString().padStart(2, "0")} / BRIEFING
          </div>

        </header>

        {missionId === 2 ? (
          <main className="briefing-content">
            <div className="mission-number">LEVEL 02</div>

            <h1 className="briefing-title">
              SUSPICIOUS
              <span> LOGIN ACTIVITY</span>
            </h1>

            <p className="briefing-subtitle">
              BRUTE-FORCE INVESTIGATION
            </p>

            <div className="briefing-layout">
              <section className="briefing-story">
                <div className="section-label">MISSION BRIEFING</div>
                <h2>Multiple failed logins have triggered an alert.</h2>
                <p>
                  The simulated security monitor has detected repeated failed
                  authentication attempts against a privileged account.
                </p>
                <p>
                  Your task is to investigate the login activity, identify the
                  attack pattern, contain the incident and verify the defensive controls.
                </p>

                <div className="warning-box">
                  <span>⚠</span>
                  <div>
                    <strong>SECURITY INCIDENT</strong>
                    <p>
                      Treat the authentication activity as suspicious until the evidence is reviewed.
                    </p>
                  </div>
                </div>
              </section>

              <section className="objectives-card">
                <div className="section-label">OBJECTIVES</div>
                {[
                  "Inspect authentication logs",
                  "Investigate the source IP",
                  "Review the targeted account",
                  "Analyze authentication patterns",
                  "Identify the brute-force attack",
                  "Block the suspicious source",
                  "Isolate the targeted account",
                  "Verify the defensive controls",
                ].map((text, index) => (
                  <div className="objective" key={text}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <p>{text}</p>
                  </div>
                ))}
              </section>
            </div>

            <div className="mission-stats">
              <div><span>XP REWARD</span><strong>+600 XP</strong></div>
              <div><span>COINS</span><strong>+120</strong></div>
              <div><span>DIFFICULTY</span><strong>MEDIUM</strong></div>
              <div><span>THREAT</span><strong>BRUTE FORCE</strong></div>
            </div>

            <div className="briefing-actions">
              <button className="abort-button" onClick={() => setScreen("home")}>
                ABORT
              </button>
              <button className="deploy-button" onClick={startMission}>
                DEPLOY TO MISSION <span>→</span>
              </button>
            </div>
          </main>
        ) : (
        <main className="briefing-content">

          <div className="mission-number">
            LEVEL 01
          </div>

          <h1 className="briefing-title">
            THE SUSPICIOUS
            <span> INVOICE</span>
          </h1>

          <p className="briefing-subtitle">
            PHISHING INVESTIGATION
          </p>

          <div className="briefing-layout">

            <section className="briefing-story">

              <div className="section-label">
                MISSION BRIEFING
              </div>

              <h2>
                A suspicious invoice has been reported.
              </h2>

              <p>
                An employee has received an unexpected
                invoice email from an unfamiliar sender.
              </p>

              <p>
                Your job is to investigate the message,
                identify suspicious indicators, collect
                evidence, classify the incident and then
                contain and verify the simulated threat.
              </p>

              <div className="warning-box">

                <span>⚠</span>

                <div>
                  <strong>SECURITY INCIDENT</strong>

                  <p>
                    Do not trust the message until you
                    have investigated the available evidence.
                  </p>
                </div>

              </div>

            </section>

            <section className="objectives-card">

              <div className="section-label">
                OBJECTIVES
              </div>

              <div className="objective">
                <span>01</span>
                <p>Inspect the suspicious email</p>
              </div>

              <div className="objective">
                <span>02</span>
                <p>Investigate the sender</p>
              </div>

              <div className="objective">
                <span>03</span>
                <p>Check domain reputation</p>
              </div>

              <div className="objective">
                <span>04</span>
                <p>Inspect the attachment</p>
              </div>

              <div className="objective">
                <span>05</span>
                <p>Collect evidence</p>
              </div>

              <div className="objective">
                <span>06</span>
                <p>Identify the phishing attack</p>
              </div>

              <div className="objective">
                <span>07</span>
                <p>Contain the simulated threat</p>
              </div>

              <div className="objective">
                <span>08</span>
                <p>Verify the containment</p>
              </div>

            </section>

          </div>

          <div className="mission-stats">

            <div>
              <span>XP REWARD</span>
              <strong>+500 XP</strong>
            </div>

            <div>
              <span>COINS</span>
              <strong>+100</strong>
            </div>

            <div>
              <span>DIFFICULTY</span>
              <strong>EASY</strong>
            </div>

            <div>
              <span>THREAT</span>
              <strong>PHISHING</strong>
            </div>

          </div>

          <div className="briefing-actions">

            <button
              className="abort-button"
              onClick={() => setScreen("home")}
            >
              ABORT
            </button>

            <button
              className="deploy-button"
              onClick={startMission}
            >
              DEPLOY TO MISSION
              <span>→</span>
            </button>

          </div>

        </main>
        )}
      </div>
    );
  }

  /* =====================================================
     HOME / GAME HUB
  ===================================================== */

  const currentMissionData =
    currentCampaignLevel === 1
      ? {
          title: "01 — THE SUSPICIOUS INVOICE",
          type: "PHISHING INVESTIGATION",
          description:
            "Investigate a suspicious invoice email and determine whether it is a legitimate message or a phishing attack.",
          available: true,
        }
      : currentCampaignLevel === 2
        ? {
            title: "02 — SUSPICIOUS LOGIN ACTIVITY",
            type: "BRUTE-FORCE INVESTIGATION",
            description:
              "Investigate repeated failed logins, identify the brute-force attack and apply simulated defensive controls.",
            available: true,
          }
        : {
            title: aiMission?.title
              ? `${currentCampaignLevel.toString().padStart(2, "0")} — ${aiMission.title}`
              : `${currentCampaignLevel.toString().padStart(2, "0")} — AI MISSION`,
            type: aiMission?.subtitle || "AI-GENERATED CYBERSECURITY INCIDENT",
            description: aiMissionLoading
              ? "AI Mission Engine is generating your simulated cybersecurity incident..."
              : aiMissionError
                ? `Mission engine error: ${aiMissionError}`
                : aiMission?.briefing.summary ||
                  "Your AI-generated cybersecurity training mission is ready to deploy.",
            available: !!aiMission || aiMissionLoading,
          };

  const startCurrentMission = async () => {
    const level = currentCampaignLevel;

    if (level <= 2) {
      setMissionId(level);
      setScreen("briefing");
      return;
    }

    const mission =
      aiMission?.level === level ? aiMission : await loadAIMission(level);

    if (!mission) return;

    resetAIMissionProgress();
    setMissionId(level);
    setScreen("briefing");
  };

  const handleLevelCardClick = async (level: number) => {
    if (level > currentCampaignLevel && !isLevelCompleted(level)) return;

    setMissionId(level);

    if (level >= 3) {
      const mission =
        aiMission?.level === level ? aiMission : await loadAIMission(level);

      if (!mission) return;
      resetAIMissionProgress();
    }

    setScreen("briefing");
  };

  return (
    <div className="home-page">

      <header className="top-bar">

        <div className="brand">
          <div className="mini-logo">⌁</div>
          <span>CYBERSIM <b>AI</b></span>
        </div>

        <div className="player-info">
          <span>OPERATOR</span>
          <strong>{operatorId}</strong>
        </div>

        <div className="resources">
          <span>🪙 {coins}</span>
          <span>LVL {Math.min(currentCampaignLevel, 10).toString().padStart(2, "0")}</span>
        </div>

      </header>

      <main className="home-content">

        <section className="welcome-section">
          <p className="eyebrow">MISSION CONTROL</p>
          <h1>
            WELCOME,
            <span> OPERATOR.</span>
          </h1>
          <p className="welcome-text">
            Your cybersecurity training campaign is ready.
          </p>
        </section>

        <section className="player-card">
          <div className="rank-info">
            <div>
              <p className="small-label">CURRENT RANK</p>
              <h2>CYBER ROOKIE</h2>
            </div>
            <div className="level-number">
              LEVEL <strong>{Math.min(currentCampaignLevel, 10).toString().padStart(2, "0")}</strong>
            </div>
          </div>

          <div className="xp-row">
            <span>{xp} XP</span>
            <span>1000 XP</span>
          </div>

          <div className="xp-bar">
            <div
              className="xp-progress"
              style={{
                width: `${Math.min((xp / 1000) * 100, 100)}%`,
              }}
            ></div>
          </div>
        </section>

        <section className="mission-card">
          <div className="mission-header">
            <div>
              <p className="small-label">CURRENT MISSION</p>
              <h2>{currentMissionData.title}</h2>
            </div>

            <div className="mission-status">
              {aiMissionLoading && currentCampaignLevel >= 3
                ? "GENERATING"
                : currentMissionData.available
                  ? "AVAILABLE"
                  : "UNAVAILABLE"}
            </div>
          </div>

          <p className="mission-type">{currentMissionData.type}</p>
          <p className="mission-description">{currentMissionData.description}</p>

          <button
            className="mission-button"
            onClick={startCurrentMission}
            disabled={aiMissionLoading || !currentMissionData.available}
            style={{
              opacity: currentMissionData.available ? 1 : 0.45,
              cursor: currentMissionData.available && !aiMissionLoading ? "pointer" : "not-allowed",
            }}
          >
            {aiMissionLoading && currentCampaignLevel >= 3
              ? "GENERATING MISSION..."
              : currentMissionData.available
                ? "START MISSION"
                : "MISSION UNAVAILABLE"}
            <span>{aiMissionLoading && currentCampaignLevel >= 3 ? "◌" : "→"}</span>
          </button>
        </section>

        <section className="levels-section">
          <div className="section-title">
            <div>
              <p className="small-label">CAMPAIGN</p>
              <h2>MISSION PROGRESSION</h2>
            </div>
            <span>{Math.min(currentCampaignLevel, 10)} / 10 UNLOCKED</span>
          </div>

          <div className="level-grid">
            {Array.from({ length: 10 }, (_, index) => {
              const level = index + 1;
              const unlocked = level <= currentCampaignLevel;
              const completed = isLevelCompleted(level);
              const mission = level >= 3 && aiMission?.level === level ? aiMission : null;

              const fallbackNames: Record<number, string> = {
                1: "PHISHING",
                2: "BRUTE FORCE",
                3: "AI INCIDENT",
                4: "AI INCIDENT",
                5: "AI INCIDENT",
                6: "AI INCIDENT",
                7: "AI INCIDENT",
                8: "AI INCIDENT",
                9: "AI INCIDENT",
                10: "AI INCIDENT",
              };

              return (
                <div
                  key={level}
                  className={`level-box ${unlocked ? "active" : "locked"}`}
                  onClick={() => unlocked && void handleLevelCardClick(level)}
                  style={{
                    cursor: unlocked ? "pointer" : "not-allowed",
                    borderColor: completed ? "#00ffd5" : undefined,
                    boxShadow: completed ? "0 0 18px rgba(0,255,213,.12)" : undefined,
                  }}
                >
                  <span>{String(level).padStart(2, "0")}</span>
                  <p>{mission?.category?.toUpperCase() || fallbackNames[level]}</p>
                  <small>
                    {completed
                      ? "COMPLETED ✓"
                      : unlocked
                        ? level >= 3 && !mission
                          ? "AVAILABLE • AI"
                          : "AVAILABLE"
                        : "LOCKED"}
                  </small>
                </div>
              );
            })}
          </div>

        </section>

      </main>
    </div>
  );
}

export default App;
