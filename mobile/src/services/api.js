const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://172.16.103.5:4000";

export const analyzeAccessibility = async (image) => {
  const formData = new FormData();

  formData.append("image", {
    uri: image,
    name: "photo.jpg",
    type: "image/jpeg",
  });

  const res = await fetch(`${API_URL}/api/accessibility`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Accessibility analysis failed: ${res.status}`);
  }

  return res.json();
};


export const askGuide = async (question) => {
  const res = await fetch(`${API_URL}/api/guide`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Guide request failed: ${res.status}`);
  }

  return data;
};
