const express = require("express");
const fs = require("fs/promises");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const {
  buildGuideResponse,
  generateGuideAudio,
  matchGuideService,
  transcribeGuideAudio,
} = require("../utils/gemini");

const router = express.Router();
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  storage: multer.memoryStorage(),
});
const servicesPath = path.join(__dirname, "..", "data", "services.json");
const audioDir = path.join(__dirname, "..", "data", "audio");
const MIN_AI_CONFIDENCE = 0.55;
const STRONG_LOCAL_SCORE = 4;
const FAST_ALBANIAN_SCORE = 5;

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

  const firstStep = Array.isArray(service.steps) && service.steps.length
    ? ` Hapi i parë: ${service.steps[0]}`
    : "";

  return `Për ${service.service}, zakonisht duhet të shkosh te ${service.institution}, në ${service.office}, ${service.floor}. Merr me vete këto dokumente: ${documents}. Koha e pritjes zakonisht është rreth ${service.estimatedWait}.${firstStep}`;
}

async function saveGuideAudio(answer, language, req) {
  try {
    const audioBuffer = await generateGuideAudio(answer, language);
    await fs.mkdir(audioDir, { recursive: true });

    const fileName = `guide-${Date.now()}-${crypto.randomUUID()}.wav`;
    const filePath = path.join(audioDir, fileName);
    await fs.writeFile(filePath, audioBuffer);

    return `${req.protocol}://${req.get("host")}/audio/${fileName}`;
  } catch (error) {
    console.warn("Gemini guide TTS failed, frontend will use fallback speech:", error.message);
    return null;
  }
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

function detectLikelyLanguage(question) {
  const normalizedQuestion = normalize(question);
  const rawQuestion = String(question || "").toLowerCase();
  const albanianHints = [
    "ku",
    "shkoj",
    "shku",
    "duhet",
    "per",
    "për",
    "certifikate",
    "certifikatë",
    "leternjoftim",
    "letërnjoftim",
    "komune",
    "komunë",
    "dokument",
    "patente",
    "pasaporte",
    "pasaportë",
    "mjek",
    "pages",
    "tatim",
  ];
  const englishHints = ["where", "how", "what", "birth", "certificate", "documents", "municipality", "floor"];
  const turkishHints = ["nereye", "nasıl", "belge", "belediye", "kat"];
  const serbianHints = ["gde", "kako", "dokument", "opstina", "opština", "sprat"];
  const hasHint = (hints) =>
    hints.some((hint) => normalizedQuestion.includes(normalize(hint)) || rawQuestion.includes(hint));

  if (hasHint(englishHints)) {
    return "en";
  }

  if (hasHint(turkishHints)) {
    return "tr";
  }

  if (hasHint(serbianHints)) {
    return "sr";
  }

  if (hasHint(albanianHints)) {
    return "sq";
  }

  return "sq";
}

async function resolveGuideAnswer(question, preferredLanguage) {
  const services = await readServices();
  const localMatch = findLocalMatch(question, services);
  const likelyLanguage = preferredLanguage || detectLikelyLanguage(question);
  const useFastAlbanian =
    likelyLanguage === "sq" && localMatch && localMatch.score >= FAST_ALBANIAN_SCORE;

  if (useFastAlbanian) {
    const friendlyAnswer = buildFriendlyAnswer(localMatch.service, "sq");

    return {
      ...localMatch.service,
      answer: friendlyAnswer,
      friendlyAnswer,
      language: "sq",
    };
  }

  const strongLocalMatch =
    localMatch && localMatch.score >= STRONG_LOCAL_SCORE ? localMatch : null;
  const match = strongLocalMatch || (await findAiMatch(question, services)) || localMatch;

  if (!match) {
    return null;
  }

  const language = preferredLanguage || match.language || likelyLanguage;

  try {
    const guideResponse = await buildGuideResponse({
      question,
      service: match.service,
      preferredLanguage: language,
    });

    return {
      ...guideResponse,
      friendlyAnswer: guideResponse.answer,
    };
  } catch (error) {
    console.warn("KuMeShku Gemini answer failed, using local fallback:", error.message);

    const fallbackLanguage = language || "sq";
    const friendlyAnswer = buildFriendlyAnswer(match.service, fallbackLanguage);

    return {
      ...match.service,
      answer: friendlyAnswer,
      friendlyAnswer,
      language: fallbackLanguage,
    };
  }
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

    const audioUrl = await saveGuideAudio(answer.answer || answer.friendlyAnswer, answer.language, req);

    res.json({
      ...answer,
      answer: answer.answer || answer.friendlyAnswer,
      friendlyAnswer: answer.answer || answer.friendlyAnswer,
      audioUrl,
    });
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

    const audioUrl = await saveGuideAudio(answer.answer || answer.friendlyAnswer, answer.language, req);

    res.json({
      ...answer,
      answer: answer.answer || answer.friendlyAnswer,
      friendlyAnswer: answer.answer || answer.friendlyAnswer,
      audioUrl,
      question: transcription.question,
      language: transcription.language,
    });
  } catch (error) {
    console.error("Guide voice route failed:", error);
    res.status(500).json({ error: error.message || "Nuk u kuptua, provo perseri." });
  }
});

module.exports = router;
