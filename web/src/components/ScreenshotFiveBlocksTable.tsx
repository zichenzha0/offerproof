import React from 'react';
import { ScreenshotFiveBlocks } from '../types';
import { ExternalLink } from 'lucide-react';

interface ScreenshotFiveBlocksTableProps {
  fiveBlocks?: ScreenshotFiveBlocks;
  companyName: string;
  roleTitle: string;
  companyUrl?: string;
  jobUrl?: string;
  isCompanyOnly?: boolean;
}

const ROWS: Array<{
  key: keyof ScreenshotFiveBlocks;
  title: string;
  hint: string;
}> = [
  {
    key: 'firm_substance',
    title: 'Firm substance',
    hint: 'Does this company actually do the work it claims?',
  },
  {
    key: 'people_credibility',
    title: 'People',
    hint: 'Can the founders and core team be verified?',
  },
  {
    key: 'role_substance',
    title: 'Role',
    hint: 'Does the job description match real work?',
  },
  {
    key: 'past_intern_outcomes',
    title: 'Past outcomes',
    hint: 'What happened to people who took similar roles?',
  },
  {
    key: 'risk_signals',
    title: 'Risk signals',
    hint: 'Fees, fake checks, or other extraction patterns.',
  },
];

export const ScreenshotFiveBlocksTable: React.FC<ScreenshotFiveBlocksTableProps> = ({
  fiveBlocks,
  companyName,
  roleTitle,
  companyUrl,
  jobUrl,
  isCompanyOnly,
}) => {
  const blocks: ScreenshotFiveBlocks = fiveBlocks || {
    firm_substance: { result: 'Mixed', evidence: 'Limited public footprint so far.' },
    people_credibility: { result: 'Mixed', evidence: 'Team profiles still need independent checks.' },
    role_substance: {
      result: isCompanyOnly ? 'Company-Only (No Job Specified)' : 'Medium',
      evidence: isCompanyOnly
        ? 'No job posting was provided. Company legitimacy only.'
        : 'Role details are incomplete.',
    },
    past_intern_outcomes: { result: 'Limited/Unclear', evidence: 'Few public alumni records.' },
    risk_signals: { result: 'Low concern', evidence: 'No advance-fee or identity-harvest flags observed.' },
  };

  return (
    <section className="card overflow-hidden">
      <div className="px-6 sm:px-8 pt-6 sm:pt-8 pb-5">
        <h2 className="section-title text-[var(--color-ink)]">{companyName}</h2>
        <p className="body-text text-[var(--color-muted)] mt-2">
          {isCompanyOnly ? 'Company check' : roleTitle}
        </p>
        {(companyUrl || jobUrl) && (
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            {companyUrl && (
              <a
                href={companyUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="label-text inline-flex items-center gap-1.5 text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
              >
                Website
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            {jobUrl && (
              <a
                href={jobUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="label-text inline-flex items-center gap-1.5 text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
              >
                Job post
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}
      </div>

      <div className="divide-y divide-[var(--color-line)] border-t border-[var(--color-line)]">
        {ROWS.map((row) => {
          const item = blocks[row.key];
          return (
            <div key={row.key} className="px-6 sm:px-8 py-5 grid grid-cols-1 sm:grid-cols-[180px_120px_1fr] gap-2 sm:gap-6">
              <div>
                <div className="text-[16px] font-semibold text-[var(--color-ink)]">{row.title}</div>
                <div className="label-text text-[var(--color-muted)] mt-1">{row.hint}</div>
              </div>
              <div className="label-text text-[var(--color-ink)] pt-0.5">{item.result}</div>
              <p className="body-text text-[var(--color-muted)] m-0">{item.evidence}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
