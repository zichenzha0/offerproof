"""Always-openable local company pages for fictional sample firms."""

from __future__ import annotations

from fastapi.responses import HTMLResponse

PAGES: dict[str, dict[str, str]] = {
    "nexus-creative": {
        "home": "Nexus Creative Studio",
        "tone": "suspect",
        "kicker": "Demo front company • domain does not exist on the public internet",
        "lede": "A 42-day-old brochure site with stock photography and a Gmail careers inbox. OfferProof hosts this page so Official Portal always opens.",
        "facts": [
            "Claimed site: nexuscreativestudio.agency — NXDOMAIN outside this demo",
            "Careers inbox: nexus.recruiting.desk@gmail.com",
            "No Secretary of State filing under this name",
            "Case studies reverse-search to Unsplash stock photos",
        ],
    },
    "xyz-capital": {
        "home": "XYZ Capital",
        "tone": "mixed",
        "kicker": "Demo boutique bank • intern role is the risk, not the firm",
        "lede": "A real-looking advisory shop used in the screenshot case. Firm substance is strong; the internship is mostly sourcing.",
        "facts": [
            "Claimed site: xyzcapital.com",
            "Role: Investment Banking Intern / Summer Analyst",
            "3 full-time bankers vs 18 interns",
            "Past interns report cold calling over modeling",
        ],
    },
    "apex-innovations": {
        "home": "Apex Innovations Global",
        "tone": "ghost",
        "kicker": "Demo evergreen pipeline • requisition auto-renewed 16 times",
        "lede": "Generic accelerator copy and a resume reservoir with no assigned recruiter.",
        "facts": [
            "Req ID: REQ-EVERGREEN-PIPELINE-001",
            "Originally posted 485 days ago",
            "No confirmation emails, no hiring manager",
            "Claimed careers host: careers.apexinnovations-global.com",
        ],
    },
    "beamline-labs": {
        "home": "Beamline Labs",
        "tone": "safe",
        "kicker": "Demo 12-person studio • founder writes from @beamlinelabs.com",
        "lede": "A small climate-tech engineering studio that hires off portfolio, not a public ATS.",
        "facts": [
            "Austin, TX • remote-friendly",
            "Junior Frontend Engineer, $75k–$85k",
            "Google Meet first, paid pairing, company MacBook",
            "No fees, no checks, no Telegram",
        ],
    },
    "vanguard-pixel": {
        "home": "Vanguard Pixel Studio",
        "tone": "danger",
        "kicker": "Demo fresh-grad scam • $220 IDE license + Telegram only",
        "lede": "Gmail outreach pretending to be a boutique studio. This page exists so the sample link opens.",
        "facts": [
            "Claimed site: vanguardpixel-studio.xyz — NXDOMAIN",
            "Sender: vanguardpixel.talent@gmail.com",
            "No video interview, Telegram coordinator",
            "Asks for $220 Zelle / Apple Pay license fee",
        ],
    },
    "craftwork-studios": {
        "home": "Craftwork Studios",
        "tone": "safe",
        "kicker": "Demo Seattle design consultancy • portfolio hire",
        "lede": "10-person studio that invites candidates to a Google Meet and ships hardware.",
        "facts": [
            "Partner email: elena@craftwork-studios.com",
            "Junior UI/UX Designer",
            "M3 MacBook Pro and Figma seats provided",
            "Never asks for checks or equipment purchases",
        ],
    },
}

JOB_COPY: dict[str, tuple[str, str]] = {
    "xyz-capital": (
        "Investment Banking Intern",
        "Financial modeling is listed. Former interns describe sourcing and cold outreach. Continuously posted.",
    ),
    "apex-innovations": (
        "Senior Full-Stack Engineer (Evergreen Pipeline)",
        "Applications go into a general reservoir. No recruiter is assigned. Re-indexed 16 times.",
    ),
    "beamline-labs": (
        "Junior Frontend Engineer",
        "TypeScript / React / Tailwind. 30-minute Google Meet, then a paid pairing hour.",
    ),
    "vanguard-pixel": (
        "Junior Web Developer",
        "Portfolio accepted as stage 1. Text questionnaire or Telegram. $220 IDE license before Monday.",
    ),
}


def _shell(title: str, tone: str, kicker: str, lede: str, facts: list[str], extra: str = "") -> str:
    accent = {
        "safe": "#059669",
        "mixed": "#d97706",
        "ghost": "#d97706",
        "suspect": "#e11d48",
        "danger": "#e11d48",
    }.get(tone, "#2563eb")
    items = "".join(f"<li>{fact}</li>" for fact in facts)
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{title} • OfferProof demo</title>
  <style>
    body {{ margin:0; font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; background:#f8fafc; color:#0f172a; }}
    header {{ background:#fff; border-bottom:1px solid #e2e8f0; padding:16px 24px; }}
    .brand {{ font-weight:800; letter-spacing:-0.03em; }}
    .wrap {{ max-width:720px; margin:32px auto; padding:0 20px; }}
    .card {{ background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:24px; }}
    .kicker {{ color:{accent}; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; }}
    h1 {{ margin:8px 0 12px; letter-spacing:-.03em; }}
    ul {{ padding-left:18px; color:#334155; }}
    .note {{ margin-top:18px; font-size:13px; color:#64748b; }}
    a {{ color:#2563eb; }}
  </style>
</head>
<body>
  <header><div class="brand">{title}</div></header>
  <div class="wrap">
    <div class="card">
      <div class="kicker">{kicker}</div>
      <h1>{title}</h1>
      <p>{lede}</p>
      <ul>{items}</ul>
      {extra}
      <p class="note">This page is hosted by OfferProof at localhost so every sample Official Portal opens. Close the tab to return to the auditor.</p>
    </div>
  </div>
</body>
</html>
"""


def render_demo(slug: str, page: str = "home") -> HTMLResponse | None:
    spec = PAGES.get(slug)
    if not spec:
        return None
    extra = ""
    title = spec["home"]
    if page == "job" and slug in JOB_COPY:
        role, detail = JOB_COPY[slug]
        title = f"{role} · {spec['home']}"
        extra = f"<p><strong>Open role:</strong> {role}</p><p>{detail}</p>"
    html = _shell(title, spec["tone"], spec["kicker"], spec["lede"], spec["facts"], extra)
    return HTMLResponse(html)
