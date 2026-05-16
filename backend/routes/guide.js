const express = require("express");
const fs = require("fs/promises");
const multer = require("multer");
const path = require("path");

const { matchGuideService, transcribeGuideAudio } = require("../utils/gemini");

const router = express.Router();
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  storage: multer.memoryStorage(),
});
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

function buildFriendlyAnswer(service, language = "sq") {
  const documents = service.documents.join(", ");

  if (language === "en") {
    return `For ${service.service}, go to ${service.institution}, ${service.office}, ${service.floor}. Bring: ${documents}. The usual waiting time is ${service.estimatedWait}.`;
  }

  if (language === "tr") {
    return `${service.service} için ${service.institution} kurumunda ${service.office}, ${service.floor} bölümüne git. Yanında şunları getir: ${documents}. Tahmini bekleme süresi ${service.estimatedWait}.`;
  }

  if (language === "sr") {
    return `Za ${service.service}, idi u ${service.institution}, ${service.office}, ${service.floor}. Ponesi: ${documents}. Uobičajeno vreme čekanja je ${service.estimatedWait}.`;
  }

  return `Per ${service.service}, shko te ${service.institution}, ne ${service.office}, ${service.floor}. Merr me vete: ${documents}. Koha e pritjes zakonisht eshte ${service.estimatedWait}.`;
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

    return service
      ? { service, source: "gemini", confidence: aiMatch.confidence, language: aiMatch.language }
      : null;
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

  return { service: bestMatch.service, source: "local", score: bestMatch.score, language: "sq" };
}

async function resolveGuideAnswer(question, preferredLanguage) {
  const services = await readServices();
  const localMatch = findLocalMatch(question, services);
  const strongLocalMatch =
    localMatch && localMatch.score >= STRONG_LOCAL_SCORE ? localMatch : null;
  const match = strongLocalMatch || (await findAiMatch(question, services)) || localMatch;

  if (!match) {
    return null;
  }

  return {
    ...match.service,
    friendlyAnswer: buildFriendlyAnswer(match.service, preferredLanguage || match.language || "sq"),
    language: preferredLanguage || match.language || "sq",
  };
}

router.post("/", async (req, res) => {
  try {
    const question = req.body?.question;

    if (!question || typeof question !== "string") {
      return res.status(400).json({ error: "question is required" });
    }

    const answer = await resolveGuideAnswer(question);

    if (!answer) {
      return res.status(404).json({
        error: "Nuk gjeta nje sherbim te pershtatshem. Provo ta pershkruash me fjale te tjera.",
      });
    }

    res.json(answer);
  } catch (error) {
    console.error("Guide route failed:", error);
    res.status(500).json({ error: "Guide service failed" });
  }
});

router.post("/voice", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Audio file is required." });
    }

    const audioBase64 = req.file.buffer.toString("base64");
    const transcription = await transcribeGuideAudio(audioBase64, req.file.mimetype);
    const answer = await resolveGuideAnswer(transcription.question, transcription.language);

    if (!answer) {
      return res.status(404).json({
        error: "Nuk u kuptua, provo perseri.",
        question: transcription.question,
        language: transcription.language,
      });
    }

    res.json({
      ...answer,
      question: transcription.question,
      language: transcription.language,
    });
  } catch (error) {
    console.error("Guide voice route failed:", error);
    res.status(500).json({ error: error.message || "Nuk u kuptua, provo perseri." });
  }
});

module.exports = router;
