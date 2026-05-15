const express = require("express");
const multer = require("multer");

const { analyzeReport } = require("../utils/gemini");

const router = express.Router();
const upload = multer({
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
  storage: multer.memoryStorage(),
});

const getErrorResponse = (error) => {
  const message = error instanceof Error ? error.message : String(error);

  try {
    const parsed = JSON.parse(message);
    const apiError = parsed.error;

    if (apiError?.message) {
      const statusByProviderStatus = {
        FAILED_PRECONDITION: 412,
        PERMISSION_DENIED: 403,
        RESOURCE_EXHAUSTED: 429,
        UNAUTHENTICATED: 401,
      };

      return {
        status: statusByProviderStatus[apiError.status] || 502,
        body: {
          error: apiError.message,
          providerStatus: apiError.status,
        },
      };
    }
  } catch (_parseError) {
    // Keep the original error message when the provider did not return JSON.
  }

  return {
    status: 500,
    body: { error: message || "Report analysis failed." },
  };
};

router.post("/", upload.single("image"), async (req, res) => {
  try {
    const description = String(req.body?.description || "").trim();
    const city = String(req.body?.city || "").trim();

    if (!description || !city) {
      return res.status(400).json({ error: "description and city are required" });
    }

    const result = await analyzeReport({
      description,
      city,
      imageBase64: req.file?.buffer.toString("base64"),
      mimeType: req.file?.mimetype,
    });

    return res.json(result);
  } catch (error) {
    console.error("Report analysis failed:", error);
    const response = getErrorResponse(error);

    return res.status(response.status).json(response.body);
  }
});

module.exports = router;
