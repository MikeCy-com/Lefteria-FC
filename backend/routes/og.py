"""Open Graph share endpoints — return crawler-friendly HTML with OG tags
so that links shared on WhatsApp/Facebook/iMessage/Twitter display a rich
preview card (photo + name + role/position).

Humans visiting these URLs get a meta-refresh redirect to the real React page.
Crawlers stop at the HTML and read the OG tags.
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse, Response
import html as _html
import io
import os
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont
import urllib.request

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

    @router.get("/player/{player_id}/announce", response_class=HTMLResponse)
    async def og_player_announce(player_id: str):
        """Special 'ΝΕΟ ΜΕΛΟΣ' announcement variant — uses the generated banner
        image so shares look like a transfer-announcement card."""
        if "--" in player_id:
            player_id = player_id.rsplit("--", 1)[-1]
        p = await db.players.find_one({"id": player_id}, {"_id": 0})
        if not p:
            raise HTTPException(status_code=404, detail="Player not found")
        site = _site_url(os.environ.get("OG_HOST", "lefteriafc.cy"))
        name = p.get("name", "Παίκτης")
        pos = POSITION_LABELS.get(p.get("position", ""), p.get("position", ""))
        team_label = "LEFTERIA FC Ακαδημία" if p.get("team_type") == "Academy" else "LEFTERIA FC"
        title = f"ΝΕΟ ΜΕΛΟΣ! {name}"
        desc = f"Καλωσορίζουμε τον {name} στην οικογένεια {team_label}!"
        if pos:
            desc += f" Θέση: {pos}."
        slug = _slug(name)
        canonical = f"{site}/api/og/player/{player_id}/announce"
        spa_path = f"/player/{slug}--{player_id}" if slug else f"/player/{player_id}"
        redirect_to = f"{site}{spa_path}"
        # Dynamic announcement banner (1200x630)
        image = f"{site}/api/og/player/{player_id}/announce.png"
        return HTMLResponse(_render(title, desc, image, canonical, redirect_to))

    @router.get("/player/{player_id}/announce.png")
    async def og_player_announce_png(player_id: str):
        if "--" in player_id:
            player_id = player_id.rsplit("--", 1)[-1]
        p = await db.players.find_one({"id": player_id}, {"_id": 0})
        if not p:
            raise HTTPException(status_code=404, detail="Player not found")
        site = _site_url(os.environ.get("OG_HOST", "lefteriafc.cy"))
        name = p.get("name", "")
        pos = POSITION_LABELS.get(p.get("position", ""), p.get("position", ""))
        number = p.get("number")
        img_url = _abs_image(p.get("image_url"), site)
        png = _render_announce_card(name, pos, number, img_url)
        return Response(content=png, media_type="image/png", headers={"Cache-Control": "public, max-age=3600"})

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

    @router.get("/staff/{staff_id}/announce", response_class=HTMLResponse)
    async def og_staff_announce(staff_id: str):
        if "--" in staff_id:
            staff_id = staff_id.rsplit("--", 1)[-1]
        s = await db.staff.find_one({"id": staff_id}, {"_id": 0})
        if not s:
            raise HTTPException(status_code=404, detail="Staff not found")
        site = _site_url(os.environ.get("OG_HOST", "lefteriafc.cy"))
        name = s.get("name", "Μέλος Επιτελείου")
        role = ROLE_LABELS.get(s.get("role", ""), s.get("role", ""))
        team_label = "LEFTERIA FC Ακαδημία" if s.get("team_type") == "Academy" else "LEFTERIA FC"
        title = f"ΝΕΟ ΜΕΛΟΣ! {name}"
        desc = f"Καλωσορίζουμε τον/την {name} στο τεχνικό επιτελείο της {team_label}!"
        if role:
            desc += f" Ρόλος: {role}."
        slug = _slug(name)
        canonical = f"{site}/api/og/staff/{staff_id}/announce"
        spa_path = f"/staff/{slug}--{staff_id}" if slug else f"/staff/{staff_id}"
        redirect_to = f"{site}{spa_path}"
        image = f"{site}/api/og/staff/{staff_id}/announce.png"
        return HTMLResponse(_render(title, desc, image, canonical, redirect_to))

    @router.get("/staff/{staff_id}/announce.png")
    async def og_staff_announce_png(staff_id: str):
        if "--" in staff_id:
            staff_id = staff_id.rsplit("--", 1)[-1]
        s = await db.staff.find_one({"id": staff_id}, {"_id": 0})
        if not s:
            raise HTTPException(status_code=404, detail="Staff not found")
        site = _site_url(os.environ.get("OG_HOST", "lefteriafc.cy"))
        name = s.get("name", "")
        role = ROLE_LABELS.get(s.get("role", ""), s.get("role", ""))
        img_url = _abs_image(s.get("image_url"), site)
        png = _render_announce_card(name, role, None, img_url)
        return Response(content=png, media_type="image/png", headers={"Cache-Control": "public, max-age=3600"})

    @router.get("/news/{news_id}", response_class=HTMLResponse)
    async def og_news(news_id: str):
        if "--" in news_id:
            news_id = news_id.rsplit("--", 1)[-1]
        n = await db.news.find_one({"id": news_id}, {"_id": 0})
        if not n:
            raise HTTPException(status_code=404, detail="News not found")
        site = _site_url(os.environ.get("OG_HOST", "lefteriafc.cy"))
        title = n.get("title", "Νέο Άρθρο")
        desc = n.get("excerpt") or (n.get("content", "")[:200])
        slug = _slug(title)
        canonical = f"{site}/news/{slug}--{news_id}" if slug else f"{site}/news/{news_id}"
        image = _abs_image(n.get("image_url"), site)
        return HTMLResponse(_render(title, desc, image, canonical, canonical))

    @router.get("/match/{fixture_id}", response_class=HTMLResponse)
    async def og_match(fixture_id: str):
        f = await db.fixtures.find_one({"id": fixture_id}, {"_id": 0})
        if not f:
            raise HTTPException(status_code=404, detail="Fixture not found")
        site = _site_url(os.environ.get("OG_HOST", "lefteriafc.cy"))
        home = f.get("home_team", "")
        away = f.get("away_team", "")
        home_score = f.get("home_score")
        away_score = f.get("away_score")
        status = (f.get("status") or "").lower()
        if status == "completed" and home_score is not None and away_score is not None:
            title = f"{home} {home_score} - {away_score} {away}"
            desc = f"Αποτέλεσμα αγώνα — {home} vs {away}"
        else:
            md = f.get("match_date", "")[:10]
            title = f"{home} vs {away}"
            desc = f"Επερχόμενος αγώνας{(' — ' + md) if md else ''}"
        canonical = f"{site}/match/{fixture_id}"
        image = _abs_image(f.get("image_url"), site)
        return HTMLResponse(_render(title, desc, image, canonical, canonical))


# ============================================================
# Dynamic announcement card image generator (1200×630 PNG)
# ============================================================
_FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
]


def _load_font(size: int):
    for path in _FONT_CANDIDATES:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()


def _fetch_image_bytes(url: str):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=5) as r:
            return r.read()
    except Exception:
        return None


_GREEK_ACCENT_MAP = str.maketrans({
    "Ά": "Α", "Έ": "Ε", "Ή": "Η", "Ί": "Ι", "Ό": "Ο", "Ύ": "Υ", "Ώ": "Ω",
    "ά": "α", "έ": "ε", "ή": "η", "ί": "ι", "ό": "ο", "ύ": "υ", "ώ": "ω",
    "Ϊ": "Ι", "Ϋ": "Υ", "ϊ": "ι", "ϋ": "υ", "ΐ": "ι", "ΰ": "υ",
})


def _strip_greek_accents(s: str) -> str:
    return (s or "").translate(_GREEK_ACCENT_MAP)


def _render_announce_card(name: str, position: str, number, image_url: str | None) -> bytes:
    W, H = 1200, 630
    bg = Image.new("RGB", (W, H), (10, 10, 10))

    # Subtle orange gradient corner (top-left)
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    for i in range(0, 600, 4):
        alpha = max(0, 40 - i // 20)
        od.ellipse((-200, -200, 200 + i, 200 + i), fill=(245, 166, 35, alpha))
    bg.paste(overlay, (0, 0), overlay)

    # Player photo on the right side (square crop)
    photo_box = (W - 480, 75, W - 75, 480)  # right side
    if image_url:
        raw = _fetch_image_bytes(image_url)
        if raw:
            try:
                im = Image.open(io.BytesIO(raw)).convert("RGB")
                # Center-crop to square
                w, h = im.size
                side = min(w, h)
                im = im.crop(((w - side) // 2, (h - side) // 2, (w + side) // 2, (h + side) // 2))
                im = im.resize((photo_box[2] - photo_box[0], photo_box[3] - photo_box[1]))
                # Rounded corners via mask
                mask = Image.new("L", im.size, 0)
                ImageDraw.Draw(mask).rounded_rectangle((0, 0, im.size[0], im.size[1]), radius=24, fill=255)
                bg.paste(im, (photo_box[0], photo_box[1]), mask)
            except Exception:
                pass

    d = ImageDraw.Draw(bg)
    # "ΝΕΟ ΜΕΛΟΣ!" banner
    label_font = _load_font(36)
    title_font = _load_font(78)
    sub_font = _load_font(36)
    foot_font = _load_font(28)

    d.text((75, 90), "ΝΕΟ ΜΕΛΟΣ!", font=label_font, fill=(245, 166, 35))
    # Player name (wrap to two lines if needed) — strip Greek accents BEFORE upper-casing
    name_upper = _strip_greek_accents((name or "").upper())
    parts = name_upper.split(" ")
    if len(parts) > 1 and len(name_upper) > 18:
        line1 = " ".join(parts[: len(parts) // 2])
        line2 = " ".join(parts[len(parts) // 2 :])
        d.text((75, 160), line1, font=title_font, fill=(255, 255, 255))
        d.text((75, 250), line2, font=title_font, fill=(255, 255, 255))
        y_after = 360
    else:
        d.text((75, 180), name_upper, font=title_font, fill=(255, 255, 255))
        y_after = 290

    # Subtitle: position + number
    sub_bits = []
    if number is not None:
        sub_bits.append(f"#{number}")
    if position:
        sub_bits.append(_strip_greek_accents(position.upper()))
    if sub_bits:
        d.text((75, y_after), " · ".join(sub_bits), font=sub_font, fill=(200, 200, 200))

    # Footer brand
    d.text((75, H - 70), "LEFTERIA FC · lefteriafc.cy", font=foot_font, fill=(120, 120, 120))

    buf = io.BytesIO()
    bg.save(buf, format="PNG", optimize=True)
    return buf.getvalue()
