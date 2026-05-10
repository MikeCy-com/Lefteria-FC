import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { ExternalLink, ChevronRight, Handshake, Crown, Award, Medal, Heart, Globe, Calendar, ArrowLeft } from "lucide-react";

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
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <span className="badge badge-secondary mb-4">Lefteria FC</span>
          <h1 className="font-['Bebas_Neue'] text-5xl md:text-7xl text-white tracking-wide">
            ΧΟΡΗΓΟΙ <span className="text-[#F5A623]">{title}</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mt-6 leading-relaxed">
            {isFirstTeam
              ? "Οι χορηγοι που στηριζουν την πρωτη ομαδα της Lefteria FC και συμβαλλουν στην αναπτυξη του συλλογου."
              : "Οι χορηγοι που στηριζουν την Ακαδημια Lefteria FC και επενδυουν στο μελλον του κυπριακου ποδοσφαιρου."
            }
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6"><div className="h-px bg-[#262626]" /></div>

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
                      className={`group bg-[#111] border border-[#262626] rounded-lg overflow-hidden hover:border-[#F5A623]/30 transition-all ${level === "mega" ? "flex items-center" : ""}`}
                      data-testid={`sponsor-card-${sponsor.id}`}
                    >
                      {sponsor.logo_url && (
                        <div className={`${level === "mega" ? "w-48 h-36 flex-shrink-0 border-r" : "w-full h-32 border-b"} border-[#262626] bg-white/[0.03] flex items-center justify-center overflow-hidden`}>
                          <img src={imgUrl(sponsor.logo_url)} alt={sponsor.name} className="max-w-[70%] max-h-[70%] object-contain" />
                        </div>
                      )}
                      <div className="p-6 flex-1">
                        <h3 className="font-['Bebas_Neue'] text-xl text-white group-hover:text-[#F5A623] transition-colors">{sponsor.name}</h3>
                        {sponsor.description && <p className="text-zinc-500 text-sm mt-2 line-clamp-2 leading-relaxed">{sponsor.description}</p>}
                        {sponsor.website && <p className="text-zinc-600 text-xs mt-3 flex items-center gap-1"><Globe size={11} /> {sponsor.website}</p>}
                        <span className="flex items-center gap-1 mt-4 text-[#F5A623] text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                          Περισσοτερα <ChevronRight size={14} />
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
              <p className="text-zinc-500 mb-6">Θελεις να στηριξεις τη Lefteria FC; Επικοινωνησε μαζι μας.</p>
              <Link to="/contact" className="inline-flex items-center gap-2 px-8 py-3 bg-[#F5A623] text-black font-semibold rounded hover:bg-[#e6951a] transition-colors">
                ΓΙΝΕ ΧΟΡΗΓΟΣ <ChevronRight size={16} />
              </Link>
            </div>
          )}
        </div>
      </section>

      {sponsors.length > 0 && (
        <>
          <div className="max-w-7xl mx-auto px-6"><div className="h-px bg-[#262626]" /></div>
          <section className="py-16 px-6">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <h3 className="font-['Bebas_Neue'] text-3xl text-white">ΘΕΛΕΙΣ ΝΑ ΓΙΝΕΙΣ <span className="text-[#F5A623]">ΧΟΡΗΓΟΣ;</span></h3>
                <p className="text-zinc-500 mt-2">Επικοινωνησε μαζι μας για να μαθεις πως μπορεις να στηριξεις τη Lefteria FC.</p>
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

// ==================== CONTENT BLOCK RENDERER ====================
const ContentBlockRenderer = ({ block }) => {
  switch (block.type) {
    case "text":
      return (
        <div className="mb-8" data-testid={`block-text-${block.id}`}>
          {block.title && (
            <>
              <h2 className="font-['Bebas_Neue'] text-2xl text-white mb-2">{block.title}</h2>
              <div className="w-12 h-1 bg-[#F5A623] mb-6" />
            </>
          )}
          <p className="text-zinc-400 leading-relaxed whitespace-pre-line">{block.content}</p>
        </div>
      );

    case "banner":
      return (
        <div className="mb-8 rounded-lg overflow-hidden" data-testid={`block-banner-${block.id}`}>
          {block.image_url && (
            <img src={imgUrl(block.image_url)} alt={block.title || ""} className="w-full h-48 md:h-72 object-cover" />
          )}
          {(block.title || block.content) && (
            <div className="bg-[#111] border border-[#262626] border-t-0 p-6">
              {block.title && <h3 className="font-['Bebas_Neue'] text-xl text-white mb-2">{block.title}</h3>}
              {block.content && <p className="text-zinc-400 text-sm leading-relaxed">{block.content}</p>}
              {block.link_url && (
                <a href={block.link_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#F5A623] text-sm mt-3 hover:underline">
                  Περισσοτερα <ExternalLink size={12} />
                </a>
              )}
            </div>
          )}
        </div>
      );

    case "offer":
      return (
        <div className="mb-8 bg-gradient-to-r from-[#F5A623]/10 to-transparent border border-[#F5A623]/20 rounded-lg p-6 md:p-8" data-testid={`block-offer-${block.id}`}>
          <span className="text-[#F5A623] text-xs font-semibold tracking-widest">ΠΡΟΣΦΟΡΑ</span>
          {block.title && <h3 className="font-['Bebas_Neue'] text-2xl text-white mt-2">{block.title}</h3>}
          {block.content && <p className="text-zinc-400 mt-3 leading-relaxed">{block.content}</p>}
          {block.link_url && (
            <a href={block.link_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#F5A623] text-black font-semibold rounded mt-4 hover:bg-[#e6951a] transition-colors text-sm">
              {block.link_text || "ΔΕΙΤΕ ΤΗΝ ΠΡΟΣΦΟΡΑ"} <ChevronRight size={14} />
            </a>
          )}
        </div>
      );

    case "highlight":
      return (
        <div className="mb-8 grid md:grid-cols-3 gap-4" data-testid={`block-highlight-${block.id}`}>
          {(block.items || []).map((item, i) => (
            <div key={i} className="bg-[#111] border border-[#262626] rounded-lg p-5 text-center">
              <p className="font-['Bebas_Neue'] text-3xl text-[#F5A623]">{item.value}</p>
              <p className="text-zinc-500 text-sm mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      );

    case "gallery":
      return (
        <div className="mb-8" data-testid={`block-gallery-${block.id}`}>
          {block.title && (
            <>
              <h2 className="font-['Bebas_Neue'] text-2xl text-white mb-2">{block.title}</h2>
              <div className="w-12 h-1 bg-[#F5A623] mb-6" />
            </>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {(block.images || []).map((img, i) => (
              <div key={i} className="aspect-video rounded-lg overflow-hidden border border-[#262626]">
                <img src={imgUrl(img)} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      );

    default:
      return null;
  }
};

// ==================== SPONSOR DETAIL PAGE ====================
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
        <p className="text-zinc-500 text-lg">Ο χορηγος δεν βρεθηκε.</p>
        <Link to="/sponsors/first-team" className="text-[#F5A623] text-sm mt-4 inline-block">← Πισω στους χορηγους</Link>
      </div>
    </div>
  );

  const lvl = LEVEL_CONFIG[sponsor.level] || LEVEL_CONFIG.supporter;
  const isFirstTeam = sponsor.sponsor_type === "first_team";
  const backPath = isFirstTeam ? "/sponsors/first-team" : "/sponsors/academy";
  const backLabel = isFirstTeam ? "Χορηγοι Πρωτης Ομαδας" : "Χορηγοι Ακαδημιας";
  const blocks = sponsor.content_blocks || [];

  return (
    <div className="min-h-screen bg-black" data-testid="sponsor-detail-page">
      {/* Banner */}
      {sponsor.banner_url && (
        <div className="relative h-64 md:h-96 overflow-hidden">
          <img src={imgUrl(sponsor.banner_url)} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        </div>
      )}

      <section className={`px-6 ${sponsor.banner_url ? "-mt-32 relative z-10" : "pt-32"}`}>
        <div className="max-w-7xl mx-auto">
          {/* Back */}
          <Link to={backPath} className="inline-flex items-center gap-2 text-zinc-500 hover:text-[#F5A623] text-sm mb-8 transition-colors" data-testid="back-to-sponsors">
            <ArrowLeft size={14} /> {backLabel}
          </Link>

          {/* Header */}
          <div className="flex flex-col md:flex-row items-start gap-8 mb-12">
            {sponsor.logo_url && (
              <div className="w-32 h-32 md:w-44 md:h-44 bg-[#111] border border-[#262626] rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                <img src={imgUrl(sponsor.logo_url)} alt={sponsor.name} className="max-w-[75%] max-h-[75%] object-contain" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold border" style={{ borderColor: `${lvl.color}40`, color: lvl.color, backgroundColor: `${lvl.color}10` }}>
                  <lvl.icon size={12} />
                  {lvl.label}
                </span>
                <span className="text-zinc-600 text-xs">{isFirstTeam ? "Πρωτη Ομαδα" : "Ακαδημια"}</span>
              </div>
              <h1 className="font-['Bebas_Neue'] text-4xl md:text-6xl text-white tracking-wide">{sponsor.name}</h1>
              {sponsor.website && (
                <a href={sponsor.website.startsWith("http") ? sponsor.website : `https://${sponsor.website}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[#F5A623] text-sm mt-3 hover:underline">
                  <Globe size={14} /> {sponsor.website}
                </a>
              )}
              {/* Social Media */}
              {(sponsor.facebook || sponsor.instagram || sponsor.twitter || sponsor.youtube || sponsor.linkedin) && (
                <div className="flex gap-2 mt-4" data-testid="sponsor-social-links">
                  {sponsor.facebook && (
                    <a href={sponsor.facebook.startsWith("http") ? sponsor.facebook : `https://${sponsor.facebook}`} target="_blank" rel="noreferrer" className="w-9 h-9 bg-[#0a0a0a] border border-[#262626] flex items-center justify-center rounded hover:border-[#F5A623] hover:text-[#F5A623] transition-colors" data-testid="sponsor-fb">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
                    </a>
                  )}
                  {sponsor.instagram && (
                    <a href={sponsor.instagram.startsWith("http") ? sponsor.instagram : `https://${sponsor.instagram}`} target="_blank" rel="noreferrer" className="w-9 h-9 bg-[#0a0a0a] border border-[#262626] flex items-center justify-center rounded hover:border-[#F5A623] hover:text-[#F5A623] transition-colors" data-testid="sponsor-ig">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>
                    </a>
                  )}
                  {sponsor.twitter && (
                    <a href={sponsor.twitter.startsWith("http") ? sponsor.twitter : `https://${sponsor.twitter}`} target="_blank" rel="noreferrer" className="w-9 h-9 bg-[#0a0a0a] border border-[#262626] flex items-center justify-center rounded hover:border-[#F5A623] hover:text-[#F5A623] transition-colors" data-testid="sponsor-tw">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </a>
                  )}
                  {sponsor.youtube && (
                    <a href={sponsor.youtube.startsWith("http") ? sponsor.youtube : `https://${sponsor.youtube}`} target="_blank" rel="noreferrer" className="w-9 h-9 bg-[#0a0a0a] border border-[#262626] flex items-center justify-center rounded hover:border-[#F5A623] hover:text-[#F5A623] transition-colors" data-testid="sponsor-yt">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                    </a>
                  )}
                  {sponsor.linkedin && (
                    <a href={sponsor.linkedin.startsWith("http") ? sponsor.linkedin : `https://${sponsor.linkedin}`} target="_blank" rel="noreferrer" className="w-9 h-9 bg-[#0a0a0a] border border-[#262626] flex items-center justify-center rounded hover:border-[#F5A623] hover:text-[#F5A623] transition-colors" data-testid="sponsor-li">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="h-px bg-[#262626] mb-12" />

          {/* Custom Content Blocks */}
          {blocks.length > 0 && (
            <div className="mb-12">
              {blocks.map((block, i) => (
                <ContentBlockRenderer key={block.id || i} block={block} />
              ))}
            </div>
          )}

          {/* Default description if no blocks */}
          {blocks.length === 0 && sponsor.description && (
            <div className="mb-12">
              <h2 className="font-['Bebas_Neue'] text-2xl text-white mb-2">ΣΧΕΤΙΚΑ ΜΕ ΤΟΝ <span className="text-[#F5A623]">ΧΟΡΗΓΟ</span></h2>
              <div className="w-12 h-1 bg-[#F5A623] mb-6" />
              <p className="text-zinc-400 leading-relaxed whitespace-pre-line">{sponsor.description}</p>
            </div>
          )}

          {/* Partnership Info */}
          <div className="mb-12">
            <h2 className="font-['Bebas_Neue'] text-2xl text-white mb-2">ΣΥΝΕΡΓΑΣΙΑ ΜΕ <span className="text-[#F5A623]">LEFTERIA FC</span></h2>
            <div className="w-12 h-1 bg-[#F5A623] mb-6" />
            <div className="bg-[#111] border border-[#262626] rounded-lg p-6">
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3">
                  <lvl.icon size={18} style={{ color: lvl.color }} />
                  <div>
                    <p className="text-zinc-600 text-xs">Επιπεδο Χορηγιας</p>
                    <p className="text-white text-sm font-medium">{lvl.label}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Handshake size={18} className="text-zinc-500" />
                  <div>
                    <p className="text-zinc-600 text-xs">Κατηγορια</p>
                    <p className="text-white text-sm font-medium">{isFirstTeam ? "Πρωτη Ομαδα" : "Ακαδημια"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar size={18} className="text-zinc-500" />
                  <div>
                    <p className="text-zinc-600 text-xs">Σεζον</p>
                    <p className="text-white text-sm font-medium">2025/26</p>
                  </div>
                </div>
                {sponsor.website && (
                  <div className="flex items-center gap-3">
                    <Globe size={18} className="text-zinc-500" />
                    <div>
                      <p className="text-zinc-600 text-xs">Ιστοσελιδα</p>
                      <a href={sponsor.website.startsWith("http") ? sponsor.website : `https://${sponsor.website}`} target="_blank" rel="noreferrer" className="text-[#F5A623] text-sm hover:underline">{sponsor.website}</a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Visit CTA */}
          <div className="flex flex-col sm:flex-row gap-4 pb-16">
            {sponsor.website && (
              <a href={sponsor.website.startsWith("http") ? sponsor.website : `https://${sponsor.website}`} target="_blank" rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#F5A623] text-black font-semibold rounded hover:bg-[#e6951a] transition-colors" data-testid="sponsor-website-link">
                <ExternalLink size={16} /> ΕΠΙΣΚΕΨΗ ΙΣΤΟΣΕΛΙΔΑΣ
              </a>
            )}
            <Link to="/contact" className="inline-flex items-center justify-center gap-2 px-8 py-3 border border-white/20 text-white font-semibold rounded hover:bg-white/5 transition-colors">
              ΓΙΝΕ ΚΙ ΕΣΥ ΧΟΡΗΓΟΣ <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SponsorsPage;
