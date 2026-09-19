(() => {
  if (window.__offerproofInjected) {
    return;
  }
  window.__offerproofInjected = true;

  const TITLE_SUFFIXES = [
    /\s*[|\u2013\u2014\-]\s*Careers\b.*$/i,
    /\s*[|\u2013\u2014\-]\s*Jobs\b.*$/i,
    /\s*[|\u2013\u2014\-]\s*LinkedIn\b.*$/i,
  ];

  const JOB_BOARDS = [
    "ashbyhq.com",
    "glassdoor.com",
    "greenhouse.io",
    "icims.com",
    "indeed.com",
    "jobvite.com",
    "lever.co",
    "linkedin.com",
    "myworkdayjobs.com",
    "smartrecruiters.com",
  ];

  const COMPANY_SELECTORS = [
    ".job-card-container__company-name",
    ".job-card-container__primary-description",
    ".artdeco-entity-lockup__subtitle",
    ".job-details-jobs-unified-top-card__company-name",
    "[data-testid='company-name']",
    "[data-company-name]",
    ".company-name",
    ".posting-headline .company",
    ".jobsearch-JobInfoHeader-companyName",
  ];

  const MULTI_SUFFIXES = new Set([
    "ac.uk",
    "co.uk",
    "com.au",
    "com.br",
    "co.jp",
    "co.nz",
    "co.za",
    "org.uk",
  ]);

  function textOf(value) {
    return (value || "").replace(/\s+/g, " ").trim();
  }

  function fromOgSiteName() {
    const meta = document.querySelector('meta[property="og:site_name"]');
    return textOf(meta && meta.getAttribute("content"));
  }

  function fromTitle() {
    let title = textOf(document.title);
    for (const suffix of TITLE_SUFFIXES) {
      title = title.replace(suffix, "").trim();
    }
    return title;
  }

  function fromH1() {
    const heading = document.querySelector("h1");
    return textOf(heading && heading.textContent);
  }

  function guessCompanyName() {
    return fromOgSiteName() || fromTitle() || fromH1() || "";
  }

  function pageSnippet() {
    return textOf(document.body && document.body.innerText).slice(0, 2500);
  }

  function pageGuess() {
    return {
      company_name: guessCompanyName(),
      domain: inferDomain(),
      snippet: pageSnippet(),
    };
  }

  function registrableDomain(rawUrl) {
    let hostname;
    try {
      hostname = new URL(rawUrl, location.href).hostname.toLowerCase();
    } catch {
      return "";
    }
    if (hostname.startsWith("www.")) {
      hostname = hostname.slice(4);
    }
    const parts = hostname.split(".").filter(Boolean);
    if (parts.length <= 2) {
      return hostname;
    }
    const lastTwo = parts.slice(-2).join(".");
    if (MULTI_SUFFIXES.has(lastTwo)) {
      return parts.slice(-3).join(".");
    }
    return lastTwo;
  }

  function isJobBoard(host) {
    return JOB_BOARDS.some((board) => host === board || host.endsWith(`.${board}`));
  }

  function isJobPage() {
    const host = location.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1") {
      return false;
    }
    if (isJobBoard(host)) {
      return true;
    }
    if (/\/(jobs?|careers?|job-openings|vacancies|positions)\b/i.test(location.pathname)) {
      return true;
    }
    return Boolean(document.querySelector(COMPANY_SELECTORS.join(",")));
  }

  function inferDomain() {
    const host = location.hostname.toLowerCase();
    if (!isJobBoard(host)) {
      return registrableDomain(location.href);
    }
    const links = Array.from(document.querySelectorAll('a[href^="http"]'));
    for (const link of links) {
      const label = `${link.textContent || ""} ${link.getAttribute("aria-label") || ""}`.toLowerCase();
      if (!/website|official|career site|apply on company|company site/.test(label)) {
        continue;
      }
      const domain = registrableDomain(link.href);
      if (domain && !isJobBoard(domain)) {
        return domain;
      }
    }
    return "";
  }

  function dashboardUrl(company, domain) {
    const params = new URLSearchParams();
    if (company) {
      params.set("company", company);
    }
    if (domain) {
      params.set("domain", domain);
    }
    return `http://localhost:8000/report?${params.toString()}`;
  }

  function openDashboard(company, domain, event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    window.open(dashboardUrl(company, domain), "_blank", "noopener");
  }

  function ensureStyles() {
    if (document.getElementById("offerproof-badge-style")) {
      return;
    }
    const style = document.createElement("style");
    style.id = "offerproof-badge-style";
    style.textContent = `
      .offerproof-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        margin-left: 8px;
        padding: 1px 7px;
        border: 1px solid #bfdbfe;
        border-radius: 999px;
        background: #eff6ff;
        color: #1d4ed8;
        font: 600 11px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
        cursor: pointer;
        vertical-align: middle;
        text-decoration: none;
        white-space: nowrap;
      }
      .offerproof-badge:hover { background: #dbeafe; }
      .offerproof-page-badge {
        position: fixed;
        right: 16px;
        bottom: 16px;
        z-index: 2147483646;
        margin-left: 0;
        padding: 8px 12px;
        box-shadow: 0 8px 24px rgba(18, 32, 51, 0.16);
      }
    `;
    document.documentElement.appendChild(style);
  }

  function makeBadge(company, domain, extraClass) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `offerproof-badge ${extraClass || ""}`.trim();
    button.textContent = "OfferProof";
    button.title = "Open OfferProof dashboard";
    button.addEventListener("click", (event) => openDashboard(company, domain, event));
    return button;
  }

  function injectCardBadges(fallbackCompany, domain) {
    const nodes = document.querySelectorAll(COMPANY_SELECTORS.join(","));
    nodes.forEach((node) => {
      if (node.dataset.offerproofBadged === "1") {
        return;
      }
      const company = textOf(node.textContent) || fallbackCompany;
      if (!company) {
        return;
      }
      node.dataset.offerproofBadged = "1";
      node.appendChild(makeBadge(company, domain));
    });
  }

  function injectPageBadge(company, domain) {
    if (document.getElementById("offerproof-page-badge") || !company) {
      return;
    }
    const badge = makeBadge(company, domain, "offerproof-page-badge");
    badge.id = "offerproof-page-badge";
    document.body.appendChild(badge);
    paintBadgeScore(badge, company, domain);
  }

  async function paintBadgeScore(badge, company, domain) {
    try {
      const response = await fetch("http://localhost:8000/api/extension/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: company,
          domain,
          page_text: pageSnippet(),
        }),
      });
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      badge.textContent = `OfferProof ${data.ghost_score}`;
      badge.title = `${data.trust_level} · open dashboard`;
    } catch {
      // leave the default badge
    }
  }

  async function backendUp() {
    try {
      const response = await fetch("http://localhost:8000/health", { cache: "no-store" });
      if (!response.ok) {
        return false;
      }
      const body = await response.json();
      return Boolean(body && body.ok);
    } catch {
      return false;
    }
  }

  async function decorate() {
    if (!isJobPage() || !(await backendUp())) {
      return;
    }
    ensureStyles();
    const company = guessCompanyName();
    const domain = inferDomain();
    injectCardBadges(company, domain);
    injectPageBadge(company, domain);
  }

  window.__offerproofGuessCompany = guessCompanyName;
  window.__offerproofPageGuess = pageGuess;

  if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message && message.type === "OFFERPROOF_GUESS") {
        sendResponse(pageGuess());
      }
    });
  }

  decorate();
  const observer = new MutationObserver(() => {
    window.clearTimeout(window.__offerproofDecorateTimer);
    window.__offerproofDecorateTimer = window.setTimeout(decorate, 400);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
