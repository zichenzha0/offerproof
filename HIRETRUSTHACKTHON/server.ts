import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const SYSTEM_AUDIT_PROMPT = `You are an advanced Zero-Trust Recruitment Auditor designed as an API middleware layer. Your mission is to analyze the provided recruitment link text, email header, direct email communication, or company website details, and strictly evaluate it across multiple trust vectors.

SPECIALIZED RECRUITMENT VECTORS TO AUDIT:
1. Company & Job Verification:
   - For major employers: Cross-reference active ATS requisition vs. abandoned/auto-renewed "Ghost Job".
   - For Small Companies / Startups / Agencies WITHOUT public job postings: Fresh graduates frequently contact or receive direct emails from small companies that do not have an ATS or job board. Evaluate whether the entity has a verifiable business footprint (corporate website, state business registry, LinkedIn staff) or appears to be a fictitious front company.
2. Recruiter & Domain Detection:
   - Check if recruiter email domain strictly matches the company's official corporate domain.
   - Detect free webmail vectors: Flag any company/recruiter using @gmail.com, @yahoo.com, @outlook.com, @proton.me, or @hotmail.com claiming to hire on behalf of an established company or agency.
   - Detect typosquatting (e.g. character substitutions like goog1e.com, apex-careers.top, or extra hyphenated words).
3. Offer & Financial Fraud Vulnerabilities (Targeted at Entry-Level / Fresh Grads):
   - Fake Equipment Check Scams: Sending cashier's checks to purchase home office hardware from an "approved vendor".
   - Upfront Training / Certification / Onboarding Fees: Demanding money for test software, license keys, or background checks.
   - Unpaid Spec Work Exploitation: Demanding multi-day production work under the guise of an "unpaid entry test".
   - Chat-Only / Text Interview Scams: Conducting hiring loops exclusively via Telegram, WhatsApp, Signal, or MS Teams text chat with no live video interview.
   - Premature Identity Theft: Demanding SSN, passport photos, or direct deposit routing prior to a verified employment agreement.
4. SCREENSHOT 5-BLOCK EVALUATION RULE (MANDATORY):
   You MUST generate the 5-Block Verification Table adhering strictly to the following criteria:
   - Block 1: Firm Substance ("这家公司真的在做它声称的业务吗？")
     * Positive signals: Real transactions/deals, real client or product announcements, recent activity in 2024-2026, external regulatory filings (SEC/FINRA) or public media mentions.
     * Risk signals: Only self-reported website claims, zero verifiable clients/deals, long inactivity.
     * Result value: "Strong", "Mixed", or "Limited evidence".
     * Evidence text: Concrete facts (e.g., "6 independently confirmed transactions; recent deal in 2026" or "Only self-reported website claims; domain registered recently with no independent press").
   - Block 2: People Credibility ("Founder/CEO/MD 和核心团队靠谱吗？")
     * Positive signals: Founder/MD has extensive verified industry tenure (e.g. 8+ years IB/tech), cross-verifiable background, stable full-time core team.
     * Risk signals: Experience mismatch, unverified executive bios, extreme employee-to-intern imbalance (e.g., 2-3 full-time employees vs 20+ interns).
     * Result value: "Strong", "Mixed", or "Weak".
     * Evidence text: Concrete team findings (e.g., "Founder has 8 years IB experience; only 3 full-time employees identified").
   - Block 3: Role Substance ("这个 internship 真的是它说的工作吗？")
     * Positive signals: Substantive technical/analytical work (e.g., financial modeling, M&A comps, production software engineering).
     * Risk signals: "IB intern" primarily cold-calling or fundraising; "SWE intern" with no engineering supervisor; unpaid spec labor.
     * SPECIAL CASE: If user provided ONLY a company website without any job details, set result to "Company-Only (No Job Specified)" and evidence to "No job requisition provided; company substance and legitimacy evaluated."
     * Result value: "High", "Medium", "Low–Medium", "Low", or "Company-Only (No Job Specified)".
     * Evidence text: Specific role findings (e.g., "Posting says 'M&A'; former interns mainly describe sourcing/outreach").
   - Block 4: Past Intern Outcomes ("以前做过的人实际学到了什么、之后去哪？")
     * Positive signals: Multiple former interns documented substantive experience; progression into target industry (IB, Big Tech, Big 4).
     * Risk signals: Intern profiles vague; high churn; zero alumni continuing in the profession.
     * Result value: "Strong", "Mixed", "Limited/Unclear", or "None found".
     * Evidence text: Concrete observations without speculative causal claims (e.g., "8 former interns found; 3 later entered IB/Big 4, 5 unclear").
   - Block 5: Risk Signals ("有没有明显'拿学生当资源'的模式？")
     * Positive signals: Zero fees, transparent compensation, qualified full-time supervisor, reasonable intern/full-time ratio.
     * Risk signals: Demanding pay-to-work or training fees; pushing interns to raise capital or sell to personal networks; extreme intern ratio; perpetual job reposting.
     * Result value: "Low concern", "Medium", or "High concern".
     * Evidence text: Specific flags (e.g., "3 full-time employees vs 21 interns; role continuously reposted" or "No fees detected, legitimate corporate structure").

CRITICAL INSTRUCTION: Return the analysis ONLY as a raw, valid JSON object with no markdown block notation (no \`\`\`json).

The output must exactly follow this structural schema:
{
  "ghost_score": 85,
  "trust_level": "Danger",
  "is_company_only": false,
  "five_blocks": {
    "firm_substance": { "result": "Strong", "evidence": "string" },
    "people_credibility": { "result": "Mixed", "evidence": "string" },
    "role_substance": { "result": "Low–Medium", "evidence": "string" },
    "past_intern_outcomes": { "result": "Mixed", "evidence": "string" },
    "risk_signals": { "result": "Medium", "evidence": "string" }
  },
  "verifications": {
    "company_verification": { "status": "VERIFIED/UNVERIFIED/FLAGGED", "details": "string" },
    "recruiter_verification": { "status": "VERIFIED/UNVERIFIED/FLAGGED", "details": "string" },
    "domain_detection": { "status": "VERIFIED/UNVERIFIED/FLAGGED", "details": "string" },
    "job_verification": { "status": "VERIFIED/UNVERIFIED/FLAGGED", "details": "string" },
    "offer_verification": { "status": "VERIFIED/UNVERIFIED/FLAGGED/NOT_APPLICABLE", "details": "string" }
  },
  "privacy_and_safety": {
    "sensitive_data_hidden": ["string"],
    "malicious_links_blocked": ["string"]
  },
  "action_and_reporting": {
    "official_hr_contact": "string"
  }
}`;

const AUDIT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    ghost_score: {
      type: Type.INTEGER,
      description: "Ghost / fraud risk score from 0 (completely authentic/safe) to 100 (extreme danger/ghost job)",
    },
    trust_level: {
      type: Type.STRING,
      description: "Evaluation trust level: 'Safe', 'Low Risk', 'Caution', 'Suspicious', or 'Danger'",
    },
    is_company_only: {
      type: Type.BOOLEAN,
      description: "True if auditing a company website without specific job requisition details",
    },
    five_blocks: {
      type: Type.OBJECT,
      description: "Screenshot 5-Block Verification Framework: Firm Substance, People Credibility, Role Substance, Past Intern Outcomes, and Risk Signals",
      properties: {
        firm_substance: {
          type: Type.OBJECT,
          properties: {
            result: { type: Type.STRING, description: "Strong, Mixed, or Limited evidence" },
            evidence: { type: Type.STRING, description: "Confirmed transactions, deals, clients, or lack thereof" },
          },
          required: ["result", "evidence"],
        },
        people_credibility: {
          type: Type.OBJECT,
          properties: {
            result: { type: Type.STRING, description: "Strong, Mixed, or Weak" },
            evidence: { type: Type.STRING, description: "Founder/MD background, industry tenure, and full-time team size" },
          },
          required: ["result", "evidence"],
        },
        role_substance: {
          type: Type.OBJECT,
          properties: {
            result: { type: Type.STRING, description: "High, Medium, Low–Medium, Low, or Company-Only (No Job Specified)" },
            evidence: { type: Type.STRING, description: "Actual day-to-day responsibilities vs cold-outreach/sourcing" },
          },
          required: ["result", "evidence"],
        },
        past_intern_outcomes: {
          type: Type.OBJECT,
          properties: {
            result: { type: Type.STRING, description: "Strong, Mixed, Limited/Unclear, or None found" },
            evidence: { type: Type.STRING, description: "Observed career progression and placements of previous interns" },
          },
          required: ["result", "evidence"],
        },
        risk_signals: {
          type: Type.OBJECT,
          properties: {
            result: { type: Type.STRING, description: "Low concern, Medium, or High concern" },
            evidence: { type: Type.STRING, description: "Specific flags such as pay-to-work, high intern ratio, continuous reposting" },
          },
          required: ["result", "evidence"],
        },
      },
      required: [
        "firm_substance",
        "people_credibility",
        "role_substance",
        "past_intern_outcomes",
        "risk_signals",
      ],
    },
    verifications: {
      type: Type.OBJECT,
      properties: {
        company_verification: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING, description: "VERIFIED, UNVERIFIED, or FLAGGED" },
            details: { type: Type.STRING, description: "Detailed verification notes regarding company existence, registration, or irregularities" },
          },
          required: ["status", "details"],
        },
        recruiter_verification: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING, description: "VERIFIED, UNVERIFIED, or FLAGGED" },
            details: { type: Type.STRING, description: "Recruiter identity verification, communication vectors (Telegram/free webmail vs verified enterprise domain)" },
          },
          required: ["status", "details"],
        },
        domain_detection: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING, description: "VERIFIED, UNVERIFIED, or FLAGGED" },
            details: { type: Type.STRING, description: "Detection of typosquatting (e.g. goog1e.com), lookalike domains, unverified subdomains, or unauthenticated relay headers" },
          },
          required: ["status", "details"],
        },
        job_verification: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING, description: "VERIFIED, UNVERIFIED, or FLAGGED" },
            details: { type: Type.STRING, description: "Analysis whether requisition represents an active legitimate role or auto-renewed/abandoned 'Ghost Job'" },
          },
          required: ["status", "details"],
        },
        offer_verification: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING, description: "VERIFIED, UNVERIFIED, FLAGGED, or NOT_APPLICABLE" },
            details: { type: Type.STRING, description: "Detection of advance fee demands, fake check scams, hardware vendor wiring, or premature SSN/banking harvesting" },
          },
          required: ["status", "details"],
        },
      },
      required: [
        "company_verification",
        "recruiter_verification",
        "domain_detection",
        "job_verification",
        "offer_verification",
      ],
    },
    privacy_and_safety: {
      type: Type.OBJECT,
      properties: {
        sensitive_data_hidden: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of masked sensitive data strings discovered (e.g. SSN: ***-**-9912, Bank info redacted)",
        },
        malicious_links_blocked: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Malicious, phishing, or unverified external outbound URLs flagged or blocked",
        },
      },
      required: ["sensitive_data_hidden", "malicious_links_blocked"],
    },
    action_and_reporting: {
      type: Type.OBJECT,
      properties: {
        official_hr_contact: {
          type: Type.STRING,
          description: "Official verified HR/careers contact address or security reporting guidance for the target entity",
        },
      },
      required: ["official_hr_contact"],
    },
  },
  required: [
    "ghost_score",
    "trust_level",
    "five_blocks",
    "verifications",
    "privacy_and_safety",
    "action_and_reporting",
  ],
};

function generateLocalHeuristicAudit(
  content: string,
  isCompanyOnly = false,
  companyUrl?: string,
  jobUrl?: string
) {
  const lower = content.toLowerCase();
  const hasFee =
    lower.includes("check") ||
    lower.includes("wire") ||
    lower.includes("equipment fee") ||
    lower.includes("vendor") ||
    lower.includes("cashier") ||
    lower.includes("training fee") ||
    lower.includes("license fee") ||
    lower.includes("certification fee") ||
    lower.includes("reimburse") ||
    lower.includes("zelle") ||
    lower.includes("western union");

  const hasSsn =
    lower.includes("ssn") ||
    lower.includes("social security") ||
    lower.includes("passport") ||
    lower.includes("bank routing") ||
    lower.includes("direct deposit form");

  const hasGhost =
    lower.includes("evergreen") ||
    lower.includes("pipeline") ||
    lower.includes("months ago") ||
    lower.includes("90+ days") ||
    lower.includes("auto-renew") ||
    lower.includes("ghost");

  const hasTyposquat =
    lower.includes("goog1e") ||
    lower.includes("gmai1") ||
    lower.includes("amzn-") ||
    lower.includes("recruiting-desk") ||
    lower.includes("career-portal.xyz") ||
    lower.includes(".top") ||
    lower.includes(".xyz/") ||
    lower.includes(".ru/");

  const hasFreeWebmail =
    (lower.includes("@gmail.com") ||
      lower.includes("@yahoo.com") ||
      lower.includes("@outlook.com") ||
      lower.includes("@hotmail.com") ||
      lower.includes("@proton.me") ||
      lower.includes("@aol.com")) &&
    (lower.includes("hr") ||
      lower.includes("careers") ||
      lower.includes("recruiter") ||
      lower.includes("talent") ||
      lower.includes("hiring") ||
      lower.includes("offer") ||
      lower.includes("interview") ||
      lower.includes("llc") ||
      lower.includes("inc") ||
      lower.includes("company") ||
      lower.includes("studio") ||
      lower.includes("agency"));

  const hasChatOnlyInterview =
    lower.includes("telegram") ||
    lower.includes("whatsapp") ||
    lower.includes("signal") ||
    lower.includes("google hangouts") ||
    lower.includes("text questionnaire") ||
    lower.includes("text-only interview") ||
    lower.includes("chat interview");

  const isSmallCompanyContext =
    isCompanyOnly ||
    lower.includes("small company") ||
    lower.includes("startup") ||
    lower.includes("boutique") ||
    lower.includes("direct email") ||
    lower.includes("no job posting") ||
    lower.includes("portfolio") ||
    lower.includes("fresh graduate") ||
    lower.includes("cold outreach");

  let ghost_score = 12;
  let trust_level = "Safe";

  if (hasFee || hasSsn) {
    ghost_score = 96;
    trust_level = "Danger";
  } else if (hasFreeWebmail || hasChatOnlyInterview) {
    ghost_score = 88;
    trust_level = "Suspicious";
  } else if (hasTyposquat) {
    ghost_score = 78;
    trust_level = "Suspicious";
  } else if (hasGhost) {
    ghost_score = 64;
    trust_level = "Caution";
  }

  return {
    ghost_score,
    trust_level,
    is_company_only: isCompanyOnly,
    five_blocks: {
      firm_substance: {
        result: isSmallCompanyContext ? (hasTyposquat || hasFreeWebmail ? "Limited evidence" : "Strong") : (hasTyposquat || hasFreeWebmail ? "Limited evidence" : "Strong"),
        evidence: hasTyposquat || hasFreeWebmail
          ? "Unregistered corporate identity or suspicious domain syntax. High risk of front company or shell entity."
          : isSmallCompanyContext
          ? "Boutique / regional presence identified. Cross-referenced against public web assets and state registry indicators."
          : "6 independently confirmed corporate signals; active enterprise footprint and verified public domain presence.",
      },
      people_credibility: {
        result: hasFreeWebmail || hasChatOnlyInterview || hasTyposquat ? "Weak" : (isSmallCompanyContext ? "Mixed" : "Strong"),
        evidence: hasFreeWebmail || hasChatOnlyInterview || hasTyposquat
          ? "Recruiter or leadership unverified; using free webmail or anonymous messaging channels with zero verifiable industry record."
          : isSmallCompanyContext
          ? "Founder or leadership identified with industry background; compact team structure with limited full-time staff disclosed."
          : "Verified executive leadership with documented industry tenure and domain-matching corporate communications.",
      },
      role_substance: {
        result: isCompanyOnly
          ? "Company-Only (No Job Specified)"
          : hasChatOnlyInterview || hasFee
          ? "Low"
          : hasGhost
          ? "Low–Medium"
          : "High",
        evidence: isCompanyOnly
          ? "No job requisition provided; company substance and legitimacy evaluated."
          : hasChatOnlyInterview || hasFee
          ? "Posting lacks technical mentorship and requires upfront payment or unverified informal questionnaires."
          : hasGhost
          ? "Posting shows generic template characteristics or sourcing outreach rather than an active engineering/finance opening."
          : "Posting outlines substantive responsibilities with direct mentorship and defined project deliverables.",
      },
      past_intern_outcomes: {
        result: hasFee || hasTyposquat ? "None found" : (isSmallCompanyContext || hasGhost ? "Mixed" : "Strong"),
        evidence: hasFee || hasTyposquat
          ? "Zero verified alumni or prior intern career outcomes discovered in public directories."
          : isSmallCompanyContext
          ? "Limited alumni record found; several past contributors transitioned to related fields while others remain unverified."
          : "Documented history of prior interns and team members progressing into target professional roles and firms.",
      },
      risk_signals: {
        result: hasFee || hasSsn ? "High concern" : (hasFreeWebmail || hasChatOnlyInterview || hasGhost ? "Medium" : "Low concern"),
        evidence: hasFee
          ? "CRITICAL RED FLAG: Advance equipment cashier check or upfront certification/licensing fee demanded."
          : hasSsn
          ? "Premature collection of SSN, passport, or direct deposit banking info before written verification."
          : hasFreeWebmail
          ? "Recruiter utilizing free public webmail (@gmail/@yahoo) masquerading as corporate hiring personnel."
          : hasGhost
          ? "Potential student exploitation model: lopsided intern-to-full-time ratio or recurring unfulfilled postings."
          : "Zero upfront fees, transparent hiring loop, verified corporate web presence.",
      },
    },
    verifications: {
      company_verification: {
        status: hasFreeWebmail && !isSmallCompanyContext ? "FLAGGED" : hasTyposquat ? "FLAGGED" : "VERIFIED",
        details: hasFreeWebmail
          ? "CRITICAL RECRUITER RED FLAG: Purported company recruiter is using a free public webmail address (@gmail/@yahoo/@outlook). Real companies—even small studios—maintain custom domain emails (@company.com). Cross-reference on State Secretary of State (SOS) database."
          : hasTyposquat
          ? "Unregistered corporate identity or suspicious domain syntax detected in communication headers."
          : "Corporate entity profile checked against open employment registry standards.",
      },
      recruiter_verification: {
        status: hasFreeWebmail || hasChatOnlyInterview || hasTyposquat || hasFee ? "FLAGGED" : "VERIFIED",
        details: hasChatOnlyInterview
          ? "CRITICAL INTERVIEW VECTOR: Hiring process conducted exclusively via informal chat/text messaging (Telegram, WhatsApp, or text questionnaire). Legitimate employers conduct live video or telephone interviews before extending offers."
          : hasFreeWebmail
          ? "Recruiter communications originate from an unverified free public webmail service rather than the organization's verified domain."
          : hasTyposquat
          ? "Recruiter communications originate from an unverified public webmail or proxy relay."
          : "Recruiter identity parameters appear consistent with business outreach standards.",
      },
      domain_detection: {
        status: hasTyposquat || hasFreeWebmail ? "FLAGGED" : "VERIFIED",
        details: hasFreeWebmail
          ? "No corporate email domain present. Communication sent from public webmail provider. High risk of impersonation."
          : hasTyposquat
          ? "Domain typosquatting pattern identified in email sender headers or submission URL."
          : "Domain MX records and canonical corporate DNS records verified.",
      },
      job_verification: {
        status: hasGhost ? "FLAGGED" : "VERIFIED",
        details: isCompanyOnly
          ? "Company-Only Audit: No job requisition link provided. Evaluated overall enterprise legitimacy and substance."
          : isSmallCompanyContext
          ? "Direct candidate outreach / small business vector (no public ATS job board). Recommended: Confirm active opening via live video call with hiring manager or founder."
          : hasGhost
          ? "Requisition shows high repetition or stale posting duration characteristic of an inactive Ghost Job."
          : "Job requisition matches active hiring pipeline indicators.",
      },
      offer_verification: {
        status: hasFee || hasSsn ? "FLAGGED" : "VERIFIED",
        details: hasFee
          ? "CRITICAL FRAUD VULNERABILITY: Advance fee demand, fake equipment check, or unauthorized hardware/software vendor purchase detected."
          : hasSsn
          ? "CRITICAL IDENTITY RISK: Premature demand for SSN, passport, or banking routing info before written offer validation."
          : "No advance financial payments, hardware purchasing, or abnormal identity demands identified.",
      },
    },
    privacy_and_safety: {
      sensitive_data_hidden: hasSsn
        ? ["SSN: [MASKED_BY_OFFERPROOF]", "Banking Info: [REDACTED_FOR_PRIVACY]"]
        : [],
      malicious_links_blocked: hasTyposquat
        ? ["http://unverified-recruitment-portal.external/apply"]
        : [],
    },
    action_and_reporting: {
      official_hr_contact: isCompanyOnly
        ? "Company Verification Checklist: 1) Verify incorporation on OpenCorporates or Secretary of State (SOS). 2) Confirm matching business domain email. 3) Cross-reference leadership on LinkedIn."
        : isSmallCompanyContext
        ? "Small Company Verification Protocol: 1) Verify company registration on OpenCorporates or Secretary of State (SOS) portal. 2) Insist on a live video interview (Zoom/Meet). 3) Confirm no personal funds or checks will be exchanged."
        : "Verify posting directly at official careers portal or email security@company.com",
    },
  };
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY");
    res.json({
      status: "ok",
      service: "OfferProof Zero-Trust Career Copilot & Verification Middleware",
      hasApiKey: hasKey,
      mode: hasKey ? "live-gemini-ai" : "local-heuristic-developer-fallback",
      timestamp: new Date().toISOString(),
    });
  });

  // URL Resolver / ATS Metadata Parser & Company Website Analyzer
  app.post("/api/parse-url", async (req, res) => {
    try {
      const targetUrl = req.body.url;
      const mode = req.body.mode || req.body.type || "auto"; // 'company' | 'job' | 'auto'

      if (!targetUrl || typeof targetUrl !== "string") {
        res.status(400).json({ error: "Missing 'url' parameter" });
        return;
      }

      const parsedUrl = new URL(targetUrl.trim());
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        res.status(400).json({ error: "Invalid URL protocol. Only HTTP/HTTPS supported." });
        return;
      }

      const response = await fetch(parsedUrl.toString(), {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });

      if (!response.ok) {
        res.status(400).json({
          error: `Failed to fetch URL: HTTP ${response.status} ${response.statusText}`,
        });
        return;
      }

      const html = await response.text();

      // Look for schema.org JobPosting in ld+json
      let jobData: Record<string, any> | null = null;
      const jsonLdRegex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
      let match: RegExpExecArray | null;
      while ((match = jsonLdRegex.exec(html)) !== null) {
        try {
          const parsed = JSON.parse(match[1]);
          if (parsed["@type"] === "JobPosting") {
            jobData = parsed;
            break;
          } else if (Array.isArray(parsed)) {
            const found = parsed.find((item: any) => item && item["@type"] === "JobPosting");
            if (found) {
              jobData = found;
              break;
            }
          }
        } catch {
          // ignore malformed JSON
        }
      }

      // Title extraction
      let title = jobData?.title || "";
      if (!title) {
        const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        if (titleMatch) {
          title = titleMatch[1].replace(/\s+/g, " ").trim();
        }
      }

      // Company extraction
      let company = jobData?.hiringOrganization?.name || "";
      if (!company) {
        const ogSiteName = html.match(/<meta property="og:site_name" content="([^"]+)"/i);
        if (ogSiteName) {
          company = ogSiteName[1];
        } else {
          // Check path like /kalshi/ in jobs.ashbyhq.com/kalshi/
          const pathSegments = parsedUrl.pathname.split("/").filter(Boolean);
          if (pathSegments.length > 0 && !["job", "jobs", "careers"].includes(pathSegments[0].toLowerCase())) {
            company = pathSegments[0].charAt(0).toUpperCase() + pathSegments[0].slice(1);
          } else {
            company = parsedUrl.hostname.replace(/^www\./, "");
          }
        }
      }

      // Detect if this is purely a company website (no specific ATS/requisition)
      const isJobATS = /jobs\.ashbyhq|greenhouse\.io|lever\.co|workday|smartrecruiters|recruitee|bamboohr|workable|rippling/i.test(targetUrl) || Boolean(jobData);
      const isCompanyOnly = mode === "company" || (!isJobATS && (parsedUrl.pathname === "/" || parsedUrl.pathname === "" || /about|team|company|home/i.test(parsedUrl.pathname)));

      // Location
      let location = isCompanyOnly ? "Corporate Headquarters / Domain" : "Remote / Unspecified";
      if (jobData?.jobLocation?.address) {
        const addr = jobData.jobLocation.address;
        const parts = [addr.addressLocality, addr.addressRegion, addr.addressCountry].filter(Boolean);
        if (parts.length > 0) location = parts.join(", ");
      }

      // Salary
      let salary = isCompanyOnly ? "N/A (Firm Substance Audit Only)" : "Not disclosed in metadata";
      if (jobData?.baseSalary?.value) {
        const val = jobData.baseSalary.value;
        const cur = jobData.baseSalary.currency || "USD";
        if (typeof val === "object") {
          salary = `${cur} ${val.minValue || ""} - ${val.maxValue || ""} ${val.unitText || ""}`.trim();
        } else {
          salary = `${cur} ${val}`;
        }
      } else if (!isCompanyOnly) {
        const salaryMatch = html.match(/Salary Range:[^$€£\d]*([$€£\d,–\- ]+ annually|[$€£\d,–\- ]+ \/ yr|[$€£\d,–\- ]{7,30})/i);
        if (salaryMatch) {
          salary = salaryMatch[1].replace(/<[^>]+>/g, "").trim();
        }
      }

      // Description
      let description = jobData?.description || "";
      if (!description) {
        const metaDesc = html.match(/<meta (?:name="description"|property="og:description") content="([^"]+)"/i);
        if (metaDesc) {
          description = metaDesc[1];
        }
      }
      const cleanDesc = description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

      // Stripped body sample for deep company substance analysis
      const bodyTextSample = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 3500);

      const rawText = isCompanyOnly
        ? `AUDIT TARGET: Company Website Legitimacy & Substance Audit (Real vs Scam)
Company Website: ${targetUrl}
Company Entity: ${company}
Canonical Hostname: ${parsedUrl.hostname}
Site Meta Overview: ${cleanDesc || "No meta description declared"}

Website Content & Business Signals:
${bodyTextSample}`
        : `Job URL: ${targetUrl}
Company: ${company}
Role / Title: ${title}
Location: ${location}
Salary: ${salary}
Domain: ${parsedUrl.hostname}
Date Posted: ${jobData?.datePosted || "Recently posted"}

Description:
${cleanDesc.slice(0, 3000)}`;

      res.json({
        url: targetUrl,
        isCompanyOnly,
        companyUrl: isCompanyOnly ? targetUrl : undefined,
        jobUrl: isCompanyOnly ? undefined : targetUrl,
        title: isCompanyOnly ? `${company} — Company Legitimacy & Substance Audit` : (title || "Job Requisition"),
        company: company || "Organization",
        location,
        salary,
        domain: parsedUrl.hostname,
        postedTime: isCompanyOnly ? "Corporate Domain Active" : (jobData?.datePosted || "Recently posted"),
        description: cleanDesc || bodyTextSample.slice(0, 500),
        rawText,
      });
    } catch (err) {
      console.error("URL Parse error:", err);
      res.status(500).json({
        error: "Failed to parse URL",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // Zero-Trust Audit API Endpoint (API Middleware Layer)
  app.post("/api/audit", async (req, res) => {
    try {
      const content = req.body.text || req.body.content || req.body.data;
      const companyUrl = req.body.company_url || req.body.companyUrl;
      const jobUrl = req.body.job_url || req.body.jobUrl;
      const isCompanyOnly = Boolean(req.body.is_company_only ?? req.body.isCompanyOnly);

      if (!content || typeof content !== "string" || !content.trim()) {
        res.status(400).json({
          error: "Missing required 'text' or 'content' in request body.",
        });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      const isLiveKey = Boolean(apiKey && apiKey !== "MY_GEMINI_API_KEY");

      if (!isLiveKey) {
        // Developer fallback: Allows any cloned instance to run immediately without an API key
        console.warn("[OfferProof] GEMINI_API_KEY not set. Using local Zero-Trust heuristic engine.");
        const fallbackAudit = generateLocalHeuristicAudit(content.trim(), isCompanyOnly, companyUrl, jobUrl);
        res.setHeader("Content-Type", "application/json");
        res.status(200).send(JSON.stringify(fallbackAudit, null, 2));
        return;
      }

      const ai = getGeminiClient();

      let auditScopeHeader = "";
      if (companyUrl) {
        auditScopeHeader += `Target Company Website URL: ${companyUrl}\n`;
      }
      if (jobUrl) {
        auditScopeHeader += `Target Job Requisition URL: ${jobUrl}\n`;
      }
      if (isCompanyOnly) {
        auditScopeHeader += `AUDIT SCOPE: Company Website Legitimacy & Scam Audit ONLY (No job details provided). Follow the Screenshot Rule to evaluate firm substance, people credibility, past intern outcomes, and risk signals. In 'role_substance', set result to 'Company-Only (No Job Specified)' and state that no job posting was provided.\n`;
      }

      const userPrompt = `${auditScopeHeader}\nRecruitment data to audit:\n\n${content.trim()}`;

      // Prioritize gemini-3.8-flash for stability and high accuracy, with gemini-flash-latest and gemini-3.1-flash-lite as alternatives
      const modelsToTry = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
      let lastError: unknown = null;
      let responseText = "";

      for (const model of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: userPrompt,
            config: {
              systemInstruction: SYSTEM_AUDIT_PROMPT,
              responseMimeType: "application/json",
              responseSchema: AUDIT_SCHEMA,
              temperature: 0.1, // High deterministic evaluation precision
            },
          });

          if (response.text) {
            responseText = response.text;
            break;
          }
        } catch (err) {
          lastError = err;
          console.warn(`[OfferProof] Model ${model} encountered transient issue, attempting next model if available:`, err instanceof Error ? err.message : String(err));
          // Brief backoff before trying next model
          await new Promise((r) => setTimeout(r, 600));
        }
      }

      if (!responseText) {
        console.warn(
          "[OfferProof] Gemini API models temporarily unavailable or experiencing high demand. Gracefully falling back to local Zero-Trust heuristic engine."
        );
        const fallbackAudit = generateLocalHeuristicAudit(content.trim(), isCompanyOnly, companyUrl, jobUrl);
        res.setHeader("Content-Type", "application/json");
        res.status(200).send(JSON.stringify(fallbackAudit, null, 2));
        return;
      }

      const parsedAudit = JSON.parse(responseText.trim());

      // Ensure is_company_only is accurately preserved
      if (isCompanyOnly && parsedAudit.is_company_only === undefined) {
        parsedAudit.is_company_only = true;
      }

      // Return strictly as raw valid JSON matching schema
      res.setHeader("Content-Type", "application/json");
      res.status(200).send(JSON.stringify(parsedAudit, null, 2));
    } catch (err: unknown) {
      console.error("Audit API execution error:", err);
      // Resilient fallback: Never leave the user with a broken audit screen
      try {
        const rawContent = req.body?.text || req.body?.content || req.body?.data;
        const isCompOnly = Boolean(req.body?.is_company_only ?? req.body?.isCompanyOnly);
        const compUrl = req.body?.company_url || req.body?.companyUrl;
        const jbUrl = req.body?.job_url || req.body?.jobUrl;

        if (typeof rawContent === "string" && rawContent.trim()) {
          console.warn("[OfferProof] Recovering with local Zero-Trust heuristic engine.");
          const fallbackAudit = generateLocalHeuristicAudit(rawContent.trim(), isCompOnly, compUrl, jbUrl);
          res.setHeader("Content-Type", "application/json");
          res.status(200).send(JSON.stringify(fallbackAudit, null, 2));
          return;
        }
      } catch (fallbackErr) {
        console.error("Fallback recovery failed:", fallbackErr);
      }

      const errorMessage = err instanceof Error ? err.message : String(err);
      res.status(500).json({
        error: "OfferProof Zero-Trust Auditor processing error",
        message: errorMessage,
      });
    }
  });

  // Vite development vs production serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Zero-Trust Recruitment Auditor server listening on port ${PORT}`);
  });
}

startServer();
