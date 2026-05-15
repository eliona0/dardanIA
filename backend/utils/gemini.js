import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// ==========================
// ACCESSIBILITY ANALYSIS
// ==========================
export const analyzeAccessibility = async (imageBase64) => {
  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `
Analyze this image for accessibility.

Return ONLY valid JSON:
{
  "title": string,
  "category": "accessibility",
  "accessibilityScore": number (0-100),
  "severity": "low | medium | high",
  "wheelchairRisk": "low | medium | high",
  "visualImpairmentRisk": "low | medium | high",
  "detectedBarriers": [string],
  "recommendations": [string],
  "summary": string,
  "officialReport": string,
  "recommendedInstitution": string,
  "status": "pending"
}
`,
          },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageBase64,
            },
          },
        ],
      },
    ],
  });

  return response.text;
};

// ==========================
// REPORT PROBLEM ANALYSIS
// ==========================
export const analyzeReport = async (textDescription) => {
  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `
Analyze this civic problem description:

"${textDescription}"

Return ONLY valid JSON:
{
  "title": string,
  "category": "road_damage | blocked_sidewalk | waste | public_lighting | water_issue | public_transport | accessibility | other",
  "severity": "low | medium | high",
  "recommendedInstitution": string,
  "summary": string,
  "officialComplaint": string,
  "status": "pending"
}
`,
          },
        ],
      },
    ],
  });

  return response.text;
};