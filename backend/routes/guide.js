const express = require("express");
const fs = require("fs/promises");
const path = require("path");

const { matchGuideService } = require("../utils/gemini");

const router = express.Router();
const servicesPath = path.join(__dirname, "..", "data", "services.json");
const MIN_AI_CONFIDENCE = 0.55;
const STRONG_LOCAL_SCORE = 4;

const aliases = {
  "certifikate e lindjes": ["certifikate", "lindjes", "lindje", "birth"],
  leternjoftim: ["leternjoftim", "id", "identitet", "dokument", "pasaporte", "karte identiteti"],
  "kontroll mjekesor": ["kontroll", "mjek", "mjekesor", "shendet", "vizite", "doktor"],
  "regjistrim studenti": ["regjistrim", "student", "universitet", "fakultet", "studime"],
  "pagese komunale": ["pagese", "komunale", "fature", "tatim", "arka", "obligim"],
  "patente shoferi": ["patente", "shofer", "vozitje", "vozites", "automjet", "kerri"],
  pasaporte: ["pasaporte", "udhetim", "dokument udhetimi"],
  "nderrim adrese": ["nderrim", "adrese", "banim", "vendbanim", "shtepi e re"],
  "certifikate e marteses": ["martese", "martes", "bashkeshort", "bashkeshorte"],
  "certifikate e vdekjes": ["vdekje", "vdekjes", "person i vdekur"],
  "vertetim i vendbanimit": ["vertetim", "vendbanim", "banimit", "adrese"],
  "regjistrim biznesi": ["regjistrim biznesi", "regjistru biznes", "biznes", "kompani", "nipt", "arbk"],
  "leje ndertimi": ["leje ndertimi", "ndertim", "ndertese", "urbanizem", "projekt teknik"],
  "tatim ne prone": ["tatim prone", "tatim", "prone", "fature prone", "obligim prone"],
  "ndihme sociale": ["ndihme sociale", "asistence", "sociale", "qendra per pune sociale", "familje pa te ardhura"],
  "termini te mjeku familjar": ["termin", "mjek familjar", "mjeku familjar", "doktor", "kontroll"],
  vaksinim: ["vaksine", "vaksinim", "imunizim"],
  "regjistrim ne cerdhe": ["cerdhe", "kopsht", "regjistru femijen", "femije"],
  "regjistrim ne shkolle": ["shkolle", "regjistru femijen", "klase", "nxenes"],
  "burse studentore": ["burse", "studentore", "stipendi", "student"],
  "ankese komunale": ["ankese", "komune", "komunale", "kerkese", "protokoll"],
  "problem me mbeturina": ["mbeturina", "berllok", "pastrim", "kontenjer", "higjiene"],
  "leje parkimi": ["parking", "parkim", "leje parkimi", "veture", "zone parkimi"],
  "transport publik": ["transport", "autobus", "urban", "kartel", "abonim", "mujor"],
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
  return `Per ${service.service}, shko te ${service.institution}, ne ${service.office}, ${service.floor}. Merr me vete: ${service.documents.join(", ")}. Koha e pritjes zakonisht eshte ${service.estimatedWait}.`;
}

async function readServices() {
  const raw = await fs.readFile(servicesPath, "utf8");
  return JSON.parse(raw);
}

async function findAiMatch(question, services) {
  try {
    const aiMatch = await matchGuideService(question, services);

    if (!aiMatch.service || aiMatch.confidence < MIN_AI_CONFIDENCE) {
      return null;
    }

    const service = services.find((item) => item.service === aiMatch.service);

    return service ? { service, source: "gemini", confidence: aiMatch.confidence } : null;
  } catch (error) {
    console.warn("KuMeShku Gemini match failed, using local fallback:", error.message);
    return null;
  }
}

function findLocalMatch(question, services) {
  const bestMatch = services
    .map((service) => ({ service, score: scoreService(question, service) }))
    .sort((a, b) => b.score - a.score)[0];

  if (!bestMatch || bestMatch.score === 0) {
    return null;
  }

  return { service: bestMatch.service, source: "local", score: bestMatch.score };
}

router.post("/", async (req, res) => {
  try {
    const question = req.body?.question;

    if (!question || typeof question !== "string") {
      return res.status(400).json({ error: "question is required" });
    }

    const services = await readServices();
    const localMatch = findLocalMatch(question, services);
    const strongLocalMatch =
      localMatch && localMatch.score >= STRONG_LOCAL_SCORE ? localMatch : null;
    const match = strongLocalMatch || (await findAiMatch(question, services)) || localMatch;

    if (!match) {
      return res.status(404).json({
        error: "Nuk gjeta nje sherbim te pershtatshem. Provo ta pershkruash me fjale te tjera.",
      });
    }

    res.json({
      ...match.service,
      friendlyAnswer: buildFriendlyAnswer(match.service),
    });
  } catch (error) {
    console.error("Guide route failed:", error);
    res.status(500).json({ error: "Guide service failed" });
  }
});

module.exports = router;
