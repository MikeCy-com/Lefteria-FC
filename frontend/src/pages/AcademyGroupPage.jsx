import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronRight, Users, Calendar, Clock, Image as ImageIcon, MapPin } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const BASE_URL = process.env.REACT_APP_BACKEND_URL;

const resolveImg = (url) => {
  if (!url) return null;
  return url.startsWith("http") ? url : `${BASE_URL}${url}`;
};

const positionGr = { Goalkeeper: "Τερμ.", Defender: "Αμυν.", Midfielder: "Μέσος", Forward: "Επιθ." };

const AcademyGroupPage = () => {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [players, setPlayers] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("roster");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupRes, playersRes, fixturesRes, galleryRes] = await Promise.all([
          axios.get(`${API}/academy-groups/${groupId}`),
          axios.get(`${API}/academy-groups/${groupId}/players`),
          axios.get(`${API}/academy-groups/${groupId}/fixtures`),
          axios.get(`${API}/gallery?academy_group_id=${groupId}`),
        ]);
        setGroup(groupRes.data);
        setPlayers(playersRes.data);
        setFixtures(fixturesRes.data);
        setGallery(galleryRes.data);
      } catch (e) {
        console.error("Error fetching academy group data:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [groupId]);

  if (loading) return (
    <div className="pt-28 flex items-center justify-center min-h-screen bg-[#050505]">
      <div className="spinner" />
    </div>
  );

  if (!group) return (
    <div className="pt-28 text-center min-h-screen bg-[#050505]">
      <h2 className="font-['Bebas_Neue'] text-3xl text-white">Η ομάδα δεν βρέθηκε</h2>
      <Link to="/academy" className="text-[#F5A623] hover:underline text-sm mt-2 inline-block">Επιστροφή στην Ακαδημία</Link>
    </div>
  );

  const upcoming = fixtures.filter(f => f.status !== "Completed").sort((a, b) => new Date(a.match_date) - new Date(b.match_date));
  const completed = fixtures.filter(f => f.status === "Completed").sort((a, b) => new Date(b.match_date) - new Date(a.match_date));

  const tabs = [
    { id: "roster", label: "Ρόστερ", count: players.length },
    { id: "schedule", label: "Πρόγραμμα", count: fixtures.length },
    { id: "gallery", label: "Γκαλερί", count: gallery.length },
  ];

  return (
    <div className="pt-24 min-h-screen" data-testid="academy-group-page">
      {/* Hero */}
      <section
        className="py-16 md:py-24 px-4 md:px-6 relative"
        style={{
          backgroundImage: `url(https://images.unsplash.com/photo-1622659097574-c814ee26068e?w=1600)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/75"></div>
        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-zinc-400 mb-6" data-testid="academy-group-breadcrumb">
            <Link to="/" className="hover:text-zinc-200 transition-colors">Αρχική</Link>
            <ChevronRight size={12} />
            <Link to="/academy" className="hover:text-zinc-200 transition-colors">Ακαδημία</Link>
            <ChevronRight size={12} />
            <span className="text-white">{group.name}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-8">
            <div className="flex-1">
              <span className="badge badge-primary mb-3">{group.age_range}</span>
              <h1 className="font-['Bebas_Neue'] text-4xl md:text-5xl text-white mb-3">
                {group.name}
              </h1>
              {group.description && (
                <p className="text-zinc-300 text-base max-w-2xl">{group.description}</p>
              )}
            </div>
            <div className="flex flex-col gap-2 text-sm text-zinc-300">
              {group.coach_name && (
                <div className="flex items-center gap-2">
                  <Users size={15} className="text-[#F5A623]" />
                  <span>Προπονητής: <strong className="text-white">{group.coach_name}</strong></span>
                </div>
              )}
              {group.training_schedule && (
                <div className="flex items-center gap-2">
                  <Clock size={15} className="text-[#F5A623]" />
                  <span>{group.training_schedule}</span>
                </div>
              )}
              {group.season && (
                <div className="flex items-center gap-2">
                  <Calendar size={15} className="text-[#F5A623]" />
                  <span>Σεζόν {group.season}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Tab Bar */}
      <div className="border-b border-[#262626] bg-[#050505] sticky top-[72px] z-30" data-testid="academy-group-tabs">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-5 py-3 text-center whitespace-nowrap transition-colors ${
                  activeTab === tab.id ? "text-[#F5A623]" : "text-zinc-500 hover:text-zinc-300"
                }`}
                data-testid={`group-tab-${tab.id}`}
              >
                <span className="font-['Bebas_Neue'] text-lg tracking-wide">{tab.label}</span>
                <span className="text-xs text-zinc-500 ml-1.5">({tab.count})</span>
                {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#F5A623]" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* ── ROSTER ── */}
        {activeTab === "roster" && (
          <div data-testid="group-roster-section">
            <h2 className="font-['Bebas_Neue'] text-3xl text-white mb-8">
              Ρόστερ <span className="text-[#F5A623]">{group.name}</span>
            </h2>
            {players.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {players.map(player => (
                  <Link
                    to={`/player/${player.id}`}
                    key={player.id}
                    className="card group overflow-hidden hover:border-[#F5A623]/30 transition-all duration-300"
                    data-testid={`group-player-${player.id}`}
                  >
                    <div className="aspect-[3/4] bg-[#0a0a0a] relative overflow-hidden">
                      {player.image_url ? (
                        <img
                          src={resolveImg(player.image_url)}
                          alt={player.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Users size={40} className="text-zinc-800" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <span className="text-[10px] bg-black/70 text-[#F5A623] px-2 py-0.5 rounded font-medium">
                          {positionGr[player.position] || player.position}
                        </span>
                      </div>
                      {player.number && (
                        <div className="absolute bottom-2 left-2">
                          <span className="font-['Bebas_Neue'] text-3xl text-white/20">{player.number}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-['Bebas_Neue'] text-lg text-white group-hover:text-[#F5A623] transition-colors leading-tight">
                        {player.name}
                      </h3>
                      {player.age && (
                        <span className="text-xs text-zinc-500">{player.age} ετών</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Users size={48} className="text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500">Δεν υπάρχουν παίκτες σε αυτή την ομάδα</p>
              </div>
            )}
          </div>
        )}

        {/* ── SCHEDULE ── */}
        {activeTab === "schedule" && (
          <div data-testid="group-schedule-section">
            <h2 className="font-['Bebas_Neue'] text-3xl text-white mb-8">
              Πρόγραμμα <span className="text-[#F5A623]">{group.name}</span>
            </h2>

            {upcoming.length > 0 && (
              <div className="mb-10">
                <h3 className="text-sm text-zinc-400 uppercase tracking-wider mb-4 font-medium">Επόμενοι Αγώνες</h3>
                <div className="space-y-3">
                  {upcoming.map(f => (
                    <div key={f.id} className="card p-5 flex flex-col sm:flex-row sm:items-center gap-3" data-testid={`upcoming-fixture-${f.id}`}>
                      <div className="flex items-center gap-2 text-sm text-zinc-400 sm:w-32">
                        <Calendar size={14} className="text-[#F5A623]" />
                        <span>{new Date(f.match_date).toLocaleDateString('el-GR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <div className="flex-1 flex items-center justify-center gap-3">
                        <span className={`font-medium text-sm ${f.home_team === 'LEFTERIA FC' ? 'text-[#F5A623]' : 'text-white'}`}>{f.home_team}</span>
                        <span className="font-['Bebas_Neue'] text-lg text-zinc-600">VS</span>
                        <span className={`font-medium text-sm ${f.away_team === 'LEFTERIA FC' ? 'text-[#F5A623]' : 'text-white'}`}>{f.away_team}</span>
                      </div>
                      {f.venue && (
                        <div className="flex items-center gap-1.5 text-xs text-zinc-500 sm:w-40 sm:text-right sm:justify-end">
                          <MapPin size={12} /> {f.venue}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {completed.length > 0 && (
              <div>
                <h3 className="text-sm text-zinc-400 uppercase tracking-wider mb-4 font-medium">Αποτελέσματα</h3>
                <div className="space-y-3">
                  {completed.map(f => (
                    <div key={f.id} className="card p-5 flex flex-col sm:flex-row sm:items-center gap-3" data-testid={`completed-fixture-${f.id}`}>
                      <div className="flex items-center gap-2 text-sm text-zinc-400 sm:w-32">
                        <Calendar size={14} />
                        <span>{new Date(f.match_date).toLocaleDateString('el-GR', { day: '2-digit', month: 'short' })}</span>
                      </div>
                      <div className="flex-1 flex items-center justify-center gap-3">
                        <span className={`font-medium text-sm ${f.home_team === 'LEFTERIA FC' ? 'text-[#F5A623]' : 'text-white'}`}>{f.home_team}</span>
                        <span className="font-['Bebas_Neue'] text-2xl text-white">
                          {f.home_score ?? 0} - {f.away_score ?? 0}
                        </span>
                        <span className={`font-medium text-sm ${f.away_team === 'LEFTERIA FC' ? 'text-[#F5A623]' : 'text-white'}`}>{f.away_team}</span>
                      </div>
                      {f.venue && (
                        <div className="flex items-center gap-1.5 text-xs text-zinc-500 sm:w-40 sm:text-right sm:justify-end">
                          <MapPin size={12} /> {f.venue}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {fixtures.length === 0 && (
              <div className="text-center py-16">
                <Calendar size={48} className="text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500">Δεν υπάρχουν αγώνες για αυτή την ομάδα</p>
              </div>
            )}
          </div>
        )}

        {/* ── GALLERY ── */}
        {activeTab === "gallery" && (
          <div data-testid="group-gallery-section">
            <h2 className="font-['Bebas_Neue'] text-3xl text-white mb-8">
              Γκαλερί <span className="text-[#F5A623]">{group.name}</span>
            </h2>
            {gallery.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {gallery.map(item => (
                  <div key={item.id} className="group relative aspect-square overflow-hidden rounded-lg bg-[#0a0a0a]" data-testid={`gallery-item-${item.id}`}>
                    <img
                      src={resolveImg(item.image_url)}
                      alt={item.title || "Gallery"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {item.title && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                        <p className="text-white text-sm font-medium">{item.title}</p>
                        {item.category && <span className="text-[10px] text-zinc-400">{item.category}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <ImageIcon size={48} className="text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500">Δεν υπάρχουν φωτογραφίες</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Back link */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <Link to="/academy" className="text-zinc-500 hover:text-[#F5A623] text-sm flex items-center gap-1 transition-colors" data-testid="back-to-academy">
          <ChevronRight size={14} className="rotate-180" /> Επιστροφή στην Ακαδημία
        </Link>
      </div>
    </div>
  );
};

export default AcademyGroupPage;
