# CyberSim AI — Connected Mission Engine

Replace your existing App.tsx with the App.tsx in this folder, then place missionTypes.ts, missionData.ts and missionEngine.ts beside it in the same src folder.

The existing Level 1 UI is preserved, but mission data and core progression rules now come from MissionDefinition + missionEngine. Future AI-generated missions can use the same contract without requiring new React UI for every level.

No real systems are touched; verification and remediation remain simulated.
