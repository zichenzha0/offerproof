import { PresetSample } from './types';

export const PRESET_SAMPLES: PresetSample[] = [
  {
    id: 'xyz-capital-screenshot',
    title: 'Investment Banking Intern',
    company: 'XYZ Capital (Dual Verification: Company & Role)',
    location: 'New York, NY / Hybrid',
    salary: '$30 – $40 / hr ($60,000 annualized equivalent)',
    postedTime: 'Active Requisition • Screenshot Verified Case',
    category: 'Ghost Job',
    subtitle: 'Screenshot Case: Firm is legitimate, but internship role is high-risk student sourcing',
    threatSummary: 'Screenshot 5-Block Standard: Firm substance and founder credibility are Strong, but Role Substance is Low–Medium with a Medium risk signal due to an extreme intern-to-FT ratio.',
    tags: ['Screenshot Case', 'Dual Link Audit', 'Role Substance Check', '5-Block Verified'],
    officialDomain: 'xyzcapital.com',
    companyUrl: '/demo/xyz-capital',
    jobUrl: '/demo/xyz-capital/job',
    initialGhostScore: 54,
    initialTrustLevel: 'Caution',
    content: `TARGET LINKS:
Company Website: https://xyzcapital.com
Job Posting Link: https://xyzcapital.com/careers/ib-intern-2026

EVALUATION SCOPE:
Firm: XYZ Capital
Position: Investment Banking Summer Analyst / Intern
Location: New York, NY
Posted Duration: Continuously active across handshake and LinkedIn

SCREENSHOT 5-BLOCK BENCHMARK DATA:
1. Firm Substance: Strong. 6 transactions confirmed; real fund/advisory deals verifiable on PitchBook and SEC filings.
2. People Credibility: Strong. Founder has 8+ years bulge-bracket IB experience, verifiable on LinkedIn and FINRA BrokerCheck.
3. Role Substance: Low–Medium. Role description mentions financial modeling and comps, but past interns report duties were largely cold calling and sourcing deal leads.
4. Past Intern Outcomes: Mixed. Multiple past interns listed on LinkedIn, but several moved into unrelated careers while only 2 joined boutique IB.
5. Risk Signals: Medium. High intern-to-full-time ratio (3 full-time bankers vs. 18 interns); frequent semester-by-semester requisition cycling.`,
  },
  {
    id: 'nexus-website-only-scam',
    title: 'Company Legitimacy & Substance Audit',
    company: 'Nexus Creative Studio (Website Link Only)',
    location: 'Domain Registered in Delaware (No physical office)',
    salary: 'N/A (Company-Only Audit - No Job Requisition)',
    postedTime: 'Domain Active • Website Only (No Job Details)',
    category: 'Scam',
    subtitle: 'Company-Only Link: Evaluating whether entity is a legitimate business or fraudulent front',
    threatSummary: 'Website-Only Verification: Evaluates corporate substance, founder credibility, and shell-entity risk signals when no job posting is provided.',
    tags: ['Website Only', 'Company Scam Radar', 'No Job Details', 'Front Company Risk'],
    officialDomain: 'nexuscreativestudio.agency',
    companyUrl: '/demo/nexus-creative',
    isCompanyOnly: true,
    initialGhostScore: 89,
    initialTrustLevel: 'Suspicious',
    content: `TARGET LINK:
Company Website: https://nexuscreativestudio.agency
Target Job Requisition: [NONE PROVIDED - WEBSITE ONLY AUDIT]

AUDIT DIRECTIVE:
User provided only a company website link with no job details. Follow Screenshot Rule to verify if the company is real or a scam/front firm:
- Domain registered 42 days ago via privacy proxy
- Website uses stock photos for "Client Case Studies" (reversed-searched to Unsplash)
- Founder profile lists "David Vance, Managing Partner", but zero LinkedIn footprint or verifiable career history
- "Careers" section displays general email form (nexus.recruiting.desk@gmail.com) rather than corporate domain email
- No registered business filing with Delaware or California Secretary of State under "Nexus Creative Studio Agency LLC"
- No verifiable clients, press releases, or portfolio deliverables`,
  },
  {
    id: 'kalshi-ashby-verified',
    title: 'Software Engineer, Product',
    company: 'Kalshi (via Ashby ATS)',
    location: 'New York City, NY',
    salary: '$200,000 – $280,000 / yr + Equity',
    postedTime: 'Active ATS Listing • Verified',
    category: 'Legitimate',
    subtitle: 'Official Ashby ATS Requisition (jobs.ashbyhq.com/kalshi)',
    threatSummary: 'Authentic job posting hosted on Kalshi official Ashby Applicant Tracking System with transparent NYC pay disclosure.',
    tags: ['Ashby ATS', 'NYC Pay Transparency', 'Registered Exchange', 'Safe'],
    officialDomain: 'kalshi.com',
    companyUrl: 'https://kalshi.com',
    jobUrl: 'https://kalshi.com/careers',
    initialGhostScore: 5,
    initialTrustLevel: 'Safe',
    content: `Job URL: https://jobs.ashbyhq.com/kalshi/3dd97725-4a12-4963-b47a-cb5c562cfd1d?utm_source=LinkedIn
Company: Kalshi (Official website: https://kalshi.com)
Hiring ATS: Ashby (jobs.ashbyhq.com)
Role: Software Engineer, Product
Location: New York City, NY
Employment Type: Full-Time
Date Posted: 2026-01-05
NYC Pay Transparency Disclosure: $200,000–$280,000 annually, plus equity and benefits.

Overview:
Kalshi has defined a new category: prediction markets. Kalshi allows people to trade on the outcome of any events and turn any question about the future into a financial asset. Legalized prediction markets in the US, fastest growing financial market in America.

Requirements:
- Bachelor's degree in Computer Science or equivalent, 4+ years of hands-on software development
- Strong command of key programming languages such as Golang, Java, etc.
- Strong knowledge of REST API design and development
- Experience with relational and NoSQL databases (PostgreSQL, MySQL, MongoDB)

Official Careers Portal: https://kalshi.com/careers
Official ATS URL: https://jobs.ashbyhq.com/kalshi/3dd97725-4a12-4963-b47a-cb5c562cfd1d`,
  },
  {
    id: 'typosquat-check-scam',
    title: 'Remote Senior Cloud Solutions Engineer',
    company: 'Google LLC (Spoofed: g00gle-careers.net)',
    location: 'Remote (US Nationwide)',
    salary: '$245,000 / yr + Equity',
    postedTime: 'Offer Received • 1d ago',
    category: 'Scam',
    subtitle: 'From: hr-talent@g00gle-careers.net with cashier check advance',
    threatSummary: 'Character-swap typosquatting (00 for oo), advance equipment check fraud, and premature SSN collection.',
    tags: ['Typosquatting', 'Equipment Check Scam', 'PII Harvesting', 'High Risk'],
    officialDomain: 'careers.google.com',
    companyUrl: 'https://careers.google.com',
    initialGhostScore: 98,
    initialTrustLevel: 'Danger',
    content: `Return-Path: <recruiting-desk@g00gle-careers.net>
Received: from mail-relay.cheapcloudhost.xyz (HELO g00gle-careers.net) [185.220.101.44]
From: "Sarah Jenkins - Global Talent Acquisition" <sarah.jenkins@g00gle-careers.net>
To: candidate@personalmail.com
Subject: OFFICIAL JOB OFFER: Remote Senior Cloud Solutions Engineer - Google LLC

Dear Candidate,

Congratulations! Following review of your profile by the executive hiring board, Google LLC is pleased to offer you the position of Remote Senior Cloud Solutions Engineer with an annual starting compensation of $245,000 USD plus equity grants.

To prepare your home workstation prior to Day 1, our finance department will courier an authorized cashier's check in the amount of $4,850.00 to your home address. You must deposit this check immediately at your local ATM and wire $4,200 to our certified vendor (FastTrack Workstation Supply LLC) via Zelle or Western Union at https://vendor-terminal-pay.ru/checkout?ref=ggl889.

To issue your onboarding badge and direct deposit setup, please reply within 24 hours with:
- Full Legal Name
- SSN: 042-88-9912 (sample placeholder)
- High-resolution scan of your Passport / Driver's License
- Direct bank account & routing number

Best Regards,
Sarah Jenkins
Head of Executive Cloud Talent, Google LLC
Official Portal: http://g00gle-careers.net/onboarding/portal-auth
Phone: +1 (800) 555-0199 ext 404`,
  },
  {
    id: 'ghost-job-listing',
    title: 'Senior Full-Stack Engineer (Evergreen Pipeline)',
    company: 'Apex Innovations Global Ltd.',
    location: 'Remote (US & Canada)',
    salary: '$165,000 - $190,000 / yr',
    postedTime: 'Reposted 2d ago • 485d Stale',
    category: 'Ghost Job',
    subtitle: '16+ months stale listing, generic copy, phantom req ID',
    threatSummary: 'Ghost Job: Auto-renewed 16 times over 485 days without recruiter activity or funded headcount.',
    tags: ['Ghost Job', 'Evergreen Pool', 'Auto-Renewed 16x', 'No Active Recruiter'],
    officialDomain: 'apexinnovations-global.com',
    companyUrl: '/demo/apex-innovations',
    jobUrl: '/demo/apex-innovations/job',
    initialGhostScore: 88,
    initialTrustLevel: 'Suspicious',
    content: `Job Title: Senior Full-Stack Engineer (Continuous Evergreen Pipeline)
Company: Apex Innovations Global Ltd.
Location: Remote (US & Canada)
Posted: 2 days ago (Originally posted: 485 days ago, Re-indexed 16 times)
Requisition ID: REQ-EVERGREEN-PIPELINE-001

About Apex Innovations:
Apex Innovations is a dynamic fast-paced tech accelerator revolutionizing digital transformation across cross-functional enterprise ecosystems.

Role Overview:
We are continuously seeking world-class talent to build innovative digital experiences. Applications submitted here are pooled into our general resume reservoir for future team openings when hiring headcount permits.

Key Responsibilities:
- Build modern web applications with cutting-edge technologies.
- Participate in agile sprints and deliver impactful features.
- Collaborate with distributed global stakeholders.

Requirements:
- 5+ years of experience with React, TypeScript, Python, or Go.
- Passion for solving complex problems.

Note: Due to high volume, candidates will not receive confirmation emails or hiring manager updates. No active recruiter is assigned to this requisition.
Careers portal link: https://careers.apexinnovations-global.com/jobs/pipeline-pool?source=auto-indexer`,
  },
  {
    id: 'telegram-identity-harvesting',
    title: 'Remote Data Analyst (Contract to Perm)',
    company: 'Microsoft Corporation (Spoofed: Gmail & Telegram)',
    location: 'Remote (Anywhere)',
    salary: '$65.00 / hr ($135,000/yr)',
    postedTime: 'Outreach • 3h ago',
    category: 'Identity Theft',
    subtitle: 'Microsoft impersonation conducting text-only chat interview',
    threatSummary: 'Identity Theft: Free Gmail address impersonating Microsoft HR, demanding Telegram chat and passport photos.',
    tags: ['Unverified Recruiter', 'Telegram Interview', 'Identity Harvesting', 'High Risk'],
    officialDomain: 'careers.microsoft.com',
    companyUrl: 'https://careers.microsoft.com',
    initialGhostScore: 95,
    initialTrustLevel: 'Danger',
    content: `Subject: Remote Data Analyst Opportunity - Microsoft Corporation
From: "David Chen - Microsoft Talent Sourcing" <david.chen.careers.outlook@gmail.com>

Hello,

Your resume has been reviewed and shortlisted for our remote Data Analyst role at Microsoft. Starting rate: $65/hr.

Because our HR headquarters is currently under system migration, all formal screening interviews are being conducted via Telegram Messenger with our Chief Talent Officer, Mr. Alexander Reed.

Instructions to join interview immediately:
1. Download Telegram app on your mobile phone or PC.
2. Search for HR handler handle: @Microsoft_Talent_Alexander or click: https://t.me/microsoft_talent_verify_team
3. Send message with code: #MSFT-HIRE-2026

Before commencing the text questionnaire, send a clear photo of your National Identity Card / US Passport front & back, along with your current residential address and date of birth to the Telegram chat for instant employee file creation.

Thank you,
Microsoft Recruiting Division
One Microsoft Way, Redmond, WA`,
  },
  {
    id: 'legitimate-enterprise-offer',
    title: 'Software Engineer III - Core Infrastructure',
    company: 'Google LLC (Verified Official)',
    location: 'Sunnyvale, CA (Hybrid / Remote)',
    salary: '$188,000 - $225,000 Base + Equity + Bonus',
    postedTime: 'Active Official Offer • 5h ago',
    category: 'Legitimate',
    subtitle: 'From authentic corporate domain with official authenticated portal',
    threatSummary: 'Authentic enterprise offer with cryptographically verified DKIM/SPF from official Google People Operations.',
    tags: ['DKIM Verified', 'Official Portal', 'No Advance Fees', 'Low Risk'],
    officialDomain: 'careers.google.com',
    companyUrl: 'https://careers.google.com',
    initialGhostScore: 5,
    initialTrustLevel: 'Safe',
    content: `Return-Path: <offers@careers.google.com>
Received: from mail-sor-f65.google.com (HELO mail-sor-f65.google.com) [209.85.220.65]
Authentication-Results: mx.google.com; dkim=pass header.i=@google.com; spf=pass (google.com: domain of offers@careers.google.com designates 209.85.220.65)
From: "Google Staffing" <staffing-team@google.com>
To: candidate@gmail.com
Subject: Your Google Offer Letter - Software Engineer III

Dear Candidate,

On behalf of Google LLC, we are delighted to extend an offer for the position of Software Engineer III within Core Infrastructure at our Sunnyvale, California campus.

Your formal offer letter, detailed compensation summary (Base Salary, Equity Units, and Annual Performance Bonus), and health benefits overview have been securely prepared.

To review and electronically execute your offer documents:
1. Log into your authenticated candidate dashboard at: https://careers.google.com/dashboard/offers/
2. Use the single-sign-on credentials established during your interview loop.

Please note: Google will NEVER ask you to purchase equipment with personal funds, deposit advance cashier checks, or conduct communications through informal messaging applications like WhatsApp or Telegram. Corporate equipment will be provisioned directly by Google TechStop IT Logistics.

If you have any questions or need to connect with your designated People Partner, please contact us at staffing-team@google.com or visit https://careers.google.com/how-we-hire/.

Congratulations again,
Google People Operations
1600 Amphitheatre Parkway, Mountain View, CA 94043`,
  },
  {
    id: 'fresh-grad-small-co-scam',
    title: 'Junior Web Developer (Direct Email - Small Agency)',
    company: 'Vanguard Pixel Studio (Spoofed: vanguardpixel.talent@gmail.com)',
    location: 'Remote (Entry Level / Fresh Graduate)',
    salary: '$42.00 / hr ($87,360 / yr)',
    postedTime: 'Direct Email Outreach • Fresh Grad Vector',
    category: 'Scam',
    subtitle: 'No public job board • Free Gmail sender asking for $220 software fee',
    threatSummary: 'Direct email scam exploiting fresh graduates: Uses free Gmail pretending to be a design studio without public job postings, conducts text-only interview, and requires a $220 "IDE developer license fee".',
    tags: ['Fresh Graduate Vector', 'No Public Job Board', 'Free Webmail', 'Training/License Fee Scam'],
    officialDomain: 'vanguardpixel-studio.xyz',
    companyUrl: '/demo/vanguard-pixel',
    jobUrl: '/demo/vanguard-pixel/job',
    initialGhostScore: 95,
    initialTrustLevel: 'Danger',
    content: `Candidate Profile: Fresh Graduate looking for entry-level engineering roles
Scenario: Small company direct email outreach (No public job board / ATS posting)
Company Claimed: Vanguard Pixel Studio (Website: http://vanguardpixel-studio.xyz)
Sender / Recruiter Email: vanguardpixel.talent@gmail.com
Subject: Invitation for Junior Web Developer - Direct Portfolio Review

Hello Candidate,

We came across your GitHub and student design portfolio. Vanguard Pixel Studio is a boutique creative studio with 15 designers and developers. We do not advertise public job listings on LinkedIn to avoid spam, but we are looking for 1 fresh graduate Junior Web Developer to join our team immediately.

Role Details:
- Compensation: $42.00/hour ($87,360/year)
- Fully Remote
- No prior commercial experience required; we provide comprehensive on-the-job training.

Next Steps:
1. Due to our tight project deadlines, there will be no video interview. We have accepted your portfolio as stage 1.
2. Complete our text questionnaire or join our hiring coordinator on Telegram: @Vanguard_Talent_Coordinator
3. Before your Day 1 onboarding on Monday, our enterprise clients require all developers to install our encrypted corporate IDE suite. You will need to purchase the license token for $220.00 via Zelle or Apple Pay to our software licensing liaison (fully refunded on your first bi-weekly paycheck).

Please reply to vanguardpixel.talent@gmail.com with your full legal name, phone number, and mailing address to proceed.

Best regards,
Marcus Vance
Creative Director & Founder
Vanguard Pixel Studio
Website: http://vanguardpixel-studio.xyz`,
  },
  {
    id: 'fresh-grad-small-co-verified',
    title: 'Junior Frontend Engineer (Direct Portfolio Contact)',
    company: 'Beamline Labs (Authentic 12-Person Engineering Studio)',
    location: 'Austin, TX (Remote-Friendly)',
    salary: '$75,000 – $85,000 / yr + Full Health & 401(k)',
    postedTime: 'Direct Email Reply • Verified Boutique Studio',
    category: 'Legitimate',
    subtitle: 'Direct contact from verified founder domain (david@beamlinelabs.com)',
    threatSummary: 'Authentic small company hiring directly: Sent from verified corporate domain matching live company website, invites to 30-min Google Meet video call, confirms hardware provisioned directly.',
    tags: ['Fresh Graduate Friendly', 'Verified Domain', 'Video Call First', 'No Upfront Fees'],
    officialDomain: 'beamlinelabs.com',
    companyUrl: '/demo/beamline-labs',
    jobUrl: '/demo/beamline-labs/job',
    initialGhostScore: 8,
    initialTrustLevel: 'Safe',
    content: `Candidate Profile: Fresh Graduate cold-inquiry / portfolio submission
Scenario: Small engineering studio direct email reply (No ATS / no public job board)
Company: Beamline Labs (Official Website: https://beamlinelabs.com)
Sender: David Martinez, Co-Founder & CTO <david@beamlinelabs.com>
Subject: Re: Junior Engineer inquiry - Beamline Labs

Hi [Candidate],

Thanks for reaching out directly to our contact email (hello@beamlinelabs.com) and sharing your resume and React/TypeScript project on GitHub.

We're a 12-person engineering studio building custom web platforms for climate tech companies. We don't maintain a formal job board or ATS because we only hire 2-3 engineers per year when project capacity expands, but your open-source projects caught our attention.

We'd love to chat more about a Junior Frontend Engineer role:
- Role: Junior Frontend Engineer (TypeScript, React, Tailwind, Next.js)
- Base Salary: $75,000 – $85,000 / yr, full health/dental, 401(k) with match
- Work model: Remote (US) or hybrid in Austin, TX

Our Process:
1. A casual 30-minute introductory video call via Google Meet to meet each other, discuss your projects, and answer your questions about Beamline.
2. A short, collaborative 1-hour pairing session with one of our senior engineers (paid at $50/hr for your time).
3. Final chat with our other co-founder, Sarah.

Important note on equipment: If we decide to work together, Beamline provisions a company-managed MacBook Pro directly to your address and covers all software subscriptions. We will never ask you to pay any fees, buy software, or cash checks.

Feel free to pick a time that works for our intro video call on my calendar: https://meet.google.com/call/beamline-intro or reply with your availability.

Cheers,
David Martinez
Co-Founder & CTO, Beamline Labs
https://beamlinelabs.com • Austin, TX`,
  },
];
