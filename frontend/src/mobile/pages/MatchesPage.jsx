import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useMobileAuth } from "../MobileAuthContext";
import { Calendar, Clock, MapPin, ExternalLink, Trophy, Shield, Check, X as XIcon } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const MatchesPage = () => {
  const { getHeaders, user } = useMobileAuth();
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("upcoming");
  const [myAvailability, setMyAvailability] = useState({});
  const [submitting, setSubmitting] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const role = user?.role || "parent";
      const endpoint = role === "coach" ? "coach" : role === "player" ? "player" : role === "management" ? "management" : "parent";
      const [dashRes, availRes] = await Promise.all([
        axios.get(`${API}/mobile/${endpoint}/dashboard`, { headers: getHeaders() }),
        axios.get(`${API}/mobile/my-availability`, { headers: getHeaders() }).catch(() => ({ data: [] })),
      ]);
      const allFixtures = dashRes.data.fixtures || [];
      setFixtures(allFixtures);
      const avMap = {};
      (availRes.data || []).forEach(a => { avMap[a.event_id] = a.status; });
      setMyAvailability(avMap);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [getHeaders, user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAvailability = async (eventId, status) => {
    setSubmitting(eventId + status);
    try {
      const playerId = user?.role === "player" ? user.linked_player_id : user?.children_ids?.[0];
      if (!playerId) return;
      await axios.post(`${API}/mobile/availability`, { event_id: eventId, player_id: playerId, status }, { headers: getHeaders() });
      setMyAvailability(prev => ({ ...prev, [eventId]: status }));
    } catch (e) { console.error(e); }
    finally { setSubmitting(null); }
  };

  const today = new Date().toISOString().split("T")[0];
  const upcoming = fixtures.filter(f => (f.match_date || "") >= today && f.status !== "Completed");
  const completed = fixtures.filter(f => f.status === "Completed");
  const displayed = filter === "upcoming" ? upcoming : completed;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-4" data-testid="matches-page">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-white tracking-tight">Αγωνες</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Ολοι οι αγωνες της ομαδας σου</p>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 mb-5">
        {[
          { id: "upcoming", label: "Επομενοι", count: upcoming.length },
          { id: "completed", label: "Ολοκληρωμενοι", count: completed.length },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              filter === f.id
                ? "bg-[#F5A623] text-black shadow-lg shadow-[#F5A623]/20"
                : "bg-[#141414] text-zinc-400 border border-white/[0.06]"
            }`}
            data-testid={`filter-${f.id}`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Match Cards */}
      {displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Trophy size={40} className="text-zinc-700 mb-3" />
          <p className="text-zinc-500 text-sm">{filter === "upcoming" ? "Δεν υπαρχουν επομενοι αγωνες" : "Δεν υπαρχουν ολοκληρωμενοι αγωνες"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(f => {
            const isCompleted = f.status === "Completed";
            const isHome = (f.home_team || "").toUpperCase().includes("LEFTERIA");
            const avail = myAvailability[f.id];
            const isFuture = (f.match_date || "") >= today;

            return (
              <div
                key={f.id}
                className="bg-[#111] border border-white/[0.06] rounded-2xl overflow-hidden"
                data-testid={`match-card-${f.id}`}
              >
                {/* Competition badge */}
                {f.competition && (
                  <div className="px-4 pt-3 pb-1">
                    <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{f.competition}</span>
                  </div>
                )}

                {/* Score area */}
                <div className="px-4 py-3 flex items-center justify-between">
                  {/* Home Team */}
                  <div className="flex flex-col items-center w-24">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-1.5 ${
                      isHome ? "bg-[#F5A623]/15" : "bg-white/[0.04]"
                    }`}>
                      {f.home_team_logo ? (
                        <img src={f.home_team_logo} alt="" className="w-7 h-7 object-contain" />
                      ) : (
                        <Shield size={18} className={isHome ? "text-[#F5A623]" : "text-zinc-500"} />
                      )}
                    </div>
                    <span className={`text-[11px] font-medium text-center leading-tight ${
                      isHome ? "text-[#F5A623]" : "text-white"
                    }`}>
                      {f.home_team?.length > 14 ? f.home_team.slice(0, 14) + "..." : f.home_team}
                    </span>
                  </div>

                  {/* Score / VS */}
                  <div className="flex flex-col items-center">
                    {isCompleted ? (
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-white tabular-nums">{f.home_score ?? 0}</span>
                        <span className="text-zinc-600 text-sm">-</span>
                        <span className="text-2xl font-bold text-white tabular-nums">{f.away_score ?? 0}</span>
                      </div>
                    ) : (
                      <span className="text-zinc-500 text-xs font-semibold tracking-widest">VS</span>
                    )}
                    {isCompleted && (
                      <span className="text-[9px] text-emerald-400 font-medium mt-0.5 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        Τελικο
                      </span>
                    )}
                  </div>

                  {/* Away Team */}
                  <div className="flex flex-col items-center w-24">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-1.5 ${
                      !isHome ? "bg-[#F5A623]/15" : "bg-white/[0.04]"
                    }`}>
                      {f.away_team_logo ? (
                        <img src={f.away_team_logo} alt="" className="w-7 h-7 object-contain" />
                      ) : (
                        <Shield size={18} className={!isHome ? "text-[#F5A623]" : "text-zinc-500"} />
                      )}
                    </div>
                    <span className={`text-[11px] font-medium text-center leading-tight ${
                      !isHome ? "text-[#F5A623]" : "text-white"
                    }`}>
                      {f.away_team?.length > 14 ? f.away_team.slice(0, 14) + "..." : f.away_team}
                    </span>
                  </div>
                </div>

                {/* Meta info */}
                <div className="px-4 pb-3 flex items-center gap-3 text-[10px] text-zinc-500 flex-wrap">
                  {f.match_date && (
                    <span className="flex items-center gap-1">
                      <Calendar size={10} />
                      {new Date(f.match_date + "T00:00:00").toLocaleDateString("el-GR", { weekday: "short", day: "numeric", month: "short" })}
                    </span>
                  )}
                  {f.match_time && <span className="flex items-center gap-1"><Clock size={10} /> {f.match_time}</span>}
                  {f.venue && <span className="flex items-center gap-1"><MapPin size={10} /> {f.venue}</span>}
                  {f.location_url && (
                    <a href={f.location_url} target="_blank" rel="noreferrer" className="text-blue-400 flex items-center gap-0.5">
                      <ExternalLink size={9} /> Χαρτης
                    </a>
                  )}
                </div>

                {/* Availability buttons */}
                {!isCompleted && isFuture && (user?.role === "parent" || user?.role === "player") && (
                  <div className="px-4 pb-3 flex gap-2">
                    <button
                      onClick={() => handleAvailability(f.id, "going")}
                      disabled={!!submitting}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                        avail === "going"
                          ? "bg-emerald-500 text-white"
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}
                      data-testid={`going-btn-${f.id}`}
                    >
                      <Check size={14} /> Παω
                    </button>
                    <button
                      onClick={() => handleAvailability(f.id, "not_going")}
                      disabled={!!submitting}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                        avail === "not_going"
                          ? "bg-red-500 text-white"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}
                      data-testid={`not-going-btn-${f.id}`}
                    >
                      <XIcon size={14} /> Δεν παω
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MatchesPage;
