import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Trophy, ArrowLeft, ArrowRight, User, Mail, Vote, Undo2, Users, X, ChevronRight } from "lucide-react";

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
  const [withdrawing, setWithdrawing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerDetail, setPlayerDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  // Voter identity from localStorage
  const [voterName, setVoterName] = useState(() => localStorage.getItem("potm_voter_name") || "");
  const [voterEmail, setVoterEmail] = useState(() => localStorage.getItem("potm_voter_email") || "");
  const [isIdentified, setIsIdentified] = useState(() => !!(localStorage.getItem("potm_voter_name") && localStorage.getItem("potm_voter_email")));

  // Identity form inputs
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");

  const resolveImg = (url) => url && url.startsWith("/api/") ? `${BACKEND_URL}${url}` : url;
  const currentMonthName = monthNames[new Date().getMonth()];

  const fetchData = useCallback(async () => {
    try {
      const promises = [
        axios.get(`${API}/players?team_type=First%20Team`),
        axios.get(`${API}/votes/potm/results`),
      ];
      if (voterEmail) {
        promises.push(axios.get(`${API}/votes/potm/check?email=${encodeURIComponent(voterEmail)}`));
      }
      const responses = await Promise.all(promises);
      setPlayers(responses[0].data);
      setResults(responses[1].data);
      if (responses[2]) {
        setHasVoted(responses[2].data.has_voted);
        setVotedId(responses[2].data.voted_player_id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [voterEmail]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleIdentify = (e) => {
    e.preventDefault();
    const name = nameInput.trim();
    const email = emailInput.trim().toLowerCase();
    if (!name || !email) {
      setError("Συμπληρώστε όνομα και email");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Μη έγκυρο email");
      return;
    }
    setError("");
    localStorage.setItem("potm_voter_name", name);
    localStorage.setItem("potm_voter_email", email);
    setVoterName(name);
    setVoterEmail(email);
    setIsIdentified(true);
  };

  const handleChangeIdentity = () => {
    localStorage.removeItem("potm_voter_name");
    localStorage.removeItem("potm_voter_email");
    setVoterName("");
    setVoterEmail("");
    setIsIdentified(false);
    setHasVoted(false);
    setVotedId(null);
    setNameInput("");
    setEmailInput("");
  };

  const handleVote = async (playerId) => {
    if (hasVoted || voting || !isIdentified) return;
    setVoting(true);
    setError("");
    try {
      await axios.post(`${API}/votes/potm`, {
        player_id: playerId,
        voter_name: voterName,
        voter_email: voterEmail,
      });
      setHasVoted(true);
      setVotedId(playerId);
      const res = await axios.get(`${API}/votes/potm/results`);
      setResults(res.data);
    } catch (e) {
      const msg = e.response?.data?.detail || "Σφάλμα κατά την ψηφοφορία";
      setError(msg);
    } finally {
      setVoting(false);
    }
  };

  const handleWithdraw = async () => {
    if (withdrawing) return;
    setWithdrawing(true);
    setError("");
    try {
      await axios.post(`${API}/votes/potm/withdraw`, { voter_email: voterEmail });
      setHasVoted(false);
      setVotedId(null);
      const res = await axios.get(`${API}/votes/potm/results`);
      setResults(res.data);
    } catch (e) {
      const msg = e.response?.data?.detail || "Σφάλμα κατά την απόσυρση";
      setError(msg);
    } finally {
      setWithdrawing(false);
    }
  };

  const openPlayerDetail = async (playerId) => {
    setSelectedPlayer(playerId);
    setDetailLoading(true);
    try {
      const res = await axios.get(`${API}/votes/potm/player/${playerId}`);
      setPlayerDetail(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedPlayer(null);
    setPlayerDetail(null);
  };

  // Merge players with their vote counts for the grid view
  const getPlayerVotes = (playerId) => {
    const r = results.results.find((x) => x.player_id === playerId);
    return r ? r.votes : 0;
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

          {/* Header */}
          <div className="mb-8">
            <span className="badge badge-primary mb-3" style={{ display: 'inline-block', padding: '4px 12px', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', background: '#F5A623', color: '#000', borderRadius: '2px', fontWeight: 600 }}>
              Ψηφοφορία {currentMonthName}
            </span>
            <h1 className="font-['Bebas_Neue'] text-4xl md:text-5xl text-white mt-2" data-testid="vote-page-title">
              Παίκτης του <span className="text-[#F5A623]">Μήνα</span>
            </h1>
            <div className="flex items-center gap-4 mt-3">
              <p className="text-zinc-400 text-sm">
                Σύνολο ψήφων: <span className="text-white font-semibold">{results.total_votes}</span>
              </p>
              {results.results.length > 0 && (
                <p className="text-zinc-400 text-sm">
                  Υποψήφιοι με ψήφους: <span className="text-white font-semibold">{results.results.length}</span>
                </p>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm" data-testid="vote-error">
              {error}
            </div>
          )}

          {/* Identity Section */}
          {!isIdentified ? (
            <div className="mb-10 p-6 bg-[#111] border border-[#222] rounded-lg max-w-md" data-testid="voter-identity-form">
              <h3 className="font-['Bebas_Neue'] text-xl text-white mb-1">Ταυτοποίηση Ψηφοφόρου</h3>
              <p className="text-zinc-500 text-xs mb-5">Εισάγετε το όνομα και email σας για να ψηφίσετε</p>
              <form onSubmit={handleIdentify} className="space-y-3">
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Το όνομά σας"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-[#F5A623] focus:outline-none transition-colors"
                    data-testid="voter-name-input"
                  />
                </div>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="email"
                    placeholder="Το email σας"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-[#F5A623] focus:outline-none transition-colors"
                    data-testid="voter-email-input"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#F5A623] text-black font-semibold text-sm py-2.5 rounded-lg hover:bg-[#e6951a] transition-colors"
                  data-testid="voter-identify-btn"
                >
                  Συνέχεια
                </button>
              </form>
            </div>
          ) : (
            <div className="mb-8 flex items-center justify-between p-4 bg-[#111] border border-[#222] rounded-lg" data-testid="voter-identity-bar">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#F5A623]/10 flex items-center justify-center">
                  <User size={14} className="text-[#F5A623]" />
                </div>
                <div>
                  <div className="text-white text-sm font-medium">{voterName}</div>
                  <div className="text-zinc-500 text-xs">{voterEmail}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hasVoted && (
                  <button
                    onClick={handleWithdraw}
                    disabled={withdrawing}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    data-testid="withdraw-vote-btn"
                  >
                    <Undo2 size={12} />
                    {withdrawing ? "Απόσυρση..." : "Απόσυρση Ψήφου"}
                  </button>
                )}
                <button
                  onClick={handleChangeIdentity}
                  className="text-zinc-500 hover:text-zinc-300 text-xs underline transition-colors"
                  data-testid="change-identity-btn"
                >
                  Αλλαγή
                </button>
              </div>
            </div>
          )}

          {/* Leaderboard */}
          {results.results.length > 0 && (
            <div className="mb-10" data-testid="vote-leaderboard">
              <h3 className="font-['Bebas_Neue'] text-lg text-zinc-400 mb-4 tracking-wider">Κατάταξη</h3>

              {/* Top leader highlight */}
              {results.results.length > 0 && (
                <button
                  onClick={() => openPlayerDetail(results.results[0].player_id)}
                  className="w-full mb-4 p-5 bg-gradient-to-r from-[#F5A623]/10 via-[#111] to-[#111] border border-[#F5A623]/20 rounded-lg hover:border-[#F5A623]/40 transition-colors text-left"
                  data-testid="vote-leader"
                >
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
                    <div className="flex-1">
                      <div className="text-[10px] text-[#F5A623] tracking-widest uppercase mb-0.5">Πρώτος</div>
                      <div className="font-['Bebas_Neue'] text-xl text-white">{results.results[0].player_name}</div>
                      <div className="text-xs text-zinc-400">{results.results[0].votes} ψήφ{results.results[0].votes === 1 ? "ος" : "οι"}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {results.results[0].voters && results.results[0].voters.length > 0 && (
                        <div className="hidden sm:flex items-center gap-1 text-xs text-zinc-500">
                          <Users size={12} />
                          <span>{results.results[0].voters.slice(0, 3).join(", ")}{results.results[0].voters.length > 3 ? ` +${results.results[0].voters.length - 3}` : ""}</span>
                        </div>
                      )}
                      <ChevronRight size={16} className="text-zinc-500" />
                    </div>
                  </div>
                </button>
              )}

              {/* Rest of rankings */}
              <div className="space-y-2">
                {results.results.slice(1).map((r, idx) => {
                  const pct = results.total_votes > 0 ? Math.round((r.votes / results.total_votes) * 100) : 0;
                  return (
                    <button
                      key={r.player_id}
                      onClick={() => openPlayerDetail(r.player_id)}
                      className={`w-full flex items-center gap-4 p-3 rounded-lg border text-left hover:border-[#F5A623]/30 transition-colors ${r.player_id === votedId ? 'bg-[#F5A623]/5 border-[#F5A623]/30' : 'bg-[#111] border-[#1a1a1a]'}`}
                      data-testid={`vote-result-${r.player_id}`}
                    >
                      <span className="font-['Bebas_Neue'] text-lg text-zinc-500 w-6 text-center">{idx + 2}</span>
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
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-zinc-400 font-mono w-10 text-right">{r.votes}</span>
                        <ChevronRight size={14} className="text-zinc-600" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Voting Grid — always show players */}
          <div>
            <h3 className="font-['Bebas_Neue'] text-lg text-zinc-400 mb-4 tracking-wider">
              {hasVoted ? "Όλοι οι Παίκτες" : "Επιλέξτε Παίκτη"}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3" data-testid="vote-grid">
              {players.map((p) => {
                const voteCount = getPlayerVotes(p.id);
                const isMyVote = p.id === votedId;
                return (
                  <div
                    key={p.id}
                    className={`relative group bg-[#111] border rounded-lg overflow-hidden transition-all ${isMyVote ? 'border-[#F5A623] ring-1 ring-[#F5A623]/30' : 'border-[#1a1a1a] hover:border-[#333]'}`}
                    data-testid={`vote-player-${p.id}`}
                  >
                    {/* Player image */}
                    <button
                      onClick={() => openPlayerDetail(p.id)}
                      className="w-full aspect-[3/4] bg-[#1a1a1a] overflow-hidden relative block"
                      data-testid={`vote-player-detail-${p.id}`}
                    >
                      {p.image_url ? (
                        <img src={resolveImg(p.image_url)} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="font-['Bebas_Neue'] text-5xl text-[#F5A623]/20">{p.number}</span>
                        </div>
                      )}
                      {/* Vote count badge */}
                      <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1">
                        <Vote size={10} className="text-[#F5A623]" />
                        <span className="text-[10px] text-white font-semibold">{voteCount}</span>
                      </div>
                      {isMyVote && (
                        <div className="absolute top-2 left-2 bg-[#F5A623] rounded-full px-2 py-0.5">
                          <span className="text-[9px] text-black font-bold tracking-wide">Η ΨΗΦΟΣ ΣΑΣ</span>
                        </div>
                      )}
                    </button>

                    {/* Player info + vote button */}
                    <div className="p-2.5">
                      <div className="font-['Bebas_Neue'] text-sm text-white truncate">#{p.number} {p.name}</div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-zinc-500">{posLabels[p.position] || p.position}</span>
                        {!hasVoted && isIdentified && (
                          <button
                            onClick={() => handleVote(p.id)}
                            disabled={voting}
                            className="text-[10px] font-semibold text-[#F5A623] hover:text-[#e6951a] transition-colors uppercase tracking-wider disabled:opacity-50"
                            data-testid={`vote-btn-${p.id}`}
                          >
                            Ψήφισε
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={closeDetail} data-testid="player-detail-modal">
          <div className="bg-[#111] border border-[#222] rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {detailLoading ? (
              <div className="p-12 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : playerDetail ? (
              <>
                <div className="relative p-5 border-b border-[#222]">
                  <button onClick={closeDetail} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors" data-testid="close-detail-modal">
                    <X size={18} />
                  </button>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-[#1a1a1a] overflow-hidden border-2 border-[#333] flex-shrink-0">
                      {playerDetail.player.image_url ? (
                        <img src={resolveImg(playerDetail.player.image_url)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-['Bebas_Neue'] text-2xl text-[#F5A623]/30">#{playerDetail.player.number}</div>
                      )}
                    </div>
                    <div>
                      <div className="font-['Bebas_Neue'] text-2xl text-white">{playerDetail.player.name}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">
                        #{playerDetail.player.number} &middot; {posLabels[playerDetail.player.position] || playerDetail.player.position}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-[#0a0a0a] rounded-lg p-3 text-center">
                      <div className="font-['Bebas_Neue'] text-2xl text-[#F5A623]">{playerDetail.vote_count}</div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Ψήφοι</div>
                    </div>
                    <div className="bg-[#0a0a0a] rounded-lg p-3 text-center">
                      <div className="font-['Bebas_Neue'] text-2xl text-white">
                        {playerDetail.total_month_votes > 0 ? Math.round((playerDetail.vote_count / playerDetail.total_month_votes) * 100) : 0}%
                      </div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Ποσοστό</div>
                    </div>
                  </div>

                  {/* Voter list */}
                  <div>
                    <h4 className="text-xs text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Users size={12} />
                      Ψηφοφόροι ({playerDetail.voters.length})
                    </h4>
                    {playerDetail.voters.length > 0 ? (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {playerDetail.voters.map((v, i) => (
                          <div key={i} className="flex items-center gap-2 p-2 bg-[#0a0a0a] rounded-lg">
                            <div className="w-6 h-6 rounded-full bg-[#F5A623]/10 flex items-center justify-center flex-shrink-0">
                              <User size={10} className="text-[#F5A623]" />
                            </div>
                            <span className="text-sm text-white">{v.voter_name}</span>
                            {v.created_at && (
                              <span className="text-[10px] text-zinc-600 ml-auto">
                                {new Date(v.created_at).toLocaleDateString("el-GR")}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-zinc-600 text-sm text-center py-4">Δεν υπάρχουν ψήφοι ακόμα</p>
                    )}
                  </div>

                  {/* Vote from modal */}
                  {!hasVoted && isIdentified && (
                    <button
                      onClick={() => { handleVote(selectedPlayer); closeDetail(); }}
                      disabled={voting}
                      className="w-full mt-5 bg-[#F5A623] text-black font-semibold text-sm py-2.5 rounded-lg hover:bg-[#e6951a] transition-colors disabled:opacity-50"
                      data-testid="modal-vote-btn"
                    >
                      Ψήφισε {playerDetail.player.name}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-zinc-500 text-sm">Σφάλμα φόρτωσης</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VotePage;
