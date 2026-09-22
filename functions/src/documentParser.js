const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const vision = require("@google-cloud/vision");

async function performOCR(buffer) {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  if (!apiKey) {
    console.warn("GOOGLE_CLOUD_VISION_API_KEY is not set. Returning mock OCR text.");
    return "This is mock OCR extracted text from the scanned document.";
  }
  
  // Use API key if available, otherwise it falls back to Application Default Credentials
  const client = new vision.ImageAnnotatorClient({ apiKey });
  
  // For PDF OCR with Cloud Vision, it's more complex (async batch processing).
  // For this hackathon, we assume images (png/jpeg) or single-page mock for simplicity if not fully fleshed out.
  // The spec mentions DOCUMENT_TEXT_DETECTION.
  try {
    const [result] = await client.documentTextDetection(buffer);
    const fullTextAnnotation = result.fullTextAnnotation;
    return fullTextAnnotation ? fullTextAnnotation.text : "";
  } catch (err) {
    console.error("OCR Error:", err);
    throw err;
  }
}

/**
 * Extracts text from a document buffer.
 * @param {Buffer} buffer 
 * @param {string} mimeType 
 * @returns {Promise<string>}
 */
async function extractText(buffer, mimeType) {
  let text = "";
  if (mimeType === "application/pdf") {
    const data = await pdfParse(buffer);
    text = data.text;
  } else if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const result = await mammoth.extractRawText({ buffer });
    text = result.value;
  }
  
  // If text is too short, fallback to OCR
  if (!text || text.trim().length < 50) {
    console.log("Extracted text is very short, falling back to OCR...");
    text = await performOCR(buffer);
  }
  
  return text;
}

module.exports = {
  extractText,
  performOCR
};
