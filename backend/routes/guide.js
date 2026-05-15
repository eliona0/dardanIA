const express = require("express");
const fs = require("fs/promises");
const path = require("path");

const router = express.Router();
const servicesPath = path.join(__dirname, "..", "data", "services.json");

const aliases = {
  "certifikate e lindjes": ["certifikate", "lindjes", "lindje", "birth"],
  leternjoftim: ["leternjoftim", "id", "identitet", "dokument", "pasaporte"],
  "kontroll mjekesor": ["kontroll", "mjek", "mjekesor", "shendet", "vizite", "doktor"],
  "regjistrim studenti": ["regjistrim", "student", "universitet", "fakultet", "studime"],
  "pagese komunale": ["pagese", "komunale", "fature", "tatim", "arka", "obligim"]
};

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ë/g, "e")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value) {
  return normalize(value).split(" ").filter(Boolean);
}

function scoreService(question, service) {
  const normalizedQuestion = normalize(question);
  const serviceName = normalize(service.service);
  const questionTokens = new Set(tokenize(question));
  const serviceTokens = tokenize(service.service);
  const aliasTokens = aliases[serviceName] || [];

  let score = 0;

  if (normalizedQuestion.includes(serviceName)) {
    score += 10;
  }

  for (const token of serviceTokens) {
    if (questionTokens.has(token)) {
      score += 3;
    }
  }

  for (const token of aliasTokens) {
    if (normalizedQuestion.includes(normalize(token))) {
      score += 2;
    }
  }

  return score;
}

function buildFriendlyAnswer(service) {
  return `Për ${service.service}, shko te ${service.institution}, në ${service.office}, ${service.floor}. Merr me vete: ${service.documents.join(", ")}. Koha e pritjes zakonisht është ${service.estimatedWait}.`;
}

async function readServices() {
  const raw = await fs.readFile(servicesPath, "utf8");
  return JSON.parse(raw);
}

router.post("/", async (req, res) => {
  try {
    const question = req.body?.question;

    if (!question || typeof question !== "string") {
      return res.status(400).json({ error: "question is required" });
    }

    const services = await readServices();
    const bestMatch = services
      .map((service) => ({ service, score: scoreService(question, service) }))
      .sort((a, b) => b.score - a.score)[0];

    if (!bestMatch || bestMatch.score === 0) {
      return res.status(404).json({
        error: "Nuk gjeta një shërbim të përshtatshëm. Provo ta përshkruash me fjalë të tjera."
      });
    }

    res.json({
      ...bestMatch.service,
      friendlyAnswer: buildFriendlyAnswer(bestMatch.service)
    });
  } catch (error) {
    console.error("Guide route failed:", error);
    res.status(500).json({ error: "Guide service failed" });
  }
});

module.exports = router;
