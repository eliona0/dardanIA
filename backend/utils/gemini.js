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
const ttsModels = [
  process.env.GEMINI_TTS_MODEL,
  "gemini-3.1-flash-tts-preview",
  "gemini-2.5-flash-preview-tts",
].filter(Boolean);

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

const waveBufferFromPcm = (pcmBuffer, sampleRate = 24000, channels = 1, bitsPerSample = 16) => {
  const header = Buffer.alloc(44);
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcmBuffer.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcmBuffer.length, 40);

  return Buffer.concat([header, pcmBuffer]);
};

const buildTtsPrompt = (answer, language = "sq") => {
  const languageNotes = {
    sq: "Speak in natural Kosovo Albanian. Make it sound like a helpful person at a municipal information desk, not like a robot or formal newsreader. Use a warm tone, clear articulation, and natural short pauses. Keep Albanian pronunciation natural.",
    en: "Speak in natural English. Make it sound like a helpful public-service assistant, warm and clear.",
    tr: "Speak in natural Turkish. Make it sound helpful, warm, and clear.",
    sr: "Speak in natural Serbian. Make it sound helpful, warm, and clear.",
  };

  return `
Audio direction:
${languageNotes[language] || languageNotes.sq}
Do not sound dramatic. Do not over-enunciate. Do not read punctuation awkwardly.
Use a conversational pace, with small pauses between ideas.

Transcript to read aloud exactly:
[warmly, natural pace] ${answer}
`;
};

const generateGuideAudio = async (answer, language = "sq") => {
  let lastError;

  for (const ttsModel of ttsModels) {
    try {
      const response = await ai.models.generateContent({
        model: ttsModel,
        contents: [
          {
            role: "user",
            parts: [
              {
                text: buildTtsPrompt(answer, language),
              },
            ],
          },
        ],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: process.env.GEMINI_TTS_VOICE || "Puck",
              },
            },
          },
        },
      });

      const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (!audioBase64) {
        throw new Error("Gemini TTS did not return audio.");
      }

      return waveBufferFromPcm(Buffer.from(audioBase64, "base64"));
    } catch (error) {
      lastError = error;
      console.warn(`Gemini TTS model ${ttsModel} failed:`, error.message);
    }
  }

  throw lastError || new Error("Gemini TTS failed.");
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

const buildGuideResponse = async ({ question, service, preferredLanguage }) => {
  const payload = JSON.stringify(
    {
      question,
      preferredLanguage,
      service,
    },
    null,
    2,
  );
  const result = await generateJson([
    {
      role: "user",
      parts: [
        {
          text: `
You are KuMeShku, a public-service routing assistant.

Task:
Detect the user's language and create a complete answer in that same language.
For Albanian, sound like a helpful public-service assistant in Kosovo: natural, clear, warm, and direct.

Supported output language codes:
- sq: Albanian
- en: English
- tr: Turkish
- sr: Serbian

Input:
${payload}

Return ONLY valid JSON with this exact shape:
{
  "language": "sq" | "en" | "tr" | "sr",
  "answer": string,
  "service": string,
  "institution": string,
  "office": string,
  "floor": string,
  "documents": string[],
  "estimatedWait": string,
  "steps": string[]
}

Rules:
- If preferredLanguage is provided, use it. Otherwise detect the language from question.
- Respond ONLY in that language.
- Translate all service data fields too: service, institution, office, floor, documents, estimatedWait, steps.
- No mixed languages.
- The answer must sound natural, not like a literal translation or a database row.
- For Albanian, prefer everyday phrasing like "zakonisht duhet të shkosh", "merr me vete", "nëse të kërkohet", "ruaje dëshminë".
- Keep the answer conversational but still accurate.
- If the language is English, translate examples like:
  "Kati 1" -> "1st floor"
  "Dokumentet" -> "Documents"
  "Komuna" -> "Municipality"
- Keep the answer short, practical, and friendly: 2-4 sentences.
- Do not invent services, offices, documents, steps, emails, addresses, or institutions.
`,
        },
      ],
    },
  ]);

  const supportedLanguages = ["sq", "en", "tr", "sr"];
  const language = supportedLanguages.includes(result.language)
    ? result.language
    : preferredLanguage || "sq";

  return {
    language,
    answer: String(result.answer || ""),
    service: String(result.service || service.service),
    institution: String(result.institution || service.institution),
    office: String(result.office || service.office),
    floor: String(result.floor || service.floor),
    documents: Array.isArray(result.documents) ? result.documents.map(String) : service.documents,
    estimatedWait: String(result.estimatedWait || service.estimatedWait),
    steps: Array.isArray(result.steps) ? result.steps.map(String) : service.steps,
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
  buildGuideResponse,
  generateGuideAudio,
  matchGuideService,
  transcribeGuideAudio,
};
