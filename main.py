"""OfferProof — verify whether a company looks real."""

from __future__ import annotations

import asyncio
import html
import json
import logging
import os
import re
from datetime import datetime, timezone
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any, Literal
from urllib.parse import urlencode

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from demo_sites import render_demo
from ollama_agent import (
    generate_local_heuristic_audit,
    ollama_available,
    ollama_settings,
    run_audit,
    run_consistency,
    run_copilot,
)
from url_parser import parse_target_url

load_dotenv()

logger = logging.getLogger("offerproof")

SEC_TICKERS_URL = "https://www.sec.gov/files/company_tickers.json"
SEC_USER_AGENT = "OfferProof hackathon contact@example.com"
REQUEST_TIMEOUT = 5.0
BASELINE_SCORE = 40
SEC_MATCH_THRESHOLD = 0.85

LEGAL_SUFFIXES = {
    "incorporated",
    "corporation",
    "company",
    "limited",
    "inc",
    "corp",
    "ltd",
    "llc",
    "llp",
    "plc",
    "lp",
    "co",
    "sa",
    "ag",
    "nv",
    "bv",
    "gmbh",
    "srl",
    "pty",
}
NAME_STOPWORDS = {"the", "a", "an", "of", "and"}

BUSINESS_MX_MARKERS = ("google.com", "googlemail.com", "outlook.com", "microsoft")

# Populated on first sec_edgar() call from SEC company_tickers.json.
_SEC_TICKERS: dict[str, dict[str, Any]] = {}
_SEC_LOCK = asyncio.Lock()

Verdict = Literal["likely_real", "unverified", "likely_fake"]
Tier = Literal["public", "established", "small_business", "unknown"]
SignalStatus = Literal["hit", "miss", "error"]


class VerifyRequest(BaseModel):
    company_name: str
    domain: str = ""


class ExtensionScoreRequest(BaseModel):
    company_name: str = ""
    domain: str = ""
    page_text: str = ""
    message: str = ""


class Signal(BaseModel):
    source: str
    status: SignalStatus
    detail: str
    weight: int


class VerifyResponse(BaseModel):
    verdict: Verdict
    confidence: int = Field(ge=0, le=100)
    tier: Tier
    signals: list[Signal]


class HealthResponse(BaseModel):
    ok: bool
    ollama: bool = False
    model: str = ""
    mode: str = "heuristic"


class AuditRequest(BaseModel):
    text: str = ""
    content: str = ""
    data: str = ""
    category: str = ""
    company_url: str = ""
    companyUrl: str = ""
    job_url: str = ""
    jobUrl: str = ""
    is_company_only: bool = False
    isCompanyOnly: bool = False


class ParseUrlRequest(BaseModel):
    url: str
    mode: str = "auto"
    type: str = ""


class CopilotMessage(BaseModel):
    role: str = "user"
    sender: str = ""
    content: str = ""
    text: str = ""


class CopilotRequest(BaseModel):
    message: str
    history: list[CopilotMessage] = Field(default_factory=list)
    audit_result: dict[str, Any] | None = None
    job: dict[str, Any] | None = None
    evidence: dict[str, Any] | None = None


class AnalyzeMessageRequest(BaseModel):
    message: str
    company_name: str = ""
    domain: str = ""


class MessageFlag(BaseModel):
    code: str
    severity: Literal["low", "medium", "high"]
    title: str
    detail: str


class AnalyzeMessageResponse(BaseModel):
    risk: Literal["low", "medium", "high"]
    flags: list[MessageFlag]
    extracted_company: str = ""
    extracted_domain: str = ""


class ConsistencyRequest(BaseModel):
    company_name: str
    domain: str
    job_description: str


class ConsistencyAspect(BaseModel):
    verdict: str
    reason: str


class ConsistencyResponse(BaseModel):
    status: Literal["ok", "no_official_source", "unavailable"]
    business_match: ConsistencyAspect | None = None
    role_listed_officially: ConsistencyAspect | None = None
    compensation_plausible: ConsistencyAspect | None = None
    tone_match: ConsistencyAspect | None = None
    overall_concern: Literal["low", "medium", "high"] | None = None
    summary: str = ""
    sources_used: list[str] = Field(default_factory=list)


app = FastAPI(title="OfferProof", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def warmup_public_records() -> None:
    async def _warm() -> None:
        try:
            async with httpx.AsyncClient(
                timeout=httpx.Timeout(20.0),
                headers={"User-Agent": SEC_USER_AGENT, "Accept": "application/json"},
            ) as client:
                await load_sec_tickers(client)
            logger.info("SEC ticker cache ready")
        except Exception as exc:  # noqa: BLE001
            logger.warning("SEC warmup skipped: %s", exc)

    asyncio.create_task(_warm())


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def normalize_domain(domain: str) -> str:
    value = domain.strip().lower()
    value = re.sub(r"^https?://", "", value)
    value = value.split("/")[0]
    value = value.split(":")[0]
    if value.startswith("www."):
        value = value[4:]
    return value


def normalize_name(name: str) -> str:
    value = name.lower()
    value = re.sub(r"[^a-z0-9\s]", " ", value)
    tokens = [
        token
        for token in value.split()
        if token and token not in LEGAL_SUFFIXES and token not in NAME_STOPWORDS
    ]
    return " ".join(tokens)


def name_ratio(left: str, right: str) -> float:
    raw = SequenceMatcher(None, left.lower().strip(), right.lower().strip()).ratio()
    normalized = SequenceMatcher(None, normalize_name(left), normalize_name(right)).ratio()
    return max(raw, normalized)


def parse_datetime(value: str) -> datetime:
    text = value.strip()
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    try:
        parsed = datetime.fromisoformat(text)
        if parsed.tzinfo is None:
            return parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(timezone.utc)
    except ValueError:
        pass

    for fmt in ("%Y%m%d%H%M%S", "%Y%m%d", "%Y-%m-%d", "%Y-%m-%d %H:%M:%S"):
        try:
            return datetime.strptime(text[:14] if fmt.startswith("%Y%m%d") else text, fmt).replace(
                tzinfo=timezone.utc
            )
        except ValueError:
            continue
    raise ValueError(f"Unrecognized date: {value}")


def years_between(earlier: datetime) -> float:
    return (now_utc() - earlier).days / 365.25


def days_between(earlier: datetime) -> int:
    return (now_utc() - earlier).days


def clamp(value: int, low: int, high: int) -> int:
    return max(low, min(high, value))


def error_signal(source: str, exc: Exception) -> Signal:
    if isinstance(exc, httpx.HTTPStatusError):
        detail = f"HTTP {exc.response.status_code} for {exc.request.url}"
    elif isinstance(exc, httpx.TimeoutException):
        detail = f"Timeout after {REQUEST_TIMEOUT:.0f}s"
    else:
        detail = f"{type(exc).__name__}: {exc}"
    return Signal(source=source, status="error", detail=detail, weight=0)


async def fetch_json(
    client: httpx.AsyncClient,
    url: str,
    *,
    params: dict[str, Any] | None = None,
    headers: dict[str, str] | None = None,
) -> Any:
    response = await client.get(url, params=params, headers=headers)
    response.raise_for_status()
    return response.json()


async def load_sec_tickers(client: httpx.AsyncClient) -> dict[str, dict[str, Any]]:
    if _SEC_TICKERS:
        return _SEC_TICKERS

    async with _SEC_LOCK:
        if _SEC_TICKERS:
            return _SEC_TICKERS
        data = await fetch_json(
            client,
            SEC_TICKERS_URL,
            headers={"User-Agent": SEC_USER_AGENT, "Accept": "application/json"},
        )
        if not isinstance(data, dict):
            raise ValueError("SEC company_tickers.json was not an object")
        _SEC_TICKERS.update(data)
        return _SEC_TICKERS


async def sec_edgar(client: httpx.AsyncClient, company_name: str) -> Signal:
    tickers = await load_sec_tickers(client)
    best_ratio = 0.0
    best_title = ""
    best_ticker = ""
    best_cik: Any = ""

    for entry in tickers.values():
        if not isinstance(entry, dict):
            continue
        title = str(entry.get("title") or "")
        if not title:
            continue
        ratio = name_ratio(company_name, title)
        if ratio > best_ratio:
            best_ratio = ratio
            best_title = title
            best_ticker = str(entry.get("ticker") or "")
            best_cik = entry.get("cik_str", "")

    if best_ratio > SEC_MATCH_THRESHOLD:
        return Signal(
            source="sec_edgar",
            status="hit",
            detail=f"Matched '{best_title}' ({best_ticker}, CIK {best_cik}) ratio={best_ratio:.2f}",
            weight=50,
        )
    detail = (
        f"No SEC match above {SEC_MATCH_THRESHOLD:.2f}"
        + (f"; closest '{best_title}' ratio={best_ratio:.2f}" if best_title else "")
    )
    return Signal(source="sec_edgar", status="miss", detail=detail, weight=0)


async def wayback(client: httpx.AsyncClient, domain: str) -> Signal:
    data = await fetch_json(
        client,
        "http://archive.org/wayback/available",
        params={"url": domain, "timestamp": "2018"},
    )
    snapshots = data.get("archived_snapshots") or {}
    if not snapshots:
        return Signal(
            source="wayback",
            status="miss",
            detail="No archived snapshots found",
            weight=-20,
        )

    closest = snapshots.get("closest") or next(iter(snapshots.values()), {})
    timestamp = str(closest.get("timestamp") or "")
    if not timestamp:
        return Signal(
            source="wayback",
            status="hit",
            detail="Archived snapshot found without a timestamp",
            weight=0,
        )

    snapshot_dt = parse_datetime(timestamp)
    years = years_between(snapshot_dt)
    weight = 25 if years > 3 else 0
    return Signal(
        source="wayback",
        status="hit",
        detail=f"Snapshot {timestamp} ({years:.1f} years of history)",
        weight=weight,
    )


async def ny_registry(client: httpx.AsyncClient, company_name: str) -> Signal:
    rows = await fetch_json(
        client,
        "https://data.ny.gov/resource/n9v6-gdp6.json",
        params={"$q": company_name, "$limit": "5"},
    )
    if not isinstance(rows, list) or not rows:
        return Signal(
            source="ny_registry",
            status="miss",
            detail="No New York corporation records found",
            weight=0,
        )

    candidates = [row for row in rows if isinstance(row, dict)]
    if not candidates:
        return Signal(
            source="ny_registry",
            status="miss",
            detail="No New York corporation records found",
            weight=0,
        )

    def row_name(row: dict[str, Any]) -> str:
        return str(row.get("current_entity_name") or row.get("entity_name") or "")

    best_row = max(candidates, key=lambda row: name_ratio(company_name, row_name(row)))
    entity_name = row_name(best_row)
    ratio = SequenceMatcher(
        None, normalize_name(company_name), normalize_name(entity_name)
    ).ratio()
    if ratio <= SEC_MATCH_THRESHOLD:
        return Signal(
            source="ny_registry",
            status="miss",
            detail=f"NY results found but no close name match (closest '{entity_name}' ratio={ratio:.2f})",
            weight=0,
        )

    filing_date = best_row.get("initial_dos_filing_date", "unknown")
    county = best_row.get("county", "unknown")
    return Signal(
        source="ny_registry",
        status="hit",
        detail=f"entity_name={entity_name}, initial_dos_filing_date={filing_date}, county={county}",
        weight=30,
    )


async def rdap(client: httpx.AsyncClient, domain: str) -> Signal:
    try:
        data = await fetch_json(client, f"https://rdap.org/domain/{domain}")
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 404:
            return Signal(
                source="rdap",
                status="miss",
                detail="Domain not found in RDAP",
                weight=0,
            )
        raise
    events = data.get("events") or []
    registration: datetime | None = None
    for event in events:
        if not isinstance(event, dict):
            continue
        if str(event.get("eventAction", "")).lower() == "registration":
            registration = parse_datetime(str(event.get("eventDate")))
            break

    if registration is None:
        return Signal(
            source="rdap",
            status="miss",
            detail="No registration event found",
            weight=0,
        )

    age_days = days_between(registration)
    if age_days > 1825:
        weight = 20
    elif age_days < 30:
        weight = -40
    elif age_days < 90:
        weight = -30
    else:
        weight = 0

    return Signal(
        source="rdap",
        status="hit",
        detail=f"Registered {registration.date().isoformat()} ({age_days} days old)",
        weight=weight,
    )


def _dns_answers(data: dict[str, Any], record_type: int) -> list[str]:
    answers = data.get("Answer") or []
    values: list[str] = []
    for answer in answers:
        if isinstance(answer, dict) and answer.get("type") == record_type:
            values.append(str(answer.get("data") or ""))
    return values


async def dns_mx(client: httpx.AsyncClient, domain: str) -> Signal:
    data = await fetch_json(
        client,
        "https://dns.google/resolve",
        params={"name": domain, "type": "MX"},
    )
    records = _dns_answers(data, 15)
    if not records:
        return Signal(
            source="dns_mx",
            status="miss",
            detail="No MX records",
            weight=-25,
        )

    joined = " ".join(record.lower() for record in records)
    if any(marker in joined for marker in BUSINESS_MX_MARKERS):
        return Signal(
            source="dns_mx",
            status="hit",
            detail=f"Business MX: {', '.join(records)}",
            weight=20,
        )
    return Signal(
        source="dns_mx",
        status="miss",
        detail=f"MX present but not a known business host: {', '.join(records)}",
        weight=0,
    )


async def dmarc(client: httpx.AsyncClient, domain: str) -> Signal:
    data = await fetch_json(
        client,
        "https://dns.google/resolve",
        params={"name": f"_dmarc.{domain}", "type": "TXT"},
    )
    records = _dns_answers(data, 16)
    has_dmarc = any("v=dmarc1" in record.lower() for record in records)
    if has_dmarc:
        return Signal(
            source="dmarc",
            status="hit",
            detail=f"DMARC present: {records[0]}" if records else "DMARC present",
            weight=10,
        )
    return Signal(
        source="dmarc",
        status="miss",
        detail="No DMARC record (not penalized)",
        weight=0,
    )


async def cert_history(client: httpx.AsyncClient, domain: str) -> Signal:
    rows = await fetch_json(
        client,
        "https://crt.sh/",
        params={"q": domain, "output": "json"},
    )
    if not isinstance(rows, list) or not rows:
        return Signal(
            source="cert_history",
            status="miss",
            detail="No certificates found",
            weight=0,
        )

    earliest: datetime | None = None
    for row in rows:
        if not isinstance(row, dict):
            continue
        raw = row.get("not_before")
        if not raw:
            continue
        try:
            current = parse_datetime(str(raw))
        except ValueError:
            continue
        if earliest is None or current < earliest:
            earliest = current

    if earliest is None:
        return Signal(
            source="cert_history",
            status="miss",
            detail="Certificates found but no parsable not_before dates",
            weight=0,
        )

    years = years_between(earliest)
    weight = 15 if years > 2 else 0
    return Signal(
        source="cert_history",
        status="hit",
        detail=f"Earliest certificate {earliest.date().isoformat()} ({years:.1f} years)",
        weight=weight,
    )


async def run_check(source: str, coro: Any) -> Signal:
    try:
        return await coro
    except Exception as exc:  # noqa: BLE001 — isolate provider failures
        logger.warning("Check %s failed: %s", source, exc)
        return error_signal(source, exc)


def signal_by_source(signals: list[Signal], source: str) -> Signal | None:
    return next((signal for signal in signals if signal.source == source), None)


def is_hit(signals: list[Signal], source: str) -> bool:
    signal = signal_by_source(signals, source)
    return signal is not None and signal.status == "hit"


def determine_tier(signals: list[Signal], sec_hit: bool) -> Tier:
    if sec_hit:
        return "public"

    wayback_signal = signal_by_source(signals, "wayback")
    rdap_signal = signal_by_source(signals, "rdap")
    cert_signal = signal_by_source(signals, "cert_history")
    has_history = (
        (wayback_signal is not None and wayback_signal.weight >= 25)
        or (rdap_signal is not None and rdap_signal.weight >= 20)
        or (cert_signal is not None and cert_signal.weight >= 15)
    )
    if has_history:
        return "established"

    mx_signal = signal_by_source(signals, "dns_mx")
    if is_hit(signals, "ny_registry") or (mx_signal is not None and mx_signal.weight >= 20):
        return "small_business"

    return "unknown"


def score_signals(signals: list[Signal]) -> int:
    total = BASELINE_SCORE + sum(signal.weight for signal in signals)
    return clamp(total, 0, 100)


def decide_verdict(score: int, signals: list[Signal], sec_hit: bool) -> tuple[Verdict, int, Tier]:
    tier = determine_tier(signals, sec_hit)
    if sec_hit:
        return "likely_real", 95, "public"

    if score >= 65:
        verdict: Verdict = "likely_real"
    elif score >= 35:
        verdict = "unverified"
    else:
        verdict = "likely_fake"

    # Real startups often have new domains. A young domain must not condemn
    # a company that already has Wayback history or a NY registry record.
    if verdict == "likely_fake" and (is_hit(signals, "wayback") or is_hit(signals, "ny_registry")):
        verdict = "unverified"
        score = max(score, 35)

    return verdict, score, tier


HTML_BLOCK_RE = re.compile(r"<script[\s\S]*?</script>|<style[\s\S]*?</style>|<[^>]+>", re.I)
FROM_EMAIL_RE = re.compile(r"[\w.+-]+@([A-Za-z0-9.-]+\.[A-Za-z]{2,})")
AT_COMPANY_RE = re.compile(
    r"\b(?:at|for)\s+([A-Z][A-Za-z0-9&'\-]{1,40}(?:\s+[A-Z][A-Za-z0-9&'\-]{1,20}){0,3})",
)
WEB_DIST = Path(__file__).resolve().parent / "web" / "dist"

MESSAGE_RULES: list[tuple[str, str, str, str, re.Pattern[str]]] = [
    (
        "off_platform_chat",
        "high",
        "Moves the conversation off email",
        "Recruiters at real companies rarely insist on Telegram, WhatsApp, or Signal for an offer.",
        re.compile(r"\b(telegram|whatsapp|signal|wechat)\b", re.I),
    ),
    (
        "payment_red_flag",
        "high",
        "Asks to pay or receive money in an unusual way",
        "Gift cards, crypto, wires, or Western Union are classic advance-fee and fake-offer patterns.",
        re.compile(r"\b(gift\s*card|cryptocurrency|bitcoin|wire transfer|western union|moneygram)\b", re.I),
    ),
    (
        "sensitive_ids",
        "high",
        "Requests sensitive identity or bank details immediately",
        "A first-touch recruiter email should not ask for SSN, a license photo, or routing numbers.",
        re.compile(
            r"\b(social security|ssn|driver'?s license|passport|routing number|bank account|date of birth)\b",
            re.I,
        ),
    ),
    (
        "secrecy",
        "high",
        "Tells you not to talk about the offer",
        "Pressure to keep an offer secret is a common social-engineering tactic.",
        re.compile(r"\b(do not (tell|discuss|share)|don'?t (tell|discuss)|keep this (confidential|secret))\b", re.I),
    ),
    (
        "no_interview",
        "medium",
        "Skips interviewing entirely",
        "A role offered with no interview or screen is unusual for a real hiring process.",
        re.compile(r"\b(no interview|without an interview|skip the interview|interview is not required)\b", re.I),
    ),
    (
        "urgency",
        "medium",
        "Creates artificial urgency",
        "A 24-hour reply window or an immediate start is often used to stop you from checking the company.",
        re.compile(r"\b(within 24 hours|start monday|start immediately|reply (asap|today)|urgent(ly)?)\b", re.I),
    ),
    (
        "unsolicited_selection",
        "medium",
        "Claims you were selected without applying",
        "Mass 'you have been selected' notes are a frequent wrapper for fake offers.",
        re.compile(r"\b(you have been selected|you.?ve been selected|selected for a .{0,40}role)\b", re.I),
    ),
]


def strip_html(raw: str) -> str:
    text = HTML_BLOCK_RE.sub(" ", raw)
    text = html.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def extract_from_message(message: str) -> tuple[str, str]:
    domain = ""
    match = FROM_EMAIL_RE.search(message)
    if match:
        domain = normalize_domain(match.group(1))
    company = ""
    match = AT_COMPANY_RE.search(message)
    if match:
        company = re.sub(r"\s+(after|and|with|before)\b.*$", "", match.group(1).strip(), flags=re.I)
        company = company.strip(" ,.;:-")
    return company, domain


def analyze_message_text(message: str) -> list[MessageFlag]:
    flags: list[MessageFlag] = []
    for code, severity, title, detail, pattern in MESSAGE_RULES:
        if pattern.search(message):
            flags.append(MessageFlag(code=code, severity=severity, title=title, detail=detail))
    return flags


def message_risk(flags: list[MessageFlag]) -> Literal["low", "medium", "high"]:
    if any(flag.severity == "high" for flag in flags):
        return "high"
    if sum(1 for flag in flags if flag.severity == "medium") >= 2:
        return "high"
    if flags:
        return "medium"
    return "low"


def extract_json_object(text: str) -> dict[str, Any] | None:
    cleaned = text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", cleaned, flags=re.I)
    try:
        parsed = json.loads(cleaned)
        return parsed if isinstance(parsed, dict) else None
    except json.JSONDecodeError:
        pass
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start >= 0 and end > start:
        try:
            parsed = json.loads(cleaned[start : end + 1])
            return parsed if isinstance(parsed, dict) else None
        except json.JSONDecodeError:
            return None
    return None


def parse_consistency_payload(data: dict[str, Any]) -> ConsistencyResponse | None:
    required = ("business_match", "role_listed_officially", "compensation_plausible", "tone_match")
    if not all(isinstance(data.get(key), dict) for key in required):
        return None
    concern = data.get("overall_concern")
    if concern not in ("low", "medium", "high"):
        concern = "medium"

    def aspect(key: str) -> ConsistencyAspect:
        raw = data.get(key) or {}
        return ConsistencyAspect(
            verdict=str(raw.get("verdict") or "unclear"),
            reason=str(raw.get("reason") or "No reason provided."),
        )

    return ConsistencyResponse(
        status="ok",
        business_match=aspect("business_match"),
        role_listed_officially=aspect("role_listed_officially"),
        compensation_plausible=aspect("compensation_plausible"),
        tone_match=aspect("tone_match"),
        overall_concern=concern,
        summary=str(data.get("summary") or "No summary provided."),
    )


async def fetch_official_page(client: httpx.AsyncClient, url: str) -> str | None:
    try:
        response = await client.get(url)
        response.raise_for_status()
        text = strip_html(response.text)
        return text[:4000] if text else None
    except Exception as exc:  # noqa: BLE001
        logger.info("Official page fetch failed for %s: %s", url, exc)
        return None


async def collect_official_text(domain: str) -> tuple[str, list[str]]:
    host = normalize_domain(domain)
    if not host:
        return "", []
    urls = [f"https://{host}", f"https://{host}/careers", f"https://{host}/jobs"]
    timeout = httpx.Timeout(6.0)
    headers = {"User-Agent": SEC_USER_AGENT, "Accept": "text/html,application/xhtml+xml"}
    async with httpx.AsyncClient(timeout=timeout, headers=headers, follow_redirects=True) as client:
        pages = await asyncio.gather(*(fetch_official_page(client, url) for url in urls))
    chunks: list[str] = []
    used: list[str] = []
    for url, text in zip(urls, pages, strict=True):
        if text:
            chunks.append(f"SOURCE {url}:\n{text}")
            used.append(url)
    return "\n\n".join(chunks), used


async def model_consistency(official_text: str, job_description: str, company_name: str, strict: bool) -> str:
    return await run_consistency(official_text, job_description, company_name, strict)



def spa_index_response(request: Request):
    index = WEB_DIST / "index.html"
    if index.exists():
        return FileResponse(index)
    dev = os.getenv("WEB_DEV_URL", "").strip()
    if dev:
        query = urlencode(request.query_params)
        target = f"{dev.rstrip('/')}/"
        if query:
            target = f"{target}?{query}"
        return RedirectResponse(target, status_code=307)
    return HTMLResponse(
        "<html><body style='font-family:sans-serif;padding:48px'>"
        "<h1>OfferProof UI is not built yet</h1>"
        "<p>Run <code>cd web && npm install && npm run build</code>, then restart the API.</p>"
        "</body></html>",
        status_code=503,
    )



@app.get("/", response_model=None)
async def landing(request: Request):
    return spa_index_response(request)


@app.get("/report", response_model=None)
async def report_page(request: Request):
    return spa_index_response(request)


@app.get("/health", response_model=HealthResponse)
@app.get("/api/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    settings = ollama_settings()
    live = await ollama_available()
    return HealthResponse(
        ok=True,
        ollama=live,
        model=settings["model"],
        mode="ollama" if live else "heuristic",
    )


async def collect_verify_signals(
    company_name: str,
    domain: str,
    *,
    fast: bool = False,
) -> list[Signal]:
    timeout = httpx.Timeout(2.0 if fast else REQUEST_TIMEOUT)
    headers = {
        "User-Agent": SEC_USER_AGENT,
        "Accept": "application/json",
    }
    async with httpx.AsyncClient(timeout=timeout, headers=headers, follow_redirects=True) as client:
        jobs = [
            run_check("sec_edgar", sec_edgar(client, company_name)),
            run_check("rdap", rdap(client, domain)),
            run_check("dns_mx", dns_mx(client, domain)),
            run_check("dmarc", dmarc(client, domain)),
        ]
        if not fast:
            jobs.extend(
                [
                    run_check("wayback", wayback(client, domain)),
                    run_check("ny_registry", ny_registry(client, company_name)),
                    run_check("cert_history", cert_history(client, domain)),
                ]
            )
        return list(await asyncio.gather(*jobs))


def dashboard_path(company_name: str, domain: str) -> str:
    query = urlencode({"company": company_name, "domain": domain})
    return f"/?{query}" if query else "/"


@app.post("/verify", response_model=VerifyResponse)
async def verify(body: VerifyRequest) -> VerifyResponse:
    company_name = body.company_name.strip()
    domain = normalize_domain(body.domain)
    signals = await collect_verify_signals(company_name, domain, fast=False)
    sec_hit = is_hit(signals, "sec_edgar")
    score = score_signals(signals)
    verdict, confidence, tier = decide_verdict(score, signals, sec_hit)
    return VerifyResponse(
        verdict=verdict,
        confidence=confidence,
        tier=tier,
        signals=signals,
    )


@app.post("/api/extension/score")
async def extension_score(body: ExtensionScoreRequest):
    page_text = (body.page_text or body.message or "").strip()
    extracted_company, extracted_domain = extract_from_message(page_text) if page_text else ("", "")
    company_name = body.company_name.strip() or extracted_company
    domain = normalize_domain(body.domain or extracted_domain)
    heuristic = generate_local_heuristic_audit(
        page_text or f"{company_name} {domain}".strip(),
        is_company_only=not page_text,
    )
    signals: list[Signal] = []
    verdict: Verdict = "unverified"
    confidence = 40
    tier: Tier = "unknown"
    if company_name or domain:
        signals = await collect_verify_signals(company_name, domain, fast=True)
        sec_hit = is_hit(signals, "sec_edgar")
        score = score_signals(signals)
        verdict, confidence, tier = decide_verdict(score, signals, sec_hit)
        if verdict == "likely_fake":
            heuristic["ghost_score"] = max(int(heuristic["ghost_score"]), 72)
            if heuristic["trust_level"] == "Safe":
                heuristic["trust_level"] = "Caution"
        elif verdict == "likely_real":
            heuristic["ghost_score"] = min(int(heuristic["ghost_score"]), 18)
            if heuristic["trust_level"] in {"Danger", "Suspicious"}:
                pass
            else:
                heuristic["trust_level"] = "Safe"
    flags = analyze_message_text(page_text) if page_text else []
    return {
        "company_name": company_name,
        "domain": domain,
        "ghost_score": heuristic["ghost_score"],
        "trust_level": heuristic["trust_level"],
        "verdict": verdict,
        "confidence": confidence,
        "tier": tier,
        "signals": [signal.model_dump() for signal in signals],
        "flags": [flag.model_dump() for flag in flags],
        "dashboard_url": dashboard_path(company_name, domain),
        "engine": "fast",
    }


@app.post("/analyze_message", response_model=AnalyzeMessageResponse)
async def analyze_message(body: AnalyzeMessageRequest) -> AnalyzeMessageResponse:
    message = body.message.strip()
    extracted_company, extracted_domain = extract_from_message(message)
    flags = analyze_message_text(message)
    return AnalyzeMessageResponse(
        risk=message_risk(flags),
        flags=flags,
        extracted_company=body.company_name.strip() or extracted_company,
        extracted_domain=normalize_domain(body.domain or extracted_domain),
    )


@app.post("/consistency", response_model=ConsistencyResponse)
async def consistency(body: ConsistencyRequest) -> ConsistencyResponse:
    try:
        official_text, sources = await collect_official_text(body.domain)
        if not official_text:
            return ConsistencyResponse(
                status="no_official_source",
                summary="Could not fetch the company homepage, /careers, or /jobs pages.",
            )
        if not await ollama_available():
            return ConsistencyResponse(
                status="unavailable",
                summary=f"Ollama is not running at {ollama_settings()['base_url']}.",
                sources_used=sources,
            )

        raw = ""
        parsed: ConsistencyResponse | None = None
        for strict in (False, True):
            try:
                raw = await model_consistency(
                    official_text,
                    body.job_description,
                    body.company_name,
                    strict=strict,
                )
                payload = extract_json_object(raw)
                if payload:
                    parsed = parse_consistency_payload(payload)
                if parsed:
                    parsed.sources_used = sources
                    return parsed
            except Exception as exc:  # noqa: BLE001
                logger.warning("Ollama consistency attempt failed: %s", exc)

        return ConsistencyResponse(
            status="unavailable",
            summary="The local Ollama model did not return usable JSON.",
            sources_used=sources,
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("Consistency endpoint failed: %s", exc)
        return ConsistencyResponse(
            status="unavailable",
            summary="Consistency analysis is temporarily unavailable.",
        )


@app.post("/api/parse-url")
async def parse_url(body: ParseUrlRequest):
    try:
        data = await parse_target_url(body.url, body.mode or body.type or "auto")
        return data
    except ValueError as exc:
        return JSONResponse({"error": str(exc)}, status_code=400)
    except Exception as exc:  # noqa: BLE001
        logger.warning("URL parse failed: %s", exc)
        return JSONResponse({"error": "Failed to parse URL", "message": str(exc)}, status_code=500)


@app.post("/api/audit")
async def audit(body: AuditRequest):
    content = (body.text or body.content or body.data).strip()
    if not content:
        return JSONResponse({"error": "Missing required 'text' or 'content' in request body."}, status_code=400)
    is_company_only = bool(body.is_company_only or body.isCompanyOnly)
    company_url = body.company_url or body.companyUrl
    job_url = body.job_url or body.jobUrl
    result, mode = await run_audit(
        content,
        is_company_only=is_company_only,
        company_url=company_url,
        job_url=job_url,
    )
    result["engine"] = mode
    return JSONResponse(result)


@app.get("/demo/{slug}", response_class=HTMLResponse)
@app.get("/demo/{slug}/{page}", response_class=HTMLResponse)
async def demo_site(slug: str, page: str = "home"):
    page_response = render_demo(slug, page)
    if page_response is None:
        return HTMLResponse("<h1>Unknown demo company</h1>", status_code=404)
    return page_response


@app.post("/api/copilot")
async def copilot(body: CopilotRequest):
    history = [item.model_dump() for item in body.history]
    reply = await run_copilot(
        body.message,
        history=history,
        audit_result=body.audit_result,
        job=body.job,
        evidence=body.evidence,
    )
    return {"reply": reply, "model": ollama_settings()["model"]}


@app.get("/{full_path:path}", response_model=None)
async def spa_fallback(full_path: str, request: Request):
    if full_path.startswith("api/") or full_path in {"verify", "analyze_message", "consistency", "health"}:
        return JSONResponse({"error": "Not found"}, status_code=404)
    candidate = WEB_DIST / full_path
    if candidate.is_file():
        return FileResponse(candidate)
    return spa_index_response(request)


if (WEB_DIST / "assets").is_dir():
    app.mount("/assets", StaticFiles(directory=WEB_DIST / "assets"), name="assets")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
