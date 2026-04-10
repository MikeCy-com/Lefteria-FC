import { useState, useEffect, useCallback } from "react";
import { Check, X, UserCheck, UserX, Users, BarChart3 } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const getAuthHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("adminToken")}` });

// Inline attendance panel for any event (training session, fixture, etc.)
const InlineAttendance = ({ eventId, players = [] }) => {
  const [records, setRecords] = useState([]);
  const [saving, setSaving] = useState(null);

  const fetchAttendance = useCallback(async () => {
    if (!eventId) return;
    try {
      const res = await axios.get(`${API}/admin/events/${eventId}/attendance`, { headers: getAuthHeaders() });
      setRecords(res.data || []);
    } catch (e) { console.error(e); }
  }, [eventId]);

  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

  const markAttendance = async (playerId, playerName, status) => {
    setSaving(playerId);
    try {
      await axios.post(`${API}/admin/events/${eventId}/attendance`, {
        responses: [{ player_id: playerId, player_name: playerName, status }],
      }, { headers: getAuthHeaders() });
      fetchAttendance();
    } catch (e) { console.error(e); }
    finally { setSaving(null); }
  };

  const getStatus = (playerId) => {
    const r = records.find(r => r.player_id === playerId);
    return r?.status || null;
  };

  const getSource = (playerId) => {
    const r = records.find(r => r.player_id === playerId);
    return r?.source || null;
  };

  const goingCount = records.filter(r => r.status === "going").length;
  const notGoingCount = records.filter(r => r.status === "not_going").length;
  const noResponse = players.length - goingCount - notGoingCount;

  if (players.length === 0) {
    return (
      <div className="text-xs text-zinc-500 text-center py-3">
        Δεν υπάρχουν παίκτες για παρουσίες
      </div>
    );
  }

  return (
    <div data-testid={`attendance-${eventId}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
          <Users size={11} /> Παρουσιες ({players.length})
        </span>
        <div className="flex gap-3 text-[10px]">
          <span className="flex items-center gap-1 text-emerald-400"><UserCheck size={10} /> {goingCount}</span>
          <span className="flex items-center gap-1 text-red-400"><UserX size={10} /> {notGoingCount}</span>
          <span className="flex items-center gap-1 text-zinc-500">? {noResponse}</span>
        </div>
      </div>
      <div className="space-y-1">
        {players.map(p => {
          const status = getStatus(p.id);
          const source = getSource(p.id);
          return (
            <div key={p.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-white/[0.02]" data-testid={`att-player-${p.id}`}>
              <div className="w-6 h-6 rounded-full bg-[#1a1a1a] flex items-center justify-center overflow-hidden flex-shrink-0">
                {p.image_url ? (
                  <img src={p.image_url.startsWith("/") ? `${process.env.REACT_APP_BACKEND_URL}${p.image_url}` : p.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[9px] text-zinc-500">{(p.name || "?")[0]}</span>
                )}
              </div>
              <span className="flex-1 text-xs text-zinc-300 truncate">{p.name} {p.number ? `#${p.number}` : ""}</span>
              {source === "mobile" && <span className="text-[8px] text-blue-400 bg-blue-500/10 px-1 py-0.5 rounded">Mobile</span>}
              <div className="flex gap-1">
                <button onClick={() => markAttendance(p.id, p.name, "going")} disabled={saving === p.id}
                  className={`p-1 rounded transition-all ${status === "going" ? "bg-emerald-500/20 text-emerald-400" : "text-zinc-600 hover:text-emerald-400"}`}
                  data-testid={`att-going-${p.id}`}>
                  <Check size={13} />
                </button>
                <button onClick={() => markAttendance(p.id, p.name, "not_going")} disabled={saving === p.id}
                  className={`p-1 rounded transition-all ${status === "not_going" ? "bg-red-500/20 text-red-400" : "text-zinc-600 hover:text-red-400"}`}
                  data-testid={`att-notgoing-${p.id}`}>
                  <X size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InlineAttendance;
