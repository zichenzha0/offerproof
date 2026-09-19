const SCORE_URL = "http://localhost:8000/api/extension/score";
const DASHBOARD_URL = "http://localhost:8000/report";

const SOURCE_LABELS = {
  sec_edgar: "SEC EDGAR",
  wayback: "Web archive",
  ny_registry: "NY State Registry",
  rdap: "Domain registration",
  dns_mx: "Business email",
  dmarc: "DMARC",
  cert_history: "TLS certificate history",
};

const TIER_LABELS = {
  public: "Public company",
  established: "Established company",
  small_business: "Small business",
  unknown: "Unknown footprint",
};

const MULTI_SUFFIXES = new Set([
  "ac.uk",
  "co.id",
  "co.in",
  "co.jp",
  "co.kr",
  "co.nz",
  "co.uk",
  "co.za",
  "com.ar",
  "com.au",
  "com.br",
  "com.cn",
  "com.hk",
  "com.mx",
  "com.sg",
  "com.tr",
  "com.tw",
  "gov.uk",
  "net.au",
  "org.au",
  "org.uk",
]);

function $(id) {
  return document.getElementById(id);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function registrableDomain(rawUrl) {
  let hostname;
  try {
    hostname = new URL(rawUrl).hostname.toLowerCase();
  } catch {
    return "";
  }
  if (hostname.endsWith(".")) {
    hostname = hostname.slice(0, -1);
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

function prettyFromDomain(domain) {
  const label = (domain.split(".")[0] || "").replace(/[-_]+/g, " ");
  return label.replace(/\b\w/g, (char) => char.toUpperCase());
}

function isRestrictedUrl(url) {
  return /^(chrome|edge|about|chrome-extension|moz-extension):/i.test(url) ||
    url.startsWith("https://chrome.google.com/webstore") ||
    url.startsWith("https://chromewebstore.google.com");
}

function looksLikeDomain(value) {
  return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(value.trim());
}

function parseQuery(raw) {
  const value = (raw || "").trim();
  if (!value) {
    return { company: "", domain: "" };
  }
  if (looksLikeDomain(value)) {
    return { company: prettyFromDomain(value), domain: registrableDomain(`https://${value}`) };
  }
  return { company: value, domain: "" };
}

function scoreTone(ghostScore, verdict) {
  if (verdict === "likely_fake" || ghostScore >= 70) {
    return "bad";
  }
  if (verdict === "unverified" || ghostScore >= 35) {
    return "warn";
  }
  return "real";
}

function statusIcon(status) {
  if (status === "hit") {
    return "✓";
  }
  if (status === "miss") {
    return "✗";
  }
  return "—";
}

function setContext(companyName, domain) {
  $("context").innerHTML = `<strong>${escapeHtml(companyName || "This page")}</strong>${escapeHtml(domain || "")}`;
}

function dashboardUrl(companyName, domain) {
  const params = new URLSearchParams();
  if (companyName) {
    params.set("company", companyName);
  }
  if (domain) {
    params.set("domain", domain);
  }
  return `${DASHBOARD_URL}?${params.toString()}`;
}

function openDashboard(companyName, domain) {
  const url = dashboardUrl(companyName, domain);
  if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.create) {
    chrome.tabs.create({ url });
    return;
  }
  window.open(url, "_blank", "noopener");
}

function renderLoading(companyName, domain) {
  setContext(companyName, domain);
  $("root").innerHTML = `
    <section class="card state" aria-live="polite">
      <div>
        <div class="spinner" aria-hidden="true"></div>
        <h1>Scoring ${escapeHtml(companyName || "this company")}</h1>
        <p>Fast public-record check, then open the dashboard for the full audit.</p>
      </div>
    </section>
  `;
}

function renderError(message) {
  $("root").innerHTML = `
    <section class="card state" aria-live="polite">
      <div>
        <h1>Backend unreachable</h1>
        <p>${escapeHtml(message)}</p>
      </div>
    </section>
  `;
}

function renderResult(companyName, domain, result) {
  const name = result.company_name || companyName;
  const host = result.domain || domain;
  setContext(name, host);
  $("company-input").value = name || host;
  const ghost = Number(result.ghost_score) || 0;
  const tone = scoreTone(ghost, result.verdict);
  const rows = (result.signals || [])
    .slice(0, 4)
    .map((signal) => {
      const status = signal.status || "error";
      return `
        <article class="row ${escapeHtml(status)}">
          <div class="icon" aria-hidden="true">${statusIcon(status)}</div>
          <div>
            <h2>${escapeHtml(SOURCE_LABELS[signal.source] || signal.source)}</h2>
            <p>${escapeHtml(signal.detail || "")}</p>
          </div>
        </article>
      `;
    })
    .join("");

  $("root").innerHTML = `
    <section class="card" id="open-score">
      <div class="score-row">
        <div class="dial ${tone}"><strong>${ghost}</strong></div>
        <div class="score-copy">
          <h2>${escapeHtml(result.trust_level || "Caution")}</h2>
          <p>Ghost / risk score · ${escapeHtml(TIER_LABELS[result.tier] || result.tier || "")}</p>
        </div>
      </div>
    </section>
    <section class="evidence">${rows}</section>
    <button type="button" class="report-btn" id="full-report">Open dashboard</button>
  `;
  const open = () => openDashboard(name, host);
  $("full-report").addEventListener("click", open);
  $("open-score").addEventListener("click", open);
  $("open-score").style.cursor = "pointer";
}

async function scoreCompany(companyName, domain, pageText) {
  const response = await fetch(SCORE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      company_name: companyName,
      domain,
      page_text: pageText || "",
    }),
  });
  if (!response.ok) {
    throw new Error(`Backend returned HTTP ${response.status}`);
  }
  return response.json();
}

async function guessFromTab(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["content.js"],
  });
  try {
    return await chrome.tabs.sendMessage(tabId, { type: "OFFERPROOF_GUESS" });
  } catch {
    const [injection] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => ({
        company_name: window.__offerproofGuessCompany ? window.__offerproofGuessCompany() : "",
        domain: "",
        snippet: (document.body && document.body.innerText ? document.body.innerText : "").slice(0, 2500),
      }),
    });
    return (injection && injection.result) || {};
  }
}

async function runFromTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url) {
    throw new Error("No active tab found.");
  }
  if (isRestrictedUrl(tab.url)) {
    renderLoading("Search a company", "");
    $("root").innerHTML = `
      <section class="card state">
        <div>
          <h1>Type a company above</h1>
          <p>This tab can't be read. Search Apple, Kalshi, or a domain, then open the dashboard.</p>
        </div>
      </section>
    `;
    return;
  }

  const fallbackDomain = registrableDomain(tab.url);
  renderLoading(tab.title || fallbackDomain, fallbackDomain);
  const guessed = await guessFromTab(tab.id);
  const companyName = (guessed && guessed.company_name) || prettyFromDomain(fallbackDomain);
  const domain = (guessed && guessed.domain) || fallbackDomain;
  $("company-input").value = companyName;
  const result = await scoreCompany(companyName, domain, guessed && guessed.snippet);
  renderResult(companyName, domain, result);
}

async function runSearch(raw) {
  const parsed = parseQuery(raw);
  if (!parsed.company && !parsed.domain) {
    await runFromTab();
    return;
  }
  renderLoading(parsed.company, parsed.domain);
  const result = await scoreCompany(parsed.company, parsed.domain, "");
  renderResult(parsed.company, parsed.domain, result);
}

async function main() {
  $("search-form").addEventListener("submit", (event) => {
    event.preventDefault();
    runSearch($("company-input").value).catch((error) => {
      renderError(
        error && error.message && /Failed to fetch|NetworkError|Load failed/i.test(error.message)
          ? "Start the API on localhost:8000 and try again."
          : (error && error.message) || "Something went wrong."
      );
    });
  });

  const inExtension = typeof chrome !== "undefined" && chrome.tabs && chrome.scripting;
  try {
    if (!inExtension) {
      renderLoading("Apple Inc.", "apple.com");
      const result = await scoreCompany("Apple Inc.", "apple.com", "");
      renderResult("Apple Inc.", "apple.com", result);
      return;
    }
    await runFromTab();
  } catch (error) {
    const message =
      error && error.message && /Failed to fetch|NetworkError|Load failed/i.test(error.message)
        ? "Start the API on localhost:8000 and try again."
        : (error && error.message) || "Something went wrong.";
    renderError(message);
  }
}

main();
