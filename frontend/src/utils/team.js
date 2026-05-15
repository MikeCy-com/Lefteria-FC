// Robust "is this our team?" helper — uses club profile name + greek_name as match needles.
// Works for any variant: "ΛΕΥΤΕΡΙΑ", "Λευτέρια FC", "LEFTERIA 2024", etc.
// Accents/case/punctuation/spacing are normalized away.

const normalizeTeamName = (s) => (s || "")
  .toUpperCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^A-Z0-9ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ]/g, "");

const FALLBACK_NEEDLES = ["ΛΕΥΤΕΡΙΑ", "LEFTERIA"].map(normalizeTeamName);

/**
 * Build a matcher from a club profile.
 * @param {{name?:string, greek_name?:string}|null} club
 * @returns {(name:string)=>boolean}
 */
export const buildIsOurTeam = (club) => {
  const candidates = [];
  if (club?.name) candidates.push(club.name);
  if (club?.greek_name) candidates.push(club.greek_name);
  // Also split greek_name on spaces — a 1-word greek_name like "ΛΕΥΤΕΡΙΑ" should match "ΛΕΥΤΕΡΙΑ 2024"
  const needles = candidates
    .flatMap((c) => [c, ...c.split(/\s+/)])
    .map(normalizeTeamName)
    .filter((n) => n.length >= 4); // avoid tiny tokens like "FC"
  const finalNeedles = needles.length ? needles : FALLBACK_NEEDLES;
  return (name) => {
    if (!name) return false;
    const n = normalizeTeamName(name);
    return finalNeedles.some((needle) => n.includes(needle));
  };
};

// Default (uses fallback needles "ΛΕΥΤΕΡΙΑ" / "LEFTERIA") for places that don't have club data
export const isOurTeam = buildIsOurTeam(null);
