import React, { useState } from 'react';
import { Copy, Check, Terminal, Code2 } from 'lucide-react';
import { RecruitmentAuditResult } from '../types';

interface ApiInspectorProps {
  rawJson: string;
  auditResult: RecruitmentAuditResult | null;
}

export const ApiInspector: React.FC<ApiInspectorProps> = ({ rawJson }) => {
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [activeTab, setActiveTab] = useState<'raw' | 'curl' | 'node'>('raw');

  const copyToClipboard = (text: string, type: 'raw' | 'curl') => {
    navigator.clipboard.writeText(text);
    if (type === 'raw') {
      setCopiedRaw(true);
      setTimeout(() => setCopiedRaw(false), 2000);
    } else {
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    }
  };

  const curlCommand = `curl -X POST "${window.location.origin}/api/audit" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "Return-Path: <recruiting-desk@g00gle-careers.net>\\\\nSubject: Remote Offer with $4850 equipment cashier check..."
  }'`;

  const nodeCode = `// Node.js / Express Middleware Integration
import fetch from 'node-fetch';

async function auditRecruitmentPayload(rawText) {
  const response = await fetch('${window.location.origin}/api/audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: rawText })
  });

  // Returns raw valid JSON matching Zero-Trust schema
  const audit = await response.json();
  if (audit.trust_level === 'Danger' || audit.ghost_score > 70) {
    console.warn('Quarantine Triggered: Fraud/Ghost vectors detected', audit);
  }
  return audit;
}`;

  return (
    <div id="api-inspector-container" className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
      {/* Header Tabs */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2">
          <button
            id="tab-raw-json"
            type="button"
            onClick={() => setActiveTab('raw')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg transition-colors ${
              activeTab === 'raw'
                ? 'bg-white text-slate-900 border border-slate-200 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-blue-600" />
            Raw JSON Output
          </button>
          <button
            id="tab-curl-command"
            type="button"
            onClick={() => setActiveTab('curl')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg transition-colors ${
              activeTab === 'curl'
                ? 'bg-white text-slate-900 border border-slate-200 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-slate-600" />
            cURL Request
          </button>
          <button
            id="tab-node-snippet"
            type="button"
            onClick={() => setActiveTab('node')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg transition-colors ${
              activeTab === 'node'
                ? 'bg-white text-slate-900 border border-slate-200 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-slate-600" />
            Middleware Node SDK
          </button>
        </div>

        <div>
          {activeTab === 'raw' ? (
            <button
              id="btn-copy-raw-json"
              type="button"
              onClick={() => copyToClipboard(rawJson, 'raw')}
              className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs transition-colors font-medium"
            >
              {copiedRaw ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              {copiedRaw ? 'Copied Raw JSON' : 'Copy Raw JSON'}
            </button>
          ) : (
            <button
              id="btn-copy-code-snippet"
              type="button"
              onClick={() => copyToClipboard(activeTab === 'curl' ? curlCommand : nodeCode, 'curl')}
              className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs transition-colors font-medium"
            >
              {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              {copiedCurl ? 'Copied' : 'Copy Code'}
            </button>
          )}
        </div>
      </div>

      {/* Code Area */}
      <div className="p-4 bg-slate-950 max-h-[520px] overflow-auto font-mono text-xs leading-relaxed text-slate-200">
        {activeTab === 'raw' && (
          <pre className="text-emerald-400 whitespace-pre-wrap selection:bg-slate-800 selection:text-emerald-200">
            {rawJson || '/* No audit response yet. Submit recruitment payload or select a preset to analyze. */'}
          </pre>
        )}

        {activeTab === 'curl' && (
          <pre className="text-sky-300 whitespace-pre-wrap selection:bg-slate-800 selection:text-sky-100">
            {curlCommand}
          </pre>
        )}

        {activeTab === 'node' && (
          <pre className="text-amber-300 whitespace-pre-wrap selection:bg-slate-800 selection:text-amber-100">
            {nodeCode}
          </pre>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50 text-[11px] font-mono text-slate-500 flex justify-between items-center">
        <span>Content-Type: application/json</span>
        <span>Standard: RFC 8259 Compliant Raw JSON</span>
      </div>
    </div>
  );
};
