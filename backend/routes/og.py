"""Open Graph share endpoints — return crawler-friendly HTML with OG tags
so that links shared on WhatsApp/Facebook/iMessage/Twitter display a rich
preview card (photo + name + role/position).

Humans visiting these URLs get a meta-refresh redirect to the real React page.
Crawlers stop at the HTML and read the OG tags.
"""
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import HTMLResponse, Response
import html as _html
import io
import os
from datetime import datetime, timezone
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

    async def _club_logo_url() -> str | None:
        try:
            club = await db.club_profile.find_one({}, {"_id": 0, "logo_url": 1})
            return (club or {}).get("logo_url")
        except Exception:
            return None

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
        logo_url = await _club_logo_url()
        png = _render_announce_card(name, pos, number, img_url, logo_url=logo_url)
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
        logo_url = await _club_logo_url()
        png = _render_announce_card(name, role, None, img_url, logo_url=logo_url)
        return Response(content=png, media_type="image/png", headers={"Cache-Control": "public, max-age=3600"})

    # ===== Birthday card =====
    @router.get("/player/{player_id}/birthday", response_class=HTMLResponse)
    async def og_player_birthday(player_id: str):
        if "--" in player_id:
            player_id = player_id.rsplit("--", 1)[-1]
        p = await db.players.find_one({"id": player_id}, {"_id": 0})
        if not p:
            raise HTTPException(status_code=404, detail="Player not found")
        site = _site_url(os.environ.get("OG_HOST", "lefteriafc.cy"))
        name = p.get("name", "Παίκτης")
        age = _calc_age(p.get("date_of_birth", ""))
        title = f"Χρόνια Πολλά, {name}!"
        desc = f"Η οικογένεια LEFTERIA FC εύχεται στον/στην {name}" + (f" για τα {age}α γενέθλια!" if age else " χρόνια πολλά!")
        slug = _slug(name)
        canonical = f"{site}/api/og/player/{player_id}/birthday"
        spa_path = f"/player/{slug}--{player_id}" if slug else f"/player/{player_id}"
        redirect_to = f"{site}{spa_path}"
        image = f"{site}/api/og/player/{player_id}/birthday.png?fmt=landscape"
        return HTMLResponse(_render(title, desc, image, canonical, redirect_to))

    @router.get("/player/{player_id}/birthday.png")
    async def og_player_birthday_png(player_id: str, fmt: str = Query("landscape", regex="^(landscape|square|story)$")):
        if "--" in player_id:
            player_id = player_id.rsplit("--", 1)[-1]
        p = await db.players.find_one({"id": player_id}, {"_id": 0})
        if not p:
            raise HTTPException(status_code=404, detail="Player not found")
        site = _site_url(os.environ.get("OG_HOST", "lefteriafc.cy"))
        name = p.get("name", "")
        age = _calc_age(p.get("date_of_birth", ""))
        img_url = _abs_image(p.get("image_url"), site)
        team_type = p.get("team_type", "First Team")
        logo_url = await _club_logo_url()
        png = _render_birthday_card(name, age, img_url, team_type, fmt, logo_url=logo_url)
        return Response(content=png, media_type="image/png", headers={"Cache-Control": "public, max-age=3600"})

    # ===== Staff birthday card =====
    @router.get("/staff/{staff_id}/birthday", response_class=HTMLResponse)
    async def og_staff_birthday(staff_id: str):
        if "--" in staff_id:
            staff_id = staff_id.rsplit("--", 1)[-1]
        s = await db.staff.find_one({"id": staff_id}, {"_id": 0})
        if not s:
            raise HTTPException(status_code=404, detail="Staff not found")
        site = _site_url(os.environ.get("OG_HOST", "lefteriafc.cy"))
        name = s.get("name", "Μέλος")
        age = _calc_age(s.get("date_of_birth", ""))
        title = f"Χρόνια Πολλά, {name}!"
        desc = f"Η οικογένεια LEFTERIA FC εύχεται στον/στην {name}" + (f" για τα {age}α γενέθλια!" if age else " χρόνια πολλά!")
        slug = _slug(name)
        canonical = f"{site}/api/og/staff/{staff_id}/birthday"
        spa_path = f"/staff/{slug}--{staff_id}" if slug else f"/staff/{staff_id}"
        redirect_to = f"{site}{spa_path}"
        image = f"{site}/api/og/staff/{staff_id}/birthday.png?fmt=landscape"
        return HTMLResponse(_render(title, desc, image, canonical, redirect_to))

    @router.get("/staff/{staff_id}/birthday.png")
    async def og_staff_birthday_png(staff_id: str, fmt: str = Query("landscape", regex="^(landscape|square|story)$")):
        if "--" in staff_id:
            staff_id = staff_id.rsplit("--", 1)[-1]
        s = await db.staff.find_one({"id": staff_id}, {"_id": 0})
        if not s:
            raise HTTPException(status_code=404, detail="Staff not found")
        site = _site_url(os.environ.get("OG_HOST", "lefteriafc.cy"))
        name = s.get("name", "")
        age = _calc_age(s.get("date_of_birth", ""))
        img_url = _abs_image(s.get("image_url"), site)
        team_type = s.get("team_type", "First Team")
        logo_url = await _club_logo_url()
        png = _render_birthday_card(name, age, img_url, team_type, fmt, logo_url=logo_url)
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
# Bundled font path — guarantees Greek glyph rendering regardless of host
# environment (Docker images may not include DejaVu / Liberation by default).
_BUNDLED_FONT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "fonts")
_FONT_CANDIDATES = [
    os.path.join(_BUNDLED_FONT_DIR, "LiberationSans-Bold.ttf"),
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


# ============================================================
# Shared helpers for card rendering
# ============================================================
# Brand palette
_BRAND_ORANGE = (245, 166, 35)
_BRAND_ORANGE_DEEP = (255, 140, 0)
_BRAND_TEXT = (255, 255, 255)
_BRAND_MUTED = (170, 170, 170)
_BRAND_DIM = (110, 110, 110)
_BRAND_BG = (8, 8, 12)


# Logo cache so we only hit the network once per process per URL.
_LOGO_CACHE: dict[str, bytes] = {}


def _get_logo_bytes(url: str | None) -> bytes | None:
    if not url:
        return None
    if url in _LOGO_CACHE:
        return _LOGO_CACHE[url]
    raw = _fetch_image_bytes(url)
    if raw:
        _LOGO_CACHE[url] = raw
    return raw


def _prep_logo(raw: bytes, size: int) -> Image.Image | None:
    """Prepare logo as RGBA, resized to fit `size` × `size`, preserving aspect."""
    try:
        im = Image.open(io.BytesIO(raw)).convert("RGBA")
        im.thumbnail((size, size), Image.LANCZOS)
        return im
    except Exception:
        return None


def _paint_radial(overlay: Image.Image, cx: int, cy: int, radius: int, color: tuple, max_alpha: int = 70):
    """Paint a soft radial glow centered at (cx, cy) into the RGBA overlay."""
    od = ImageDraw.Draw(overlay)
    for r in range(radius, 0, -6):
        alpha = max(0, int(max_alpha * (1 - r / radius) ** 1.6))
        if alpha <= 0:
            continue
        od.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(*color, alpha))


def _paint_dot_pattern(overlay: Image.Image, color: tuple, alpha: int, step: int = 36, dot_r: int = 2):
    """Paint a subtle dot grid pattern across the overlay."""
    od = ImageDraw.Draw(overlay)
    w, h = overlay.size
    for y in range(0, h, step):
        x_offset = (step // 2) if (y // step) % 2 else 0
        for x in range(x_offset, w, step):
            od.ellipse((x - dot_r, y - dot_r, x + dot_r, y + dot_r), fill=(*color, alpha))


def _paste_logo_watermark(bg: Image.Image, logo_url: str | None, size: int, pos: tuple, opacity: int = 200):
    """Paste a small semi-transparent club logo at `pos` (top-left anchor)."""
    raw = _get_logo_bytes(logo_url)
    if not raw:
        return
    logo = _prep_logo(raw, size)
    if logo is None:
        return
    # Apply opacity
    if opacity < 255:
        alpha = logo.split()[-1].point(lambda p: int(p * opacity / 255))
        logo.putalpha(alpha)
    bg.paste(logo, pos, logo)


def _draw_pill(d: ImageDraw.ImageDraw, x: int, y: int, w: int, h: int, fill, radius: int | None = None):
    r = radius or (h // 2)
    d.rounded_rectangle((x, y, x + w, y + h), radius=r, fill=fill)


def _draw_accent_line(d: ImageDraw.ImageDraw, x: int, y: int, w: int, h: int = 4, fill=_BRAND_ORANGE):
    d.rectangle((x, y, x + w, y + h), fill=fill)


def _render_announce_card(name: str, position: str, number, image_url: str | None, logo_url: str | None = None) -> bytes:
    """ΝΕΟ ΜΕΛΟΣ! card — modernized: diagonal accent stripe, photo on right with
    multi-layer ring, watermark logo, accent line under name."""
    W, H = 1200, 630
    bg = Image.new("RGB", (W, H), _BRAND_BG)

    # Layered background — radial glow from top-left + diagonal stripe accent
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    _paint_radial(overlay, -120, -120, int(W * 0.7), _BRAND_ORANGE, max_alpha=85)
    _paint_radial(overlay, W + 100, H + 100, int(W * 0.4), _BRAND_ORANGE_DEEP, max_alpha=55)
    _paint_dot_pattern(overlay, _BRAND_ORANGE, 8, step=40, dot_r=1)
    bg.paste(overlay, (0, 0), overlay)

    # Diagonal accent stripe on the left edge
    d = ImageDraw.Draw(bg, "RGBA")
    d.polygon([(0, 0), (28, 0), (4, H), (0, H)], fill=(*_BRAND_ORANGE, 220))

    # ============ Photo on the right (square w/ rounded corners + glow) ============
    photo_box = (W - 460, 90, W - 90, 460)
    pw, ph_ = photo_box[2] - photo_box[0], photo_box[3] - photo_box[1]
    if image_url:
        raw = _fetch_image_bytes(image_url)
        if raw:
            try:
                im = Image.open(io.BytesIO(raw)).convert("RGB")
                w, h = im.size
                side = min(w, h)
                im = im.crop(((w - side) // 2, (h - side) // 2, (w + side) // 2, (h + side) // 2))
                im = im.resize((pw, ph_))
                # Soft glow behind the photo
                glow = Image.new("RGBA", (pw + 60, ph_ + 60), (0, 0, 0, 0))
                gd = ImageDraw.Draw(glow)
                for off in range(30, 0, -3):
                    a = int(50 * (off / 30))
                    gd.rounded_rectangle((30 - off, 30 - off, pw + 30 + off, ph_ + 30 + off), radius=32, outline=(*_BRAND_ORANGE, a), width=3)
                bg.paste(glow, (photo_box[0] - 30, photo_box[1] - 30), glow)
                # Rounded photo
                mask = Image.new("L", im.size, 0)
                ImageDraw.Draw(mask).rounded_rectangle((0, 0, im.size[0], im.size[1]), radius=28, fill=255)
                bg.paste(im, (photo_box[0], photo_box[1]), mask)
                # Inner border accent
                d.rounded_rectangle((photo_box[0], photo_box[1], photo_box[2], photo_box[3]), radius=28, outline=(*_BRAND_ORANGE, 230), width=4)
            except Exception:
                pass

    # ============ Left-side text content ============
    label_font = _load_font(34)
    title_font = _load_font(78)
    sub_font = _load_font(34)
    foot_font = _load_font(26)

    LEFT = 75
    # "ΝΕΟ ΜΕΛΟΣ!" badge pill
    badge_text = "ΝΕΟ ΜΕΛΟΣ!"
    bbox = d.textbbox((0, 0), badge_text, font=label_font)
    bw = bbox[2] - bbox[0]
    bh = bbox[3] - bbox[1]
    pill_pad_x, pill_pad_y = 18, 10
    pill_w = bw + pill_pad_x * 2
    pill_h = bh + pill_pad_y * 2 + 8
    _draw_pill(d, LEFT, 80, pill_w, pill_h, _BRAND_ORANGE, radius=pill_h // 2)
    d.text((LEFT + pill_pad_x, 80 + pill_pad_y - 2), badge_text, font=label_font, fill=(0, 0, 0))

    # Player name
    name_upper = _strip_greek_accents((name or "").upper())
    parts = name_upper.split(" ")
    name_y0 = 170
    if len(parts) > 1 and len(name_upper) > 16:
        line1 = " ".join(parts[: len(parts) // 2])
        line2 = " ".join(parts[len(parts) // 2:])
        d.text((LEFT, name_y0), line1, font=title_font, fill=_BRAND_TEXT)
        d.text((LEFT, name_y0 + 90), line2, font=title_font, fill=_BRAND_TEXT)
        y_after = name_y0 + 200
    else:
        d.text((LEFT, name_y0 + 30), name_upper, font=title_font, fill=_BRAND_TEXT)
        y_after = name_y0 + 140

    # Accent line under name
    _draw_accent_line(d, LEFT, y_after + 8, 70, 4, _BRAND_ORANGE)

    # Subtitle: #number · position
    sub_bits = []
    if number is not None:
        sub_bits.append(f"#{number}")
    if position:
        sub_bits.append(_strip_greek_accents(position.upper()))
    if sub_bits:
        d.text((LEFT, y_after + 28), " · ".join(sub_bits), font=sub_font, fill=_BRAND_MUTED)

    # Watermark logo top-right (corner)
    _paste_logo_watermark(bg, logo_url, 70, (W - 70 - 30, 30), opacity=210)

    # Footer
    d.text((LEFT, H - 60), "LEFTERIA FC · lefteriafc.cy", font=foot_font, fill=_BRAND_DIM)

    buf = io.BytesIO()
    bg.save(buf, format="PNG", optimize=True)
    return buf.getvalue()



# ============================================================
# Birthday card image generator — supports multiple aspect ratios
# ============================================================
def _calc_age(dob: str) -> int | None:
    """Calculate age in years from YYYY-MM-DD string. Returns None on failure."""
    if not dob:
        return None
    try:
        d = datetime.strptime(dob[:10], "%Y-%m-%d")
        now = datetime.now(timezone.utc)
        age = now.year - d.year - ((now.month, now.day) < (d.month, d.day))
        return age if age > 0 else None
    except Exception:
        return None


_BIRTHDAY_SIZES = {
    "landscape": (1200, 630),   # Facebook / WhatsApp / Twitter feed
    "square":    (1080, 1080),  # Instagram feed
    "story":     (1080, 1920),  # Instagram / Facebook Story + TikTok / Reels
}


def _fit_photo_circle(raw: bytes, diameter: int) -> Image.Image | None:
    try:
        im = Image.open(io.BytesIO(raw)).convert("RGB")
        w, h = im.size
        side = min(w, h)
        im = im.crop(((w - side) // 2, (h - side) // 2, (w + side) // 2, (h + side) // 2))
        im = im.resize((diameter, diameter))
        mask = Image.new("L", (diameter, diameter), 0)
        ImageDraw.Draw(mask).ellipse((0, 0, diameter, diameter), fill=255)
        im.putalpha(mask)
        return im
    except Exception:
        return None


def _draw_text_centered(d: ImageDraw.ImageDraw, text: str, font, y: int, W: int, fill):
    bbox = d.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    d.text(((W - tw) // 2, y), text, font=font, fill=fill)


def _render_birthday_card(name: str, age, image_url: str | None, team_type: str, fmt: str, logo_url: str | None = None) -> bytes:
    W, H = _BIRTHDAY_SIZES.get(fmt, _BIRTHDAY_SIZES["landscape"])
    is_portrait = H > W

    # ============ Layered background ============
    bg = Image.new("RGB", (W, H), _BRAND_BG)
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    # Primary radial glow — top-center
    cx, cy = W // 2, int(H * (0.20 if is_portrait else 0.18))
    _paint_radial(overlay, cx, cy, int(max(W, H) * 0.6), _BRAND_ORANGE, max_alpha=95)
    # Secondary cooler accent — bottom-right corner
    _paint_radial(overlay, W + 50, H + 50, int(W * 0.45), _BRAND_ORANGE_DEEP, max_alpha=45)
    # Confetti-style dot pattern (subtle)
    _paint_dot_pattern(overlay, _BRAND_ORANGE, 14, step=int(min(W, H) * 0.05), dot_r=2)
    bg.paste(overlay, (0, 0), overlay)

    d = ImageDraw.Draw(bg, "RGBA")
    base = min(W, H)

    # ============ Fonts (proportional) ============
    f_pill   = _load_font(int(base * 0.034))
    f_title  = _load_font(int(base * 0.115))
    f_sub    = _load_font(int(base * 0.038))
    f_name   = _load_font(int(base * 0.074))
    f_age    = _load_font(int(base * 0.05))
    f_foot   = _load_font(int(base * 0.026))

    # ============ Top: small "ΓΕΝΕΘΛΙΑ" pill ============
    pill_text = "ΓΕΝΕΘΛΙΑ"
    pbbox = d.textbbox((0, 0), pill_text, font=f_pill)
    pw = pbbox[2] - pbbox[0]
    ph_ = pbbox[3] - pbbox[1]
    pad_x = int(base * 0.025)
    pad_y = int(base * 0.014)
    pill_w = pw + pad_x * 2
    pill_h = ph_ + pad_y * 2 + 6
    pill_x = (W - pill_w) // 2
    pill_y = int(H * (0.045 if is_portrait else 0.05))
    _draw_pill(d, pill_x, pill_y, pill_w, pill_h, (*_BRAND_ORANGE, 230))
    d.text((pill_x + pad_x, pill_y + pad_y - 2), pill_text, font=f_pill, fill=(0, 0, 0))

    # ============ Headline ============
    headline = "ΧΡΟΝΙΑ ΠΟΛΛΑ!"
    head_y = pill_y + pill_h + int(base * 0.025)
    _draw_text_centered(d, headline, f_title, head_y, W, _BRAND_ORANGE)

    # Underline accent under headline (centered)
    hbbox = d.textbbox((0, 0), headline, font=f_title)
    acc_w = int((hbbox[2] - hbbox[0]) * 0.18)
    acc_y = head_y + int(base * 0.13)
    d.rectangle(((W - acc_w) // 2, acc_y, (W + acc_w) // 2, acc_y + 4), fill=_BRAND_ORANGE)

    # Subtitle (team scope)
    sub_label = "LEFTERIA FC ΑΚΑΔΗΜΙΑ" if team_type == "Academy" else "LEFTERIA FC"
    sub_y = acc_y + int(base * 0.025)
    _draw_text_centered(d, sub_label, f_sub, sub_y, W, _BRAND_MUTED)

    # ============ Circular photo with double ring ============
    photo_diameter = int(base * (0.43 if is_portrait else 0.5))
    photo_cx = W // 2
    photo_cy = int(H * (0.45 if is_portrait else 0.5))
    if image_url:
        raw = _fetch_image_bytes(image_url)
        if raw:
            ph_img = _fit_photo_circle(raw, photo_diameter)
            if ph_img is not None:
                # Outer ring (thin, light)
                outer_pad = max(10, int(base * 0.022))
                outer_box = (photo_cx - photo_diameter // 2 - outer_pad,
                             photo_cy - photo_diameter // 2 - outer_pad,
                             photo_cx + photo_diameter // 2 + outer_pad,
                             photo_cy + photo_diameter // 2 + outer_pad)
                d.ellipse(outer_box, outline=(*_BRAND_ORANGE, 90), width=max(2, int(base * 0.004)))
                # Inner ring (thick, solid)
                inner_pad = max(4, int(base * 0.010))
                inner_box = (photo_cx - photo_diameter // 2 - inner_pad,
                             photo_cy - photo_diameter // 2 - inner_pad,
                             photo_cx + photo_diameter // 2 + inner_pad,
                             photo_cy + photo_diameter // 2 + inner_pad)
                d.ellipse(inner_box, outline=_BRAND_ORANGE, width=max(4, int(base * 0.008)))
                bg.paste(ph_img, (photo_cx - photo_diameter // 2, photo_cy - photo_diameter // 2), ph_img)

    # ============ Name + age badge ============
    name_y = photo_cy + photo_diameter // 2 + int(base * (0.075 if is_portrait else 0.07))
    name_upper = _strip_greek_accents((name or "").upper())
    if d.textbbox((0, 0), name_upper, font=f_name)[2] > W - int(base * 0.1):
        parts = name_upper.split(" ")
        if len(parts) > 1:
            mid = len(parts) // 2
            line1 = " ".join(parts[:mid])
            line2 = " ".join(parts[mid:])
            _draw_text_centered(d, line1, f_name, name_y, W, _BRAND_TEXT)
            _draw_text_centered(d, line2, f_name, name_y + int(base * 0.09), W, _BRAND_TEXT)
            name_h_total = int(base * 0.18)
        else:
            _draw_text_centered(d, name_upper, f_name, name_y, W, _BRAND_TEXT)
            name_h_total = int(base * 0.09)
    else:
        _draw_text_centered(d, name_upper, f_name, name_y, W, _BRAND_TEXT)
        name_h_total = int(base * 0.09)

    if age:
        age_text = f"{age} ΕΤΩΝ"
        abbox = d.textbbox((0, 0), age_text, font=f_age)
        a_w = abbox[2] - abbox[0]
        a_h = abbox[3] - abbox[1]
        a_pad_x = int(base * 0.03)
        a_pad_y = int(base * 0.013)
        badge_w = a_w + a_pad_x * 2
        badge_h = a_h + a_pad_y * 2 + 6
        badge_x = (W - badge_w) // 2
        badge_y = name_y + name_h_total + int(base * 0.025)
        # Pill background — dark with orange border
        _draw_pill(d, badge_x, badge_y, badge_w, badge_h, (0, 0, 0, 180))
        d.rounded_rectangle((badge_x, badge_y, badge_x + badge_w, badge_y + badge_h),
                            radius=badge_h // 2, outline=_BRAND_ORANGE, width=3)
        d.text((badge_x + a_pad_x, badge_y + a_pad_y - 2), age_text, font=f_age, fill=_BRAND_ORANGE)

    # ============ Watermark logo (top-left) ============
    logo_size = int(base * 0.075)
    _paste_logo_watermark(bg, logo_url, logo_size, (int(base * 0.025), int(base * 0.025)), opacity=200)

    # ============ Footer with divider ============
    foot_y = H - int(base * 0.06)
    # subtle divider line
    div_y = foot_y - int(base * 0.018)
    div_w = int(W * 0.3)
    d.rectangle(((W - div_w) // 2, div_y, (W + div_w) // 2, div_y + 1), fill=(*_BRAND_DIM, 180))
    _draw_text_centered(d, "LEFTERIA FC · lefteriafc.cy", f_foot, foot_y, W, _BRAND_DIM)

    buf = io.BytesIO()
    bg.save(buf, format="PNG", optimize=True)
    return buf.getvalue()
