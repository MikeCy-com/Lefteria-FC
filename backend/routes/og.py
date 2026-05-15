"""Open Graph share endpoints — return crawler-friendly HTML with OG tags
so that links shared on WhatsApp/Facebook/iMessage/Twitter display a rich
preview card (photo + name + role/position).

Humans visiting these URLs get a meta-refresh redirect to the real React page.
Crawlers stop at the HTML and read the OG tags.
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse
import html as _html
import os

router = APIRouter(prefix="/api/og")

POSITION_LABELS = {
    "Goalkeeper": "Τερματοφύλακας",
    "Defender": "Αμυντικός",
    "Midfielder": "Μέσος",
    "Forward": "Επιθετικός",
}

ROLE_LABELS = {
    "Head Coach": "Προπονητής",
    "Assistant Coach": "Βοηθός Προπονητή",
    "Goalkeeper Coach": "Προπονητής Τερματοφυλάκων",
    "Fitness Coach": "Γυμναστής",
    "Physiotherapist": "Φυσιοθεραπευτής",
    "Team Manager": "Διευθυντής Ομάδας",
    "Academy Director": "Διευθυντής Ακαδημίας",
    "Doctor": "Ιατρός",
    "Scout": "Παρατηρητής",
    "Analyst": "Αναλυτής",
}


def _site_url(request_host: str) -> str:
    """Best-effort absolute site URL. Honors a SITE_URL env var when set."""
    env = os.environ.get("SITE_URL")
    if env:
        return env.rstrip("/")
    return f"https://{request_host}"


def _abs_image(image_url: str | None, site: str) -> str | None:
    if not image_url:
        return None
    if image_url.startswith("http"):
        return image_url
    return f"{site}{image_url}"


def _render(title: str, description: str, image: str | None, canonical: str, redirect_to: str) -> str:
    t = _html.escape(title)
    d = _html.escape(description)
    c = _html.escape(canonical)
    r = _html.escape(redirect_to)
    image_tag = ""
    if image:
        img_safe = _html.escape(image)
        image_tag = (
            f'<meta property="og:image" content="{img_safe}" />\n'
            f'<meta property="og:image:width" content="800" />\n'
            f'<meta property="og:image:height" content="800" />\n'
            f'<meta name="twitter:image" content="{img_safe}" />\n'
        )
    return f"""<!doctype html>
<html lang="el">
<head>
<meta charset="utf-8" />
<title>{t}</title>
<meta name="description" content="{d}" />
<link rel="canonical" href="{c}" />

<meta property="og:type" content="profile" />
<meta property="og:site_name" content="LEFTERIA FC" />
<meta property="og:locale" content="el_GR" />
<meta property="og:title" content="{t}" />
<meta property="og:description" content="{d}" />
<meta property="og:url" content="{c}" />
{image_tag}
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{t}" />
<meta name="twitter:description" content="{d}" />

<!-- Real humans get redirected to the React SPA page; crawlers stop here. -->
<meta http-equiv="refresh" content="0; url={r}" />
<style>body{{background:#0a0a0a;color:#fff;font-family:sans-serif;text-align:center;padding:40px}}</style>
</head>
<body>
<p>Ανακατεύθυνση... <a href="{r}" style="color:#F5A623">Πάτησε εδώ αν δεν φορτώσει αυτόματα.</a></p>
<script>window.location.replace({r!r});</script>
</body>
</html>"""


def _slug(name: str) -> str:
    import unicodedata
    s = (name or "").lower().strip()
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if not unicodedata.category(c).startswith("M"))
    out = []
    for ch in s:
        if ch.isalnum() or ("\u03b1" <= ch <= "\u03c9"):
            out.append(ch)
        elif out and out[-1] != "-":
            out.append("-")
    return "".join(out).strip("-")


def setup_og_routes(db, request_host_provider=None):
    """request_host_provider(request) -> str. If None, falls back to SITE_URL env."""

    @router.get("/player/{player_id}", response_class=HTMLResponse)
    async def og_player(player_id: str):
        # Strip slug if combined
        if "--" in player_id:
            player_id = player_id.rsplit("--", 1)[-1]
        p = await db.players.find_one({"id": player_id}, {"_id": 0})
        if not p:
            raise HTTPException(status_code=404, detail="Player not found")
        site = _site_url(os.environ.get("OG_HOST", "lefteriafc.cy"))
        name = p.get("name", "Παίκτης")
        pos = POSITION_LABELS.get(p.get("position", ""), p.get("position", ""))
        team_label = "LEFTERIA FC Ακαδημία" if p.get("team_type") == "Academy" else "LEFTERIA FC Πρώτη Ομάδα"
        number = p.get("number")
        title = f"{name} — {team_label}"
        desc_parts = []
        if number is not None:
            desc_parts.append(f"#{number}")
        if pos:
            desc_parts.append(pos)
        if p.get("nationality"):
            desc_parts.append(p["nationality"])
        desc = " · ".join(desc_parts) or team_label
        slug = _slug(name)
        spa_path = f"/player/{slug}--{player_id}" if slug else f"/player/{player_id}"
        canonical = f"{site}{spa_path}"
        image = _abs_image(p.get("image_url"), site)
        return HTMLResponse(_render(title, desc, image, canonical, canonical))

    @router.get("/staff/{staff_id}", response_class=HTMLResponse)
    async def og_staff(staff_id: str):
        if "--" in staff_id:
            staff_id = staff_id.rsplit("--", 1)[-1]
        s = await db.staff.find_one({"id": staff_id}, {"_id": 0})
        if not s:
            raise HTTPException(status_code=404, detail="Staff not found")
        site = _site_url(os.environ.get("OG_HOST", "lefteriafc.cy"))
        name = s.get("name", "Μέλος Επιτελείου")
        role = ROLE_LABELS.get(s.get("role", ""), s.get("role", ""))
        team_label = "LEFTERIA FC Ακαδημία" if s.get("team_type") == "Academy" else "LEFTERIA FC Πρώτη Ομάδα"
        title = f"{name} — {team_label}"
        desc_parts = [role]
        if s.get("nationality"):
            desc_parts.append(s["nationality"])
        desc = " · ".join([d for d in desc_parts if d]) or team_label
        slug = _slug(name)
        spa_path = f"/staff/{slug}--{staff_id}" if slug else f"/staff/{staff_id}"
        canonical = f"{site}{spa_path}"
        image = _abs_image(s.get("image_url"), site)
        return HTMLResponse(_render(title, desc, image, canonical, canonical))
