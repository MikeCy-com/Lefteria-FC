import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useMobileAuth } from "../MobileAuthContext";
import AttendanceView from "../components/AttendanceView";
import {
  Target, Trophy, Clock, Star, Calendar, Bell, User, Shield,
  MapPin, ChevronRight, ArrowLeft, Zap, TrendingUp, Award, Activity, ClipboardCheck, Dumbbell
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const imgUrl = (url) => url ? (url.startsWith("http") ? url : `${process.env.REACT_APP_BACKEND_URL}${url}`) : null;
const parseDate = (d) => { if (!d) return null; const s = d.includes("T") ? d : d + "T00:00:00"; const dt = new Date(s); return isNaN(dt.getTime()) ? null : dt; };

const PlayerDashboard = ({ onTabChange }) => {
  const { user, getHeaders } = useMobileAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("home");
  const [selectedEvent, setSelectedEvent] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/mobile/player/dashboard`, { headers: getHeaders() });
      setData(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [getHeaders]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-8 h-8 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data) return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-zinc-500">
      <Zap size={40} className="mb-3 text-zinc-700" />
      <p className="text-sm">Σφαλμα φορτωσης</p>
    </div>
  );

  const player = data.player;
  const stats = data.stats || {};
  const allFixtures = data.fixtures || [];
  const upcomingFixtures = allFixtures.filter(f => (f.match_date || "") >= new Date().toISOString().split("T")[0] && f.status !== "Completed");
  const completedFixtures = allFixtures.filter(f => f.status === "Completed").slice(0, 3);

  const playerId = data?.player?.id || user?.linked_player_id;

  // ===================== ATTENDANCE VIEW =====================
  if (view === "attendance" && selectedEvent) {
    return (
      <AttendanceView
        eventId={selectedEvent.id}
        eventType={selectedEvent.event_type || "event"}
        eventTitle={selectedEvent.title}
        onBack={() => setView("event")}
        playerIds={playerId ? [playerId] : []}
      />
    );
  }

  // ===================== EVENT DETAIL =====================
  if (view === "event" && selectedEvent) {
    const ev = selectedEvent;
    return (
      <div className="px-4 pt-4 pb-4" data-testid="player-event-detail">
        <button onClick={() => { setView("home"); setSelectedEvent(null); }} className="flex items-center gap-1.5 text-zinc-400 text-sm mb-4" data-testid="back-from-event">
          <ArrowLeft size={16} /> Πισω
        </button>
        <div className={`rounded-2xl overflow-hidden border ${ev.event_type === "match" ? "border-emerald-500/20 bg-emerald-500/[0.04]" : "border-blue-500/20 bg-blue-500/[0.04]"}`}>
          <div className="px-5 py-4">
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${ev.event_type === "match" ? "text-emerald-400" : "text-blue-400"}`}>
              {ev.event_type === "match" ? "Αγωνας" : "Γεγονος"}
            </span>
            <h2 className="text-sm font-bold text-white mt-1">{ev.title}</h2>
            <div className="mt-4 space-y-2.5">
              {ev.date && (
                <div className="flex items-center gap-3 text-sm">
                  <Calendar size={15} className="text-zinc-500" />
                  <span className="text-zinc-300">{parseDate(ev.date)?.toLocaleDateString("el-GR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
                </div>
              )}
              {(ev.start_time || ev.match_time) && (
                <div className="flex items-center gap-3 text-sm">
                  <Clock size={15} className="text-zinc-500" />
                  <span className="text-zinc-300">Εναρξη: {ev.start_time || ev.match_time}</span>
                </div>
              )}
              {(ev.location || ev.venue) && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin size={15} className="text-zinc-500" />
                  <span className="text-zinc-300">{ev.location || ev.venue}</span>
                </div>
              )}
            </div>
          </div>
          {/* Attendance Button */}
          <div className="px-5 py-4 border-t border-white/[0.06]">
            <button
              onClick={() => setView("attendance")}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-colors"
              data-testid="open-attendance-btn"
            >
              <ClipboardCheck size={16} />
              Παρουσιες
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===================== HOME DASHBOARD =====================
  return (
    <div className="px-4 pt-5 pb-4" data-testid="player-dashboard-home">
      {/* Player Hero Card */}
      <div className="relative bg-[#111] border border-white/[0.06] rounded-2xl overflow-hidden mb-5" data-testid="player-hero-card">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.06] via-transparent to-[#F5A623]/[0.04]" />
        <div className="relative px-4 py-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] overflow-hidden flex-shrink-0 border-2 border-emerald-500/20">
            {player?.image_url ? (
              <img src={imgUrl(player.image_url)} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User size={24} className="text-emerald-400" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-white leading-tight truncate">{player?.name || user?.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              {player?.number && <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold">#{player.number}</span>}
              {player?.position && <span className="text-xs text-zinc-400">{player.position}</span>}
            </div>
            {player?.academy_group_name && (
              <p className="text-[10px] text-zinc-500 mt-1">{player.academy_group_name}</p>
            )}
          </div>
          <button className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center" data-testid="player-notifications-btn">
            <Bell size={16} className="text-zinc-400" />
          </button>
        </div>
      </div>

      {/* Season Stats */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {[
          { label: "Γκολ", value: stats.goals || 0, icon: Target, color: "#10B981", bg: "rgba(16,185,129,0.12)" },
          { label: "Ασιστ", value: stats.assists || 0, icon: Star, color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
          { label: "Αγωνες", value: stats.appearances || 0, icon: Trophy, color: "#F5A623", bg: "rgba(245,166,35,0.12)" },
          { label: "Λεπτα", value: stats.minutes || 0, icon: Clock, color: "#8B5CF6", bg: "rgba(139,92,246,0.12)" },
        ].map(stat => (
          <div key={stat.label} className="bg-[#111] border border-white/[0.06] rounded-2xl p-2.5 text-center" data-testid={`player-stat-${stat.label}`}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center mx-auto mb-1.5" style={{ backgroundColor: stat.bg }}>
              <stat.icon size={13} style={{ color: stat.color }} />
            </div>
            <p className="text-base font-bold text-white leading-none">{stat.value}</p>
            <p className="text-[9px] text-zinc-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Next Match */}
      {upcomingFixtures.length > 0 && (() => {
        const next = upcomingFixtures[0];
        const isHome = (next.home_team || "").toUpperCase().includes("LEFTERIA");
        return (
          <div className="mb-5">
            <SectionHeader title="Επομενος Αγωνας" />
            <div
              className="bg-[#111] border border-white/[0.06] rounded-2xl overflow-hidden cursor-pointer"
              onClick={() => onTabChange("matches")}
              data-testid="player-next-match-card"
            >
              <div className="bg-gradient-to-r from-emerald-500/[0.08] to-transparent px-4 py-1.5">
                <span className="text-[9px] font-semibold text-emerald-400 uppercase tracking-wider">{next.competition || "Αγωνας"}</span>
              </div>
              <div className="px-4 py-4 flex items-center justify-between">
                <div className="flex flex-col items-center w-20">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1 ${isHome ? "bg-emerald-500/15" : "bg-white/[0.04]"}`}>
                    <Shield size={16} className={isHome ? "text-emerald-400" : "text-zinc-500"} />
                  </div>
                  <span className={`text-[10px] font-medium text-center ${isHome ? "text-emerald-400" : "text-white"}`}>
                    {next.home_team?.slice(0, 12)}
                  </span>
                </div>
                <div className="text-center">
                  <p className="text-zinc-500 text-xs font-semibold tracking-widest">VS</p>
                  <p className="text-[10px] text-zinc-600 mt-1">
                    {next.match_date && parseDate(next.match_date)?.toLocaleDateString("el-GR", { day: "numeric", month: "short" })}
                    {next.match_time && ` · ${next.match_time}`}
                  </p>
                </div>
                <div className="flex flex-col items-center w-20">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1 ${!isHome ? "bg-emerald-500/15" : "bg-white/[0.04]"}`}>
                    <Shield size={16} className={!isHome ? "text-emerald-400" : "text-zinc-500"} />
                  </div>
                  <span className={`text-[10px] font-medium text-center ${!isHome ? "text-emerald-400" : "text-white"}`}>
                    {next.away_team?.slice(0, 12)}
                  </span>
                </div>
              </div>
              {next.venue && (
                <div className="px-4 pb-3 flex items-center gap-1.5 text-[10px] text-zinc-500">
                  <MapPin size={10} /> {next.venue}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Development Plans */}
      {(data.development_plans || []).length > 0 && (
        <div className="mb-5">
          <SectionHeader title="Πλανο Αναπτυξης" />
          <div className="space-y-2">
            {data.development_plans.slice(0, 3).map(plan => (
              <div key={plan.id} className="bg-[#111] border border-white/[0.06] rounded-2xl p-3.5" data-testid={`player-plan-${plan.id}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#F5A623]/10 flex items-center justify-center">
                      <TrendingUp size={13} className="text-[#F5A623]" />
                    </div>
                    <p className="text-xs font-medium text-white">{plan.title}</p>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${
                    plan.status === "completed" ? "bg-emerald-500/15 text-emerald-400" : "bg-[#F5A623]/15 text-[#F5A623]"
                  }`}>
                    {plan.status === "completed" ? "Ολοκληρωθηκε" : "Σε εξελιξη"}
                  </span>
                </div>
                {plan.progress !== undefined && (
                  <div className="w-full h-1.5 bg-white/[0.04] rounded-full mt-2">
                    <div className="h-full bg-gradient-to-r from-[#F5A623] to-emerald-400 rounded-full transition-all" style={{ width: `${plan.progress || 0}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Evaluations */}
      {(data.evaluations || []).length > 0 && (
        <div className="mb-5">
          <SectionHeader title="Αξιολογησεις" />
          <div className="space-y-2">
            {data.evaluations.slice(0, 2).map(ev => (
              <div key={ev.id} className="bg-[#111] border border-white/[0.06] rounded-2xl p-3.5" data-testid={`player-eval-${ev.id}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Award size={13} className="text-purple-400" />
                    </div>
                    <p className="text-xs font-medium text-white">{ev.period || ev.title}</p>
                  </div>
                  {ev.overall_rating && (
                    <div className="flex items-center gap-1.5 bg-[#F5A623]/10 px-2.5 py-1 rounded-full">
                      <Star size={11} className="text-[#F5A623]" />
                      <span className="text-xs font-bold text-[#F5A623]">{ev.overall_rating}/10</span>
                    </div>
                  )}
                </div>
                {ev.notes && <p className="text-[10px] text-zinc-400 mt-2 line-clamp-2 pl-9">{ev.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Training Sessions */}
      {(data.training_sessions || []).length > 0 && (
        <div className="mb-5">
          <SectionHeader title="Προπονησεις" />
          <div className="space-y-2">
            {data.training_sessions.slice(0, 3).map(session => (
              <button
                key={session.id}
                onClick={() => { setSelectedEvent({ ...session, event_type: "training", title: session.title || "Προπονηση" }); setView("event"); }}
                className="w-full text-left bg-[#111] border border-white/[0.06] rounded-2xl p-3 flex items-center gap-3 hover:border-emerald-500/20 transition-colors"
                data-testid={`player-training-${session.id}`}
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <Dumbbell size={16} className="text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{session.title || "Προπονηση"}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    {session.date && parseDate(session.date)?.toLocaleDateString("el-GR", { weekday: "short", day: "numeric", month: "short" })}
                    {session.start_time && ` · ${session.start_time}`}
                  </p>
                </div>
                <ChevronRight size={14} className="text-zinc-600 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      <div className="mb-5">
        <SectionHeader title="Προγραμμα" action={(data.events || []).length > 0 ? "Ολα" : undefined} onAction={() => onTabChange("calendar")} />
        {(data.events || []).length > 0 ? (
          <div className="space-y-2">
            {data.events.slice(0, 3).map(ev => (
              <button
                key={ev.id}
                onClick={() => { setSelectedEvent(ev); setView("event"); }}
                className="w-full text-left bg-[#111] border border-white/[0.06] rounded-2xl p-3 flex items-center gap-3 hover:border-emerald-500/20 transition-colors"
                data-testid={`player-event-${ev.id}`}
              >
                <div className={`w-1 h-10 rounded-full ${ev.event_type === "match" ? "bg-emerald-500" : "bg-blue-500"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{ev.title || "Γεγονος"}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    {ev.date && parseDate(ev.date)?.toLocaleDateString("el-GR", { weekday: "short", day: "numeric", month: "short" })}
                    {(ev.start_time || ev.match_time) && ` · ${ev.start_time || ev.match_time}`}
                  </p>
                </div>
                <ChevronRight size={14} className="text-zinc-600 flex-shrink-0" />
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-6 text-center" data-testid="player-no-events">
            <Calendar size={24} className="text-zinc-700 mx-auto mb-2" />
            <p className="text-xs text-zinc-500">Δεν υπαρχουν επομενα γεγονοτα</p>
          </div>
        )}
      </div>

      {/* Recent Results */}
      {completedFixtures.length > 0 && (
        <div className="mb-5">
          <SectionHeader title="Τελευταια Αποτελεσματα" action="Ολα" onAction={() => onTabChange("matches")} />
          <div className="space-y-2">
            {completedFixtures.map(f => {
              const isHome = (f.home_team || "").toUpperCase().includes("LEFTERIA");
              const ourScore = isHome ? f.home_score : f.away_score;
              const theirScore = isHome ? f.away_score : f.home_score;
              const won = ourScore > theirScore;
              const drew = ourScore === theirScore;
              return (
                <div key={f.id} className="bg-[#111] border border-white/[0.06] rounded-2xl px-4 py-3 flex items-center gap-3" data-testid={`player-result-${f.id}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                    won ? "bg-emerald-500/15 text-emerald-400" : drew ? "bg-zinc-500/15 text-zinc-400" : "bg-red-500/15 text-red-400"
                  }`}>
                    {won ? "W" : drew ? "D" : "L"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{f.home_team} vs {f.away_team}</p>
                    <p className="text-[10px] text-zinc-500">{f.match_date && parseDate(f.match_date)?.toLocaleDateString("el-GR", { day: "numeric", month: "short" })}</p>
                  </div>
                  <span className="text-sm font-bold text-white tabular-nums">{f.home_score} - {f.away_score}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Announcements */}
      <div className="mb-5">
        <SectionHeader title="Ανακοινωσεις" />
        {(data.announcements || []).length > 0 ? (
          <div className="space-y-2">
            {data.announcements.slice(0, 3).map((a, i) => (
              <div key={a.id || i} className="bg-[#111] border border-white/[0.06] rounded-2xl p-3" data-testid={`player-announcement-${i}`}>
                <p className="text-xs font-medium text-white">{a.title}</p>
                {a.content && <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2">{a.content}</p>}
                {a.created_at && <p className="text-[9px] text-zinc-600 mt-1.5">{new Date(a.created_at).toLocaleDateString("el-GR")}</p>}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-6 text-center" data-testid="player-no-announcements">
            <Bell size={24} className="text-zinc-700 mx-auto mb-2" />
            <p className="text-xs text-zinc-500">Δεν υπαρχουν ανακοινωσεις</p>
          </div>
        )}
      </div>
    </div>
  );
};

const SectionHeader = ({ title, action, onAction }) => (
  <div className="flex items-center justify-between mb-2.5">
    <h2 className="text-xs font-semibold text-white uppercase tracking-wide">{title}</h2>
    {action && (
      <button onClick={onAction} className="text-[10px] text-emerald-400 font-medium">{action}</button>
    )}
  </div>
);

export default PlayerDashboard;
