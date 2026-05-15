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
