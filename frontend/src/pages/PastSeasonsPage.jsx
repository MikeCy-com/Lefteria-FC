import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { Archive, ChevronRight, Trophy, Users, Calendar, ArrowLeft } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const PastSeasonsPage = () => {
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/seasons/archive`)
      .then(res => setArchives(res.data || []))
      .catch(() => setArchives([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-black pt-24 md:pt-28 pb-20" data-testid="past-seasons-page">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="mb-10">
          <span className="badge badge-secondary mb-4">Αρχειο</span>
          <h1 className="font-['Bebas_Neue'] text-4xl md:text-6xl text-white tracking-wide">
            Παλαιοτερες <span className="text-[#F5A623]">Σεζον</span>
          </h1>
          <p className="text-zinc-400 mt-2 max-w-2xl">Ιστορικό αρχείο όλων των σεζόν με στατιστικά, αγώνες και κορυφαίους παίκτες.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : archives.length === 0 ? (
          <div className="card p-12 text-center">
            <Archive size={36} className="text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">Δεν υπάρχουν αρχειοθετημένες σεζόν.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" data-testid="archives-grid">
            {archives.map((a) => (
              <Link
                key={a.id}
                to={`/seasons/${a.id}`}
                className="card p-6 hover:border-[#F5A623]/40 transition-all group"
                data-testid={`archive-card-${a.id}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="badge badge-secondary mb-0">Σεζόν</span>
                  <ChevronRight size={16} className="text-zinc-600 group-hover:text-[#F5A623] transition-colors" />
                </div>
                <h2 className="font-['Bebas_Neue'] text-3xl md:text-4xl text-white mb-1">{a.season_name}</h2>
                {a.archived_at && (
                  <p className="text-zinc-500 text-xs mb-5 flex items-center gap-1.5">
                    <Calendar size={11} /> Αρχειοθετήθηκε {new Date(a.archived_at).toLocaleDateString("el-GR")}
                  </p>
                )}
                {a.top_scorer_name && (
                  <div className="border-t border-[#1e1e1e] pt-3 mt-3">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Πρωτος Σκορερ</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-white text-sm font-medium">{a.top_scorer_name}</span>
                      <span className="font-['Bebas_Neue'] text-xl text-[#F5A623]">{a.top_scorer_goals} γκολ</span>
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const ArchivedSeasonDetailPage = () => {
  const { archiveId } = useParams();
  const [archive, setArchive] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/seasons/archive/${archiveId}`)
      .then(res => setArchive(res.data))
      .catch(() => setArchive(null))
      .finally(() => setLoading(false));
  }, [archiveId]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" /></div>;
  if (!archive) return <div className="min-h-screen bg-black pt-32 px-6"><p className="text-zinc-400 text-center">Δεν βρέθηκε.</p></div>;

  const completedFixtures = (archive.fixtures || []).filter(f => f.status === "Completed");
  const wins = completedFixtures.filter(f => (f.home_team === "LEFTERIA FC" && (f.home_score || 0) > (f.away_score || 0)) || (f.away_team === "LEFTERIA FC" && (f.away_score || 0) > (f.home_score || 0))).length;
  const losses = completedFixtures.filter(f => (f.home_team === "LEFTERIA FC" && (f.home_score || 0) < (f.away_score || 0)) || (f.away_team === "LEFTERIA FC" && (f.away_score || 0) < (f.home_score || 0))).length;
  const draws = completedFixtures.length - wins - losses;

  const topScorers = (archive.player_stats || [])
    .filter(p => (p.statistics?.goals || 0) > 0)
    .sort((a, b) => (b.statistics?.goals || 0) - (a.statistics?.goals || 0))
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-black pt-24 md:pt-28 pb-20" data-testid="archive-detail-page">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <Link to="/seasons" className="inline-flex items-center gap-2 text-zinc-400 hover:text-[#F5A623] text-sm mb-6 transition-colors">
          <ArrowLeft size={14} /> Πίσω στο Αρχείο
        </Link>

        <div className="mb-10">
          <span className="badge badge-secondary mb-4">Αρχειοθετημενη Σεζον</span>
          <h1 className="font-['Bebas_Neue'] text-4xl md:text-6xl text-white tracking-wide">
            Σεζον <span className="text-[#F5A623]">{archive.season_name}</span>
          </h1>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="card p-5 text-center"><div className="font-['Bebas_Neue'] text-4xl text-white">{completedFixtures.length}</div><div className="text-xs text-zinc-500 uppercase mt-1">Αγώνες</div></div>
          <div className="card p-5 text-center"><div className="font-['Bebas_Neue'] text-4xl text-emerald-400">{wins}</div><div className="text-xs text-zinc-500 uppercase mt-1">Νίκες</div></div>
          <div className="card p-5 text-center"><div className="font-['Bebas_Neue'] text-4xl text-zinc-300">{draws}</div><div className="text-xs text-zinc-500 uppercase mt-1">Ισοπαλίες</div></div>
          <div className="card p-5 text-center"><div className="font-['Bebas_Neue'] text-4xl text-red-400">{losses}</div><div className="text-xs text-zinc-500 uppercase mt-1">Ήττες</div></div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top Scorers */}
          <div className="card p-6">
            <h2 className="font-['Bebas_Neue'] text-2xl text-white mb-5 flex items-center gap-2"><Trophy className="text-[#F5A623]" size={20} /> Κορυφαιοι Σκορερ</h2>
            {topScorers.length > 0 ? (
              <div className="space-y-2">
                {topScorers.map((p, i) => (
                  <div key={p.player_id} className="flex items-center gap-3 p-2 rounded hover:bg-white/5">
                    <span className={`font-['Bebas_Neue'] text-lg w-6 text-center ${i === 0 ? 'text-[#F5A623]' : 'text-zinc-600'}`}>{i + 1}</span>
                    {p.image_url ? <img src={p.image_url} alt="" className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-[#1a1a1a]" />}
                    <span className="text-white text-sm flex-1 truncate">{p.name}</span>
                    <span className="font-['Bebas_Neue'] text-xl text-[#F5A623]">{p.statistics?.goals || 0}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-zinc-500 text-sm">Χωρίς δεδομένα</p>}
          </div>

          {/* Recent Results */}
          <div className="card p-6">
            <h2 className="font-['Bebas_Neue'] text-2xl text-white mb-5 flex items-center gap-2"><Calendar className="text-[#F5A623]" size={20} /> Τελευταια Αποτελεσματα</h2>
            {completedFixtures.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {completedFixtures.sort((a, b) => new Date(b.match_date) - new Date(a.match_date)).slice(0, 15).map(f => (
                  <div key={f.id} className="flex items-center justify-between p-2 rounded bg-[#0a0a0a] border border-[#1e1e1e]">
                    <div className="flex-1 text-sm truncate">
                      <span className={f.home_team === "LEFTERIA FC" ? "text-[#F5A623]" : "text-white"}>{f.home_team}</span>
                      <span className="font-['Bebas_Neue'] text-zinc-400 px-2">{f.home_score} - {f.away_score}</span>
                      <span className={f.away_team === "LEFTERIA FC" ? "text-[#F5A623]" : "text-white"}>{f.away_team}</span>
                    </div>
                    <span className="text-zinc-600 text-[10px]">{f.match_date && new Date(f.match_date).toLocaleDateString("el-GR")}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-zinc-500 text-sm">Χωρίς αγώνες</p>}
          </div>

          {/* Players archived */}
          <div className="card p-6 lg:col-span-2">
            <h2 className="font-['Bebas_Neue'] text-2xl text-white mb-5 flex items-center gap-2"><Users className="text-[#F5A623]" size={20} /> Αποστολη Σεζον</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {(archive.player_stats || []).map(p => (
                <div key={p.player_id} className="bg-[#0a0a0a] border border-[#1e1e1e] rounded p-3 flex items-center gap-3">
                  {p.image_url ? <img src={p.image_url} alt="" className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-[#1a1a1a]" />}
                  <div className="min-w-0">
                    <p className="text-white text-xs truncate">{p.name}</p>
                    <p className="text-[10px] text-zinc-600">{p.statistics?.goals || 0}G · {p.statistics?.assists || 0}A · {p.statistics?.appearances || 0} συμμ.</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
