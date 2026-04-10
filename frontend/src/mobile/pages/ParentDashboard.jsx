import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useMobileAuth } from "../MobileAuthContext";
import {
  Users, Calendar, Euro, Clock, ChevronRight, AlertCircle, ChevronLeft,
  CheckCircle, RefreshCw, Trophy, Star, ChevronDown, Check, X as XIcon,
  MapPin, ExternalLink, BarChart3, Shield, User, TrendingUp, Target
} from "lucide-react";
import { stripGreekAccents } from "../../utils/greekText";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ParentDashboard = ({ onTabChange }) => {
  const { user, getHeaders } = useMobileAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("home"); // home, team, child
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedChild, setSelectedChild] = useState(null);
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
    setSubmitting(eventId);
    try {
      await axios.post(`${API}/mobile/availability`, {
        event_id: eventId, player_id: playerId, status,
      }, { headers: getHeaders() });
      setMyAvailability(prev => ({ ...prev, [eventId]: status }));
    } catch (e) { console.error(e); }
    finally { setSubmitting(null); }
  };

  if (loading) return <LoadingSpinner />;
  if (!data) return <ErrorState />;

  const getPlayerId = () => {
    if (selectedChild) return selectedChild.id;
    if (user?.linked_player_id) return user.linked_player_id;
    if (data.children?.[0]) return data.children[0].id;
    return null;
  };

  // ==================== VIEW: TEAM DETAIL ====================
  if (view === "team" && selectedGroup) {
    const groupPlayers = data.group_players?.[selectedGroup.id] || [];
    const groupFixtures = data.fixtures?.filter(f => f.academy_group_id === selectedGroup.id) || [];
    const groupTrainings = data.training_sessions?.filter(t => t.academy_group_id === selectedGroup.id) || [];
    const myKidIds = new Set((data.children || []).map(c => c.id));

    return (
      <div className="px-4 pb-20 space-y-4" data-testid="parent-team-view">
        {/* Back button */}
        <button onClick={() => { setView("home"); setSelectedGroup(null); }} className="flex items-center gap-1 text-[#F5A623] text-sm py-2" data-testid="back-to-home">
          <ChevronLeft size={16} /> Πίσω
        </button>

        {/* Team Header */}
        <div className="bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            {selectedGroup.banner_url ? (
              <img src={selectedGroup.banner_url.startsWith("http") ? selectedGroup.banner_url : `${process.env.REACT_APP_BACKEND_URL}${selectedGroup.banner_url}`} alt="" className="w-14 h-14 rounded-xl object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Shield size={24} className="text-emerald-400" />
              </div>
            )}
            <div>
              <h2 className="text-white text-lg font-bold">{stripGreekAccents(selectedGroup.name)}</h2>
              <p className="text-xs text-zinc-400">{selectedGroup.coach_name && `Προπονητής: ${selectedGroup.coach_name}`}</p>
              <p className="text-xs text-zinc-500">{selectedGroup.training_schedule}</p>
            </div>
          </div>
        </div>

        {/* Roster */}
        <div>
          <h3 className="text-white font-medium text-sm mb-2 flex items-center gap-2">
            <Users size={14} className="text-emerald-400" /> Ρόστερ ({groupPlayers.length})
          </h3>
          <div className="space-y-1.5">
            {groupPlayers.map(p => {
              const isMyKid = myKidIds.has(p.id);
              return (
                <button key={p.id}
                  onClick={isMyKid ? () => { setSelectedChild(p); setView("child"); } : undefined}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    isMyKid ? "bg-[#F5A623]/10 border border-[#F5A623]/30 hover:bg-[#F5A623]/15" : "bg-[#121212] border border-[#1e1e1e]"
                  }`}
                  data-testid={`roster-player-${p.id}`}
                >
                  <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-[#1a1a1a] flex items-center justify-center">
                    {p.image_url ? (
                      <img src={p.image_url.startsWith("http") ? p.image_url : `${process.env.REACT_APP_BACKEND_URL}${p.image_url}`} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <span className="text-zinc-500 text-xs font-bold">{p.name?.[0]}</span>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`text-sm font-medium ${isMyKid ? "text-[#F5A623]" : "text-white"}`}>{p.name}</p>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                      {p.number && <span>#{p.number}</span>}
                      {p.position && <span>{p.position}</span>}
                    </div>
                  </div>
                  {isMyKid && <ChevronRight size={14} className="text-[#F5A623]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Team Fixtures */}
        {groupFixtures.length > 0 && (
          <div>
            <h3 className="text-white font-medium text-sm mb-2 flex items-center gap-2">
              <Trophy size={14} className="text-emerald-400" /> Αγώνες
            </h3>
            <div className="space-y-2">
              {groupFixtures.map(f => (
                <EventItem key={f.id} item={{
                  id: f.id, title: `${f.home_team || ""} vs ${f.away_team || ""}`,
                  date: f.match_date, start_time: f.match_time, location: f.venue,
                  location_url: f.location_url, arrival_time: f.arrival_time, event_type: "match",
                }} avail={myAvailability[f.id]} playerId={getPlayerId()}
                  onAvailability={handleAvailability} submitting={submitting} userRole={user?.role}
                />
              ))}
            </div>
          </div>
        )}

        {/* Team Trainings */}
        {groupTrainings.length > 0 && (
          <div>
            <h3 className="text-white font-medium text-sm mb-2 flex items-center gap-2">
              <Target size={14} className="text-blue-400" /> Προπονήσεις
            </h3>
            <div className="space-y-2">
              {groupTrainings.map(t => (
                <EventItem key={t.id} item={{
                  id: t.id, title: t.title || "Προπόνηση",
                  date: t.date, start_time: t.start_time, location: t.venue,
                  location_url: t.location_url, arrival_time: t.arrival_time, event_type: "training",
                }} avail={myAvailability[t.id]} playerId={getPlayerId()}
                  onAvailability={handleAvailability} submitting={submitting} userRole={user?.role}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==================== VIEW: CHILD DETAIL ====================
  if (view === "child" && selectedChild) {
    const childFixtures = data.fixtures?.filter(f =>
      f.academy_group_id && (selectedChild.academy_group_ids || []).includes(f.academy_group_id) ||
      f.academy_group_id === selectedChild.academy_group_id
    ) || [];
    const stats = { goals: 0, assists: 0, appearances: 0, minutes: 0 };
    childFixtures.forEach(f => {
      (f.player_performances || []).forEach(pp => {
        if (pp.player_id === selectedChild.id) {
          stats.goals += pp.goals || 0;
          stats.assists += pp.assists || 0;
          stats.minutes += pp.minutes || 0;
          stats.appearances += 1;
        }
      });
    });
    const childAttendance = data.attendance?.find(a => a.player_id === selectedChild.id);

    return (
      <div className="px-4 pb-20 space-y-4" data-testid="parent-child-view">
        {/* Back button */}
        <button onClick={() => { setView(selectedGroup ? "team" : "home"); setSelectedChild(null); }} className="flex items-center gap-1 text-[#F5A623] text-sm py-2" data-testid="back-from-child">
          <ChevronLeft size={16} /> Πίσω
        </button>

        {/* Child Profile Card */}
        <div className="bg-gradient-to-r from-[#F5A623]/10 to-transparent border border-[#F5A623]/20 rounded-2xl p-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 bg-[#1a1a1a] border-2 border-[#F5A623]/30">
              {selectedChild.image_url ? (
                <img src={selectedChild.image_url.startsWith("http") ? selectedChild.image_url : `${process.env.REACT_APP_BACKEND_URL}${selectedChild.image_url}`} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#F5A623] text-xl font-bold">{selectedChild.name?.[0]}</div>
              )}
            </div>
            <div>
              <h2 className="text-white text-lg font-bold">{selectedChild.name}</h2>
              <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                {selectedChild.number && <span className="bg-[#F5A623]/20 text-[#F5A623] px-2 py-0.5 rounded-full font-medium">#{selectedChild.number}</span>}
                {selectedChild.position && <span>{selectedChild.position}</span>}
              </div>
              {selectedChild.academy_group_name && (
                <span className="text-xs text-emerald-400 mt-1 block">{selectedChild.academy_group_name}</span>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Trophy} label="Συμμετοχές" value={stats.appearances} color="text-emerald-400" />
          <StatCard icon={Target} label="Γκολ" value={stats.goals} color="text-[#F5A623]" />
          <StatCard icon={TrendingUp} label="Ασίστ" value={stats.assists} color="text-blue-400" />
          <StatCard icon={Clock} label="Λεπτά" value={stats.minutes} color="text-purple-400" />
        </div>

        {/* Attendance */}
        {childAttendance && (
          <div className="bg-[#121212] border border-[#1e1e1e] rounded-2xl p-4">
            <h3 className="text-white font-medium text-sm mb-3 flex items-center gap-2">
              <CheckCircle size={14} className="text-emerald-400" /> Παρουσίες
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-[#1e1e1e] rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${childAttendance.rate}%` }} />
                </div>
                <span className="text-sm text-zinc-300 font-medium">{childAttendance.rate}%</span>
              </div>
              <span className="text-xs text-zinc-500">{childAttendance.attended}/{childAttendance.total} γεγονότα</span>
            </div>
          </div>
        )}

        {/* Upcoming Events with Going/Not Going */}
        <div>
          <h3 className="text-white font-medium text-sm mb-2">Επερχόμενα</h3>
          <div className="space-y-2">
            {data.events?.filter(e => (e.date || "") >= new Date().toISOString().split("T")[0]).slice(0, 8).map(event => (
              <EventItem key={event.id} item={event} avail={myAvailability[event.id]}
                playerId={selectedChild.id} onAvailability={handleAvailability}
                submitting={submitting} userRole={user?.role}
              />
            ))}
            {(!data.events || data.events.length === 0) && (
              <EmptyCard text="Δεν υπάρχουν επερχόμενα γεγονότα" />
            )}
          </div>
        </div>

        {/* Financial */}
        {data.financial_records?.filter(r => r.player_id === selectedChild.id && r.status !== "paid").length > 0 && (
          <div>
            <h3 className="text-white font-medium text-sm mb-2 flex items-center gap-2">
              <Euro size={14} className="text-yellow-400" /> Οφειλές
            </h3>
            <div className="space-y-2">
              {data.financial_records.filter(r => r.player_id === selectedChild.id && r.status !== "paid").map(rec => (
                <div key={rec.id} className="bg-[#121212] border border-[#1e1e1e] rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white">{rec.description}</p>
                    <p className="text-xs text-zinc-500">{rec.due_date || "—"}</p>
                  </div>
                  <span className={`text-sm font-semibold ${rec.status === "overdue" ? "text-red-400" : "text-yellow-400"}`}>
                    €{parseFloat(rec.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==================== VIEW: HOME ====================
  const totalOwed = data.financial_records?.filter(r => r.status !== "paid").reduce((s, r) => s + (r.amount || 0), 0) || 0;

  return (
    <div className="px-4 pb-20 space-y-4" data-testid="parent-dashboard">
      {/* Welcome */}
      <div className="pt-2">
        <p className="text-zinc-500 text-sm">Καλώς ήρθατε,</p>
        <h2 className="text-white text-xl font-semibold">{user?.name}</h2>
      </div>

      {/* Team Cards (Groups the kids are in) */}
      {data.groups?.length > 0 && (
        <div>
          <h3 className="text-white font-medium text-sm mb-2 flex items-center gap-2">
            <Shield size={14} className="text-emerald-400" /> Οι Ομάδες μας
          </h3>
          <div className="space-y-2">
            {data.groups.map(group => {
              const kidsInGroup = (data.children || []).filter(c =>
                (c.academy_group_ids || []).includes(group.id) || c.academy_group_id === group.id
              );
              return (
                <button key={group.id}
                  onClick={() => { setSelectedGroup(group); setView("team"); }}
                  className="w-full bg-gradient-to-r from-emerald-500/5 to-transparent border border-emerald-500/20 rounded-2xl p-4 text-left hover:border-emerald-500/40 transition-all group"
                  data-testid={`team-card-${group.id}`}
                >
                  <div className="flex items-center gap-3">
                    {group.banner_url ? (
                      <img src={group.banner_url.startsWith("http") ? group.banner_url : `${process.env.REACT_APP_BACKEND_URL}${group.banner_url}`} alt="" className="w-12 h-12 rounded-xl object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <Shield size={20} className="text-emerald-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="text-white font-semibold text-sm group-hover:text-emerald-400 transition-colors">{stripGreekAccents(group.name)}</h4>
                      {group.coach_name && <p className="text-xs text-zinc-500">{group.coach_name}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        {kidsInGroup.map(k => (
                          <span key={k.id} className="text-[10px] bg-[#F5A623]/10 text-[#F5A623] px-2 py-0.5 rounded-full">{k.name?.split(" ")[0]}</span>
                        ))}
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-zinc-600 group-hover:text-emerald-400 transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Children Quick Cards */}
      {data.children?.map(child => (
        <button key={child.id}
          onClick={() => { setSelectedChild(child); setView("child"); }}
          className="w-full bg-[#121212] border border-[#1e1e1e] rounded-2xl p-4 text-left hover:border-[#F5A623]/30 transition-all"
          data-testid={`child-card-${child.id}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full overflow-hidden bg-[#F5A623]/10 flex items-center justify-center flex-shrink-0">
              {child.image_url ? (
                <img src={child.image_url.startsWith("http") ? child.image_url : `${process.env.REACT_APP_BACKEND_URL}${child.image_url}`} alt="" className="w-11 h-11 rounded-full object-cover" />
              ) : (
                <span className="text-[#F5A623] font-bold text-lg">{child.name?.[0]}</span>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-white font-medium text-sm">{child.name}</h3>
              <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                {child.position && <span>{child.position}</span>}
                {child.number && <span>#{child.number}</span>}
              </div>
            </div>
            {child.academy_group_name && (
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">{child.academy_group_name}</span>
            )}
            <ChevronRight size={16} className="text-zinc-600" />
          </div>
        </button>
      ))}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <QuickStat
          icon={Calendar} label="Επόμενο Γεγονός"
          value={data.events?.[0] ? new Date(data.events[0].date).toLocaleDateString("el-GR", { day: "numeric", month: "short" }) : "—"}
          sub={data.events?.[0]?.title || "Κανένα"} color="text-blue-400"
          onClick={() => onTabChange("schedule")}
        />
        <QuickStat
          icon={Euro} label="Υπόλοιπο"
          value={totalOwed > 0 ? `€${totalOwed.toFixed(0)}` : "€0"}
          sub={totalOwed > 0 ? "Εκκρεμεί" : "Εντάξει"}
          color={totalOwed > 0 ? "text-red-400" : "text-emerald-400"}
        />
      </div>

      {/* Upcoming Events with Going/Not Going */}
      <SectionHeader title="Πρόγραμμα" onMore={() => onTabChange("schedule")} />
      {data.events?.filter(e => (e.date || "") >= new Date().toISOString().split("T")[0]).length > 0 ? (
        <div className="space-y-2">
          {data.events.filter(e => (e.date || "") >= new Date().toISOString().split("T")[0]).slice(0, 4).map(event => (
            <EventItem key={event.id} item={event} avail={myAvailability[event.id]}
              playerId={getPlayerId()} onAvailability={handleAvailability}
              submitting={submitting} userRole={user?.role}
            />
          ))}
        </div>
      ) : (
        <EmptyCard text="Δεν υπάρχουν επερχόμενα γεγονότα" />
      )}

      {/* Announcements */}
      <SectionHeader title="Ανακοινώσεις" onMore={() => onTabChange("news")} />
      {data.announcements?.length > 0 ? (
        <div className="space-y-2">
          {data.announcements.slice(0, 3).map(post => (
            <AnnouncementCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <EmptyCard text="Δεν υπάρχουν ανακοινώσεις" />
      )}
    </div>
  );
};

// ==================== SHARED COMPONENTS ====================
const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-20">
    <RefreshCw size={24} className="animate-spin text-[#F5A623]" />
  </div>
);

const ErrorState = () => (
  <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
    <AlertCircle size={32} />
    <p className="mt-2 text-sm">Σφάλμα φόρτωσης</p>
  </div>
);

const QuickStat = ({ icon: Icon, label, value, sub, color, onClick }) => (
  <button onClick={onClick} className="bg-[#121212] border border-[#1e1e1e] rounded-2xl p-4 text-left w-full">
    <Icon size={18} className={`${color} mb-2`} />
    <p className="text-xs text-zinc-500">{label}</p>
    <p className={`text-lg font-semibold ${color}`}>{value}</p>
    {sub && <p className="text-xs text-zinc-600">{sub}</p>}
  </button>
);

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-[#121212] border border-[#1e1e1e] rounded-2xl p-4 text-center">
    <Icon size={18} className={`${color} mx-auto mb-1.5`} />
    <p className={`text-xl font-bold ${color}`}>{value}</p>
    <p className="text-[10px] text-zinc-500 mt-0.5">{label}</p>
  </div>
);

const SectionHeader = ({ title, onMore }) => (
  <div className="flex items-center justify-between pt-2">
    <h3 className="text-white font-medium text-sm">{title}</h3>
    {onMore && (
      <button onClick={onMore} className="text-xs text-[#F5A623] flex items-center gap-0.5">
        Όλα <ChevronRight size={12} />
      </button>
    )}
  </div>
);

const EventItem = ({ item, avail, playerId, onAvailability, submitting, userRole }) => {
  const typeColors = {
    training: { bg: "bg-blue-500/10", border: "border-blue-500/30", dot: "bg-blue-500" },
    match: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", dot: "bg-emerald-500" },
    other: { bg: "bg-zinc-500/10", border: "border-zinc-500/30", dot: "bg-zinc-500" },
  };
  const c = typeColors[item.event_type] || typeColors.other;
  const isFuture = (item.date || "") >= new Date().toISOString().split("T")[0];

  return (
    <div className={`${c.bg} border ${c.border} rounded-xl px-4 py-3`} data-testid={`event-${item.id}`}>
      <div className="flex items-center gap-3">
        <div className={`w-1 h-10 rounded-full ${c.dot}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white font-medium truncate">{item.title}</p>
          <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-zinc-500 mt-0.5">
            {item.date && <span className="flex items-center gap-0.5"><Calendar size={9} /> {new Date(item.date + "T00:00:00").toLocaleDateString("el-GR", { weekday: "short", day: "numeric", month: "short" })}</span>}
            {item.start_time && <span className="flex items-center gap-0.5"><Clock size={9} /> {item.start_time}</span>}
            {item.arrival_time && <span>Άφιξη: {item.arrival_time}</span>}
            {item.location && <span className="flex items-center gap-0.5"><MapPin size={9} /> {item.location}</span>}
          </div>
        </div>
        {avail && (
          <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
            avail === "going" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
          }`}>
            {avail === "going" ? "Πάω" : "Δεν πάω"}
          </span>
        )}
      </div>
      {playerId && isFuture && (userRole === "parent" || userRole === "player") && (
        <div className="flex gap-2 mt-2.5 ml-4" data-testid={`availability-${item.id}`}>
          <button onClick={() => onAvailability(item.id, playerId, "going")} disabled={submitting === item.id}
            className={`flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              avail === "going" ? "bg-emerald-500 text-white" : "bg-[#1a1a1a] text-zinc-400 border border-[#333]"
            }`} data-testid={`going-btn-${item.id}`}>
            <Check size={12} /> Πάω
          </button>
          <button onClick={() => onAvailability(item.id, playerId, "not_going")} disabled={submitting === item.id}
            className={`flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              avail === "not_going" ? "bg-red-500 text-white" : "bg-[#1a1a1a] text-zinc-400 border border-[#333]"
            }`} data-testid={`not-going-btn-${item.id}`}>
            <XIcon size={12} /> Δεν πάω
          </button>
        </div>
      )}
    </div>
  );
};

const AnnouncementCard = ({ post }) => (
  <div className="bg-[#121212] border border-[#1e1e1e] rounded-xl px-4 py-3">
    <p className="text-sm text-white">{post.title || post.content?.slice(0, 60)}</p>
    <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{post.content}</p>
    <span className="text-[10px] text-zinc-600 mt-1 block">{new Date(post.created_at).toLocaleDateString("el-GR")}</span>
  </div>
);

const EmptyCard = ({ text }) => (
  <div className="bg-[#121212] border border-[#1e1e1e] rounded-xl px-4 py-6 text-center text-zinc-600 text-sm">
    {text}
  </div>
);

export default ParentDashboard;

// EventCard - backwards-compatible wrapper used by Coach/Player/Management dashboards
const EventCard = ({ event }) => {
  const colors = {
    training: { bg: "bg-blue-500/10", border: "border-blue-500/30", dot: "bg-blue-500" },
    match: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", dot: "bg-emerald-500" },
  };
  const c = colors[event.event_type] || { bg: "bg-zinc-500/10", border: "border-zinc-500/30", dot: "bg-zinc-500" };
  return (
    <div className={`${c.bg} border ${c.border} rounded-xl px-4 py-3`}>
      <div className="flex items-center gap-3">
        <div className={`w-1 h-10 rounded-full ${c.dot}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white font-medium truncate">{event.title || `vs ${event.opponent || event.away_team || ""}`}</p>
          <div className="flex items-center flex-wrap gap-x-2 text-[10px] text-zinc-500 mt-0.5">
            {(event.date || event.match_date) && <span>{new Date((event.date || event.match_date) + "T00:00:00").toLocaleDateString("el-GR", { weekday: "short", day: "numeric", month: "short" })}</span>}
            {(event.start_time || event.match_time) && <span>{event.start_time || event.match_time}</span>}
            {(event.location || event.venue) && <span>{event.location || event.venue}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export { LoadingSpinner, ErrorState, QuickStat, SectionHeader, EventItem, EventCard, AnnouncementCard, EmptyCard };
