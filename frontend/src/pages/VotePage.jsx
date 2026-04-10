import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/CustomerAuth";
import axios from "axios";
import { Trophy, ArrowLeft, Vote, Undo2, Users, X, ChevronRight, LogIn, Share2, Check } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const posLabels = { Goalkeeper: "Τερμ.", Defender: "Αμυν.", Midfielder: "Μέσος", Forward: "Επιθ." };
const monthNames = ["Ιανουαρίου", "Φεβρουαρίου", "Μαρτίου", "Απριλίου", "Μαΐου", "Ιουνίου", "Ιουλίου", "Αυγούστου", "Σεπτεμβρίου", "Οκτωβρίου", "Νοεμβρίου", "Δεκεμβρίου"];

const VoteShareSection = ({ playerName }) => {
  const [copied, setCopied] = useState(false);
  const shareText = `Ψήφισα τον ${playerName} ως Παίκτη του Μήνα στη ΛΕΥΤΕΡΙΑ FC!`;
  const shareUrl = window.location.href;

  const handleFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`, "_blank", "width=600,height=400");
  };

  const handleTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, "_blank", "width=600,height=400");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="mb-8 p-4 bg-gradient-to-r from-[#F5A623]/5 via-[#111] to-[#111] border border-[#F5A623]/20 rounded-lg" data-testid="vote-share-section">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Share2 size={16} className="text-[#F5A623] flex-shrink-0" />
          <span className="text-sm text-zinc-300 truncate">Μοιράσου ότι ψήφισες τον <strong className="text-white">{playerName}</strong>!</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleFacebook}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#1877F2]/10 text-[#1877F2] border border-[#1877F2]/20 rounded-lg hover:bg-[#1877F2]/20 transition-colors" data-testid="share-facebook">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            Facebook
          </button>
          <button onClick={handleTwitter}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white/5 text-white border border-white/10 rounded-lg hover:bg-white/10 transition-colors" data-testid="share-twitter">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            X
          </button>
          <button onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-lg transition-colors ${copied ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10"}`} data-testid="share-copy">
            {copied ? <><Check size={12} /> Αντιγράφηκε</> : "Αντιγραφή"}
          </button>
        </div>
      </div>
    </div>
  );
};

const VotePage = () => {
  const { user, getAuthHeaders } = useAuth();
  const [players, setPlayers] = useState([]);
  const [results, setResults] = useState({ results: [], total_votes: 0, month_key: "" });
  const [hasVoted, setHasVoted] = useState(false);
  const [votedId, setVotedId] = useState(null);
  const [votedPlayerName, setVotedPlayerName] = useState("");
  const [voting, setVoting] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerDetail, setPlayerDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  const resolveImg = (url) => url && url.startsWith("/api/") ? `${BACKEND_URL}${url}` : url;
  const currentMonthName = monthNames[new Date().getMonth()];

  const fetchData = useCallback(async () => {
    try {
      const headers = getAuthHeaders();
      const promises = [
        axios.get(`${API}/players?team_type=First%20Team`),
        axios.get(`${API}/votes/potm/results`),
        axios.get(`${API}/votes/potm/check`, { headers, withCredentials: true }),
      ];
      const responses = await Promise.all(promises);
      setPlayers(responses[0].data);
      setResults(responses[1].data);
      setHasVoted(responses[2].data.has_voted);
      setVotedId(responses[2].data.voted_player_id);
      if (responses[2].data.voted_player_id) {
        const vp = responses[0].data.find(p => p.id === responses[2].data.voted_player_id);
        setVotedPlayerName(vp?.name || responses[2].data.voter_name || "");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleVote = async (playerId) => {
    if (!user || hasVoted || voting) return;
    setVoting(true);
    setError("");
    try {
      await axios.post(`${API}/votes/potm`, { player_id: playerId }, { headers: getAuthHeaders() });
      setHasVoted(true);
      setVotedId(playerId);
      const votedP = players.find(p => p.id === playerId);
      setVotedPlayerName(votedP?.name || "");
      const res = await axios.get(`${API}/votes/potm/results`);
      setResults(res.data);
    } catch (e) {
      setError(e.response?.data?.detail || "Σφάλμα κατά την ψηφοφορία");
    } finally {
      setVoting(false);
    }
  };

  const handleWithdraw = async () => {
    if (withdrawing) return;
    setWithdrawing(true);
    setError("");
    try {
      await axios.post(`${API}/votes/potm/withdraw`, {}, { headers: getAuthHeaders() });
      setHasVoted(false);
      setVotedId(null);
      const res = await axios.get(`${API}/votes/potm/results`);
      setResults(res.data);
    } catch (e) {
      setError(e.response?.data?.detail || "Σφάλμα κατά την απόσυρση");
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

  const closeDetail = () => { setSelectedPlayer(null); setPlayerDetail(null); };

  const getPlayerVotes = (playerId) => {
    const r = results.results.find((x) => x.player_id === playerId);
    return r ? r.votes : 0;
  };

  if (loading) return <div className="pt-24 min-h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="pt-24 min-h-screen bg-[#0a0a0a]" data-testid="vote-page">
      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-[#F5A623] text-sm mb-8 transition-colors" data-testid="vote-back-link"><ArrowLeft size={14} /> Αρχική</Link>

          <div className="mb-8">
            <span className="badge badge-primary mb-3" style={{ display: 'inline-block', padding: '4px 12px', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', background: '#F5A623', color: '#000', borderRadius: '2px', fontWeight: 600 }}>Ψηφοφορια {currentMonthName}</span>
            <h1 className="font-['Bebas_Neue'] text-4xl md:text-5xl text-white mt-2" data-testid="vote-page-title">Παικτης του <span className="text-[#F5A623]">Μηνα</span></h1>
            <div className="flex items-center gap-4 mt-3">
              <p className="text-zinc-400 text-sm">Σύνολο ψήφων: <span className="text-white font-semibold">{results.total_votes}</span></p>
            </div>
          </div>

          {error && <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm" data-testid="vote-error">{error}</div>}

          {/* Login prompt if not logged in */}
          {!user ? (
            <div className="mb-10 p-6 bg-[#111] border border-[#222] rounded-lg max-w-md" data-testid="vote-login-prompt">
              <div className="flex items-center gap-3 mb-3">
                <LogIn size={20} className="text-[#F5A623]" />
                <h3 className="font-['Bebas_Neue'] text-xl text-white">Απαιτειται Συνδεση</h3>
              </div>
              <p className="text-zinc-500 text-sm mb-4">Συνδεθείτε στον λογαριασμό σας για να ψηφίσετε τον αγαπημένο σας παίκτη.</p>
              <div className="flex gap-3">
                <Link to="/login" className="bg-[#F5A623] text-black font-semibold text-sm px-6 py-2.5 rounded-lg hover:bg-[#e6951a] transition-colors" data-testid="vote-login-btn">Σύνδεση</Link>
                <Link to="/register" className="border border-[#333] text-zinc-400 text-sm px-6 py-2.5 rounded-lg hover:border-[#F5A623] hover:text-white transition-colors" data-testid="vote-register-btn">Εγγραφή</Link>
              </div>
            </div>
          ) : (
            <div className="mb-8 flex items-center justify-between p-4 bg-[#111] border border-[#222] rounded-lg" data-testid="voter-identity-bar">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#F5A623]/10 flex items-center justify-center">
                  <span className="text-[#F5A623] text-xs font-bold">{user.name?.charAt(0)?.toUpperCase()}</span>
                </div>
                <div>
                  <div className="text-white text-sm font-medium">{user.name}</div>
                  <div className="text-zinc-500 text-xs">{hasVoted ? "Έχετε ψηφίσει" : "Έτοιμοι να ψηφίσετε"}</div>
                </div>
              </div>
              {hasVoted && (
                <button onClick={handleWithdraw} disabled={withdrawing}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors disabled:opacity-50" data-testid="withdraw-vote-btn">
                  <Undo2 size={12} /> {withdrawing ? "Απόσυρση..." : "Απόσυρση Ψήφου"}
                </button>
              )}
            </div>
          )}

          {/* Share Section - shown after voting */}
          {user && hasVoted && votedPlayerName && <VoteShareSection playerName={votedPlayerName} />}

          {/* Leaderboard */}
          {results.results.length > 0 && (
            <div className="mb-10" data-testid="vote-leaderboard">
              <h3 className="font-['Bebas_Neue'] text-lg text-zinc-400 mb-4 tracking-wider">Καταταξη</h3>
              {results.results[0] && (
                <button onClick={() => openPlayerDetail(results.results[0].player_id)}
                  className="w-full mb-4 p-5 bg-gradient-to-r from-[#F5A623]/10 via-[#111] to-[#111] border border-[#F5A623]/20 rounded-lg hover:border-[#F5A623]/40 transition-colors text-left" data-testid="vote-leader">
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-[#1a1a1a] overflow-hidden border-2 border-[#F5A623]">
                        {results.results[0].image_url ? <img src={resolveImg(results.results[0].image_url)} alt="" className="w-full h-full object-cover" /> :
                          <div className="w-full h-full flex items-center justify-center font-['Bebas_Neue'] text-xl text-[#F5A623]/40">#{results.results[0].number}</div>}
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#F5A623] rounded-full flex items-center justify-center shadow-lg"><Trophy size={12} className="text-black" /></div>
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] text-[#F5A623] tracking-widest uppercase mb-0.5">Πρωτος</div>
                      <div className="font-['Bebas_Neue'] text-xl text-white">{results.results[0].player_name}</div>
                      <div className="text-xs text-zinc-400">{results.results[0].votes} ψήφ{results.results[0].votes === 1 ? "ος" : "οι"}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {results.results[0].voters?.length > 0 && (
                        <div className="hidden sm:flex items-center gap-1 text-xs text-zinc-500"><Users size={12} /><span>{results.results[0].voters.slice(0, 3).join(", ")}{results.results[0].voters.length > 3 ? ` +${results.results[0].voters.length - 3}` : ""}</span></div>
                      )}
                      <ChevronRight size={16} className="text-zinc-500" />
                    </div>
                  </div>
                </button>
              )}
              <div className="space-y-2">
                {results.results.slice(1).map((r, idx) => {
                  const pct = results.total_votes > 0 ? Math.round((r.votes / results.total_votes) * 100) : 0;
                  return (
                    <button key={r.player_id} onClick={() => openPlayerDetail(r.player_id)}
                      className={`w-full flex items-center gap-4 p-3 rounded-lg border text-left hover:border-[#F5A623]/30 transition-colors ${r.player_id === votedId ? 'bg-[#F5A623]/5 border-[#F5A623]/30' : 'bg-[#111] border-[#1a1a1a]'}`} data-testid={`vote-result-${r.player_id}`}>
                      <span className="font-['Bebas_Neue'] text-lg text-zinc-500 w-6 text-center">{idx + 2}</span>
                      <div className="w-9 h-9 rounded-full bg-[#1a1a1a] overflow-hidden flex-shrink-0">
                        {r.image_url ? <img src={resolveImg(r.image_url)} alt="" className="w-full h-full object-cover" /> :
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-600">#{r.number}</div>}
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

          {/* Player Grid */}
          <div>
            <h3 className="font-['Bebas_Neue'] text-lg text-zinc-400 mb-4 tracking-wider">{hasVoted ? "Ολοι οι Παικτες" : "Επιλεξτε Παικτη"}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3" data-testid="vote-grid">
              {players.map((p) => {
                const voteCount = getPlayerVotes(p.id);
                const isMyVote = p.id === votedId;
                return (
                  <div key={p.id} className={`relative group bg-[#111] border rounded-lg overflow-hidden transition-all ${isMyVote ? 'border-[#F5A623] ring-1 ring-[#F5A623]/30' : 'border-[#1a1a1a] hover:border-[#333]'}`} data-testid={`vote-player-${p.id}`}>
                    <button onClick={() => openPlayerDetail(p.id)} className="w-full aspect-[3/4] bg-[#1a1a1a] overflow-hidden relative block" data-testid={`vote-player-detail-${p.id}`}>
                      {p.image_url ? <img src={resolveImg(p.image_url)} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> :
                        <div className="w-full h-full flex items-center justify-center"><span className="font-['Bebas_Neue'] text-5xl text-[#F5A623]/20">{p.number}</span></div>}
                      <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1">
                        <Vote size={10} className="text-[#F5A623]" /><span className="text-[10px] text-white font-semibold">{voteCount}</span>
                      </div>
                      {isMyVote && <div className="absolute top-2 left-2 bg-[#F5A623] rounded-full px-2 py-0.5"><span className="text-[9px] text-black font-bold tracking-wide">Η ΨΗΦΟΣ ΣΑΣ</span></div>}
                    </button>
                    <div className="p-2.5">
                      <div className="font-['Bebas_Neue'] text-sm text-white truncate">#{p.number} {p.name}</div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-zinc-500">{posLabels[p.position] || p.position}</span>
                        {user && !hasVoted && (
                          <button onClick={() => handleVote(p.id)} disabled={voting}
                            className="text-[10px] font-semibold text-[#F5A623] hover:text-[#e6951a] transition-colors uppercase tracking-wider disabled:opacity-50" data-testid={`vote-btn-${p.id}`}>Ψηφισε</button>
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
              <div className="p-12 flex items-center justify-center"><div className="w-6 h-6 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin"></div></div>
            ) : playerDetail ? (
              <>
                <div className="relative p-5 border-b border-[#222]">
                  <button onClick={closeDetail} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors" data-testid="close-detail-modal"><X size={18} /></button>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-[#1a1a1a] overflow-hidden border-2 border-[#333] flex-shrink-0">
                      {playerDetail.player.image_url ? <img src={resolveImg(playerDetail.player.image_url)} alt="" className="w-full h-full object-cover" /> :
                        <div className="w-full h-full flex items-center justify-center font-['Bebas_Neue'] text-2xl text-[#F5A623]/30">#{playerDetail.player.number}</div>}
                    </div>
                    <div>
                      <div className="font-['Bebas_Neue'] text-2xl text-white">{playerDetail.player.name}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">#{playerDetail.player.number} &middot; {posLabels[playerDetail.player.position] || playerDetail.player.position}</div>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-[#0a0a0a] rounded-lg p-3 text-center"><div className="font-['Bebas_Neue'] text-2xl text-[#F5A623]">{playerDetail.vote_count}</div><div className="text-[10px] text-zinc-500 uppercase tracking-wider">Ψηφοι</div></div>
                    <div className="bg-[#0a0a0a] rounded-lg p-3 text-center"><div className="font-['Bebas_Neue'] text-2xl text-white">{playerDetail.total_month_votes > 0 ? Math.round((playerDetail.vote_count / playerDetail.total_month_votes) * 100) : 0}%</div><div className="text-[10px] text-zinc-500 uppercase tracking-wider">Ποσοστο</div></div>
                  </div>
                  <div>
                    <h4 className="text-xs text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Users size={12} /> Ψηφοφοροι ({playerDetail.voters.length})</h4>
                    {playerDetail.voters.length > 0 ? (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {playerDetail.voters.map((v, i) => (
                          <div key={i} className="flex items-center gap-2 p-2 bg-[#0a0a0a] rounded-lg">
                            <div className="w-6 h-6 rounded-full bg-[#F5A623]/10 flex items-center justify-center flex-shrink-0"><span className="text-[#F5A623] text-[9px] font-bold">{v.voter_name?.charAt(0)?.toUpperCase()}</span></div>
                            <span className="text-sm text-white">{v.voter_name}</span>
                            {v.created_at && <span className="text-[10px] text-zinc-600 ml-auto">{new Date(v.created_at).toLocaleDateString("el-GR")}</span>}
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-zinc-600 text-sm text-center py-4">Δεν υπάρχουν ψήφοι ακόμα</p>}
                  </div>
                  {user && !hasVoted && (
                    <button onClick={() => { handleVote(selectedPlayer); closeDetail(); }} disabled={voting}
                      className="w-full mt-5 bg-[#F5A623] text-black font-semibold text-sm py-2.5 rounded-lg hover:bg-[#e6951a] transition-colors disabled:opacity-50" data-testid="modal-vote-btn">Ψήφισε {playerDetail.player.name}</button>
                  )}
                </div>
              </>
            ) : <div className="p-8 text-center text-zinc-500 text-sm">Σφάλμα φόρτωσης</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default VotePage;
