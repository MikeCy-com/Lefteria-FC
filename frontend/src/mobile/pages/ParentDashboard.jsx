import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useMobileAuth } from "../MobileAuthContext";
import {
  Users, Calendar, Euro, Clock, ChevronRight, ChevronLeft, AlertCircle,
  CheckCircle, RefreshCw, Trophy, Star, ChevronDown, Check, X as XIcon,
  MapPin, ExternalLink, BarChart3, Shield, User, TrendingUp, Target,
  Megaphone, ArrowLeft, UserCheck, UserX, HelpCircle, Mail, Phone
} from "lucide-react";
import { stripGreekAccents } from "../../utils/greekText";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ParentDashboard = ({ onTabChange }) => {
  const { user, getHeaders } = useMobileAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Navigation state
  const [view, setView] = useState("home");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [teamTab, setTeamTab] = useState("schedule");

  // Availability
  const [myAvailability, setMyAvailability] = useState({});
  const [submitting, setSubmitting] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, availRes] = await Promise.all([
        axios.get(`${API}/mobile/parent/dashboard`, { headers: getHeaders() }),
        axios.get(`${API}/mobile/my-availability`, { headers: getHeaders() }).catch(() => ({ data: [] })),
      ]);
      setData(dashRes.data);
      const avMap = {};
      (availRes.data || []).forEach(a => { avMap[a.event_id] = a.status; });
      setMyAvailability(avMap);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [getHeaders]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAvailability = async (eventId, playerId, status) => {
    setSubmitting(eventId + status);
    try {
      await axios.post(`${API}/mobile/availability`, {
        event_id: eventId, player_id: playerId, status,
      }, { headers: getHeaders() });
      setMyAvailability(prev => ({ ...prev, [eventId]: status }));
    } catch (e) { console.error(e); }
    finally { setSubmitting(null); }
  };

  const getPlayerId = () => {
    if (selectedPlayer?.id && myKidIds.has(selectedPlayer.id)) return selectedPlayer.id;
    if (user?.linked_player_id) return user.linked_player_id;
    if (data?.children?.[0]) return data.children[0].id;
    return null;
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <RefreshCw size={28} className="animate-spin text-[#F5A623]" />
    </div>
  );
  if (!data) return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-zinc-500 px-8 text-center">
      <AlertCircle size={40} className="mb-3" />
      <p className="text-sm">Σφάλμα φόρτωσης δεδομένων</p>
    </div>
  );

  const myKidIds = new Set((data.children || []).map(c => c.id));
  const allEvents = [
    ...(data.fixtures || []).map(f => ({
      ...f, event_type: "match",
      title: `${f.home_team || "—"} vs ${f.away_team || "—"}`,
      date: f.match_date, start_time: f.match_time,
      location: f.venue, location_url: f.location_url,
    })),
    ...(data.training_sessions || []).map(t => ({
      ...t, event_type: "training",
      title: t.title || "Προπόνηση",
    })),
    ...(data.events || []).map(e => ({ ...e, event_type: e.event_type || "other" })),
  ].sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  // ==================== EVENT DETAIL VIEW ====================
  if (view === "event" && selectedEvent) {
    const ev = selectedEvent;
    const eventAttendanceList = (data.group_players?.[selectedGroup?.id] || data.children || []);
    const playerId = getPlayerId();
    const avail = myAvailability[ev.id];
    const typeLabel = ev.event_type === "match" ? "Αγώνας" : ev.event_type === "training" ? "Προπόνηση" : "Γεγονός";
    const typeColor = ev.event_type === "match" ? "#10B981" : ev.event_type === "training" ? "#3B82F6" : "#F5A623";

    return (
      <div className="pb-24" data-testid="event-detail-view">
        {/* Header */}
        <div className="px-4 pt-3 pb-4" style={{ borderBottom: `1px solid ${typeColor}20` }}>
          <button onClick={() => { setView(selectedGroup ? "team" : "home"); setSelectedEvent(null); }}
            className="flex items-center gap-1.5 text-zinc-400 text-sm mb-3" data-testid="event-back-btn">
            <ArrowLeft size={16} /> Πίσω
          </button>
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full tracking-wide"
            style={{ background: `${typeColor}15`, color: typeColor, border: `1px solid ${typeColor}30` }}>
            {typeLabel}
          </span>
          <h1 className="text-white text-xl font-bold mt-2 leading-tight">{ev.title}</h1>
        </div>

        {/* Going / Not Going prompt */}
        {playerId && (
          <div className="mx-4 mt-4 bg-[#121212] border border-[#1e1e1e] rounded-2xl p-4" data-testid="availability-prompt">
            <p className="text-sm text-zinc-400 mb-3">Θα είσαι εκεί;</p>
            <div className="flex gap-2">
              <button onClick={() => handleAvailability(ev.id, playerId, "going")}
                disabled={submitting === ev.id + "going"}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                  avail === "going"
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                    : "bg-[#1a1a1a] text-zinc-400 border border-[#2a2a2a] hover:border-emerald-500/40"
                }`} data-testid="going-btn">
                <Check size={16} /> Πάω
              </button>
              <button onClick={() => handleAvailability(ev.id, playerId, "not_going")}
                disabled={submitting === ev.id + "not_going"}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                  avail === "not_going"
                    ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                    : "bg-[#1a1a1a] text-zinc-400 border border-[#2a2a2a] hover:border-red-500/40"
                }`} data-testid="not-going-btn">
                <XIcon size={16} /> Δεν πάω
              </button>
            </div>
          </div>
        )}

        {/* Details Row */}
        <div className="mx-4 mt-4 space-y-3">
          {ev.date && (() => { const dd = new Date(ev.date + (ev.date.includes("T") ? "" : "T00:00:00")); return !isNaN(dd.getTime()) ? (
            <DetailRow icon={Calendar} color={typeColor}
              label={dd.toLocaleDateString("el-GR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} />
          ) : null; })()}
          {ev.start_time && <DetailRow icon={Clock} color={typeColor} label={`Ώρα: ${ev.start_time}`} />}
          {ev.arrival_time && <DetailRow icon={Clock} color="#F5A623" label={`Άφιξη: ${ev.arrival_time}`} />}
          {ev.location && (
            <DetailRow icon={MapPin} color={typeColor} label={ev.location}
              action={ev.location_url ? { label: "Χάρτης", url: ev.location_url } : null} />
          )}
          {ev.competition && <DetailRow icon={Trophy} color="#F5A623" label={ev.competition} />}
        </div>

        {/* Attendance List */}
        <div className="mx-4 mt-6">
          <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            <Users size={14} style={{ color: typeColor }} /> Παρουσιες ({eventAttendanceList.length})
          </h3>
          {/* Group by status */}
          {["going", "not_going", "no_response"].map(status => {
            const statusPlayers = eventAttendanceList.filter(p => {
              const pAvail = myAvailability[ev.id + "_" + p.id]; // per-player availability
              if (status === "no_response") return !myAvailability[ev.id] || (p.id !== getPlayerId());
              return false; // We only know our own status currently
            });
            return null; // Simplified: show all players
          })}
          <div className="space-y-1.5">
            {eventAttendanceList.map(p => {
              const isMyKid = myKidIds.has(p.id);
              return (
                <div key={p.id}
                  className={`flex items-center gap-3 p-3 rounded-xl ${
                    isMyKid ? "bg-[#F5A623]/5 border border-[#F5A623]/20" : "bg-[#0e0e0e] border border-[#1a1a1a]"
                  }`}>
                  <div className="w-9 h-9 rounded-full bg-[#1a1a1a] flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {p.image_url ? (
                      <img src={p.image_url.startsWith("http") ? p.image_url : `${process.env.REACT_APP_BACKEND_URL}${p.image_url}`}
                        alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <span className={`text-xs font-bold ${isMyKid ? "text-[#F5A623]" : "text-zinc-500"}`}>{p.name?.slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isMyKid ? "text-[#F5A623]" : "text-white"}`}>{p.name}</p>
                    <p className="text-[10px] text-zinc-600">{p.position || ""} {p.number ? `#${p.number}` : ""}</p>
                  </div>
                  {isMyKid && avail && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      avail === "going" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                    }`}>
                      {avail === "going" ? "Πάω" : "Δεν πάω"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ==================== PLAYER PROFILE VIEW ====================
  if (view === "player" && selectedPlayer) {
    const isMyKid = myKidIds.has(selectedPlayer.id);
    const p = selectedPlayer;

    // Compute stats from fixtures
    const playerFixtures = (data.fixtures || []).filter(f =>
      f.academy_group_id && ((p.academy_group_ids || []).includes(f.academy_group_id) || f.academy_group_id === p.academy_group_id)
    );
    const totalFixtures = playerFixtures.length;
    const playerPerformances = playerFixtures.flatMap(f => (f.player_performances || []).filter(pp => pp.player_id === p.id));
    const stats = { goals: 0, assists: 0, appearances: playerPerformances.length, minutes: 0 };
    playerPerformances.forEach(pp => {
      stats.goals += pp.goals || 0;
      stats.assists += pp.assists || 0;
      stats.minutes += pp.minutes || 0;
    });

    // Training attendance
    const totalTrainings = (data.training_sessions || []).length;
    const trainAttRate = totalTrainings > 0 ? Math.round((stats.appearances / Math.max(totalFixtures, 1)) * 100) : 0;
    const matchAttRate = totalFixtures > 0 ? Math.round((stats.appearances / totalFixtures) * 100) : 0;

    // Group roster for ranking
    const groupId = (p.academy_group_ids?.[0]) || p.academy_group_id;
    const groupPlayers = data.group_players?.[groupId] || [];
    const totalInGroup = groupPlayers.length;

    return (
      <div className="pb-24" data-testid="player-profile-view">
        {/* Back */}
        <div className="px-4 pt-3">
          <button onClick={() => { setView(selectedGroup ? "team" : "home"); setSelectedPlayer(null); }}
            className="flex items-center gap-1.5 text-zinc-400 text-sm" data-testid="player-back-btn">
            <ArrowLeft size={16} /> Πίσω
          </button>
        </div>

        {/* Avatar & Name */}
        <div className="flex flex-col items-center pt-4 pb-6">
          <div className={`w-24 h-24 rounded-full overflow-hidden mb-3 ${isMyKid ? "ring-2 ring-[#F5A623] ring-offset-2 ring-offset-[#0a0a0a]" : "border-2 border-[#2a2a2a]"}`}>
            {p.image_url ? (
              <img src={p.image_url.startsWith("http") ? p.image_url : `${process.env.REACT_APP_BACKEND_URL}${p.image_url}`}
                alt="" className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full flex items-center justify-center text-3xl font-bold ${isMyKid ? "bg-[#F5A623]/10 text-[#F5A623]" : "bg-[#1a1a1a] text-zinc-500"}`}>
                {p.name?.charAt(0)}
              </div>
            )}
          </div>
          <h2 className="text-white text-xl font-bold">{p.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            {p.number && <span className="text-xs bg-[#F5A623]/15 text-[#F5A623] px-2.5 py-0.5 rounded-full font-semibold">#{p.number}</span>}
            {p.position && <span className="text-xs text-zinc-500">{p.position}</span>}
          </div>
          {isMyKid && <span className="text-[10px] text-[#F5A623]/70 mt-1.5">Το παιδί μου</span>}
        </div>

        {/* Stat Cards — always visible for own kids, limited for others */}
        <div className="px-4 space-y-3">
          {/* Training Attendance */}
          <div className="bg-[#121212] border border-[#1e1e1e] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-zinc-400 text-xs font-medium flex items-center gap-1.5">
                <Target size={13} className="text-blue-400" /> Παρουσίες Προπόνησης
              </h3>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <span className="text-4xl font-bold text-blue-400">{isMyKid ? trainAttRate : "—"}</span>
                <span className="text-lg text-blue-400/60 ml-0.5">%</span>
              </div>
              {isMyKid && totalInGroup > 0 && (
                <div className="text-right">
                  <p className="text-[10px] text-zinc-600">Κατάταξη</p>
                  <p className="text-lg font-bold text-zinc-400">—<span className="text-xs text-zinc-600">/{totalInGroup}</span></p>
                </div>
              )}
            </div>
            <div className="w-full h-1.5 bg-[#1e1e1e] rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: isMyKid ? `${trainAttRate}%` : "0%" }} />
            </div>
          </div>

          {/* Match Attendance */}
          <div className="bg-[#121212] border border-[#1e1e1e] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-zinc-400 text-xs font-medium flex items-center gap-1.5">
                <Trophy size={13} className="text-emerald-400" /> Παρουσίες Αγώνων
              </h3>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <span className="text-4xl font-bold text-emerald-400">{isMyKid ? matchAttRate : "—"}</span>
                <span className="text-lg text-emerald-400/60 ml-0.5">%</span>
              </div>
              {isMyKid && totalInGroup > 0 && (
                <div className="text-right">
                  <p className="text-[10px] text-zinc-600">Κατάταξη</p>
                  <p className="text-lg font-bold text-zinc-400">—<span className="text-xs text-zinc-600">/{totalInGroup}</span></p>
                </div>
              )}
            </div>
            <div className="w-full h-1.5 bg-[#1e1e1e] rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: isMyKid ? `${matchAttRate}%` : "0%" }} />
            </div>
          </div>

          {/* Performance Stats — only for own kids */}
          {isMyKid && (
            <div className="grid grid-cols-3 gap-2.5">
              <MiniStat label="Γκολ" value={stats.goals} color="text-[#F5A623]" />
              <MiniStat label="Ασίστ" value={stats.assists} color="text-blue-400" />
              <MiniStat label="Λεπτά" value={stats.minutes} color="text-emerald-400" />
            </div>
          )}

          {/* Not my kid — restricted view */}
          {!isMyKid && (
            <div className="bg-[#121212] border border-[#1e1e1e] rounded-2xl p-5 text-center">
              <HelpCircle size={24} className="text-zinc-600 mx-auto mb-2" />
              <p className="text-xs text-zinc-500">Τα αναλυτικά στατιστικά είναι διαθέσιμα μόνο για τα παιδιά σας</p>
            </div>
          )}

          {/* Parent Info (for own kids) */}
          {isMyKid && p.parent_name && (
            <div className="bg-[#121212] border border-[#1e1e1e] rounded-2xl p-4">
              <p className="text-[10px] text-zinc-600 mb-2">Γονέας / Κηδεμόνας</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F5A623]/10 flex items-center justify-center">
                  <User size={18} className="text-[#F5A623]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">{p.parent_name}</p>
                  {p.parent_phone && <p className="text-[10px] text-zinc-500">{p.parent_phone}</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==================== TEAM VIEW (with tabs) ====================
  if (view === "team" && selectedGroup) {
    const group = selectedGroup;
    const groupPlayers = data.group_players?.[group.id] || [];
    const groupEvents = allEvents.filter(e =>
      e.academy_group_id === group.id || (e.team_id && data.children?.some(c => (c.academy_group_ids || []).includes(group.id)))
    );
    const now = new Date().toISOString().split("T")[0];
    const upcomingEvents = groupEvents.filter(e => (e.date || "") >= now);
    const completedEvents = groupEvents.filter(e => (e.date || "") < now);
    const announcements = data.announcements || [];

    const tabs = [
      { id: "schedule", label: "Πρόγραμμα", icon: Calendar },
      { id: "roster", label: "Ρόστερ", icon: Users },
      { id: "feed", label: "Νέα", icon: Megaphone },
    ];

    return (
      <div className="pb-24" data-testid="team-detail-view">
        {/* Team Header Banner */}
        <div className="relative">
          {group.banner_url ? (
            <div className="h-36 overflow-hidden">
              <img src={group.banner_url.startsWith("http") ? group.banner_url : `${process.env.REACT_APP_BACKEND_URL}${group.banner_url}`}
                alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
            </div>
          ) : (
            <div className="h-28 bg-gradient-to-r from-emerald-500/10 to-[#0a0a0a]" />
          )}
          <button onClick={() => { setView("home"); setSelectedGroup(null); setTeamTab("schedule"); }}
            className="absolute top-3 left-3 flex items-center gap-1 text-white/80 text-sm bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5 z-10"
            data-testid="team-back-btn">
            <ArrowLeft size={14} /> Πίσω
          </button>
          <div className="absolute bottom-3 left-4 right-4">
            <h2 className="text-white text-2xl font-bold drop-shadow-lg">{stripGreekAccents(group.name)}</h2>
            <div className="flex items-center gap-3 text-xs text-zinc-300/80 mt-0.5">
              {group.coach_name && <span className="flex items-center gap-1"><User size={10} /> {group.coach_name}</span>}
              <span className="flex items-center gap-1"><Users size={10} /> {groupPlayers.length} παίκτες</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#1e1e1e] px-4 mt-1" data-testid="team-tabs">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setTeamTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition-all ${
                teamTab === tab.id
                  ? "border-[#F5A623] text-[#F5A623]"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`} data-testid={`team-tab-${tab.id}`}>
              <tab.icon size={13} /> {tab.label}
            </button>
          ))}
        </div>

        <div className="px-4 mt-4">
          {/* SCHEDULE TAB */}
          {teamTab === "schedule" && (
            <div className="space-y-4" data-testid="team-schedule">
              {/* Upcoming */}
              {upcomingEvents.length > 0 && (
                <div>
                  <h3 className="text-zinc-500 text-[10px] font-semibold tracking-wider mb-2">ΕΠΕΡΧΟΜΕΝΑ</h3>
                  <div className="space-y-2">
                    {upcomingEvents.map(ev => (
                      <EventCard key={ev.id} event={ev} avail={myAvailability[ev.id]}
                        onClick={() => { setSelectedEvent(ev); setView("event"); }} />
                    ))}
                  </div>
                </div>
              )}
              {/* Completed */}
              {completedEvents.length > 0 && (
                <div>
                  <h3 className="text-zinc-500 text-[10px] font-semibold tracking-wider mb-2">ΟΛΟΚΛΗΡΩΜΕΝΑ</h3>
                  <div className="space-y-2">
                    {completedEvents.map(ev => (
                      <EventCard key={ev.id} event={ev} avail={myAvailability[ev.id]} completed
                        onClick={() => { setSelectedEvent(ev); setView("event"); }} />
                    ))}
                  </div>
                </div>
              )}
              {upcomingEvents.length === 0 && completedEvents.length === 0 && (
                <EmptyState icon={Calendar} text="Δεν υπάρχουν γεγονότα" />
              )}
            </div>
          )}

          {/* ROSTER TAB */}
          {teamTab === "roster" && (
            <div className="space-y-1.5" data-testid="team-roster">
              {groupPlayers.map(p => {
                const isMyKid = myKidIds.has(p.id);
                return (
                  <button key={p.id}
                    onClick={() => { setSelectedPlayer(p); setView("player"); }}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all text-left ${
                      isMyKid
                        ? "bg-[#F5A623]/5 border border-[#F5A623]/20 hover:bg-[#F5A623]/10"
                        : "bg-[#0e0e0e] border border-[#1a1a1a] hover:border-[#2a2a2a]"
                    }`} data-testid={`player-card-${p.id}`}>
                    <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 bg-[#1a1a1a] flex items-center justify-center">
                      {p.image_url ? (
                        <img src={p.image_url.startsWith("http") ? p.image_url : `${process.env.REACT_APP_BACKEND_URL}${p.image_url}`}
                          alt="" className="w-11 h-11 rounded-full object-cover" />
                      ) : (
                        <span className={`text-sm font-bold ${isMyKid ? "text-[#F5A623]" : "text-zinc-500"}`}>{p.name?.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isMyKid ? "text-[#F5A623]" : "text-white"}`}>{p.name}</p>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-0.5">
                        {p.number && <span className="font-medium">#{p.number}</span>}
                        {p.position && <span>{p.position}</span>}
                      </div>
                    </div>
                    {isMyKid && <Star size={14} className="text-[#F5A623] fill-[#F5A623] flex-shrink-0" />}
                    <ChevronRight size={14} className="text-zinc-600 flex-shrink-0" />
                  </button>
                );
              })}
              {groupPlayers.length === 0 && <EmptyState icon={Users} text="Δεν υπάρχουν παίκτες" />}
            </div>
          )}

          {/* FEED TAB */}
          {teamTab === "feed" && (
            <div className="space-y-3" data-testid="team-feed">
              {announcements.map(post => (
                <div key={post.id} className="bg-[#121212] border border-[#1e1e1e] rounded-2xl p-4">
                  {post.title && <h4 className="text-white font-medium text-sm mb-1">{post.title}</h4>}
                  <p className="text-zinc-400 text-xs leading-relaxed">{post.content}</p>
                  <span className="text-[10px] text-zinc-600 mt-2 block">{new Date(post.created_at).toLocaleDateString("el-GR")}</span>
                </div>
              ))}
              {announcements.length === 0 && <EmptyState icon={Megaphone} text="Δεν υπάρχουν ανακοινώσεις" />}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==================== HOME VIEW ====================
  const totalOwed = data.financial_records?.filter(r => r.status !== "paid").reduce((s, r) => s + (r.amount || 0), 0) || 0;
  const now = new Date().toISOString().split("T")[0];
  const nextEvents = allEvents.filter(e => (e.date || "") >= now).slice(0, 5);

  return (
    <div className="px-4 pb-24 space-y-5" data-testid="parent-dashboard">
      {/* Welcome */}
      <div className="pt-3">
        <p className="text-zinc-500 text-xs">Καλώς ήρθατε,</p>
        <h2 className="text-white text-lg font-bold mt-0.5">{user?.name}</h2>
      </div>

      {/* Team Cards */}
      {data.groups?.length > 0 && (
        <div className="space-y-3">
          {data.groups.map(group => {
            const kidsInGroup = (data.children || []).filter(c =>
              (c.academy_group_ids || []).includes(group.id) || c.academy_group_id === group.id
            );
            const groupPlayerCount = (data.group_players?.[group.id] || []).length;

            return (
              <button key={group.id}
                onClick={() => { setSelectedGroup(group); setView("team"); setTeamTab("schedule"); }}
                className="w-full text-left group relative overflow-hidden rounded-2xl border border-[#1e1e1e] hover:border-emerald-500/30 transition-all"
                data-testid={`team-card-${group.id}`}
              >
                {group.banner_url ? (
                  <div className="h-28 overflow-hidden">
                    <img src={group.banner_url.startsWith("http") ? group.banner_url : `${process.env.REACT_APP_BACKEND_URL}${group.banner_url}`}
                      alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent" />
                  </div>
                ) : (
                  <div className="h-24 bg-gradient-to-r from-emerald-500/8 to-transparent" />
                )}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <h3 className="text-white text-lg font-bold drop-shadow-lg group-hover:text-emerald-400 transition-colors">
                        {stripGreekAccents(group.name)}
                      </h3>
                      <div className="flex items-center gap-3 text-[10px] text-zinc-400 mt-0.5">
                        <span className="flex items-center gap-1"><Users size={10} /> {groupPlayerCount} παίκτες</span>
                        {group.coach_name && <span>{group.coach_name}</span>}
                      </div>
                    </div>
                    <div className="flex -space-x-2">
                      {kidsInGroup.slice(0, 3).map(k => (
                        <div key={k.id} className="w-7 h-7 rounded-full border-2 border-[#0a0a0a] overflow-hidden bg-[#F5A623]/15 flex items-center justify-center">
                          {k.image_url ? (
                            <img src={k.image_url.startsWith("http") ? k.image_url : `${process.env.REACT_APP_BACKEND_URL}${k.image_url}`}
                              alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[9px] font-bold text-[#F5A623]">{k.name?.charAt(0)}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Children Quick Access */}
      <div>
        <SectionHeader title="Τα παιδιά μου" />
        <div className="space-y-1.5">
          {(data.children || []).map(child => (
            <button key={child.id}
              onClick={() => { setSelectedPlayer(child); setView("player"); }}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#0e0e0e] border border-[#1a1a1a] hover:border-[#F5A623]/30 transition-all text-left"
              data-testid={`child-card-${child.id}`}>
              <div className="w-10 h-10 rounded-full overflow-hidden bg-[#F5A623]/10 flex items-center justify-center flex-shrink-0">
                {child.image_url ? (
                  <img src={child.image_url.startsWith("http") ? child.image_url : `${process.env.REACT_APP_BACKEND_URL}${child.image_url}`}
                    alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <span className="text-[#F5A623] font-bold">{child.name?.charAt(0)}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm">{child.name}</p>
                <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                  {child.position && <span>{child.position}</span>}
                  {child.academy_group_name && <span className="text-emerald-400">{child.academy_group_name}</span>}
                </div>
              </div>
              <ChevronRight size={14} className="text-zinc-600 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#121212] border border-[#1e1e1e] rounded-2xl p-4"
          onClick={() => onTabChange?.("schedule")}>
          <Calendar size={18} className="text-blue-400 mb-2" />
          <p className="text-[10px] text-zinc-600">Επόμενο</p>
          <p className="text-base font-bold text-blue-400">
            {nextEvents[0] ? new Date(nextEvents[0].date + "T00:00:00").toLocaleDateString("el-GR", { day: "numeric", month: "short" }) : "—"}
          </p>
          <p className="text-[10px] text-zinc-500 truncate">{nextEvents[0]?.title || "Κανένα"}</p>
        </div>
        <div className="bg-[#121212] border border-[#1e1e1e] rounded-2xl p-4">
          <Euro size={18} className={`${totalOwed > 0 ? "text-red-400" : "text-emerald-400"} mb-2`} />
          <p className="text-[10px] text-zinc-600">Υπόλοιπο</p>
          <p className={`text-base font-bold ${totalOwed > 0 ? "text-red-400" : "text-emerald-400"}`}>€{totalOwed.toFixed(0)}</p>
          <p className="text-[10px] text-zinc-500">{totalOwed > 0 ? "Εκκρεμεί" : "Εντάξει"}</p>
        </div>
      </div>

      {/* Upcoming Events */}
      {nextEvents.length > 0 && (
        <div>
          <SectionHeader title="Επερχόμενα" onMore={() => onTabChange?.("schedule")} />
          <div className="space-y-2">
            {nextEvents.map(ev => (
              <EventCard key={ev.id} event={ev} avail={myAvailability[ev.id]}
                onClick={() => {
                  const grp = data.groups?.find(g => g.id === ev.academy_group_id);
                  if (grp) setSelectedGroup(grp);
                  setSelectedEvent(ev); setView("event");
                }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== SUB-COMPONENTS ====================
const SectionHeader = ({ title, onMore }) => (
  <div className="flex items-center justify-between mb-2">
    <h3 className="text-white font-semibold text-sm">{title}</h3>
    {onMore && (
      <button onClick={onMore} className="text-[10px] text-[#F5A623] flex items-center gap-0.5">
        Όλα <ChevronRight size={10} />
      </button>
    )}
  </div>
);

const EventCard = ({ event, avail, completed, onClick }) => {
  const colors = {
    match: { accent: "#10B981", label: "Αγώνας" },
    training: { accent: "#3B82F6", label: "Προπόνηση" },
    other: { accent: "#F5A623", label: "Γεγονός" },
  };
  const c = colors[event.event_type] || colors.other;
  const d = event.date ? new Date(event.date + (event.date.includes("T") ? "" : "T00:00:00")) : null;
  const validDate = d && !isNaN(d.getTime());

  return (
    <button onClick={onClick}
      className={`w-full text-left flex items-center gap-3 p-3.5 rounded-xl transition-all border ${
        completed ? "bg-[#0a0a0a] border-[#141414] opacity-60" : "bg-[#0e0e0e] border-[#1a1a1a] hover:border-[#2a2a2a]"
      }`} data-testid={`event-card-${event.id}`}>
      {/* Date badge */}
      {validDate && (
        <div className="flex flex-col items-center justify-center w-12 flex-shrink-0">
          <span className="text-[10px] text-zinc-500 leading-none">{d.toLocaleDateString("el-GR", { month: "short" }).toUpperCase()}</span>
          <span className="text-xl font-bold text-white leading-tight">{d.getDate()}</span>
          <span className="text-[9px] text-zinc-600 leading-none">{d.toLocaleDateString("el-GR", { weekday: "short" })}</span>
        </div>
      )}
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
            style={{ background: `${c.accent}15`, color: c.accent }}>
            {c.label}
          </span>
          {avail && (
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
              avail === "going" ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
            }`}>
              {avail === "going" ? "Πάω" : "Δεν πάω"}
            </span>
          )}
        </div>
        <p className="text-sm text-white font-medium truncate">{event.title}</p>
        <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-0.5">
          {event.start_time && <span className="flex items-center gap-0.5"><Clock size={9} /> {event.start_time}</span>}
          {event.location && <span className="flex items-center gap-0.5 truncate"><MapPin size={9} /> {event.location}</span>}
        </div>
      </div>
      <ChevronRight size={14} className="text-zinc-600 flex-shrink-0" />
    </button>
  );
};

const DetailRow = ({ icon: Icon, color, label, action }) => (
  <div className="flex items-start gap-3 bg-[#121212] border border-[#1e1e1e] rounded-xl px-4 py-3">
    <Icon size={16} style={{ color }} className="mt-0.5 flex-shrink-0" />
    <div className="flex-1">
      <p className="text-sm text-white">{label}</p>
    </div>
    {action && (
      <a href={action.url} target="_blank" rel="noreferrer"
        className="text-xs flex items-center gap-1 text-blue-400 hover:underline flex-shrink-0">
        {action.label} <ExternalLink size={10} />
      </a>
    )}
  </div>
);

const MiniStat = ({ label, value, color }) => (
  <div className="bg-[#121212] border border-[#1e1e1e] rounded-xl p-3 text-center">
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
    <p className="text-[10px] text-zinc-500 mt-0.5">{label}</p>
  </div>
);

const EmptyState = ({ icon: Icon, text }) => (
  <div className="py-12 text-center">
    <Icon size={32} className="text-zinc-700 mx-auto mb-2" />
    <p className="text-sm text-zinc-500">{text}</p>
  </div>
);

export default ParentDashboard;

// Backwards-compatible exports for Coach/Player/Management dashboards
const LoadingSpinner = () => <div className="flex items-center justify-center py-20"><RefreshCw size={24} className="animate-spin text-[#F5A623]" /></div>;
const ErrorState = () => <div className="flex flex-col items-center justify-center py-20 text-zinc-500"><AlertCircle size={32} /><p className="mt-2 text-sm">Σφάλμα</p></div>;
const QuickStat = ({ icon: Icon, label, value, sub, color, onClick }) => (
  <button onClick={onClick} className="bg-[#121212] border border-[#1e1e1e] rounded-2xl p-4 text-left w-full">
    <Icon size={18} className={`${color} mb-2`} /><p className="text-xs text-zinc-500">{label}</p>
    <p className={`text-lg font-semibold ${color}`}>{value}</p>{sub && <p className="text-xs text-zinc-600">{sub}</p>}
  </button>
);
const AnnouncementCard = ({ post }) => (
  <div className="bg-[#121212] border border-[#1e1e1e] rounded-xl px-4 py-3">
    <p className="text-sm text-white">{post.title || post.content?.slice(0, 60)}</p>
    <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{post.content}</p>
  </div>
);
const EmptyCard = ({ text }) => <div className="bg-[#121212] border border-[#1e1e1e] rounded-xl px-4 py-6 text-center text-zinc-600 text-sm">{text}</div>;
const EventItem = EventCard;

export { LoadingSpinner, ErrorState, QuickStat, SectionHeader, EventItem, EventCard, AnnouncementCard, EmptyCard };
