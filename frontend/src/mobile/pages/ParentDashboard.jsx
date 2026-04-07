import { useState, useEffect } from "react";
import axios from "axios";
import { useMobileAuth } from "../MobileAuthContext";
import {
  Users, Calendar, DollarSign, Clock, ChevronRight, AlertCircle,
  CheckCircle, TrendingUp, RefreshCw, Trophy, Star
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ParentDashboard = ({ onTabChange }) => {
  const { user, getHeaders } = useMobileAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/mobile/parent/dashboard`, { headers: getHeaders() })
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [getHeaders]);

  if (loading) return <LoadingSpinner />;
  if (!data) return <ErrorState />;

  const calcAge = (dob) => {
    if (!dob) return "";
    try { return Math.floor((new Date() - new Date(dob)) / 31557600000); } catch { return ""; }
  };

  const totalOwed = data.financial_records?.filter(r => r.status !== "paid").reduce((s, r) => s + (r.amount || 0), 0) || 0;

  return (
    <div className="px-4 pb-20 space-y-4" data-testid="parent-dashboard">
      {/* Welcome */}
      <div className="pt-2">
        <p className="text-zinc-500 text-sm">Καλώς ήρθατε,</p>
        <h2 className="text-white text-xl font-semibold">{user?.name}</h2>
      </div>

      {/* Children Cards */}
      {data.children?.map(child => (
        <div key={child.id} className="bg-[#121212] border border-[#1e1e1e] rounded-2xl p-4" data-testid={`child-card-${child.id}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-[#F5A623]/10 flex items-center justify-center flex-shrink-0">
              {child.image_url ? (
                <img src={child.image_url.startsWith("http") ? child.image_url : `${process.env.REACT_APP_BACKEND_URL}${child.image_url}`} alt="" className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <span className="text-[#F5A623] font-bold text-lg">{child.name?.[0]}</span>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-white font-medium">{child.name}</h3>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                {child.position && <span>{child.position}</span>}
                {child.number && <span>#{child.number}</span>}
                {child.date_of_birth && <span>{calcAge(child.date_of_birth)} ετών</span>}
              </div>
            </div>
          </div>
          {child.academy_group_name && (
            <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">{child.academy_group_name}</span>
          )}
        </div>
      ))}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <QuickStat
          icon={Calendar}
          label="Επόμενο Γεγονός"
          value={data.events?.[0] ? new Date(data.events[0].date).toLocaleDateString("el-GR", { day: "numeric", month: "short" }) : "—"}
          sub={data.events?.[0]?.title || "Κανένα"}
          color="text-blue-400"
          onClick={() => onTabChange("schedule")}
        />
        <QuickStat
          icon={DollarSign}
          label="Υπόλοιπο"
          value={totalOwed > 0 ? `€${totalOwed.toFixed(0)}` : "€0"}
          sub={totalOwed > 0 ? "Εκκρεμεί" : "Εντάξει"}
          color={totalOwed > 0 ? "text-red-400" : "text-emerald-400"}
        />
      </div>

      {/* Attendance */}
      {data.attendance?.length > 0 && (
        <div className="bg-[#121212] border border-[#1e1e1e] rounded-2xl p-4">
          <h3 className="text-white font-medium text-sm mb-3 flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-400" /> Παρουσίες
          </h3>
          {data.attendance.map(att => {
            const child = data.children?.find(c => c.id === att.player_id);
            return (
              <div key={att.player_id} className="flex items-center justify-between py-2 border-b border-[#1e1e1e] last:border-0">
                <span className="text-sm text-zinc-300">{child?.name || "—"}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-[#1e1e1e] rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${att.rate}%` }} />
                  </div>
                  <span className="text-xs text-zinc-400 w-10 text-right">{att.rate}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upcoming Schedule */}
      <SectionHeader title="Πρόγραμμα" onMore={() => onTabChange("schedule")} />
      {data.events?.length > 0 ? (
        <div className="space-y-2">
          {data.events.slice(0, 3).map(event => (
            <EventCard key={event.id} event={event} />
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

      {/* Payments */}
      {data.financial_records?.some(r => r.status !== "paid") && (
        <>
          <SectionHeader title="Οφειλές" />
          <div className="space-y-2">
            {data.financial_records.filter(r => r.status !== "paid").slice(0, 5).map(rec => (
              <div key={rec.id} className="bg-[#121212] border border-[#1e1e1e] rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">{rec.description}</p>
                  <p className="text-xs text-zinc-500">{rec.player_name} • {rec.due_date || "—"}</p>
                </div>
                <span className={`text-sm font-semibold ${rec.status === "overdue" ? "text-red-400" : "text-yellow-400"}`}>
                  €{parseFloat(rec.amount).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ==================== SHARED MOBILE COMPONENTS ====================
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

const EventCard = ({ event }) => {
  const typeColors = { training: "bg-blue-500", match: "bg-emerald-500", meeting: "bg-purple-500", other: "bg-zinc-500" };
  return (
    <div className="bg-[#121212] border border-[#1e1e1e] rounded-xl px-4 py-3 flex items-center gap-3">
      <div className={`w-1 h-10 rounded-full ${typeColors[event.event_type] || typeColors.other}`} />
      <div className="flex-1">
        <p className="text-sm text-white">{event.title}</p>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Calendar size={10} />
          <span>{new Date(event.date).toLocaleDateString("el-GR", { weekday: "short", day: "numeric", month: "short" })}</span>
          {event.start_time && <><Clock size={10} /><span>{event.start_time}</span></>}
        </div>
      </div>
    </div>
  );
};

const AnnouncementCard = ({ post }) => (
  <div className="bg-[#121212] border border-[#1e1e1e] rounded-xl px-4 py-3">
    {post.is_pinned && <span className="text-[10px] text-[#F5A623] font-medium">ΣΗΜΑΝΤΙΚΟ</span>}
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
export { LoadingSpinner, ErrorState, QuickStat, SectionHeader, EventCard, AnnouncementCard, EmptyCard };
