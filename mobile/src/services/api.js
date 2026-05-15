import axios from "axios";

import { API_URL } from "@env";
export const analyzeAccessibility = async (image) => {
  const formData = new FormData();

  formData.append("image", {
    uri: image,
    name: "photo.jpg",
    type: "image/jpeg",
  });

  const res = await axios.post(`${API_URL}/api/accessibility`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};