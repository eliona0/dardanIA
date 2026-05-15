const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://172.16.103.5:4000";

const readJsonResponse = async (res, fallbackMessage) => {
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || `${fallbackMessage}: ${res.status}`);
  }

  return data;
};

const appendImageFile = async (formData, image) => {
  const fileName = image.fileName || "report-photo.jpg";
  const mimeType = image.mimeType || "image/jpeg";

  if (typeof image === "string") {
    formData.append("image", {
      uri: image,
      name: fileName,
      type: mimeType,
    });
    return;
  }

  formData.append("image", {
    uri: image.uri,
    name: fileName,
    type: mimeType,
  });
};

export const analyzeAccessibility = async (image) => {
  const formData = new FormData();

  await appendImageFile(formData, image);

  const res = await fetch(`${API_URL}/api/accessibility`, {
    method: "POST",
    body: formData,
  });

  return readJsonResponse(res, "Accessibility analysis failed");
};

export const analyzeReport = async ({ image, description, city }) => {
  const formData = new FormData();

  formData.append("description", description);
  formData.append("city", city);

  if (image) {
    await appendImageFile(formData, image);
  }

  const res = await fetch(`${API_URL}/api/report`, {
    method: "POST",
    body: formData,
  });

  return readJsonResponse(res, "Report analysis failed");
};

export const saveCase = async (caseResult) => {
  const res = await fetch(`${API_URL}/api/cases`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(caseResult),
  });

  return readJsonResponse(res, "Case save failed");
};


export const askGuide = async (question) => {
  const res = await fetch(`${API_URL}/api/guide`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question }),
  });

  return readJsonResponse(res, "Guide request failed");
};
