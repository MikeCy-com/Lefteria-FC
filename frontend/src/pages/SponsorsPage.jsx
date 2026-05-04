import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { ExternalLink, ChevronRight, Handshake, Crown, Award, Medal, Heart, Globe, MapPin, Phone, Mail, Calendar, ArrowLeft } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const imgUrl = (url) => url ? (url.startsWith("http") ? url : `${process.env.REACT_APP_BACKEND_URL}${url}`) : null;

const LEVEL_CONFIG = {
  mega: { label: "MEGA SPONSOR", icon: Crown, color: "#F5A623" },
  gold: { label: "GOLD SPONSOR", icon: Award, color: "#EAB308" },
  silver: { label: "SILVER SPONSOR", icon: Medal, color: "#94A3B8" },
  supporter: { label: "SUPPORTER", icon: Heart, color: "#10B981" },
};

const LEVEL_ORDER = ["mega", "gold", "silver", "supporter"];

export const SponsorsPage = ({ type }) => {
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/sponsors?type=${type}`).then(res => {
      setSponsors(res.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [type]);

  const isFirstTeam = type === "first_team";
  const title = isFirstTeam ? "ΠΡΩΤΗΣ ΟΜΑΔΑΣ" : "ΑΚΑΔΗΜΙΑΣ";

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-black" data-testid="sponsors-page">
      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <span className="text-[#F5A623] text-sm font-medium tracking-[0.3em] block mb-4">LEFTERIA FC</span>
          <h1 className="font-['Bebas_Neue'] text-5xl md:text-7xl text-white tracking-wide">
            ΧΟΡΗΓΟΙ <span className="text-[#F5A623]">{title}</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mt-6 leading-relaxed">
            {isFirstTeam
              ? "Οι χορηγοί που στηρίζουν την πρώτη ομάδα της Lefteria FC και συμβάλλουν στην ανάπτυξη του συλλόγου."
              : "Οι χορηγοί που στηρίζουν την Ακαδημία Lefteria FC και επενδύουν στο μέλλον του κυπριακού ποδοσφαίρου."
            }
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6"><div className="h-px bg-[#262626]" /></div>

      {/* Sponsors by Level */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          {LEVEL_ORDER.map(level => {
            const lvl = LEVEL_CONFIG[level];
            const levelSponsors = sponsors.filter(s => s.level === level);
            if (levelSponsors.length === 0) return null;
            return (
              <div key={level} className="mb-16" data-testid={`sponsor-level-${level}`}>
                <div className="flex items-center gap-3 mb-2">
                  <lvl.icon size={20} style={{ color: lvl.color }} />
                  <h2 className="font-['Bebas_Neue'] text-2xl tracking-wider" style={{ color: lvl.color }}>{lvl.label}</h2>
                </div>
                <div className="w-12 h-1 mb-8" style={{ backgroundColor: lvl.color }} />

                <div className={`grid gap-5 ${level === "mega" ? "grid-cols-1" : level === "gold" ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
                  {levelSponsors.map(sponsor => (
                    <Link
                      key={sponsor.id}
                      to={`/sponsors/${sponsor.id}`}
                      className={`group bg-[#111] border border-[#262626] rounded-lg overflow-hidden hover:border-[#F5A623]/30 transition-all ${
                        level === "mega" ? "flex items-center" : ""
                      }`}
                      data-testid={`sponsor-card-${sponsor.id}`}
                    >
                      {sponsor.logo_url && (
                        <div className={`${level === "mega" ? "w-48 h-36 flex-shrink-0" : "w-full h-32"} bg-white/[0.03] flex items-center justify-center overflow-hidden border-b border-[#262626] ${level === "mega" ? "border-b-0 border-r" : ""}`}>
                          <img src={imgUrl(sponsor.logo_url)} alt={sponsor.name} className="max-w-[70%] max-h-[70%] object-contain" />
                        </div>
                      )}
                      <div className="p-6 flex-1">
                        <h3 className="font-['Bebas_Neue'] text-xl text-white group-hover:text-[#F5A623] transition-colors">{sponsor.name}</h3>
                        {sponsor.description && <p className="text-zinc-500 text-sm mt-2 line-clamp-2 leading-relaxed">{sponsor.description}</p>}
                        {sponsor.website && (
                          <p className="text-zinc-600 text-xs mt-3 flex items-center gap-1"><Globe size={11} /> {sponsor.website}</p>
                        )}
                        <span className="flex items-center gap-1 mt-4 text-[#F5A623] text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                          Δες περισσότερα <ChevronRight size={14} />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}

          {sponsors.length === 0 && (
            <div className="py-20">
              <Handshake size={48} className="text-zinc-800 mb-4" />
              <h3 className="font-['Bebas_Neue'] text-2xl text-white mb-2">ΔΕΝ ΥΠΑΡΧΟΥΝ ΑΚΟΜΑ ΧΟΡΗΓΟΙ</h3>
              <p className="text-zinc-500 mb-6">Θέλεις να στηρίξεις τη Lefteria FC; Επικοινώνησε μαζί μας.</p>
              <Link to="/contact" className="inline-flex items-center gap-2 px-8 py-3 bg-[#F5A623] text-black font-semibold rounded hover:bg-[#e6951a] transition-colors">
                ΓΙΝΕ ΧΟΡΗΓΟΣ <ChevronRight size={16} />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      {sponsors.length > 0 && (
        <>
          <div className="max-w-7xl mx-auto px-6"><div className="h-px bg-[#262626]" /></div>
          <section className="py-16 px-6">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <h3 className="font-['Bebas_Neue'] text-3xl text-white">ΘΕΛΕΙΣ ΝΑ ΓΙΝΕΙΣ <span className="text-[#F5A623]">ΧΟΡΗΓΟΣ;</span></h3>
                <p className="text-zinc-500 mt-2">Επικοινώνησε μαζί μας για να μάθεις πώς μπορείς να στηρίξεις τη Lefteria FC.</p>
              </div>
              <Link to="/contact" className="inline-flex items-center gap-2 px-8 py-3 bg-[#F5A623] text-black font-semibold rounded hover:bg-[#e6951a] transition-colors flex-shrink-0">
                ΕΠΙΚΟΙΝΩΝΙΑ <ChevronRight size={16} />
              </Link>
            </div>
          </section>
        </>
      )}
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
    <div className="min-h-screen bg-black pt-32 px-6">
      <div className="max-w-7xl mx-auto">
        <p className="text-zinc-500 text-lg">Ο χορηγός δεν βρέθηκε.</p>
        <Link to="/sponsors/first-team" className="text-[#F5A623] text-sm mt-4 inline-block">← Πίσω στους χορηγούς</Link>
      </div>
    </div>
  );

  const lvl = LEVEL_CONFIG[sponsor.level] || LEVEL_CONFIG.supporter;
  const isFirstTeam = sponsor.sponsor_type === "first_team";
  const backPath = isFirstTeam ? "/sponsors/first-team" : "/sponsors/academy";
  const backLabel = isFirstTeam ? "Χορηγοί Πρώτης Ομάδας" : "Χορηγοί Ακαδημίας";

  return (
    <div className="min-h-screen bg-black" data-testid="sponsor-detail-page">
      {/* Banner */}
      {sponsor.banner_url && (
        <div className="relative h-64 md:h-80 overflow-hidden">
          <img src={imgUrl(sponsor.banner_url)} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        </div>
      )}

      <section className={`px-6 ${sponsor.banner_url ? "-mt-24 relative z-10" : "pt-32"}`}>
        <div className="max-w-7xl mx-auto">
          {/* Back Link */}
          <Link to={backPath} className="inline-flex items-center gap-2 text-zinc-500 hover:text-[#F5A623] text-sm mb-8 transition-colors" data-testid="back-to-sponsors">
            <ArrowLeft size={14} /> {backLabel}
          </Link>

          {/* Sponsor Header */}
          <div className="flex flex-col md:flex-row items-start gap-8 mb-12">
            {sponsor.logo_url && (
              <div className="w-32 h-32 md:w-40 md:h-40 bg-[#111] border border-[#262626] rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                <img src={imgUrl(sponsor.logo_url)} alt={sponsor.name} className="max-w-[75%] max-h-[75%] object-contain" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold border" style={{ borderColor: `${lvl.color}40`, color: lvl.color, backgroundColor: `${lvl.color}10` }}>
                  <lvl.icon size={12} />
                  {lvl.label}
                </span>
                <span className="text-zinc-600 text-xs">{isFirstTeam ? "Πρώτη Ομάδα" : "Ακαδημία"}</span>
              </div>
              <h1 className="font-['Bebas_Neue'] text-4xl md:text-6xl text-white tracking-wide">{sponsor.name}</h1>
              {sponsor.website && (
                <a
                  href={sponsor.website.startsWith("http") ? sponsor.website : `https://${sponsor.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-[#F5A623] text-sm mt-3 hover:underline"
                >
                  <Globe size={14} /> {sponsor.website}
                </a>
              )}
            </div>
          </div>

          <div className="h-px bg-[#262626] mb-12" />

          {/* Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8 pb-16">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {sponsor.description && (
                <div>
                  <h2 className="font-['Bebas_Neue'] text-2xl text-white mb-2">ΣΧΕΤΙΚΑ ΜΕ ΤΟΝ <span className="text-[#F5A623]">ΧΟΡΗΓΟ</span></h2>
                  <div className="w-12 h-1 bg-[#F5A623] mb-6" />
                  <p className="text-zinc-400 leading-relaxed whitespace-pre-line">{sponsor.description}</p>
                </div>
              )}

              {/* Partnership Info */}
              <div className="mt-12">
                <h2 className="font-['Bebas_Neue'] text-2xl text-white mb-2">ΣΥΝΕΡΓΑΣΙΑ ΜΕ <span className="text-[#F5A623]">LEFTERIA FC</span></h2>
                <div className="w-12 h-1 bg-[#F5A623] mb-6" />
                <div className="bg-[#111] border border-[#262626] rounded-lg p-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <lvl.icon size={18} style={{ color: lvl.color }} />
                      <div>
                        <p className="text-zinc-600 text-xs">Επίπεδο Χορηγίας</p>
                        <p className="text-white text-sm font-medium">{lvl.label}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Handshake size={18} className="text-zinc-500" />
                      <div>
                        <p className="text-zinc-600 text-xs">Κατηγορία</p>
                        <p className="text-white text-sm font-medium">{isFirstTeam ? "Πρώτη Ομάδα" : "Ακαδημία"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar size={18} className="text-zinc-500" />
                      <div>
                        <p className="text-zinc-600 text-xs">Σεζόν</p>
                        <p className="text-white text-sm font-medium">2025/26</p>
                      </div>
                    </div>
                    {sponsor.website && (
                      <div className="flex items-center gap-3">
                        <Globe size={18} className="text-zinc-500" />
                        <div>
                          <p className="text-zinc-600 text-xs">Ιστοσελίδα</p>
                          <a href={sponsor.website.startsWith("http") ? sponsor.website : `https://${sponsor.website}`} target="_blank" rel="noreferrer" className="text-[#F5A623] text-sm hover:underline">
                            {sponsor.website}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Sponsor Logo Card */}
              {sponsor.logo_url && (
                <div className="bg-[#111] border border-[#262626] rounded-lg p-8 flex items-center justify-center">
                  <img src={imgUrl(sponsor.logo_url)} alt={sponsor.name} className="max-w-full max-h-48 object-contain" />
                </div>
              )}

              {/* Visit Website CTA */}
              {sponsor.website && (
                <a
                  href={sponsor.website.startsWith("http") ? sponsor.website : `https://${sponsor.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-[#F5A623] text-black font-semibold rounded hover:bg-[#e6951a] transition-colors"
                  data-testid="sponsor-website-link"
                >
                  <ExternalLink size={16} />
                  ΕΠΙΣΚΕΨΗ ΙΣΤΟΣΕΛΙΔΑΣ
                </a>
              )}

              {/* Become a Sponsor CTA */}
              <div className="bg-[#111] border border-[#262626] rounded-lg p-6">
                <h4 className="font-['Bebas_Neue'] text-lg text-white mb-2">ΓΙΝΕ ΚΙ ΕΣΥ ΧΟΡΗΓΟΣ</h4>
                <p className="text-zinc-500 text-sm mb-4 leading-relaxed">Θέλεις να στηρίξεις τη Lefteria FC; Επικοινώνησε μαζί μας.</p>
                <Link to="/contact" className="flex items-center justify-center gap-2 w-full py-2.5 border border-[#F5A623] text-[#F5A623] font-semibold rounded hover:bg-[#F5A623]/10 transition-colors text-sm">
                  ΕΠΙΚΟΙΝΩΝΙΑ <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SponsorsPage;
