"""Fetch and summarize a company or job URL for the OfferProof auditor."""

from __future__ import annotations

import json
import re
from urllib.parse import urlparse

import httpx

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)
HTML_BLOCK_RE = re.compile(r"<script[\s\S]*?</script>|<style[\s\S]*?</style>|<[^>]+>", re.I)
JSON_LD_RE = re.compile(r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>([\s\S]*?)</script>', re.I)
TITLE_RE = re.compile(r"<title[^>]*>([\s\S]*?)</title>", re.I)
OG_SITE_RE = re.compile(r'<meta[^>]+property=["\']og:site_name["\'][^>]+content=["\']([^"\']+)["\']', re.I)
META_DESC_RE = re.compile(
    r'<meta[^>]+(?:name=["\']description["\']|property=["\']og:description["\'])[^>]+content=["\']([^"\']+)["\']',
    re.I,
)
ATS_RE = re.compile(
    r"jobs\.ashbyhq|greenhouse\.io|lever\.co|workday|smartrecruiters|recruitee|bamboohr|workable|rippling",
    re.I,
)


def _clean(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def _find_job_posting(html: str) -> dict | None:
    for match in JSON_LD_RE.finditer(html):
        try:
            parsed = json.loads(match.group(1))
        except json.JSONDecodeError:
            continue
        candidates = parsed if isinstance(parsed, list) else [parsed]
        for item in candidates:
            if isinstance(item, dict) and item.get("@type") == "JobPosting":
                return item
    return None


def _salary(job_data: dict | None) -> str:
    if not job_data:
        return ""
    base = job_data.get("baseSalary") or {}
    value = base.get("value")
    currency = base.get("currency") or "USD"
    if isinstance(value, dict):
        return f"{currency} {value.get('minValue') or ''} - {value.get('maxValue') or ''} {value.get('unitText') or ''}".strip()
    if value:
        return f"{currency} {value}"
    return ""


def _location(job_data: dict | None) -> str:
    if not job_data:
        return ""
    address = ((job_data.get("jobLocation") or {}).get("address")) or {}
    parts = [address.get("addressLocality"), address.get("addressRegion"), address.get("addressCountry")]
    return ", ".join(part for part in parts if part)


async def parse_target_url(target_url: str, mode: str = "auto") -> dict:
    raw = target_url.strip()
    if raw.startswith("/"):
        raw = f"http://127.0.0.1:8000{raw}"
    parsed = urlparse(raw)
    if parsed.scheme not in ("http", "https"):
        raise ValueError("Only HTTP/HTTPS URLs are supported.")
    target_url = raw

    timeout = httpx.Timeout(12.0)
    headers = {"User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml"}
    try:
        async with httpx.AsyncClient(timeout=timeout, headers=headers, follow_redirects=True) as client:
            response = await client.get(parsed.geturl())
            response.raise_for_status()
            html = response.text
    except Exception as exc:  # noqa: BLE001 — still return an auditable payload
        host = parsed.hostname or ""
        is_company_only = mode == "company" or parsed.path in {"", "/"}
        company = host.replace("www.", "") if host else "Unknown organization"
        raw_text = (
            f"AUDIT TARGET: Unreachable URL\n"
            f"URL: {target_url}\nHostname: {host}\n"
            f"Fetch error: {exc}\n"
            f"DNS or HTTP failed. Treat a brand-new or non-resolving domain as a high-risk signal, not proof by itself."
        )
        return {
            "url": target_url,
            "isCompanyOnly": is_company_only,
            "companyUrl": target_url if is_company_only else None,
            "jobUrl": None if is_company_only else target_url,
            "title": f"{company} — Unreachable site",
            "company": company,
            "location": "Domain did not resolve or fetch failed",
            "salary": "N/A",
            "domain": host,
            "postedTime": "Unreachable",
            "description": str(exc),
            "rawText": raw_text,
            "unreachable": True,
        }

    job_data = _find_job_posting(html)
    title_match = TITLE_RE.search(html)
    title = str((job_data or {}).get("title") or (title_match.group(1) if title_match else ""))
    title = _clean(re.sub(r"<[^>]+>", " ", title))

    company = str(((job_data or {}).get("hiringOrganization") or {}).get("name") or "")
    if not company:
        og = OG_SITE_RE.search(html)
        if og:
            company = og.group(1)
        else:
            segments = [part for part in parsed.path.split("/") if part]
            if segments and segments[0].lower() not in {"job", "jobs", "careers"}:
                company = segments[0][:1].upper() + segments[0][1:]
            else:
                company = parsed.hostname.replace("www.", "") if parsed.hostname else "Organization"

    is_job_ats = bool(ATS_RE.search(target_url) or job_data)
    is_company_only = mode == "company" or (
        not is_job_ats and (parsed.path in {"", "/"} or bool(re.search(r"about|team|company|home", parsed.path, re.I)))
    )

    location = _location(job_data) or ("Corporate Headquarters / Domain" if is_company_only else "Remote / Unspecified")
    salary = _salary(job_data) or (
        "N/A (Firm Substance Audit Only)" if is_company_only else "Not disclosed in metadata"
    )

    meta_desc = META_DESC_RE.search(html)
    description = str((job_data or {}).get("description") or (meta_desc.group(1) if meta_desc else ""))
    clean_desc = _clean(re.sub(r"<[^>]+>", " ", description))
    body_sample = _clean(HTML_BLOCK_RE.sub(" ", html))[:3500]
    host = parsed.hostname or ""

    raw_text = (
        f"AUDIT TARGET: Company Website Legitimacy & Substance Audit\n"
        f"Company Website: {target_url}\nCompany Entity: {company}\nCanonical Hostname: {host}\n"
        f"Site Meta Overview: {clean_desc or 'No meta description declared'}\n\n"
        f"Website Content & Business Signals:\n{body_sample}"
        if is_company_only
        else (
            f"Job URL: {target_url}\nCompany: {company}\nRole / Title: {title}\n"
            f"Location: {location}\nSalary: {salary}\nDomain: {host}\n\n"
            f"Description:\n{clean_desc[:3000]}"
        )
    )

    return {
        "url": target_url,
        "isCompanyOnly": is_company_only,
        "companyUrl": target_url if is_company_only else None,
        "jobUrl": None if is_company_only else target_url,
        "title": f"{company} — Company Legitimacy & Substance Audit" if is_company_only else (title or "Job Requisition"),
        "company": company or "Organization",
        "location": location,
        "salary": salary,
        "domain": host,
        "postedTime": "Corporate Domain Active" if is_company_only else str((job_data or {}).get("datePosted") or "Recently posted"),
        "description": clean_desc or body_sample[:500],
        "rawText": raw_text,
    }
