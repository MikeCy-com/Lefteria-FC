import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Crown, Award, ChevronRight, Globe } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const imgUrl = (url) => url ? (url.startsWith("http") ? url : `${process.env.REACT_APP_BACKEND_URL}${url}`) : null;

const LEVEL_META = {
  mega: { label: "MEGA SPONSOR", Icon: Crown, color: "#F5A623" },
  gold: { label: "GOLD SPONSOR", Icon: Award, color: "#EAB308" },
};

// Auto-rotating spotlight that highlights Mega + Gold sponsors on the homepage.
const SponsorSpotlight = () => {
  const [sponsors, setSponsors] = useState([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/sponsors?type=first_team`).catch(() => ({ data: [] })),
      axios.get(`${API}/sponsors?type=academy`).catch(() => ({ data: [] })),
    ]).then(([ft, ac]) => {
      const all = [...(ft.data || []), ...(ac.data || [])];
      const featured = all.filter(s => s.level === "mega" || s.level === "gold");
      // Mega first, then gold; respect display_order within each
      featured.sort((a, b) => {
        if (a.level !== b.level) return a.level === "mega" ? -1 : 1;
        return (a.display_order || 0) - (b.display_order || 0);
      });
      setSponsors(featured);
    });
  }, []);

  // Rotate every 6 seconds
  useEffect(() => {
    if (sponsors.length <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % sponsors.length), 6000);
    return () => clearInterval(t);
  }, [sponsors.length]);

  const current = useMemo(() => sponsors[idx] || null, [sponsors, idx]);
  if (!current) return null;
  const meta = LEVEL_META[current.level] || LEVEL_META.gold;
  const Icon = meta.Icon;
  const detailHref = `/sponsors/${current.id}`;

  return (
    <section className="py-16 px-4 md:px-6 bg-gradient-to-b from-[#0a0a0a] to-black border-y border-[#1a1a1a]" data-testid="sponsor-spotlight">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="badge badge-secondary mb-3">Στηρίζουν τη Λευτερια FC</span>
            <h2 className="font-['Bebas_Neue'] text-3xl md:text-4xl text-white tracking-wide">
              Οι <span className="text-[#F5A623]">Χορηγοι</span> μας
            </h2>
          </div>
          <div className="hidden md:flex gap-2">
            {sponsors.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setIdx(i)}
                aria-label={`spotlight-${i}`}
                data-testid={`spotlight-dot-${i}`}
                className={`w-2 h-2 rounded-full transition-all ${i === idx ? 'bg-[#F5A623] w-8' : 'bg-zinc-700 hover:bg-zinc-500'}`}
              />
            ))}
          </div>
        </div>

        <Link
          to={detailHref}
          className="group grid md:grid-cols-[280px_1fr] gap-6 lg:gap-10 items-stretch bg-[#0a0a0a] border border-[#1e1e1e] hover:border-[#F5A623]/40 rounded-xl overflow-hidden transition-all"
          data-testid={`spotlight-card-${current.id}`}
          key={current.id}
        >
          {/* Logo column */}
          <div className="bg-white/[0.04] flex items-center justify-center p-8 md:p-10 border-b md:border-b-0 md:border-r border-[#1e1e1e]">
            {current.logo_url ? (
              <img src={imgUrl(current.logo_url)} alt={current.name} className="max-w-full max-h-32 md:max-h-40 object-contain" />
            ) : (
              <div className="font-['Bebas_Neue'] text-4xl text-zinc-600">{current.name?.charAt(0)}</div>
            )}
          </div>

          {/* Content */}
          <div className="p-6 md:p-10 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold border" style={{ borderColor: `${meta.color}40`, color: meta.color, backgroundColor: `${meta.color}10` }}>
                <Icon size={12} />
                {meta.label}
              </span>
              <span className="text-zinc-500 text-xs">{current.sponsor_type === "academy" ? "Ακαδημια" : "Πρωτη Ομαδα"}</span>
            </div>
            <h3 className="font-['Bebas_Neue'] text-3xl md:text-5xl text-white group-hover:text-[#F5A623] transition-colors tracking-wide">
              {current.name}
            </h3>
            {current.description && (
              <p className="text-zinc-400 leading-relaxed mt-3 line-clamp-3 max-w-2xl">{current.description}</p>
            )}
            <div className="flex items-center gap-4 mt-5">
              <span className="inline-flex items-center gap-1.5 text-[#F5A623] text-sm font-medium">
                Δειτε Περισσοτερα <ChevronRight size={14} />
              </span>
              {current.website && (
                <span className="text-zinc-500 text-xs flex items-center gap-1">
                  <Globe size={11} /> {current.website}
                </span>
              )}
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
};

export default SponsorSpotlight;
