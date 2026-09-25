require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const Busboy = require("busboy");
const { callGroq, wrapDocumentForPrompt, parseLLMJSON } = require("./groqClient");
const { extractText } = require("./documentParser");

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const busboy = busboy({ headers: req.headers });
    let fileBuffer = null;
    let mimeType = null;
    let role = "Tenant"; // default
    
    busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
      if (fieldname !== "document") {
        file.resume();
        return;
      }
      mimeType = mimetype;
      const chunks = [];
      file.on("data", (data) => {
        chunks.push(data);
      });
      file.on("end", () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    busboy.on("field", (fieldname, val) => {
      if (fieldname === "role") {
        role = val;
      }
    });

    busboy.on("finish", () => {
      if (!fileBuffer) {
        reject(new Error("No file uploaded"));
      } else {
        resolve({ fileBuffer, mimeType, role });
      }
    });
    
    busboy.on("error", reject);
    
    // Firebase functions v2 raw body handling
    if (req.rawBody) {
      busboy.end(req.rawBody);
    } else {
      req.pipe(busboy);
    }
  });
}

exports.analyze = onRequest({ maxInstances: 10, timeoutSeconds: 300, secrets: ["GROQ_API_KEY"] }, async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  try {
    // 1. Parse multipart form data
    // We are using raw busboy but Firebase functions natively parse json and urlencoded. For multipart, we need busboy.
    // Wait, let's use the busboy module imported above
    const busboy = require('busboy');
    const bb = busboy({ headers: req.headers, limits: { fileSize: 10 * 1024 * 1024 } });
    
    let fileBuffer = null;
    let mimeType = null;
    let role = "Tenant";
    
    bb.on("file", (name, file, info) => {
      if (name !== "document") {
        file.resume();
        return;
      }
      mimeType = info.mimeType;
      const chunks = [];
      file.on("data", (data) => {
        chunks.push(data);
      });
      file.on("end", () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    bb.on("field", (name, val) => {
      if (name === "role") {
        role = val;
      }
    });

    let finished = false;
    await new Promise((resolve, reject) => {
      bb.on("finish", () => {
        finished = true;
        resolve();
      });
      bb.on("error", reject);
      if (req.rawBody) {
        bb.end(req.rawBody);
      } else {
        req.pipe(bb);
      }
    });

    if (!fileBuffer) {
      res.status(400).send("No document provided.");
      return;
    }

    // 2. Validate MIME type
    const validMimes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/png", "image/jpeg"];
    if (!validMimes.includes(mimeType)) {
      res.status(400).send("Unsupported file type.");
      return;
    }

    // 3. Extract text
    let docText = await extractText(fileBuffer, mimeType);
    if (!docText || docText.trim().length < 50) {
      // Fallback to OCR
      // TODO: Implement OCR using Google Cloud Vision
      docText = "Fallback to OCR not yet implemented. Text too short.";
    }

    // Redact basic PII here before logging if needed
    // logger.info("Text length:", docText.length);

    // 4. Send to Groq for analysis
    const systemPrompt = `You are an expert legal document analyzer.
Your task is to analyze the document from the perspective of a ${role}.
Output MUST be valid JSON matching this schema:
{
  "documentType": "string",
  "summary": {
    "simple": "string",
    "standard": "string",
    "detailed": "string"
  },
  "risks": [
    {
      "clauseName": "string",
      "explanation": "string",
      "severity": "High | Medium | Low",
      "whyItMatters": "string (specific to the ${role})"
    }
  ],
  "timeline": [
    {
      "dateOrCondition": "string (e.g. 'Within 30 days of termination')",
      "event": "string",
      "description": "string"
    }
  ],
  "nextSteps": ["string (recommended next steps for the ${role})"]
}`;
    
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: wrapDocumentForPrompt(docText) }
    ];

    const groqResponse = await callGroq(messages, {
      response_format: { type: "json_object" }
    });

    const parsedData = parseLLMJSON(groqResponse);
    parsedData.originalText = docText;

    res.json(parsedData);
  } catch (error) {
    logger.error("Analyze Error", error);
    res.status(500).json({ error: "Analysis failed. Please try again." });
  }
});

exports.ask = onRequest({ maxInstances: 10, timeoutSeconds: 300, secrets: ["GROQ_API_KEY"] }, async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }
  
  try {
    const { question, documentText, history = [] } = req.body;
    if (!question || !documentText) {
      res.status(400).send("Missing question or documentText");
      return;
    }
    
    const systemPrompt = `You are a legal document assistant answering questions based ONLY on the provided document text. 
If the document doesn't address the question, say so explicitly rather than guessing (e.g. "Not addressed in this document").
Provide a specific section or clause citation where possible.
Output MUST be valid JSON matching this schema:
{
  "answer": "string",
  "citation": "string (or null if not addressed)"
}`;
    
    const messages = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: `Question: ${question}\n\n` + wrapDocumentForPrompt(documentText) }
    ];

    const groqResponse = await callGroq(messages, {
      response_format: { type: "json_object" }
    });

    const parsedData = parseLLMJSON(groqResponse);
    res.json(parsedData);
  } catch (error) {
    logger.error("Ask Error", error);
    res.status(500).json({ error: "Failed to answer question." });
  }
});

exports.ocr = onRequest({ maxInstances: 10, timeoutSeconds: 300, secrets: ["GROQ_API_KEY"] }, async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  try {
    const busboy = require('busboy');
    const bb = busboy({ headers: req.headers, limits: { fileSize: 10 * 1024 * 1024 } });
    
    let fileBuffer = null;
    
    bb.on("file", (name, file) => {
      const chunks = [];
      file.on("data", data => chunks.push(data));
      file.on("end", () => fileBuffer = Buffer.concat(chunks));
    });

    let finished = false;
    await new Promise((resolve, reject) => {
      bb.on("finish", () => {
        finished = true;
        resolve();
      });
      bb.on("error", reject);
      if (req.rawBody) bb.end(req.rawBody);
      else req.pipe(bb);
    });

    if (!fileBuffer) {
      res.status(400).send("No document provided.");
      return;
    }

    const { performOCR } = require("./documentParser");
    const text = await performOCR(fileBuffer);
    res.json({ text });
  } catch (error) {
    logger.error("OCR Endpoint Error", error);
    res.status(500).json({ error: "OCR processing failed." });
  }
});

exports.compare = onRequest({ maxInstances: 10, timeoutSeconds: 300, secrets: ["GROQ_API_KEY"] }, async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }
  
  try {
    const { doc1Text, doc2Text, role } = req.body;
    if (!doc1Text || !doc2Text) {
      res.status(400).send("Missing doc1Text or doc2Text");
      return;
    }
    
    const systemPrompt = `You are comparing two legal documents. Output a JSON object with a summary of key differences and a list of specific clause differences.
Output MUST be valid JSON matching this schema:
{
  "keyDifferences": ["string"],
  "differences": [
    {
      "clauseName": "string",
      "doc1Text": "string",
      "doc2Text": "string",
      "impact": "string (impact on the ${role})"
    }
  ]
}`;
    
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `DOCUMENT 1:\n${wrapDocumentForPrompt(doc1Text)}\n\nDOCUMENT 2:\n${wrapDocumentForPrompt(doc2Text)}` }
    ];

    const groqResponse = await callGroq(messages, {
      response_format: { type: "json_object" }
    });

    const parsedData = parseLLMJSON(groqResponse);
    res.json(parsedData);
  } catch (error) {
    logger.error("Compare Error", error);
    res.status(500).json({ error: "Failed to compare documents." });
  }
});
