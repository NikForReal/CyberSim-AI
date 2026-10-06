import "dotenv/config";
import express from "express";
import cors from "cors";
import { generateAIMission } from "./missionGenerator.js";

const app = express();
const PORT = 3001;

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "CyberSim AI Mission Server is running",
  });
});

app.post("/api/missions/generate", async (req, res) => {
  try {
    console.log("AI mission generation request:", {
      level: req.body?.level,
      difficulty: req.body?.difficulty,
      patternId: req.body?.patternId,
      seed: req.body?.seed,
    });

    const mission = await generateAIMission({
      level: req.body?.level ?? 3,
      difficulty: req.body?.difficulty,
      patternId: req.body?.patternId,
      seed: req.body?.seed,
    });

    res.json({
      mission,
      source: "ai",
      requestId: `ai-${Date.now()}`,
    });
  } catch (error) {
    console.error("Mission generation error:", error);

    res.status(500).json({
      error: "Failed to generate mission",
      message:
        error instanceof Error
          ? error.message
          : "Unknown error",
    });
  }
});

app.listen(PORT, () => {
  console.log(
    `CyberSim AI Mission Server running on http://localhost:${PORT}`,
  );
});