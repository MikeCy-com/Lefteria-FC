import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useMobileAuth } from "../MobileAuthContext";
import AttendanceView from "../components/AttendanceView";
import { noAccent } from "../components/SharedComponents";
import {
  Users, Calendar, Clock, ChevronRight, ChevronDown, Bell,
  CheckCircle, Trophy, Star, Check, X as XIcon, MapPin,
  ExternalLink, Shield, User, Target, ArrowLeft, Briefcase,
  Activity, Zap, Award, Cone, ClipboardCheck, TrendingUp
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const imgUrl = (url) => url ? (url.startsWith("http") ? url : `${process.env.REACT_APP_BACKEND_URL}${url}`) : null;
const parseDate = (d) => { if (!d) return null; const s = d.includes("T") ? d : d + "T00:00:00"; const dt = new Date(s); return isNaN(dt.getTime()) ? null : dt; };
const fmtDate = (d, opts) => { const s = d?.toLocaleDateString("el-GR", opts); return s ? noAccent(s) : s; };

const CoachDashboard = ({ onTabChange }) => {
  const { user, getHeaders } = useMobileAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("home");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [expandedSections, setExpandedSections] = useState({ events: true, roster: false, staff: false });
  const [attendanceData, setAttendanceData] = useState({});

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/mobile/coach/dashboard`, { headers: getHeaders() });
      setData(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [getHeaders]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleSection = (key) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

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

  const allGroups = [...(data.teams || []), ...(data.groups || [])];
  const totalPlayers = data.players?.length || 0;
  const upcomingEvents = data.events || [];
  const allFixtures = data.fixtures || [];
  const upcomingFixtures = allFixtures.filter(f => (f.match_date || "") >= new Date().toISOString().split("T")[0] && f.status !== "Completed");
  const completedFixtures = allFixtures.filter(f => f.status === "Completed").slice(0, 3);
  const trainingSessions = data.training_sessions || [];

  const buildEvents = (groupId) => {
    const fixtures = allFixtures.filter(f => f.academy_group_id === groupId).map(f => ({
      ...f, event_type: "match", title: `${f.home_team || "—"} vs ${f.away_team || "—"}`,
      date: f.match_date, start_time: f.match_time, location: f.venue,
    }));
    const trainings = trainingSessions.filter(t => t.academy_group_id === groupId).map(t => ({
      ...t, event_type: "training", title: t.title || "Προπονηση",
    }));
    return [...fixtures, ...trainings].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  };

  // ===================== ATTENDANCE VIEW =====================
  if (view === "attendance" && selectedEvent) {
    const ev = selectedEvent;
    return (
      <AttendanceView
        eventId={ev.id}
        eventType={ev.event_type || "event"}
        eventTitle={ev.title}
        onBack={() => { setView("event"); }}
      />
    );
  }

  // ===================== EVENT DETAIL =====================
  if (view === "event" && selectedEvent) {
    const ev = selectedEvent;
    return (
      <div className="px-4 pt-4 pb-4" data-testid="coach-event-detail">
        <button onClick={() => { setView(selectedGroup ? "team" : "home"); setSelectedEvent(null); }} className="flex items-center gap-1.5 text-zinc-400 text-sm mb-4" data-testid="back-from-event">
          <ArrowLeft size={16} /> Πισω
        </button>
        <div className={`rounded-2xl overflow-hidden border ${ev.event_type === "match" ? "border-emerald-500/20 bg-emerald-500/[0.04]" : "border-blue-500/20 bg-blue-500/[0.04]"}`}>
          <div className="px-5 py-4">
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${ev.event_type === "match" ? "text-emerald-400" : "text-blue-400"}`}>
              {ev.event_type === "match" ? "Αγωνας" : "Προπονηση"}
            </span>
            <p className="text-xs font-bold text-white mt-1">{noAccent(ev.title)}</p>
            <div className="mt-4 space-y-2.5">
              {ev.date && (
                <div className="flex items-center gap-3 text-sm">
                  <Calendar size={15} className="text-zinc-500" />
                  <span className="text-zinc-300">{fmtDate(parseDate(ev.date), { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
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
                  {ev.location_url && (
                    <a href={ev.location_url} target="_blank" rel="noreferrer" className="text-blue-400 text-xs ml-1 flex items-center gap-0.5"><ExternalLink size={10} /> Χαρτης</a>
                  )}
                </div>
              )}
            </div>
          </div>
          {/* Attendance Button */}
          <div className="px-5 py-4 border-t border-white/[0.06]">
            <button
              onClick={() => setView("attendance")}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#F5A623] text-black text-sm font-semibold shadow-lg shadow-[#F5A623]/20 hover:bg-[#e6951a] transition-colors"
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

  // ===================== PLAYER PROFILE =====================
  if (view === "player" && selectedPlayer) {
    const p = selectedPlayer;
    const stats = p.statistics || {};
    return (
      <div className="px-4 pt-4 pb-4" data-testid="coach-player-profile">
        <button onClick={() => { setView("team"); setSelectedPlayer(null); }} className="flex items-center gap-1.5 text-zinc-400 text-sm mb-4" data-testid="back-from-player">
          <ArrowLeft size={16} /> Πισω
        </button>
        <div className="flex flex-col items-center mb-6">
          {p.image_url ? (
            <img src={imgUrl(p.image_url)} alt="" className="w-20 h-20 rounded-2xl object-cover border-2 border-[#F5A623]/30" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-[#141414] border border-white/[0.06] flex items-center justify-center">
              <User size={28} className="text-zinc-600" />
            </div>
          )}
          <p className="text-xs font-bold text-white mt-3">{noAccent(p.name)}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-[#F5A623] bg-[#F5A623]/10 px-2 py-0.5 rounded-full font-medium">#{p.number}</span>
            <span className="text-xs text-zinc-400">{p.position}</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { label: "Γκολ", value: stats.goals || 0, icon: Target, color: "text-[#F5A623]", bg: "bg-[#F5A623]/10" },
            { label: "Ασιστ", value: stats.assists || 0, icon: Star, color: "text-blue-400", bg: "bg-blue-500/10" },
            { label: "Λεπτα", value: stats.minutes_played || 0, icon: Clock, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          ].map(s => (
            <div key={s.label} className="bg-[#111] border border-white/[0.06] rounded-2xl p-3 text-center">
              <div className={`w-8 h-8 rounded-xl ${s.bg} flex items-center justify-center mx-auto mb-2`}>
                <s.icon size={15} className={s.color} />
              </div>
              <p className="text-xs font-bold text-white">{s.value}</p>
              <p className="text-[10px] text-zinc-500">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-4 space-y-3">
          {p.date_of_birth && <InfoRow label="Ημ. Γεννησης" value={p.date_of_birth} />}
          {p.nationality && <InfoRow label="Εθνικοτητα" value={p.nationality} />}
          {p.height && <InfoRow label="Υψος" value={p.height} />}
          {p.weight && <InfoRow label="Βαρος" value={p.weight} />}
          {p.parent_name && <InfoRow label="Γονεας" value={p.parent_name} />}
        </div>
      </div>
    );
  }

  // ===================== TEAM DETAIL =====================
  if (view === "team" && selectedGroup) {
    const events = buildEvents(selectedGroup.id);
    const groupPlayers = (data.players || []).filter(p =>
      (p.academy_group_ids || []).includes(selectedGroup.id) || p.academy_group_id === selectedGroup.id
    );
    const futureEvents = events.filter(e => (e.date || "") >= new Date().toISOString().split("T")[0]);

    const sections = [
      { key: "events", label: "Επομενα Γεγονοτα", icon: Calendar, count: futureEvents.length, color: "text-emerald-400" },
      { key: "roster", label: "Ροστερ", icon: Users, count: groupPlayers.length, color: "text-[#F5A623]" },
    ];

    return (
      <div className="px-4 pt-4 pb-4" data-testid="coach-team-detail">
        <button onClick={() => { setView("home"); setSelectedGroup(null); }} className="flex items-center gap-1.5 text-zinc-400 text-sm mb-4" data-testid="back-from-team">
          <ArrowLeft size={16} /> Πισω
        </button>
        {selectedGroup.banner_url && (
          <div className="h-28 rounded-2xl overflow-hidden mb-3 border border-white/[0.06]">
            <img src={imgUrl(selectedGroup.banner_url)} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="mb-5">
          <p className="text-[11px] font-semibold text-white">{noAccent(selectedGroup.name)}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {selectedGroup.age_range && <span className="text-[10px] text-[#F5A623] bg-[#F5A623]/10 px-2 py-0.5 rounded-full font-semibold">{selectedGroup.age_range}</span>}
            <span className="text-[10px] text-zinc-400">{groupPlayers.length} παικτες</span>
          </div>
        </div>

        <div className="space-y-2">
          {sections.map(sec => (
            <div key={sec.key} className="bg-[#111] border border-white/[0.06] rounded-2xl overflow-hidden">
              <button onClick={() => toggleSection(sec.key)} className="w-full flex items-center gap-3 px-4 py-3.5" data-testid={`coach-section-${sec.key}`}>
                <div className="w-8 h-8 rounded-xl bg-white/[0.04] flex items-center justify-center">
                  <sec.icon size={16} className={sec.color} />
                </div>
                <div className="flex-1 text-left">
                  <span className="text-sm font-medium text-white">{sec.label}</span>
                  <span className="text-[10px] text-zinc-500 ml-2">({sec.count})</span>
                </div>
                {expandedSections[sec.key] ? <ChevronDown size={16} className="text-zinc-500" /> : <ChevronRight size={16} className="text-zinc-500" />}
              </button>
              {expandedSections[sec.key] && (
                <div className="px-4 pb-3 border-t border-white/[0.04]">
                  {sec.key === "events" && (
                    <div className="pt-2 space-y-2">
                      {futureEvents.length === 0 ? (
                        <p className="text-zinc-600 text-xs py-3 text-center">Δεν υπαρχουν επομενα γεγονοτα</p>
                      ) : futureEvents.slice(0, 5).map(ev => (
                        <button key={ev.id} onClick={() => { setSelectedEvent(ev); setView("event"); }}
                          className="w-full text-left bg-white/[0.02] rounded-xl p-3 flex items-center gap-3" data-testid={`coach-event-${ev.id}`}>
                          <div className={`w-1 h-10 rounded-full ${ev.event_type === "match" ? "bg-emerald-500" : "bg-blue-500"}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white truncate">{noAccent(ev.title)}</p>
                            <p className="text-[10px] text-zinc-500 mt-0.5">
                              {ev.date && fmtDate(parseDate(ev.date), { weekday: "short", day: "numeric", month: "short" })}
                              {ev.start_time && ` · ${ev.start_time}`}
                            </p>
                          </div>
                          <ChevronRight size={14} className="text-zinc-600 flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                  {sec.key === "roster" && (
                    <div className="pt-2 space-y-1.5">
                      {groupPlayers.length === 0 ? (
                        <p className="text-zinc-600 text-xs py-3 text-center">Δεν υπαρχουν παικτες</p>
                      ) : groupPlayers.map(p => (
                        <button key={p.id} onClick={() => { setSelectedPlayer(p); setView("player"); }}
                          className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.03] transition-colors" data-testid={`coach-player-${p.id}`}>
                          {p.image_url ? (
                            <img src={imgUrl(p.image_url)} alt="" className="w-9 h-9 rounded-xl object-cover" />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center"><User size={14} className="text-zinc-600" /></div>
                          )}
                          <div className="flex-1 text-left min-w-0">
                            <p className="text-xs font-medium text-white truncate">{noAccent(p.name)}</p>
                            <p className="text-[10px] text-zinc-500">{p.position}</p>
                          </div>
                          <span className="text-[10px] text-zinc-600 font-mono">#{p.number}</span>
                          <ChevronRight size={13} className="text-zinc-700" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ===================== HOME DASHBOARD =====================
  return (
    <div className="px-4 pt-5 pb-4" data-testid="coach-dashboard-home">
      {/* Welcome Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/20">
            {(user?.name || "?")[0].toUpperCase()}
          </div>
          <div>
            <p className="text-[10px] text-zinc-500">Γεια σου, Προπονητη</p>
            <p className="text-[11px] font-medium text-white leading-tight truncate max-w-[200px]">{noAccent(user?.name) || "Coach"}</p>
          </div>
        </div>
        <button className="w-9 h-9 rounded-xl bg-[#141414] border border-white/[0.06] flex items-center justify-center" data-testid="coach-notifications-btn">
          <Bell size={16} className="text-zinc-400" />
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {[
          { label: "Παικτες", value: totalPlayers, icon: Users, color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
          { label: "Ομαδες", value: allGroups.length, icon: Shield, color: "#F5A623", bg: "rgba(245,166,35,0.12)" },
          { label: "Προπονησεις", value: trainingSessions.length, icon: Cone, color: "#10B981", bg: "rgba(16,185,129,0.12)" },
        ].map(stat => (
          <div key={stat.label} className="bg-[#111] border border-white/[0.06] rounded-2xl p-3" data-testid={`coach-stat-${stat.label}`}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: stat.bg }}>
              <stat.icon size={15} style={{ color: stat.color }} />
            </div>
            <p className="text-xs font-bold text-white leading-none">{stat.value}</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Next Match Card */}
      {upcomingFixtures.length > 0 && (() => {
        const next = upcomingFixtures[0];
        const isHome = (next.home_team || "").toUpperCase().includes("LEFTERIA");
        return (
          <div className="mb-5">
            <SectionHeader title="Επομενος Αγωνας" />
            <div
              className="bg-[#111] border border-white/[0.06] rounded-2xl overflow-hidden cursor-pointer"
              onClick={() => onTabChange("matches")}
              data-testid="coach-next-match-card"
            >
              <div className="bg-gradient-to-r from-blue-500/[0.08] to-transparent px-4 py-1.5">
                <span className="text-[9px] font-semibold text-blue-400 uppercase tracking-wider">{next.competition || "Αγωνας"}</span>
              </div>
              <div className="px-4 py-4 flex items-center justify-between">
                <div className="flex flex-col items-center w-20">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1 ${isHome ? "bg-blue-500/15" : "bg-white/[0.04]"}`}>
                    <Shield size={16} className={isHome ? "text-blue-400" : "text-zinc-500"} />
                  </div>
                  <span className={`text-[10px] font-medium text-center ${isHome ? "text-blue-400" : "text-white"}`}>
                    {noAccent(next.home_team)?.slice(0, 12)}
                  </span>
                </div>
                <div className="text-center">
                  <p className="text-zinc-500 text-xs font-semibold tracking-widest">VS</p>
                  <p className="text-[10px] text-zinc-600 mt-1">
                    {next.match_date && fmtDate(parseDate(next.match_date), { day: "numeric", month: "short" })}
                    {next.match_time && ` · ${next.match_time}`}
                  </p>
                </div>
                <div className="flex flex-col items-center w-20">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1 ${!isHome ? "bg-blue-500/15" : "bg-white/[0.04]"}`}>
                    <Shield size={16} className={!isHome ? "text-blue-400" : "text-zinc-500"} />
                  </div>
                  <span className={`text-[10px] font-medium text-center ${!isHome ? "text-blue-400" : "text-white"}`}>
                    {noAccent(next.away_team)?.slice(0, 12)}
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

      {/* My Teams */}
      <div className="mb-5">
        <SectionHeader title="Ομαδες Μου" />
        <div className="space-y-2">
          {allGroups.map(g => {
            const playerCount = (data.players || []).filter(p =>
              (p.academy_group_ids || []).includes(g.id) || p.academy_group_id === g.id
            ).length;
            return (
              <button
                key={g.id}
                onClick={() => { setSelectedGroup(g); setView("team"); setExpandedSections({ events: true, roster: false }); }}
                className="w-full bg-[#111] border border-white/[0.06] rounded-2xl p-3 flex items-center gap-3 hover:border-blue-500/20 transition-all group"
                data-testid={`coach-group-${g.id}`}
              >
                {g.banner_url ? (
                  <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0">
                    <img src={imgUrl(g.banner_url)} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Shield size={18} className="text-blue-400" />
                  </div>
                )}
                <div className="flex-1 text-left min-w-0">
                  <p className="text-xs font-semibold text-white group-hover:text-blue-400 transition-colors truncate">{noAccent(g.name)}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {g.age_range && <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded font-medium">{g.age_range}</span>}
                    <span className="text-[10px] text-zinc-500">{playerCount} παικτες</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-zinc-600 group-hover:text-blue-400 transition-colors flex-shrink-0" />
              </button>
            );
          })}
          {allGroups.length === 0 && (
            <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-8 text-center">
              <Shield size={28} className="text-zinc-700 mx-auto mb-2" />
              <p className="text-xs text-zinc-500">Δεν εχεις ομαδες ακομα</p>
            </div>
          )}
        </div>
      </div>

      {/* Training Schedule */}
      {trainingSessions.length > 0 && (
        <div className="mb-5">
          <SectionHeader title="Προπονησεις" action="Ολες" onAction={() => onTabChange("calendar")} />
          <div className="space-y-2">
            {trainingSessions.slice(0, 3).map(session => (
              <button
                key={session.id}
                onClick={() => { setSelectedEvent({ ...session, event_type: "training", title: session.title || "Προπονηση" }); setView("event"); }}
                className="w-full text-left bg-[#111] border border-white/[0.06] rounded-2xl p-3 flex items-center gap-3 hover:border-emerald-500/20 transition-colors"
                data-testid={`coach-training-${session.id}`}
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <Cone size={16} className="text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{noAccent(session.title) || "Προπονηση"}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    {session.date && fmtDate(parseDate(session.date), { weekday: "short", day: "numeric", month: "short" })}
                    {session.start_time && ` · ${session.start_time}`}
                    {session.duration && ` · ${session.duration} λεπτα`}
                  </p>
                </div>
                <ChevronRight size={14} className="text-zinc-600 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

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
                <div key={f.id} className="bg-[#111] border border-white/[0.06] rounded-2xl px-4 py-3 flex items-center gap-3" data-testid={`coach-result-${f.id}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                    won ? "bg-emerald-500/15 text-emerald-400" : drew ? "bg-zinc-500/15 text-zinc-400" : "bg-red-500/15 text-red-400"
                  }`}>
                    {won ? "W" : drew ? "D" : "L"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{noAccent(f.home_team)} vs {noAccent(f.away_team)}</p>
                    <p className="text-[10px] text-zinc-500">{f.match_date && fmtDate(parseDate(f.match_date), { day: "numeric", month: "short" })}</p>
                  </div>
                  <span className="text-xs font-bold text-white tabular-nums">{f.home_score} - {f.away_score}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Announcements */}
      {(data.announcements || []).length > 0 && (
        <div className="mb-5">
          <SectionHeader title="Ανακοινωσεις" />
          <div className="space-y-2">
            {data.announcements.slice(0, 3).map((a, i) => (
              <div key={a.id || i} className="bg-[#111] border border-white/[0.06] rounded-2xl p-3" data-testid={`coach-announcement-${i}`}>
                <p className="text-xs font-medium text-white">{noAccent(a.title)}</p>
                {a.content && <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2">{a.content}</p>}
                {a.created_at && <p className="text-[9px] text-zinc-600 mt-1.5">{noAccent(new Date(a.created_at).toLocaleDateString("el-GR"))}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const SectionHeader = ({ title, action, onAction }) => (
  <div className="flex items-center justify-between mb-2.5">
    <p className="text-[9px] font-medium text-zinc-500 tracking-wide">{title}</p>
    {action && (
      <button onClick={onAction} className="text-[10px] text-blue-400 font-medium">{action}</button>
    )}
  </div>
);

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between items-center">
    <span className="text-xs text-zinc-500">{label}</span>
    <span className="text-xs text-white font-medium">{value}</span>
  </div>
);

export default CoachDashboard;
