# OfferProof 🛡️

**OfferProof** is an advanced Zero-Trust Career Copilot and Recruitment Auditor API middleware designed to protect job seekers from ghost jobs, typosquatting domains, fake check scams, and unauthorized identity harvesting.

---

## 🚀 Running Locally

Anyone who clones this repository can run it immediately on their local machine.

### Prerequisites

- **Node.js** v18.0.0 or higher
- **npm** v9.0.0 or higher

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/offerproof.git
cd offerproof
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables (Optional)

Copy the example environment file:

```bash
cp .env.example .env
```

Open `.env` and set your Google Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
```

> **Note:** Even without a `GEMINI_API_KEY`, the application is pre-configured with a built-in local Zero-Trust heuristic engine so you can test all sample requisitions and UI features immediately after cloning! Adding a Gemini API key enables real-time Gemini AI auditing.

### 4. Start the Development Server

```bash
npm run dev
```

Open your browser and navigate to:

```
http://localhost:3000
```

---

## 🏗️ Production Build & Start

To build for production and start the optimized server:

```bash
# Build Vite frontend and bundle server
npm run build

# Start production server
npm start
```

---

## 📡 API Middleware Endpoint

OfferProof exposes an RFC 8259-compliant REST API endpoint:

### Health Check

```bash
curl http://localhost:3000/api/health
```

### Run Zero-Trust Audit

```bash
curl -X POST http://localhost:3000/api/audit \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Apex Systems recruiter outreach from apex-careers.org offering $180/hr remote role. Requires purchasing equipment via cashier check."
  }'
```

---

## 🛡️ Trust Vectors Evaluated

1. **Company & Corporate Verification**: Validates registration, entity authenticity, and corporate footprint.
2. **Job & Requisition Verification**: Detects auto-renewed "Ghost Jobs", evergreen postings, and inactive pipelines.
3. **Recruiter Identity & Domain Verification**: Uncovers domain typosquatting (`goog1e.com`, lookalike domains), spoofed headers, and unverified relay routes.
4. **Offer & Financial Fraud Vulnerabilities**: Flags advance-fee schemes, equipment purchase scams, and check-kiting traps.
5. **Privacy & Quarantine Shield**: Automatically masks discovered sensitive PII (SSNs, passports, bank credentials) and isolates dangerous external URLs.
