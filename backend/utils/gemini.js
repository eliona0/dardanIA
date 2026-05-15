const path = require("path");

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(__dirname, "..", "credentials.json");
} else if (!path.isAbsolute(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve(
    __dirname,
    "..",
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
  );
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
    title: String(result.title || "Accessibility barrier report"),
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
    title: String(result.title || "Civic problem report"),
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
Analyze this image for accessibility barriers.

The photo may show an entrance, sidewalk, ramp, parking space, or elevator.
Assess risks for wheelchair users and people with visual impairments.

Return ONLY valid JSON with this exact shape:
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
Analyze this civic problem report.

Description:
"${description}"

City or location:
"${city}"

Return ONLY valid JSON with this exact shape:
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

Rules:
- Use the provided city/location as the location unless the report clearly identifies a more precise place.
- If an image is provided, use it as supporting evidence.
- If no image is provided, analyze only the description and city/location.
- Keep officialComplaint formal and ready to send to the recommended institution.
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

module.exports = {
  analyzeAccessibility,
  analyzeReport,
};
