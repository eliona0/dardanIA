const fs = require("fs");
const path = require("path");

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(__dirname, "..", "credentials.json");
} else if (!path.isAbsolute(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
  const fromBackend = path.resolve(__dirname, "..", process.env.GOOGLE_APPLICATION_CREDENTIALS);
  const fromRepoRoot = path.resolve(__dirname, "..", "..", process.env.GOOGLE_APPLICATION_CREDENTIALS);

  process.env.GOOGLE_APPLICATION_CREDENTIALS = fs.existsSync(fromBackend)
    ? fromBackend
    : fromRepoRoot;
}

const { GoogleGenAI } = require("@google/genai");

const project = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || "dardania-496416";
const location = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const ai = new GoogleGenAI({
  vertexai: true,
  project,
  location,
});

const extractJson = (text) => {
  const cleaned = String(text || "")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Gemini did not return valid JSON.");
  }

  return JSON.parse(cleaned.slice(start, end + 1));
};

const validateRisk = (value) => ["low", "medium", "high"].includes(value);
const validateReportCategory = (value) =>
  [
    "road_damage",
    "blocked_sidewalk",
    "waste",
    "public_lighting",
    "water_issue",
    "public_transport",
    "accessibility",
    "other",
  ].includes(value);

const validateAccessibilityResult = (result) => {
  if (!result || typeof result !== "object") {
    throw new Error("Gemini returned an invalid response.");
  }

  if (result.category !== "accessibility") {
    result.category = "accessibility";
  }

  if (!validateRisk(result.severity)) {
    result.severity = "medium";
  }

  if (!validateRisk(result.wheelchairRisk)) {
    result.wheelchairRisk = "medium";
  }

  if (!validateRisk(result.visualImpairmentRisk)) {
    result.visualImpairmentRisk = "medium";
  }

  return {
    title: String(result.title || "Raport për pengesa në qasje"),
    category: "accessibility",
    accessibilityScore: Math.max(0, Math.min(100, Number(result.accessibilityScore) || 0)),
    severity: result.severity,
    wheelchairRisk: result.wheelchairRisk,
    visualImpairmentRisk: result.visualImpairmentRisk,
    detectedBarriers: Array.isArray(result.detectedBarriers)
      ? result.detectedBarriers.map(String)
      : [],
    recommendations: Array.isArray(result.recommendations)
      ? result.recommendations.map(String)
      : [],
    summary: String(result.summary || ""),
    officialReport: String(result.officialReport || ""),
    recommendedInstitution: String(result.recommendedInstitution || ""),
    status: "pending",
  };
};

const validateReportResult = (result, fallbackLocation) => {
  if (!result || typeof result !== "object") {
    throw new Error("Gemini returned an invalid response.");
  }

  if (!validateReportCategory(result.category)) {
    result.category = "other";
  }

  if (!validateRisk(result.severity)) {
    result.severity = "medium";
  }

  return {
    title: String(result.title || "Raport qytetar"),
    category: result.category,
    severity: result.severity,
    recommendedInstitution: String(result.recommendedInstitution || ""),
    summary: String(result.summary || ""),
    officialComplaint: String(result.officialComplaint || ""),
    location: String(result.location || fallbackLocation),
    status: "pending",
  };
};

const generateJson = async (contents) => {
  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });

  return extractJson(response.text);
};

const analyzeAccessibility = async (imageBase64, mimeType = "image/jpeg") => {
  const result = await generateJson([
    {
      role: "user",
      parts: [
        {
          text: `
Analizo këtë fotografi për pengesa të qasjes.

Fotografia mund të tregojë hyrje, trotuar, rampë, parking ose ashensor.
Vlerëso rreziqet për përdorues të karrocës dhe persona me dëmtime në shikim.

Kthe VETËM JSON valid me këtë strukturë të saktë:
{
  "title": string,
  "category": "accessibility",
  "accessibilityScore": number,
  "severity": "low | medium | high",
  "wheelchairRisk": "low | medium | high",
  "visualImpairmentRisk": "low | medium | high",
  "detectedBarriers": string[],
  "recommendations": string[],
  "summary": string,
  "officialReport": string,
  "recommendedInstitution": string,
  "status": "pending"
}

Rregulla:
- Shkruaj të gjitha vlerat tekstuale në gjuhën shqipe: title, detectedBarriers, recommendations, summary, officialReport, recommendedInstitution.
- Mos përkthe vlerat teknike: category duhet të jetë "accessibility"; severity, wheelchairRisk dhe visualImpairmentRisk duhet të jenë vetëm "low", "medium" ose "high"; status duhet të jetë "pending".
- officialReport duhet të jetë formal dhe gati për t'u dërguar te institucioni përgjegjës në Kosovë.
`,
        },
        {
          inlineData: {
            mimeType,
            data: imageBase64,
          },
        },
      ],
    },
  ]);

  return validateAccessibilityResult(result);
};

const analyzeReport = async ({ description, city, imageBase64, mimeType = "image/jpeg" }) => {
  const parts = [
    {
      text: `
Analizo këtë raport qytetar.

Përshkrimi:
"${description}"

Qyteti ose lokacioni:
"${city}"

Kthe VETËM JSON valid me këtë strukturë të saktë:
{
  "title": string,
  "category": "road_damage | blocked_sidewalk | waste | public_lighting | water_issue | public_transport | accessibility | other",
  "severity": "low | medium | high",
  "recommendedInstitution": string,
  "summary": string,
  "officialComplaint": string,
  "location": string,
  "status": "pending"
}

Rregulla:
- Shkruaj të gjitha vlerat tekstuale në gjuhën shqipe: title, recommendedInstitution, summary, officialComplaint, location.
- Mos përkthe vlerat teknike të category: përdor vetëm njërën nga këto kode: "road_damage", "blocked_sidewalk", "waste", "public_lighting", "water_issue", "public_transport", "accessibility", "other".
- Mos përkthe severity: përdor vetëm "low", "medium" ose "high".
- Mos përkthe status: përdor vetëm "pending".
- Përdor qytetin/lokacionin e dhënë si location, përveç nëse raporti identifikon qartë vend më të saktë.
- Nëse ka fotografi, përdore si dëshmi mbështetëse.
- Nëse nuk ka fotografi, analizo vetëm përshkrimin dhe qytetin/lokacionin.
- officialComplaint duhet të jetë formal dhe gati për t'u dërguar te institucioni përgjegjës në Kosovë.
`,
    },
  ];

  if (imageBase64) {
    parts.push({
      inlineData: {
        mimeType,
        data: imageBase64,
      },
    });
  }

  const result = await generateJson([
    {
      role: "user",
      parts,
    },
  ]);

  return validateReportResult(result, city);
};

const matchGuideService = async (question, services) => {
  const serviceNames = services.map((service) => service.service);
  const payload = JSON.stringify({ question, allowedServices: serviceNames }, null, 2);
  const result = await generateJson([
    {
      role: "user",
      parts: [
        {
          text: `
You are KuMeShku, an Albanian public-service routing assistant.

Task:
Choose the single best matching service from the allowed services list for the user's question.

Input:
${payload}

Return ONLY valid JSON with this exact shape:
{
  "service": string | null,
  "confidence": number,
  "language": "sq" | "en" | "tr" | "sr",
  "reason": string
}

Rules:
- The "service" value must be exactly one of the allowed services, or null if none fits.
- Understand informal Albanian, typos, synonyms, abbreviations, and mixed language.
- Detect the user's language. If unclear, use "sq".
- Match the user's intent, not only exact words.
- Do not invent new services, institutions, offices, documents, or steps.
- Use confidence from 0 to 1.
`,
        },
      ],
    },
  ]);

  if (!result || typeof result !== "object") {
    throw new Error("Gemini returned an invalid guide match.");
  }

  const matchedService = serviceNames.find((name) => name === result.service);
  const supportedLanguages = ["sq", "en", "tr", "sr"];

  return {
    service: matchedService || null,
    confidence: Math.max(0, Math.min(1, Number(result.confidence) || 0)),
    language: supportedLanguages.includes(result.language) ? result.language : "sq",
    reason: String(result.reason || ""),
  };
};

const transcribeGuideAudio = async (audioBase64, mimeType = "audio/m4a") => {
  const result = await generateJson([
    {
      role: "user",
      parts: [
        {
          text: `
You are the voice input layer for KuMeShku.

Task:
Transcribe the spoken user question and detect the language.

Supported languages:
- sq: Albanian
- en: English
- tr: Turkish
- sr: Serbian

Return ONLY valid JSON with this exact shape:
{
  "question": string,
  "language": "sq" | "en" | "tr" | "sr"
}

Rules:
- If the audio is Albanian dialect or Kosovo Albanian, use "sq".
- If the language is unclear, use "sq".
- Return the user's question as normal readable text.
- Do not answer the question here.
`,
        },
        {
          inlineData: {
            mimeType,
            data: audioBase64,
          },
        },
      ],
    },
  ]);

  if (!result || typeof result !== "object" || !result.question) {
    throw new Error("Nuk u kuptua, provo perseri.");
  }

  const supportedLanguages = ["sq", "en", "tr", "sr"];

  return {
    question: String(result.question),
    language: supportedLanguages.includes(result.language) ? result.language : "sq",
  };
};

module.exports = {
  analyzeAccessibility,
  analyzeReport,
  matchGuideService,
  transcribeGuideAudio,
};
