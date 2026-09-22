# LegalLens

**PromptWars: Virtual — Challenge 2 ("Build with AI") Submission**

LegalLens is an AI-powered legal document assistant that simplifies complex legal texts, highlights risks, extracts timelines, and answers questions — all customized to your specific role in the agreement.

## 1. Chosen Vertical / Persona
**Primary Persona:** Tenant (Real Estate)
**Why:** Tenants often face dense, complex lease agreements where the power dynamic heavily favors the landlord. The language is confusing, risks are buried, and timelines for renewals or penalties are easily missed. This tool specifically flags risks and obligations from the *tenant's* perspective to balance that information asymmetry. While the tool defaults to Tenant, it supports other personas (Landlord, Employee, Freelancer) by dynamically branching the AI analysis based on the selected role.

## 2. Approach and Logic
- **Role-based Branching:** The user selects their role before analysis. This role is passed to the LLM (Groq) to contextualize risk severity and generate personalized "Why it matters to you" explanations.
- **Document Type Detection:** The system first detects the document type to adapt its extraction and risk-flagging patterns to the specific legal domain.
- **Inference Strategy:** We use `llama-3.3-70b-versatile` via Groq for high-speed, high-quality reasoning. The prompts enforce strict JSON output for structured UI rendering.
- **Google Cloud Integrations:**
  - **Firebase Hosting & Cloud Functions:** Provides a secure backend to hide API keys from the client and serve the React app statically.
  - **Google Cloud Vision OCR:** Acts as a fallback for scanned documents when standard text extraction (`pdf-parse`/`mammoth`) yields insufficient text.
  - **Web Speech API:** Used on the frontend for text-to-speech (TTS) accessibility without heavy backend dependencies, though Cloud TTS is a viable server-side alternative.

## 3. How the Solution Works
1. **Upload:** User uploads a document and selects their role on the React frontend.
2. **Extraction:** The file is sent via `POST` to the `/api/analyze` Cloud Function. The backend extracts text using `pdf-parse` or `mammoth` (falling back to Cloud Vision for scans).
3. **Analysis:** The backend builds a secure prompt (with prompt-injection delimiters) and calls the Groq API.
4. **Render:** The structured JSON response is rendered in a split-pane UI featuring a summary, risk cards, interactive Q&A, and a timeline.
5. **Additional Endpoints:**
   - `/api/analyze`: Main document parsing, summary, risk, and timeline generation.
   - `/api/ask`: Grounded Q&A against the document text with citations.
   - `/api/ocr`: Standalone OCR endpoint for scanned files.
   - `/api/compare`: Side-by-side document comparison.

## 4. Assumptions Made
- **[ASSUMPTION]** Max upload size is capped at 10MB to prevent function timeouts and excessive token usage.
- **[ASSUMPTION]** We default to the "Tenant" persona, but leave other options available in the UI to demonstrate flexibility.
- **[ASSUMPTION]** The Groq model name `llama-3.3-70b-versatile` is accurate and available at the time of building.
- **[ASSUMPTION]** A static `.ics` file generation on the client-side is sufficient for timeline export, avoiding the complexity and OAuth requirements of direct Google Calendar integration.
- **[ASSUMPTION]** Documents are processed entirely in-memory and discarded immediately after the request to maximize privacy and reduce storage costs.

## 5. Setup Instructions
### Prerequisites
- Node.js 20+
- Firebase CLI (`npm install -g firebase-tools`)

### Environment Variables
Set the following secrets in Firebase (or in a `.env` file in the `functions` directory for local development):
- `GROQ_API_KEY`
- `GOOGLE_CLOUD_VISION_API_KEY`

### Local Development
1. Install dependencies:
   ```bash
   npm install
   cd functions && npm install
   ```
2. Start the Firebase emulator for backend functions:
   ```bash
   npm run serve --prefix functions
   ```
3. Start the Vite frontend dev server (in a separate terminal):
   ```bash
   npm run dev
   ```

### Deployment
1. Build the frontend: `npm run build`
2. Deploy to Firebase: `firebase deploy`

## 6. Security Notes
- **Prompt-Injection Defense:** All LLM calls wrap untrusted document text in strict `<<<DOCUMENT_START>>>` and `<<<DOCUMENT_END>>>` delimiters. The system prompt explicitly instructs the model to ignore any instructions found within the document boundaries, neutralizing attacks like "Ignore previous instructions."
- **Zero Secrets in Repo:** All API keys are loaded from environment variables or Firebase Secret Manager. The frontend never possesses or transmits an API key.
- **No Persistence by Default:** Documents are held in memory only during the Cloud Function execution lifecycle and are never written to disk or a database, ensuring maximum privacy for sensitive legal documents.