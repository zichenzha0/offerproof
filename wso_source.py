"""Wall Street Oasis (WSO) intern-intelligence layer for OfferProof.

Turns WSO forum chatter about a company/internship into a normalized
"Role / Intern Risk" score and an anonymous-reviews feed that answers the
candidate-side question OfferProof's legitimacy engine does not:
"the firm is real, but is the *internship* actually worth it?"

Seed-first by design: everything runs fully offline from data/wso_seed.json.
An optional live path is gated behind WSO_LIVE=1 and always falls back to the
seed on any error, so a demo never depends on a live network call.
"""

from __future__ import annotations

import json
import logging
import os
import re
from functools import lru_cache
from pathlib import Path
from typing import Any

logger = logging.getLogger("offerproof.wso")

SEED_PATH = Path(__file__).with_name("data") / "wso_seed.json"

# ---- vector weights for the composite Role / Intern Risk score ----------------
VECTOR_WEIGHTS = {
    "role_substance": 0.30,      # real work vs cold-calling / sourcing / admin
    "exploitation_risk": 0.30,   # pay, hours, intern:FT ratio
    "past_outcomes": 0.25,       # return offers / conversion
    "culture": 0.15,             # sentiment + red-flag culture signals
}

LOW_VALUE_WORK = {"cold_calling", "sourcing", "admin"}
HIGH_VALUE_WORK = {"modeling", "other"}

NEGATIVE_FLAGS = {
    "unpaid",
    "misrepresented role",
    "understaffed",
    "no mentorship",
    "long hours",
    "low return rate",
    "dangled return offer",
    "ghost job",
    "no response",
    "stale posting",
    "resume harvesting",
    "phantom company",
    "fake reviews",
    "no footprint",
}
POSITIVE_FLAGS = {
    "real work",
    "strong mentorship",
    "paid well",
    "ships to prod",
    "legit process",
    "high return rate",
    "legit firm",
}


def _norm(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", (text or "").lower()).strip()


@lru_cache(maxsize=1)
def load_seed() -> dict[str, Any]:
    try:
        with SEED_PATH.open("r", encoding="utf-8") as fh:
            return json.load(fh)
    except FileNotFoundError:
        logger.warning("WSO seed not found at %s", SEED_PATH)
        return {"companies": []}
    except json.JSONDecodeError as exc:
        logger.warning("WSO seed is invalid JSON: %s", exc)
        return {"companies": []}


def _match_company(company_name: str, text: str) -> dict[str, Any] | None:
    """Find the seeded firm that best matches an explicit name or the raw text."""
    companies = load_seed().get("companies", [])
    if not companies:
        return None

    name_n = _norm(company_name)
    text_n = _norm(text)

    # 1) explicit-name match against company + aliases (substring both ways).
    if name_n:
        for entry in companies:
            candidates = [entry.get("company", ""), entry.get("demo_slug", ""), *entry.get("aliases", [])]
            for cand in candidates:
                cand_n = _norm(cand)
                if cand_n and (cand_n in name_n or name_n in cand_n):
                    return entry

    # 2) fall back to scanning the audited text for any known firm/alias.
    if text_n:
        for entry in companies:
            candidates = [entry.get("company", ""), *entry.get("aliases", [])]
            for cand in candidates:
                cand_n = _norm(cand)
                # require a reasonably specific token so "co" / "capital" alone don't match
                if len(cand_n) >= 5 and cand_n in text_n:
                    return entry
    return None


# ---- parsing helpers ----------------------------------------------------------
def _is_unpaid(comp: str) -> bool:
    c = (comp or "").lower()
    return "unpaid" in c or "$0" in c or "no pay" in c or "stipend only" in c


def _hours(value: Any) -> float | None:
    if isinstance(value, (int, float)):
        return float(value)
    return None


def _ratio(value: str) -> float | None:
    """'18:3' -> 6.0 interns per full-timer. Returns None when unknown."""
    if not value or value == "na":
        return None
    m = re.match(r"\s*(\d+)\s*:\s*(\d+)\s*", str(value))
    if not m:
        return None
    interns, ft = int(m.group(1)), int(m.group(2))
    return interns / ft if ft else None


def _clamp(v: float) -> int:
    return int(max(0, min(100, round(v))))


# ---- per-vector scoring -------------------------------------------------------
def _score_role_substance(records: list[dict]) -> tuple[int, str]:
    typed = [r.get("work_type") for r in records if r.get("work_type")]
    relevant = [t for t in typed if t in LOW_VALUE_WORK or t in HIGH_VALUE_WORK]
    if not relevant:
        return 50, "Not enough evidence on day-to-day work."
    low = sum(1 for t in relevant if t in LOW_VALUE_WORK)
    share = low / len(relevant)
    score = _clamp(20 + share * 75)
    if share >= 0.6:
        note = f"{low}/{len(relevant)} accounts describe cold-calling / sourcing rather than real project work."
    elif share > 0:
        note = "Mixed — some substantive work, but sourcing/admin shows up in several accounts."
    else:
        note = "Accounts describe substantive, real work (modeling / engineering / product)."
    return score, note


def _score_exploitation(records: list[dict]) -> tuple[int, str]:
    hours = [h for h in (_hours(r.get("hours_per_week")) for r in records) if h is not None]
    unpaid = [r for r in records if _is_unpaid(r.get("comp", ""))]
    ratios = [x for x in (_ratio(r.get("intern_to_ft_ratio", "")) for r in records) if x is not None]

    score = 30.0
    notes: list[str] = []
    if hours:
        avg_h = sum(hours) / len(hours)
        if avg_h >= 65:
            score += 30
            notes.append(f"~{round(avg_h)}h weeks")
        elif avg_h >= 55:
            score += 15
            notes.append(f"~{round(avg_h)}h weeks")
    if records and len(unpaid) / len(records) >= 0.5:
        score += 25
        notes.append("largely unpaid")
    if ratios and max(ratios) >= 4:
        score += 15
        notes.append(f"{round(max(ratios))}:1 intern-to-staff ratio")
    note = "Compensation/hours load: " + (", ".join(notes) if notes else "no major strain reported.")
    return _clamp(score), note


def _score_outcomes(records: list[dict]) -> tuple[int, str]:
    decided = [r.get("return_offer") for r in records if isinstance(r.get("return_offer"), bool)]
    if not decided:
        return 55, "Return-offer / conversion outcomes are unclear from available accounts."
    got = sum(1 for r in decided if r is True)
    rate = got / len(decided)
    score = _clamp(90 - rate * 80)
    note = f"Return-offer signal: {got}/{len(decided)} accounts report an offer."
    return score, note


def _score_culture(records: list[dict]) -> tuple[int, str]:
    sentiments = [r.get("sentiment") for r in records if r.get("sentiment")]
    neg = sum(1 for s in sentiments if s == "negative")
    flags = {f for r in records for f in r.get("culture_flags", [])}
    bad = len(flags & NEGATIVE_FLAGS)
    good = len(flags & POSITIVE_FLAGS)
    score = 40.0
    if sentiments:
        score += (neg / len(sentiments)) * 40
    score += bad * 4
    score -= good * 6
    top_bad = sorted(flags & NEGATIVE_FLAGS)[:3]
    note = ("Culture flags: " + ", ".join(top_bad)) if top_bad else "No notable culture red flags."
    return _clamp(score), note


def _risk_level(score: int) -> str:
    if score >= 75:
        return "High risk"
    if score >= 55:
        return "Elevated"
    if score >= 35:
        return "Moderate"
    return "Low risk"


def _aggregate_stats(records: list[dict]) -> dict[str, Any]:
    hours = [h for h in (_hours(r.get("hours_per_week")) for r in records) if h is not None]
    unpaid = sum(1 for r in records if _is_unpaid(r.get("comp", "")))
    ratios = [x for x in (_ratio(r.get("intern_to_ft_ratio", "")) for r in records) if x is not None]
    decided = [r.get("return_offer") for r in records if isinstance(r.get("return_offer"), bool)]
    got = sum(1 for d in decided if d is True)
    return {
        "review_count": len(records),
        "avg_hours_per_week": round(sum(hours) / len(hours)) if hours else None,
        "unpaid_share": round(unpaid / len(records), 2) if records else None,
        "intern_to_ft_ratio": (f"{round(max(ratios))}:1" if ratios else None),
        "return_offer_rate": (round(got / len(decided), 2) if decided else None),
    }


def _matches_filters(record: dict, filters: dict[str, Any] | None) -> bool:
    """Light candidate-condition filter used by the UI (pitch feature)."""
    if not filters:
        return True
    pay = filters.get("pay")  # 'paid' | 'unpaid' | None
    if pay == "paid" and _is_unpaid(record.get("comp", "")):
        return False
    if pay == "unpaid" and not _is_unpaid(record.get("comp", "")):
        return False
    return True


def build_intern_intel(
    company_name: str = "",
    text: str = "",
    *,
    company_legitimacy_score: int | None = None,
    company_trust_level: str = "",
    filters: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Return the intern_intel block for an audited company.

    Always returns a dict. When no WSO data matches, ``matched`` is False so the
    UI can render a graceful "no intern intelligence yet" state.
    """
    entry = _match_company(company_name, text)
    if not entry:
        return {
            "matched": False,
            "source": "WSO forum",
            "company": company_name or "",
            "message": "No Wall Street Oasis intern reports matched this company yet.",
            "reviews": [],
            "sources": [],
        }

    records = list(entry.get("records", []))

    vectors_raw = {
        "role_substance": _score_role_substance(records),
        "exploitation_risk": _score_exploitation(records),
        "past_outcomes": _score_outcomes(records),
        "culture": _score_culture(records),
    }
    labels = {
        "role_substance": "Role substance",
        "exploitation_risk": "Exploitation risk",
        "past_outcomes": "Past intern outcomes",
        "culture": "Culture & credibility",
    }
    vectors = [
        {
            "key": key,
            "label": labels[key],
            "score": score,
            "level": _risk_level(score),
            "evidence": note,
            "weight": VECTOR_WEIGHTS[key],
        }
        for key, (score, note) in vectors_raw.items()
    ]

    role_risk = _clamp(sum(v["score"] * v["weight"] for v in vectors))
    stats = _aggregate_stats(records)

    filtered = [r for r in records if _matches_filters(r, filters)]
    reviews = [
        {
            "quote": r.get("quote", ""),
            "role": r.get("role", ""),
            "sentiment": r.get("sentiment", "mixed"),
            "comp": r.get("comp", ""),
            "hours_per_week": r.get("hours_per_week"),
            "work_type": r.get("work_type", ""),
            "return_offer": r.get("return_offer"),
            "culture_flags": r.get("culture_flags", []),
            "date": r.get("date", ""),
            "source_url": r.get("source_url", ""),
        }
        for r in filtered
    ]
    sources = sorted({r.get("source_url", "") for r in records if r.get("source_url")})

    verdict = _verdict_line(
        entry.get("company", company_name),
        role_risk,
        company_legitimacy_score,
        company_trust_level,
        stats,
    )

    return {
        "matched": True,
        "source": "WSO forum",
        "company": entry.get("company", company_name),
        "sector": entry.get("sector", ""),
        "role_risk_score": role_risk,
        "risk_level": _risk_level(role_risk),
        "vectors": vectors,
        "stats": stats,
        "reviews": reviews,
        "sources": sources,
        "verdict": verdict,
    }


def _verdict_line(
    company: str,
    role_risk: int,
    legit_score: int | None,
    trust_level: str,
    stats: dict[str, Any],
) -> str:
    bits: list[str] = []
    # The signature "firm is real, role is risky" contrast.
    if legit_score is not None and legit_score <= 40 and role_risk >= 55:
        bits.append(f"{company} looks like a legitimate firm, but the internship carries real risk")
    elif role_risk >= 55:
        bits.append(f"The {company} internship shows elevated risk for candidates")
    else:
        bits.append(f"The {company} internship looks reasonable for candidates")

    detail: list[str] = []
    if stats.get("avg_hours_per_week"):
        detail.append(f"~{stats['avg_hours_per_week']}h weeks")
    if stats.get("unpaid_share") is not None and stats["unpaid_share"] >= 0.5:
        detail.append("mostly unpaid")
    if stats.get("intern_to_ft_ratio"):
        detail.append(f"{stats['intern_to_ft_ratio']} intern-to-staff")
    if stats.get("return_offer_rate") is not None:
        detail.append(f"{int(stats['return_offer_rate'] * 100)}% return-offer rate")
    if detail:
        bits.append("(" + ", ".join(detail) + ")")
    return " ".join(bits) + f" — based on {stats.get('review_count', 0)} WSO reports."
