require("dotenv").config();

const cors = require("cors");
const crypto = require("crypto");
const express = require("express");
const fs = require("fs/promises");
const path = require("path");

const accessibilityRouter = require("./routes/accessibility");
const guideRouter = require("./routes/guide");
const reportRouter = require("./routes/report");

const app = express();
const PORT = process.env.PORT || 4000;
const casesPath = path.join(__dirname, "data", "cases.json");

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/accessibility", accessibilityRouter);
app.use("/api/guide", guideRouter);
app.use("/api/report", reportRouter);

app.post("/api/cases", async (req, res) => {
  try {
    const rawCases = await fs.readFile(casesPath, "utf8").catch(() => "[]");
    const cases = JSON.parse(rawCases);
    const newCase = {
      ...req.body,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      status: req.body?.status || "pending",
    };

    cases.push(newCase);
    await fs.writeFile(casesPath, JSON.stringify(cases, null, 2));

    res.status(201).json(newCase);
  } catch (error) {
    console.error("Save case failed:", error);
    res.status(500).json({ error: "Could not save case." });
  }
});

app.get("/api/cases", async (_req, res) => {
  const rawCases = await fs.readFile(casesPath, "utf8").catch(() => "[]");
  res.json(JSON.parse(rawCases));
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
