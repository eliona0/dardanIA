require("dotenv").config({ override: true });

const cors = require("cors");
const crypto = require("crypto");
const express = require("express");
const fs = require("fs/promises");
const nodemailer = require("nodemailer");
const path = require("path");

const accessibilityRouter = require("./routes/accessibility");
const guideRouter = require("./routes/guide");
const reportRouter = require("./routes/report");

const app = express();
const PORT = process.env.PORT || 4000;
const casesPath = path.join(__dirname, "data", "cases.json");
const institutionsPath = path.join(__dirname, "data", "institutions.json");

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/accessibility", accessibilityRouter);
app.use("/api/guide", guideRouter);
app.use("/api/report", reportRouter);

const normalize = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/Ã«/g, "e")
    .replace(/Ã§/g, "c")
    .replace(/ë/g, "e")
    .replace(/ç/g, "c")
    .trim();

const readJsonFile = async (filePath, fallback) => {
  const raw = await fs.readFile(filePath, "utf8").catch(() => null);

  if (!raw) {
    return fallback;
  }

  return JSON.parse(raw);
};

const writeCases = async (cases) => {
  await fs.writeFile(casesPath, JSON.stringify(cases, null, 2));
};

const getCaseCity = (caseData) => {
  if (caseData?.location && typeof caseData.location === "object") {
    return caseData.location.city;
  }

  if (typeof caseData?.location === "string") {
    return caseData.location;
  }

  return caseData?.city || process.env.DEFAULT_CASE_CITY || "Prishtinë";
};

const findInstitution = async (caseData) => {
  const institutions = await readJsonFile(institutionsPath, []);
  const caseCategory = normalize(caseData?.category);
  const caseCity = normalize(getCaseCity(caseData));

  return institutions.find((institution) => {
    const categoryMatch = institution.categories
      ?.map(normalize)
      .includes(caseCategory);
    const cityMatch = normalize(institution.city) === caseCity;

    return categoryMatch && cityMatch;
  });
};

const createMailTransport = () => {
  if (!process.env.SMTP_HOST) {
    return nodemailer.createTransport({ jsonTransport: true });
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
  });
};

const formatLocation = (caseData) => {
  const location = caseData?.location;

  if (caseData?.address) {
    return caseData.address;
  }

  if (location && typeof location === "object") {
    return [location.city, location.neighborhood].filter(Boolean).join(", ");
  }

  return location || "Nuk është dhënë adresë.";
};

const buildCaseEmail = (caseData) => {
  const reportText = caseData.officialComplaint || caseData.officialReport || "Nuk ka raport zyrtar.";
  const createdAt = caseData.createdAt || new Date().toISOString();

  return {
    subject: `Raport i ri nga dardanIA: ${caseData.title || "Rast qytetar"}`,
    text: [
      "Përshëndetje,",
      "",
      "Ju është dërguar një raport i ri nga platforma dardanIA.",
      "",
      `Titulli: ${caseData.title || "Pa titull"}`,
      `Kategoria: ${caseData.category || "Pa kategori"}`,
      `Ashpërsia: ${caseData.severity || "Pa vlerësim"}`,
      `Lokacioni/Adresa: ${formatLocation(caseData)}`,
      `Përmbledhja: ${caseData.summary || "Nuk ka përmbledhje."}`,
      "",
      "Raporti zyrtar / ankesa:",
      reportText,
      "",
      `Data e krijimit: ${createdAt}`,
      "",
      "Ky email është gjeneruar nga dardanIA.",
    ].join("\n"),
  };
};

const sendCaseEmail = async (caseData) => {
  if (!caseData.institutionEmail) {
    throw new Error("Case has no matched institution email.");
  }

  const transporter = createMailTransport();
  const email = buildCaseEmail(caseData);

  return transporter.sendMail({
    from: process.env.SMTP_FROM || "dardanIA <no-reply@dardania.local>",
    to: caseData.institutionEmail,
    subject: email.subject,
    text: email.text,
  });
};

app.post("/api/cases", async (req, res) => {
  try {
    const cases = await readJsonFile(casesPath, []);
    const institution = await findInstitution(req.body);
    const newCase = {
      ...req.body,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      status: req.body?.status || "pending",
      institutionName: institution?.name || null,
      institutionEmail: institution?.email || null,
      emailStatus: "not_sent",
    };

    cases.push(newCase);
    const caseIndex = cases.length - 1;

    if (newCase.institutionEmail) {
      try {
        await sendCaseEmail(newCase);
        cases[caseIndex] = {
          ...newCase,
          emailStatus: "sent",
          emailSentAt: new Date().toISOString(),
        };
      } catch (emailError) {
        console.error("Auto-send case email failed:", emailError);
        cases[caseIndex] = {
          ...newCase,
          emailStatus: "failed",
        };
      }
    }

    await writeCases(cases);

    res.status(201).json(cases[caseIndex]);
  } catch (error) {
    console.error("Save case failed:", error);
    res.status(500).json({ error: "Could not save case." });
  }
});

app.post("/api/cases/:id/send-email", async (req, res) => {
  const cases = await readJsonFile(casesPath, []);
  const caseIndex = cases.findIndex((caseItem) => caseItem.id === req.params.id);

  if (caseIndex === -1) {
    return res.status(404).json({ error: "Case not found." });
  }

  const caseData = cases[caseIndex];

  if (!caseData.institutionEmail) {
    cases[caseIndex] = {
      ...caseData,
      emailStatus: "failed",
    };
    await writeCases(cases);

    return res.status(400).json({ error: "Case has no matched institution email." });
  }

  try {
    const sent = await sendCaseEmail(caseData);

    cases[caseIndex] = {
      ...caseData,
      emailStatus: "sent",
      emailSentAt: new Date().toISOString(),
    };
    await writeCases(cases);

    return res.json({
      ...cases[caseIndex],
      emailMessageId: sent.messageId || null,
    });
  } catch (error) {
    console.error("Send case email failed:", error);
    cases[caseIndex] = {
      ...caseData,
      emailStatus: "failed",
    };
    await writeCases(cases);

    return res.status(500).json({ error: "Could not send case email." });
  }
});

app.get("/api/cases", async (_req, res) => {
  res.json(await readJsonFile(casesPath, []));
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
