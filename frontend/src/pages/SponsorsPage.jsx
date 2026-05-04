import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { ExternalLink, ChevronRight, Handshake, Crown, Award, Medal, Heart } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const imgUrl = (url) => url ? (url.startsWith("http") ? url : `${process.env.REACT_APP_BACKEND_URL}${url}`) : null;

const LEVEL_CONFIG = {
  mega: { label: "MEGA SPONSOR", icon: Crown, color: "#F5A623", bg: "rgba(245,166,35,0.12)" },
  gold: { label: "GOLD SPONSOR", icon: Award, color: "#EAB308", bg: "rgba(234,179,8,0.12)" },
  silver: { label: "SILVER SPONSOR", icon: Medal, color: "#94A3B8", bg: "rgba(148,163,184,0.12)" },
  supporter: { label: "SUPPORTER", icon: Heart, color: "#10B981", bg: "rgba(16,185,129,0.12)" },
};

const LEVEL_ORDER = ["mega", "gold", "silver", "supporter"];

export const SponsorsPage = ({ type }) => {
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/sponsors?type=${type}`).then(res => {
      setSponsors(res.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [type]);

  const isFirstTeam = type === "first_team";
  const title = isFirstTeam ? "ΧΟΡΗΓΟΙ ΠΡΩΤΗΣ ΟΜΑΔΑΣ" : "ΧΟΡΗΓΟΙ ΑΚΑΔΗΜΙΑΣ";
  const subtitle = isFirstTeam
    ? "Οι χορηγοί που στηρίζουν την πρώτη ομάδα της Lefteria FC."
    : "Οι χορηγοί που στηρίζουν την Ακαδημία της Lefteria FC.";

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-black" data-testid="sponsors-page">
      {/* Hero */}
      <section className="relative py-32 px-6 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-[#F5A623]/5 via-transparent to-transparent" />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F5A623]/10 border border-[#F5A623]/20 mb-6">
            <Handshake size={16} className="text-[#F5A623]" />
            <span className="text-[#F5A623] text-sm font-medium tracking-wider">ΧΟΡΗΓΟΙ</span>
          </div>
          <h1 className="font-['Bebas_Neue'] text-4xl md:text-6xl text-white mb-4 tracking-wide">{title}</h1>
          <p className="text-zinc-400 text-lg">{subtitle}</p>
        </div>
      </section>

      {/* Sponsors by Level */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        {LEVEL_ORDER.map(level => {
          const lvl = LEVEL_CONFIG[level];
          const levelSponsors = sponsors.filter(s => s.level === level);
          if (levelSponsors.length === 0) return null;
          return (
            <div key={level} className="mb-12" data-testid={`sponsor-level-${level}`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: lvl.bg }}>
                  <lvl.icon size={20} style={{ color: lvl.color }} />
                </div>
                <h2 className="font-['Bebas_Neue'] text-3xl tracking-wider" style={{ color: lvl.color }}>{lvl.label}</h2>
              </div>
              <div className={`grid gap-4 ${level === "mega" ? "md:grid-cols-1" : level === "gold" ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
                {levelSponsors.map(sponsor => (
                  <Link
                    key={sponsor.id}
                    to={`/sponsors/${sponsor.id}`}
                    className={`group bg-[#111] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-white/10 transition-all ${level === "mega" ? "p-8 flex items-center gap-8" : "p-6"}`}
                    data-testid={`sponsor-card-${sponsor.id}`}
                  >
                    {sponsor.logo_url && (
                      <div className={`${level === "mega" ? "w-40 h-32" : "w-full h-28 mb-4"} bg-white/5 rounded-xl flex items-center justify-center overflow-hidden`}>
                        <img src={imgUrl(sponsor.logo_url)} alt={sponsor.name} className="max-w-full max-h-full object-contain p-3" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-['Bebas_Neue'] text-xl text-white group-hover:text-[#F5A623] transition-colors">{sponsor.name}</h3>
                      {sponsor.description && <p className="text-zinc-400 text-sm mt-2 line-clamp-2">{sponsor.description}</p>}
                      <div className="flex items-center gap-1 mt-3 text-[#F5A623] text-sm">
                        Περισσότερα <ChevronRight size={14} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}

        {sponsors.length === 0 && (
          <div className="text-center py-20">
            <Handshake size={48} className="text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500 text-lg">Δεν υπάρχουν ακόμα χορηγοί</p>
            <Link to="/contact" className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-[#F5A623] text-black font-semibold rounded-xl hover:bg-[#e6951a] transition-colors">
              Γίνε Χορηγός
            </Link>
          </div>
        )}

        {/* CTA */}
        {sponsors.length > 0 && (
          <div className="mt-12 text-center border-t border-white/[0.06] pt-12">
            <h3 className="font-['Bebas_Neue'] text-3xl text-white mb-3">ΘΕΛΕΙΣ ΝΑ ΓΙΝΕΙΣ ΧΟΡΗΓΟΣ;</h3>
            <p className="text-zinc-400 mb-6">Επικοινώνησε μαζί μας για να μάθεις πώς μπορείς να στηρίξεις τη Lefteria FC.</p>
            <Link to="/contact" className="inline-flex items-center gap-2 px-8 py-3 bg-[#F5A623] text-black font-semibold rounded-xl hover:bg-[#e6951a] transition-colors">
              Επικοινωνία <ChevronRight size={16} />
            </Link>
          </div>
        )}
      </section>
    </div>
  );
};

export const SponsorDetailPage = () => {
  const { sponsorId } = useParams();
  const [sponsor, setSponsor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/sponsors/${sponsorId}`).then(res => {
      setSponsor(res.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [sponsorId]);

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!sponsor) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-zinc-500">Ο χορηγός δεν βρέθηκε</p>
    </div>
  );

  const lvl = LEVEL_CONFIG[sponsor.level] || LEVEL_CONFIG.supporter;
  const isFirstTeam = sponsor.sponsor_type === "first_team";

  return (
    <div className="min-h-screen bg-black" data-testid="sponsor-detail-page">
      <section className="max-w-4xl mx-auto px-6 py-32">
        {/* Back */}
        <Link
          to={isFirstTeam ? "/sponsors/first-team" : "/sponsors/academy"}
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-[#F5A623] text-sm mb-8 transition-colors"
        >
          ← {isFirstTeam ? "Χορηγοί Πρώτης Ομάδας" : "Χορηγοί Ακαδημίας"}
        </Link>

        {/* Sponsor Header */}
        <div className="bg-[#111] border border-white/[0.06] rounded-2xl overflow-hidden">
          {sponsor.banner_url && (
            <div className="h-48 md:h-64 overflow-hidden">
              <img src={imgUrl(sponsor.banner_url)} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-8 md:p-12">
            <div className="flex items-start gap-6 mb-6">
              {sponsor.logo_url && (
                <div className="w-24 h-24 bg-white/5 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/[0.06]">
                  <img src={imgUrl(sponsor.logo_url)} alt={sponsor.name} className="max-w-full max-h-full object-contain p-2" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: lvl.bg, color: lvl.color }}>
                    <lvl.icon size={12} />
                    {lvl.label}
                  </span>
                  <span className="text-xs text-zinc-500">{isFirstTeam ? "Πρώτη Ομάδα" : "Ακαδημία"}</span>
                </div>
                <h1 className="font-['Bebas_Neue'] text-4xl md:text-5xl text-white">{sponsor.name}</h1>
              </div>
            </div>

            {sponsor.description && (
              <div className="prose prose-invert max-w-none mb-8">
                <p className="text-zinc-300 leading-relaxed whitespace-pre-line">{sponsor.description}</p>
              </div>
            )}

            {sponsor.website && (
              <a
                href={sponsor.website.startsWith("http") ? sponsor.website : `https://${sponsor.website}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#F5A623] text-black font-semibold rounded-xl hover:bg-[#e6951a] transition-colors"
                data-testid="sponsor-website-link"
              >
                <ExternalLink size={16} />
                Επίσκεψη Ιστοσελίδας
              </a>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default SponsorsPage;
