import { Platform } from "react-native";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://172.16.103.5:4000";

export type RiskLevel = "low" | "medium" | "high";

export type AccessibilityAnalysisResult = {
  title: string;
  category: "accessibility";
  accessibilityScore: number;
  severity: RiskLevel;
  wheelchairRisk: RiskLevel;
  visualImpairmentRisk: RiskLevel;
  detectedBarriers: string[];
  recommendations: string[];
  summary: string;
  officialReport: string;
  recommendedInstitution: string;
  status: "pending";
};

type ImagePayload = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
};

const parseResponse = async <T>(res: Response): Promise<T> => {
  const payload = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(payload?.error || `Request failed: ${res.status}`);
  }

  return payload as T;
};

const appendImageFile = async (formData: FormData, image: ImagePayload) => {
  const fileName = image.fileName || "accessibility-photo.jpg";
  const mimeType = image.mimeType || "image/jpeg";

  if (Platform.OS === "web") {
    const imageResponse = await fetch(image.uri);
    const blob = await imageResponse.blob();

    formData.append("image", blob, fileName);
    return;
  }

  formData.append("image", {
    uri: image.uri,
    name: fileName,
    type: mimeType,
  } as unknown as Blob);
};

export const analyzeAccessibility = async (
  image: ImagePayload,
): Promise<AccessibilityAnalysisResult> => {
  const formData = new FormData();

  await appendImageFile(formData, image);

  const res = await fetch(`${API_URL}/api/accessibility`, {
    method: "POST",
    body: formData,
  });

  return parseResponse<AccessibilityAnalysisResult>(res);
};

export const saveCase = async (
  accessibilityResult: AccessibilityAnalysisResult,
): Promise<AccessibilityAnalysisResult & { id: string; createdAt: string }> => {
  const res = await fetch(`${API_URL}/api/cases`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(accessibilityResult),
  });

  return parseResponse<AccessibilityAnalysisResult & { id: string; createdAt: string }>(res);
};
