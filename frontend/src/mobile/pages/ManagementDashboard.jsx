import { useState, useEffect } from "react";
import axios from "axios";
import { useMobileAuth } from "../MobileAuthContext";
import { LoadingSpinner, ErrorState, SectionHeader, EventCard, AnnouncementCard, EmptyCard } from "../components/SharedComponents";
import {
  Users, Euro, TrendingUp, AlertCircle, ClipboardList, Calendar,
  ChevronRight, Trophy, BarChart3
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ManagementDashboard = ({ onTabChange }) => {
  const { user, getHeaders } = useMobileAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/mobile/management/dashboard`, { headers: getHeaders() })
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [getHeaders]);

  if (loading) return <LoadingSpinner />;
  if (!data) return <ErrorState />;

  const fin = data.financial || {};

  return (
    <div className="px-4 pb-20 space-y-4" data-testid="management-dashboard">
      {/* Welcome */}
      <div className="pt-2">
        <p className="text-zinc-500 text-sm">Διοίκηση</p>
        <h2 className="text-white text-xl font-semibold">{user?.name}</h2>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#121212] border border-[#1e1e1e] rounded-2xl p-4">
          <Users size={18} className="text-blue-400 mb-2" />
          <p className="text-2xl font-bold text-white">{data.player_count}</p>
          <p className="text-xs text-zinc-500">Παίκτες</p>
        </div>
        <div className="bg-[#121212] border border-[#1e1e1e] rounded-2xl p-4">
          <Trophy size={18} className="text-[#F5A623] mb-2" />
          <p className="text-2xl font-bold text-white">{(data.teams?.length || 0) + (data.groups?.length || 0)}</p>
          <p className="text-xs text-zinc-500">Ομάδες</p>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="bg-[#121212] border border-[#1e1e1e] rounded-2xl p-4">
        <h3 className="text-white font-medium text-sm mb-3 flex items-center gap-2">
          <Euro size={16} className="text-[#F5A623]" /> Οικονομικά
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-lg font-bold text-emerald-400">€{(fin.total_revenue || 0).toLocaleString()}</p>
            <p className="text-[10px] text-zinc-500">Έσοδα</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-yellow-400">€{(fin.total_pending || 0).toLocaleString()}</p>
            <p className="text-[10px] text-zinc-500">Εκκρεμή</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-red-400">€{(fin.total_overdue || 0).toLocaleString()}</p>
            <p className="text-[10px] text-zinc-500">Ληξιπρόθεσμα</p>
          </div>
        </div>
      </div>

      {/* Teams */}
      <SectionHeader title="Ομάδες" onMore={() => onTabChange("teams")} />
      <div className="space-y-2">
        {data.teams?.map(team => (
          <div key={team.id} className="bg-[#121212] border border-[#1e1e1e] rounded-xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#F5A623]/10 flex items-center justify-center">
                <Trophy size={14} className="text-[#F5A623]" />
              </div>
              <span className="text-sm text-white">{team.name}</span>
            </div>
            <ChevronRight size={16} className="text-zinc-600" />
          </div>
        ))}
        {data.groups?.map(group => (
          <div key={group.id} className="bg-[#121212] border border-[#1e1e1e] rounded-xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Users size={14} className="text-emerald-400" />
              </div>
              <span className="text-sm text-white">{group.name}</span>
            </div>
            <ChevronRight size={16} className="text-zinc-600" />
          </div>
        ))}
      </div>

      {/* Recent Registrations */}
      {data.registrations?.length > 0 && (
        <>
          <SectionHeader title="Πρόσφατες Εγγραφές" />
          <div className="space-y-2">
            {data.registrations.slice(0, 5).map(reg => (
              <div key={reg.id} className="bg-[#121212] border border-[#1e1e1e] rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">{reg.player_name || reg.child_first_name}</p>
                  <span className="text-xs text-zinc-500">{reg.status || "pending"}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${reg.status === "approved" ? "bg-emerald-500/10 text-emerald-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                  {reg.status === "approved" ? "Εγκρίθηκε" : "Εκκρεμεί"}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Schedule */}
      <SectionHeader title="Πρόγραμμα" />
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
    </div>
  );
};

export default ManagementDashboard;
