import { Calendar, Clock, MapPin, ChevronRight, Shield, Zap, ExternalLink } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-[60vh]">
    <div className="w-8 h-8 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
  </div>
);

export const ErrorState = ({ message }) => (
  <div className="flex flex-col items-center justify-center h-[60vh] text-zinc-500">
    <Zap size={40} className="mb-3 text-zinc-700" />
    <p className="text-sm">{message || "Σφαλμα φορτωσης"}</p>
  </div>
);

export const SectionHeader = ({ title, action, onAction }) => (
  <div className="flex items-center justify-between mb-2.5">
    <h2 className="text-sm font-semibold text-white">{title}</h2>
    {action && (
      <button onClick={onAction} className="text-[10px] text-[#F5A623] font-medium">{action}</button>
    )}
  </div>
);

export const EventCard = ({ event, onClick }) => {
  const isMatch = event.event_type === "match" || event.home_team;
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-[#111] border border-white/[0.06] rounded-2xl p-3 flex items-center gap-3 hover:border-[#F5A623]/20 transition-colors"
      data-testid={`event-card-${event.id}`}
    >
      <div className={`w-1 h-10 rounded-full ${isMatch ? "bg-emerald-500" : "bg-blue-500"}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-white truncate">
          {event.title || (event.home_team && event.away_team ? `${event.home_team} vs ${event.away_team}` : "Γεγονος")}
        </p>
        <p className="text-[10px] text-zinc-500 mt-0.5">
          {event.date && new Date(event.date + "T00:00:00").toLocaleDateString("el-GR", { weekday: "short", day: "numeric", month: "short" })}
          {(event.start_time || event.match_time) && ` · ${event.start_time || event.match_time}`}
          {(event.location || event.venue) && ` · ${event.location || event.venue}`}
        </p>
      </div>
      <ChevronRight size={14} className="text-zinc-600 flex-shrink-0" />
    </button>
  );
};

export const AnnouncementCard = ({ announcement }) => (
  <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-3">
    <p className="text-xs font-medium text-white">{announcement.title}</p>
    {announcement.content && <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2">{announcement.content}</p>}
    {announcement.created_at && <p className="text-[9px] text-zinc-600 mt-1.5">{new Date(announcement.created_at).toLocaleDateString("el-GR")}</p>}
  </div>
);

export const EmptyCard = ({ icon: Icon, text }) => (
  <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-8 text-center">
    <Icon size={28} className="text-zinc-700 mx-auto mb-2" />
    <p className="text-xs text-zinc-500">{text}</p>
  </div>
);
