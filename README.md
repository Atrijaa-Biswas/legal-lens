# LegalLens ⚖️🔍

LegalLens is an AI-powered legal document analyzer designed to instantly review, summarize, and extract critical information from legal documents. Whether you're a tenant looking at a lease, an employee reviewing a contract, or a lawyer preparing for a case, LegalLens provides deep insights with a privacy-first approach.

## 🌟 Features

- **Instant Document Analysis**: Upload PDFs, Word documents, text files, or images. The app uses advanced AI (via Groq) to analyze the content instantly.
- **Role-Based Insights**: Tailors the analysis based on your selected role (e.g., Tenant, Landlord, Employee, Employer, Lawyer).
- **Multi-Level Summaries**: Read summaries in *Simple*, *Standard*, or *Detailed* language based on your comfort level.
- **Risk Identification**: Automatically flags high, medium, and low-risk clauses, explaining what they mean and why they matter to your specific role.
- **Interactive Q&A**: Chat directly with your document. Ask specific questions and get answers cited directly from the text.
- **Timeline & Deadlines**: Extracts important dates and obligations. You can instantly download them as a `.ics` calendar file to add to your personal calendar.
- **Recommended Next Steps**: Provides actionable advice on what to do next based on the document's contents.
- **Export Reports**: Generate and download a comprehensive text report of the analysis to share or save for your records.
- **Privacy First**: Documents are processed entirely in-memory and are **never stored** or saved to a database.

## 🛠️ Tech Stack

- **Frontend**: React, Vite
- **Backend**: Node.js, Firebase Cloud Functions (v2)
- **AI Processing**: Groq API (High-speed LLM inference)
- **Document Parsing**: `pdf-parse`, `mammoth`, Google Cloud Vision (fallback OCR)

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js (v20+)
- Firebase CLI (`npm install -g firebase-tools`)
- Groq API Key

### 1. Clone & Install
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd functions
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory:
```env
GROQ_API_KEY=your_groq_api_key_here
GOOGLE_CLOUD_VISION_API_KEY=your_optional_vision_key_here
```

### 3. Run the App
Start the Firebase Emulator (Backend) and Vite Dev Server (Frontend) simultaneously:

```bash
# Terminal 1: Start Backend
cd functions
npm run serve

# Terminal 2: Start Frontend
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🔒 Privacy Notice
LegalLens is built for privacy. Uploaded files are streamed into memory, parsed, sent to the LLM for analysis, and immediately discarded. No databases are connected to the document upload pipeline.