export type VerificationStatus = 'VERIFIED' | 'UNVERIFIED' | 'FLAGGED' | 'NOT_APPLICABLE';

export interface InternIntelVector {
  key: string;
  label: string;
  score: number; // 0-100, higher = worse for the candidate
  level: string; // 'Low risk' | 'Moderate' | 'Elevated' | 'High risk'
  evidence: string;
  weight: number;
}

export interface InternIntelReview {
  quote: string;
  role: string;
  sentiment: 'positive' | 'mixed' | 'negative' | string;
  comp: string;
  hours_per_week: number | null;
  work_type: string;
  return_offer: boolean | string | null;
  culture_flags: string[];
  date: string;
  source_url: string;
}

export interface InternIntelStats {
  review_count: number;
  avg_hours_per_week: number | null;
  unpaid_share: number | null;
  intern_to_ft_ratio: string | null;
  return_offer_rate: number | null;
}

export interface InternIntel {
  matched: boolean;
  source: string;
  company?: string;
  sector?: string;
  message?: string;
  role_risk_score?: number;
  risk_level?: string;
  vectors?: InternIntelVector[];
  stats?: InternIntelStats;
  reviews: InternIntelReview[];
  sources: string[];
  verdict?: string;
}

export interface VerificationItem {
  status: VerificationStatus;
  details: string;
}

export interface ScreenshotFiveBlockItem {
  category: 'Firm Substance' | 'People Credibility' | 'Role Substance' | 'Past Intern Outcomes' | 'Risk Signals' | string;
  question: string; // The guiding question from screenshot
  result: string; // 'Strong' | 'Mixed' | 'Limited evidence' | 'Weak' | 'High' | 'Low–Medium' | 'Low' | 'Medium' | 'High concern' | 'Company-Only'
  evidence: string;
}

export interface ScreenshotFiveBlocks {
  firm_substance: {
    result: string; // 'Strong' | 'Mixed' | 'Limited evidence'
    evidence: string;
    details?: string;
  };
  people_credibility: {
    result: string; // 'Strong' | 'Mixed' | 'Weak'
    evidence: string;
    details?: string;
  };
  role_substance: {
    result: string; // 'High' | 'Medium' | 'Low–Medium' | 'Low' | 'Company-Only (No Job Specified)'
    evidence: string;
    details?: string;
  };
  past_intern_outcomes: {
    result: string; // 'Strong' | 'Mixed' | 'Limited/Unclear' | 'None found'
    evidence: string;
    details?: string;
  };
  risk_signals: {
    result: string; // 'Low concern' | 'Medium' | 'Medium concern' | 'High concern'
    evidence: string;
    details?: string;
  };
}

export interface RecruitmentAuditResult {
  ghost_score: number;
  trust_level: 'Safe' | 'Low Risk' | 'Caution' | 'Suspicious' | 'Danger' | string;
  is_company_only?: boolean;
  intern_intel?: InternIntel;
  target_company_url?: string;
  target_job_url?: string;
  five_blocks?: ScreenshotFiveBlocks;
  verifications: {
    company_verification: VerificationItem;
    recruiter_verification: VerificationItem;
    domain_detection: VerificationItem;
    job_verification: VerificationItem;
    offer_verification: VerificationItem;
  };
  privacy_and_safety: {
    sensitive_data_hidden: string[];
    malicious_links_blocked: string[];
  };
  action_and_reporting: {
    official_hr_contact: string;
  };
}

export interface PresetSample {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  postedTime: string;
  category: 'Scam' | 'Ghost Job' | 'Identity Theft' | 'Legitimate';
  subtitle: string;
  threatSummary: string;
  tags: string[];
  content: string;
  companyUrl?: string;
  jobUrl?: string;
  isCompanyOnly?: boolean;
  officialDomain?: string;
  initialGhostScore?: number;
  initialTrustLevel?: string;
  initialFiveBlocks?: ScreenshotFiveBlocks;
}

