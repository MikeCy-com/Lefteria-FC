import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Trophy, ArrowLeft, ArrowRight } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const posLabels = { Goalkeeper: "Τερμ.", Defender: "Αμυν.", Midfielder: "Μέσος", Forward: "Επιθ." };
const monthNames = ["Ιανουαρίου", "Φεβρουαρίου", "Μαρτίου", "Απριλίου", "Μαΐου", "Ιουνίου", "Ιουλίου", "Αυγούστου", "Σεπτεμβρίου", "Οκτωβρίου", "Νοεμβρίου", "Δεκεμβρίου"];

const VotePage = () => {
  const [players, setPlayers] = useState([]);
  const [results, setResults] = useState({ results: [], total_votes: 0, month_key: "" });
  const [hasVoted, setHasVoted] = useState(false);
  const [votedId, setVotedId] = useState(null);
  const [voting, setVoting] = useState(false);
  const [loading, setLoading] = useState(true);

  const resolveImg = (url) => url && url.startsWith("/api/") ? `${BACKEND_URL}${url}` : url;
  const currentMonthName = monthNames[new Date().getMonth()];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [playersRes, resultsRes, checkRes] = await Promise.all([
          axios.get(`${API}/players?team_type=First%20Team`),
          axios.get(`${API}/votes/potm/results`),
          axios.get(`${API}/votes/potm/check`),
        ]);
        setPlayers(playersRes.data);
        setResults(resultsRes.data);
        setHasVoted(checkRes.data.has_voted);
        setVotedId(checkRes.data.voted_player_id);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleVote = async (playerId) => {
    if (hasVoted || voting) return;
    setVoting(true);
    try {
      await axios.post(`${API}/votes/potm`, { player_id: playerId });
      setHasVoted(true);
      setVotedId(playerId);
      const res = await axios.get(`${API}/votes/potm/results`);
      setResults(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-24 min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="pt-24 min-h-screen bg-[#0a0a0a]" data-testid="vote-page">
      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-[#F5A623] text-sm mb-8 transition-colors" data-testid="vote-back-link">
            <ArrowLeft size={14} /> Αρχική
          </Link>

          <div className="mb-10">
            <span className="badge badge-primary mb-3" style={{ display: 'inline-block', padding: '4px 12px', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', background: '#F5A623', color: '#000', borderRadius: '2px', fontWeight: 600 }}>
              Ψηφοφορία {currentMonthName}
            </span>
            <h1 className="font-['Bebas_Neue'] text-4xl md:text-5xl text-white mt-2" data-testid="vote-page-title">
              Παίκτης του <span className="text-[#F5A623]">Μήνα</span>
            </h1>
            <p className="text-zinc-400 text-sm mt-3 max-w-lg">
              {hasVoted
                ? `Ευχαριστούμε για την ψήφο σας! Σύνολο ψήφων: ${results.total_votes}`
                : "Επιλέξτε τον αγαπημένο σας παίκτη. Μπορείτε να ψηφίσετε μία φορά τον μήνα."
              }
            </p>
          </div>

          {hasVoted ? (
            /* Results View */
            <div data-testid="vote-results">
              {/* Leader highlight */}
              {results.results.length > 0 && (
                <div className="mb-8 p-5 bg-gradient-to-r from-[#F5A623]/10 via-[#111] to-[#111] border border-[#F5A623]/20 rounded-lg" data-testid="vote-leader">
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-[#1a1a1a] overflow-hidden border-2 border-[#F5A623]">
                        {results.results[0].image_url ? (
                          <img src={resolveImg(results.results[0].image_url)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-['Bebas_Neue'] text-xl text-[#F5A623]/40">#{results.results[0].number}</div>
                        )}
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#F5A623] rounded-full flex items-center justify-center shadow-lg">
                        <Trophy size={12} className="text-black" />
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#F5A623] tracking-widest uppercase mb-0.5">Πρώτος</div>
                      <div className="font-['Bebas_Neue'] text-xl text-white">{results.results[0].player_name}</div>
                      <div className="text-xs text-zinc-400">{results.results[0].votes} ψήφοι</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {results.results.map((r, idx) => {
                  const pct = results.total_votes > 0 ? Math.round((r.votes / results.total_votes) * 100) : 0;
                  return (
                    <div key={r.player_id} className={`flex items-center gap-4 p-3 rounded-lg border ${r.player_id === votedId ? 'bg-[#F5A623]/5 border-[#F5A623]/30' : 'bg-[#111] border-[#1a1a1a]'}`} data-testid={`vote-result-${r.player_id}`}>
                      <span className="font-['Bebas_Neue'] text-lg text-zinc-500 w-6 text-center">{idx + 1}</span>
                      <div className="w-9 h-9 rounded-full bg-[#1a1a1a] overflow-hidden flex-shrink-0">
                        {r.image_url ? (
                          <img src={resolveImg(r.image_url)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-600">#{r.number}</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white text-sm truncate">{r.player_name}</span>
                          {r.player_id === votedId && <span className="text-[10px] text-[#F5A623] bg-[#F5A623]/10 px-2 py-0.5 rounded-full">Η ψήφος σας</span>}
                        </div>
                        <div className="mt-1 w-full bg-[#1a1a1a] rounded-full h-1.5 overflow-hidden">
                          <div className="h-full bg-[#F5A623] rounded-full transition-all duration-700" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                      <span className="text-sm text-zinc-400 font-mono w-12 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Voting Grid */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3" data-testid="vote-grid">
              {players.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleVote(p.id)}
                  disabled={voting}
                  className="group text-left bg-[#111] border border-[#1a1a1a] rounded-lg overflow-hidden hover:border-[#F5A623] transition-all focus:outline-none focus:ring-1 focus:ring-[#F5A623] disabled:opacity-50"
                  data-testid={`vote-player-${p.id}`}
                >
                  <div className="aspect-[3/4] bg-[#1a1a1a] overflow-hidden relative">
                    {p.image_url ? (
                      <img src={resolveImg(p.image_url)} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="font-['Bebas_Neue'] text-5xl text-[#F5A623]/20">{p.number}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                      <span className="text-xs text-[#F5A623] font-semibold tracking-wider uppercase">Ψήφισε</span>
                    </div>
                  </div>
                  <div className="p-2.5">
                    <div className="font-['Bebas_Neue'] text-sm text-white group-hover:text-[#F5A623] transition-colors truncate">#{p.number} {p.name}</div>
                    <div className="text-[10px] text-zinc-500">{posLabels[p.position] || p.position}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default VotePage;
