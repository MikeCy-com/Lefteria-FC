// Utility helpers for player display & routing on the website.
// IMPORTANT: this file is intentionally NOT used by the mobile app — only the public website.

export const stripGreekAccents = (str = "") =>
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// Slug-friendly name (Latin + Greek, kebab-case, lowercase).
export const slugifyPlayerName = (name = "") => {
  const cleaned = stripGreekAccents(name).toLowerCase().trim();
  // Keep latin letters, greek lowercase, digits; collapse the rest into "-"
  const slug = cleaned.replace(/[^a-z0-9\u03B1-\u03C9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug;
};

// Build a public player URL with a human-readable slug appended to the UUID.
// Format: /player/<slug>--<uuid>     (separator "--" is unambiguous because UUIDs use single "-")
export const playerLink = (player) => {
  if (!player?.id) return "#";
  const slug = slugifyPlayerName(player.name);
  return slug ? `/player/${slug}--${player.id}` : `/player/${player.id}`;
};

// Extract the UUID from a route param produced by `playerLink`.
// Falls back to the raw param if no "--" separator is present (back-compat for old links).
export const extractPlayerId = (param = "") => {
  const idx = param.lastIndexOf("--");
  return idx >= 0 ? param.slice(idx + 2) : param;
};

// Public-website privacy formatter for Academy (kid) players:
// Show the full first name + only the first 2 letters of the last name + a dot.
// "Πετρος Νικολαου"  → "Πετρος Νι."
// "John Doe"         → "John Do."
// "Maria"            → "Maria"  (single name → unchanged)
export const formatAcademyDisplayName = (name = "") => {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;
  const first = parts[0];
  const last = parts.slice(1).join(" ");
  const trimmedLast = last.slice(0, 2);
  return `${first} ${trimmedLast}.`;
};

// Staff profile URL with human-readable slug + UUID (same scheme as playerLink).
export const staffLink = (staff) => {
  if (!staff?.id) return "#";
  const slug = slugifyPlayerName(staff.name);
  return slug ? `/staff/${slug}--${staff.id}` : `/staff/${staff.id}`;
};

// Extract UUID from a staff route param (same scheme as extractPlayerId).
export const extractStaffId = (param = "") => {
  const idx = param.lastIndexOf("--");
  return idx >= 0 ? param.slice(idx + 2) : param;
};
