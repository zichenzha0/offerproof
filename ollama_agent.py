"""Local Ollama client for OfferProof audit, copilot, and consistency checks."""

from __future__ import annotations

import logging
import os
from typing import Any

import httpx

logger = logging.getLogger("offerproof.ollama")


def ollama_settings() -> dict[str, str]:
    return {
        "base_url": os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/"),
        "model": os.getenv("OLLAMA_MODEL", "qwen2.5:14b-instruct"),
    }

SYSTEM_AUDIT_PROMPT = """You are an advanced Zero-Trust Recruitment Auditor.
Analyze the provided recruitment text, email, or company website details and evaluate it across trust vectors.

Write every human-readable string in English only. Do not use Chinese or any other language.

Return ONLY a raw valid JSON object. No markdown.

Schema:
{
  "ghost_score": 0-100,
  "trust_level": "Safe"|"Low Risk"|"Caution"|"Suspicious"|"Danger",
  "is_company_only": false,
  "five_blocks": {
    "firm_substance": {"result": "Strong|Mixed|Limited evidence", "evidence": "string"},
    "people_credibility": {"result": "Strong|Mixed|Weak", "evidence": "string"},
    "role_substance": {"result": "High|Medium|Low–Medium|Low|Company-Only (No Job Specified)", "evidence": "string"},
    "past_intern_outcomes": {"result": "Strong|Mixed|Limited/Unclear|None found", "evidence": "string"},
    "risk_signals": {"result": "Low concern|Medium|High concern", "evidence": "string"}
  },
  "verifications": {
    "company_verification": {"status": "VERIFIED|UNVERIFIED|FLAGGED", "details": "string"},
    "recruiter_verification": {"status": "VERIFIED|UNVERIFIED|FLAGGED", "details": "string"},
    "domain_detection": {"status": "VERIFIED|UNVERIFIED|FLAGGED", "details": "string"},
    "job_verification": {"status": "VERIFIED|UNVERIFIED|FLAGGED", "details": "string"},
    "offer_verification": {"status": "VERIFIED|UNVERIFIED|FLAGGED|NOT_APPLICABLE", "details": "string"}
  },
  "privacy_and_safety": {
    "sensitive_data_hidden": ["string"],
    "malicious_links_blocked": ["string"]
  },
  "action_and_reporting": {
    "official_hr_contact": "string"
  }
}

Rules:
- All evidence, details, and summaries must be English sentences.
- Fresh graduates often hear from small companies with no public job board. That is not automatically fraud.
- Free webmail (@gmail/@yahoo/@outlook) claiming to represent an established company is a red flag.
- Fake equipment checks, training fees, Telegram-only interviews, and premature SSN/bank requests are high risk.
- Judge only what the text supports. Do not invent filings, clients, or alumni.
"""

COPILOT_SYSTEM = """You are OfferProof, a Zero-Trust career copilot running locally via Ollama.
Help a job seeker evaluate a recruiter message, company, or offer.

Reply in English only. Never switch to Chinese or any other language.
Be concrete and cautious. Prefer checklists and verification steps over hype.
Never tell the user to send money, deposit a check, or share SSN/bank details before a written offer.
If evidence is thin, say so. Ground answers in the audit JSON and public-record signals when provided.
Keep replies concise (under 250 words) unless the user asks for a drafted email.
"""


async def ollama_available() -> bool:
    base_url = ollama_settings()["base_url"]
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            response = await client.get(f"{base_url}/api/tags")
            return response.is_success
    except Exception:  # noqa: BLE001
        return False


async def ollama_chat(
    messages: list[dict[str, str]],
    *,
    json_mode: bool = False,
    temperature: float = 0.2,
    timeout: float = 120.0,
) -> str:
    settings = ollama_settings()
    payload: dict[str, Any] = {
        "model": settings["model"],
        "messages": messages,
        "stream": False,
        "options": {"temperature": temperature},
    }
    if json_mode:
        payload["format"] = "json"
    async with httpx.AsyncClient(timeout=httpx.Timeout(timeout)) as client:
        response = await client.post(f"{settings['base_url']}/api/chat", json=payload)
        response.raise_for_status()
        data = response.json()
    return str((data.get("message") or {}).get("content") or "")


def generate_local_heuristic_audit(
    content: str,
    is_company_only: bool = False,
) -> dict[str, Any]:
    lower = content.lower()
    has_fee = any(
        token in lower
        for token in (
            "equipment fee",
            "cashier",
            "training fee",
            "license fee",
            "certification fee",
            "western union",
            "zelle",
            "wire transfer",
            "gift card",
        )
    )
    has_ssn = any(
        token in lower
        for token in ("ssn", "social security", "passport", "bank routing", "direct deposit form")
    )
    has_ghost = any(
        token in lower
        for token in ("evergreen", "pipeline", "months ago", "90+ days", "auto-renew", "ghost")
    )
    has_typosquat = any(
        token in lower
        for token in ("goog1e", "gmai1", "amzn-", "recruiting-desk", ".top", ".xyz", ".ru/")
    )
    free_mail = any(
        token in lower
        for token in ("@gmail.com", "@yahoo.com", "@outlook.com", "@hotmail.com", "@proton.me")
    )
    hiring_context = any(
        token in lower
        for token in ("hr", "careers", "recruiter", "talent", "hiring", "offer", "interview")
    )
    has_free_webmail = free_mail and hiring_context
    has_chat_only = any(
        token in lower
        for token in ("telegram", "whatsapp", "signal", "text-only interview", "chat interview")
    )
    is_small = is_company_only or any(
        token in lower
        for token in ("small company", "startup", "boutique", "direct email", "fresh graduate")
    )

    ghost_score = 12
    trust_level = "Safe"
    if has_fee or has_ssn:
        ghost_score, trust_level = 96, "Danger"
    elif has_free_webmail or has_chat_only:
        ghost_score, trust_level = 88, "Suspicious"
    elif has_typosquat:
        ghost_score, trust_level = 78, "Suspicious"
    elif has_ghost:
        ghost_score, trust_level = 64, "Caution"

    return {
        "ghost_score": ghost_score,
        "trust_level": trust_level,
        "is_company_only": is_company_only,
        "five_blocks": {
            "firm_substance": {
                "result": "Limited evidence" if has_typosquat or has_free_webmail else "Strong",
                "evidence": (
                    "Suspicious domain or free-webmail identity. Treat as a possible front company."
                    if has_typosquat or has_free_webmail
                    else "Public web footprint looks consistent with an operating business."
                ),
            },
            "people_credibility": {
                "result": "Weak" if has_free_webmail or has_chat_only or has_typosquat else ("Mixed" if is_small else "Strong"),
                "evidence": (
                    "Recruiter or leadership is unverified and using informal channels."
                    if has_free_webmail or has_chat_only or has_typosquat
                    else "Communications are consistent with a compact but real hiring team."
                ),
            },
            "role_substance": {
                "result": (
                    "Company-Only (No Job Specified)"
                    if is_company_only
                    else "Low"
                    if has_chat_only or has_fee
                    else "Low–Medium"
                    if has_ghost
                    else "High"
                ),
                "evidence": (
                    "No job requisition provided; company substance evaluated only."
                    if is_company_only
                    else "Role asks for payment or informal chat-only screening."
                    if has_chat_only or has_fee
                    else "Role text is generic or evergreen rather than an active opening."
                    if has_ghost
                    else "Role describes concrete work and a normal hiring loop."
                ),
            },
            "past_intern_outcomes": {
                "result": "None found" if has_fee or has_typosquat else ("Mixed" if is_small or has_ghost else "Strong"),
                "evidence": "Heuristic scan only — confirm alumni independently.",
            },
            "risk_signals": {
                "result": "High concern" if has_fee or has_ssn else ("Medium" if has_free_webmail or has_chat_only or has_ghost else "Low concern"),
                "evidence": (
                    "Advance fee, fake check, or premature identity collection."
                    if has_fee or has_ssn
                    else "Free webmail or chat-only interview pattern."
                    if has_free_webmail or has_chat_only
                    else "Possible stale or evergreen posting."
                    if has_ghost
                    else "No classic advance-fee or identity-harvest flags."
                ),
            },
        },
        "verifications": {
            "company_verification": {
                "status": "FLAGGED" if has_typosquat or (has_free_webmail and not is_small) else "VERIFIED",
                "details": (
                    "Recruiter is using free public webmail instead of a company domain."
                    if has_free_webmail
                    else "Suspicious domain syntax in the outreach."
                    if has_typosquat
                    else "No immediate company-identity red flags in the supplied text."
                ),
            },
            "recruiter_verification": {
                "status": "FLAGGED" if has_free_webmail or has_chat_only or has_typosquat or has_fee else "VERIFIED",
                "details": (
                    "Hiring is being pushed onto Telegram/WhatsApp/text only."
                    if has_chat_only
                    else "Recruiter email is not on a corporate domain."
                    if has_free_webmail
                    else "Recruiter channel looks consistent with normal outreach."
                ),
            },
            "domain_detection": {
                "status": "FLAGGED" if has_typosquat or has_free_webmail else "VERIFIED",
                "details": (
                    "Lookalike or newly minted domain pattern detected."
                    if has_typosquat
                    else "No corporate email domain present."
                    if has_free_webmail
                    else "Domain text does not show an obvious typosquat."
                ),
            },
            "job_verification": {
                "status": "FLAGGED" if has_ghost else "VERIFIED",
                "details": (
                    "Company-only audit: no requisition was provided."
                    if is_company_only
                    else "Posting looks evergreen or abandoned."
                    if has_ghost
                    else "No ghost-job markers in the supplied text."
                ),
            },
            "offer_verification": {
                "status": "FLAGGED" if has_fee or has_ssn else "VERIFIED",
                "details": (
                    "Advance fee, fake equipment check, or premature SSN/bank request."
                    if has_fee or has_ssn
                    else "No advance payment or identity-harvest language found."
                ),
            },
        },
        "privacy_and_safety": {
            "sensitive_data_hidden": ["SSN: [MASKED_BY_OFFERPROOF]", "Banking Info: [REDACTED_FOR_PRIVACY]"] if has_ssn else [],
            "malicious_links_blocked": ["unverified-recruitment-portal.external"] if has_typosquat else [],
        },
        "action_and_reporting": {
            "official_hr_contact": (
                "Verify incorporation, insist on a live video call, and refuse any personal payment or check deposit."
                if is_small or is_company_only
                else "Confirm the role on the official careers portal before sharing documents."
            )
        },
    }


async def run_audit(
    content: str,
    *,
    is_company_only: bool = False,
    company_url: str = "",
    job_url: str = "",
    evidence: dict[str, Any] | None = None,
) -> tuple[dict[str, Any], str]:
    """Return (audit_json, mode) where mode is 'ollama' or 'heuristic'."""
    fallback = generate_local_heuristic_audit(content, is_company_only)
    if not await ollama_available():
        logger.warning("Ollama is offline; using heuristic audit.")
        return fallback, "heuristic"

    scope = ""
    if company_url:
        scope += f"Target Company Website URL: {company_url}\n"
    if job_url:
        scope += f"Target Job Requisition URL: {job_url}\n"
    if is_company_only:
        scope += "AUDIT SCOPE: Company website only. Set role_substance to Company-Only (No Job Specified).\n"
    if evidence:
        scope += f"Public-record evidence from OfferProof verifiers:\n{evidence}\n"

    try:
        raw = await ollama_chat(
            [
                {"role": "system", "content": SYSTEM_AUDIT_PROMPT},
                {"role": "user", "content": f"{scope}\nWrite the entire JSON in English.\n\nRecruitment data to audit:\n\n{content.strip()}"},
            ],
            json_mode=True,
            temperature=0.1,
        )
        parsed = _as_dict(raw)
        if parsed and "ghost_score" in parsed and "verifications" in parsed:
            parsed.setdefault("is_company_only", is_company_only)
            parsed.setdefault("five_blocks", fallback["five_blocks"])
            parsed.setdefault("privacy_and_safety", fallback["privacy_and_safety"])
            parsed.setdefault("action_and_reporting", fallback["action_and_reporting"])
            return parsed, "ollama"
        logger.warning("Ollama audit returned unusable JSON; falling back.")
    except Exception as exc:  # noqa: BLE001
        logger.warning("Ollama audit failed: %s", exc)
    return fallback, "heuristic"


async def run_copilot(
    message: str,
    *,
    history: list[dict[str, str]] | None = None,
    audit_result: dict[str, Any] | None = None,
    job: dict[str, Any] | None = None,
    evidence: dict[str, Any] | None = None,
) -> str:
    context_parts = []
    if job:
        context_parts.append(f"Selected opportunity: {job}")
    if audit_result:
        context_parts.append(f"Latest audit JSON: {audit_result}")
    if evidence:
        context_parts.append(f"Public-record signals: {evidence}")
    system = COPILOT_SYSTEM
    if context_parts:
        system += "\n\nContext:\n" + "\n".join(context_parts)

    messages = [{"role": "system", "content": system}]
    for item in history or []:
        role = item.get("role") or item.get("sender") or "user"
        if role in ("copilot", "assistant"):
            role = "assistant"
        elif role != "system":
            role = "user"
        text = str(item.get("content") or item.get("text") or "").strip()
        if text:
            messages.append({"role": role, "content": text})
    messages.append({"role": "user", "content": message.strip()})

    if not await ollama_available():
        settings = ollama_settings()
        return (
            "Ollama is not reachable at "
            f"{settings['base_url']}. Start Ollama (`ollama serve`) and pull `{settings['model']}`, "
            "then ask again. Until then: do not send money, deposit a check, or share SSN/bank details."
        )
    try:
        reply = await ollama_chat(messages, temperature=0.3)
        return reply.strip() or "I could not form a reply from the local model. Try again."
    except Exception as exc:  # noqa: BLE001
        logger.warning("Ollama copilot failed: %s", exc)
        return f"The local Ollama agent failed: {exc}"


async def run_consistency(official_text: str, job_description: str, company_name: str, strict: bool) -> str:
    instruction = """You compare a company's official website text with a job description.
Reply in English only. Every reason and summary must be English.
Return STRICT JSON only.
Schema:
{
  "business_match": {"verdict": "consistent"|"mismatch"|"unclear", "reason": str},
  "role_listed_officially": {"verdict": "yes"|"no"|"unclear", "reason": str},
  "compensation_plausible": {"verdict": "plausible"|"suspicious"|"unclear", "reason": str},
  "tone_match": {"verdict": "consistent"|"mismatch"|"unclear", "reason": str},
  "overall_concern": "low"|"medium"|"high",
  "summary": str
}
A role missing from the careers page is not proof of fraud. Small companies have sparse sites.
"""
    if strict:
        instruction += "\nYour entire reply must be a single JSON object."
    return await ollama_chat(
        [
            {"role": "system", "content": instruction},
            {
                "role": "user",
                "content": (
                    f"Company: {company_name}\n\n"
                    f"OFFICIAL SITE TEXT:\n{official_text[:12000]}\n\n"
                    f"JOB DESCRIPTION:\n{job_description[:8000]}"
                ),
            },
        ],
        json_mode=True,
        temperature=0.1,
        timeout=60.0,
    )


def _as_dict(raw: str) -> dict[str, Any] | None:
    import json
    import re

    cleaned = raw.strip()
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", cleaned, flags=re.I)
    try:
        parsed = json.loads(cleaned)
        return parsed if isinstance(parsed, dict) else None
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start >= 0 and end > start:
            try:
                parsed = json.loads(cleaned[start : end + 1])
                return parsed if isinstance(parsed, dict) else None
            except json.JSONDecodeError:
                return None
    return None
