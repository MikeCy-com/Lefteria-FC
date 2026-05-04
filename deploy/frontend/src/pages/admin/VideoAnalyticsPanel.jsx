import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Video, Plus, X, Save, RefreshCw, Search, Play, Pause, Tag,
  Clock, ChevronRight, Trash2, Edit2, Eye, Flag, Upload, Link,
  Users, Filter
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const MARKER_TYPES = [
  { value: "goal", label: "Γκολ", color: "bg-emerald-500" },
  { value: "assist", label: "Ασίστ", color: "bg-blue-500" },
  { value: "foul", label: "Φάουλ", color: "bg-red-500" },
  { value: "tactical", label: "Τακτική", color: "bg-purple-500" },
  { value: "note", label: "Σημείωση", color: "bg-zinc-500" },
];

const VIDEO_TYPES = [
  { value: "match", label: "Αγώνας" },
  { value: "training", label: "Προπόνηση" },
  { value: "highlights", label: "Στιγμιότυπα" },
  { value: "other", label: "Άλλο" },
];

const VideoAnalyticsPanel = ({ teamId, academyGroupId, players = [] }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showMarkerForm, setShowMarkerForm] = useState(false);
  const [filterType, setFilterType] = useState("");

  const [form, setForm] = useState({
    title: "", description: "", video_url: "", video_type: "match",
    thumbnail_url: "", duration: "", tagged_players: [],
  });

  const [markerForm, setMarkerForm] = useState({
    timestamp: "00:00:00", timestamp_seconds: 0, label: "",
    description: "", marker_type: "note", tagged_players: [],
  });

  const fetchVideos = useCallback(async () => {
    try {
      const params = {};
      if (teamId) params.team_id = teamId;
      if (academyGroupId) params.academy_group_id = academyGroupId;
      const res = await axios.get(`${API}/admin/videos`, { headers: getAuthHeaders(), params });
      setVideos(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [teamId, academyGroupId]);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  const handleSave = async () => {
    if (!form.title || !form.video_url) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        team_id: teamId || undefined,
        academy_group_id: academyGroupId || undefined,
      };
      if (selectedVideo && !showModal) {
        await axios.put(`${API}/admin/videos/${selectedVideo.id}`, payload, { headers: getAuthHeaders() });
      } else {
        await axios.post(`${API}/admin/videos`, payload, { headers: getAuthHeaders() });
      }
      setShowModal(false);
      resetForm();
      fetchVideos();
    } catch (e) {
      alert(e.response?.data?.detail || "Σφάλμα");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Διαγραφή βίντεο;")) return;
    try {
      await axios.delete(`${API}/admin/videos/${id}`, { headers: getAuthHeaders() });
      if (selectedVideo?.id === id) setSelectedVideo(null);
      fetchVideos();
    } catch (e) {
      alert("Σφάλμα");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await axios.post(`${API}/admin/videos/upload`, fd, {
        headers: { ...getAuthHeaders(), "Content-Type": "multipart/form-data" },
      });
      setForm({ ...form, video_url: `${process.env.REACT_APP_BACKEND_URL}${res.data.video_url}` });
    } catch (e) {
      alert(e.response?.data?.detail || "Σφάλμα μεταφόρτωσης");
    } finally {
      setUploading(false);
    }
  };

  const handleAddMarker = async () => {
    if (!selectedVideo || !markerForm.label) return;
    try {
      await axios.post(`${API}/admin/videos/${selectedVideo.id}/markers`, markerForm, { headers: getAuthHeaders() });
      setShowMarkerForm(false);
      setMarkerForm({ timestamp: "00:00:00", timestamp_seconds: 0, label: "", description: "", marker_type: "note", tagged_players: [] });
      // Refresh video
      const res = await axios.get(`${API}/admin/videos/${selectedVideo.id}`, { headers: getAuthHeaders() });
      setSelectedVideo(res.data);
      fetchVideos();
    } catch (e) {
      alert("Σφάλμα");
    }
  };

  const handleDeleteMarker = async (markerId) => {
    if (!selectedVideo) return;
    try {
      await axios.delete(`${API}/admin/videos/${selectedVideo.id}/markers/${markerId}`, { headers: getAuthHeaders() });
      const res = await axios.get(`${API}/admin/videos/${selectedVideo.id}`, { headers: getAuthHeaders() });
      setSelectedVideo(res.data);
      fetchVideos();
    } catch (e) {
      alert("Σφάλμα");
    }
  };

  const resetForm = () => setForm({
    title: "", description: "", video_url: "", video_type: "match",
    thumbnail_url: "", duration: "", tagged_players: [],
  });

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const filteredVideos = videos.filter(v => !filterType || v.video_type === filterType);

  const getTypeLabel = (t) => VIDEO_TYPES.find(vt => vt.value === t)?.label || t;
  const getMarkerColor = (t) => MARKER_TYPES.find(mt => mt.value === t)?.color || "bg-zinc-500";
  const getMarkerLabel = (t) => MARKER_TYPES.find(mt => mt.value === t)?.label || t;

  const isYouTube = (url) => url?.includes("youtube.com") || url?.includes("youtu.be");
  const getYouTubeEmbed = (url) => {
    if (!url) return "";
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
  };

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <RefreshCw size={24} className="animate-spin text-[#F5A623]" />
    </div>
  );

  // Detail View
  if (selectedVideo) {
    return (
      <div data-testid="video-detail-view">
        <button onClick={() => setSelectedVideo(null)} className="admin-btn-ghost text-sm mb-4" data-testid="back-to-videos">
          <ChevronRight size={14} className="rotate-180" /> Πίσω στα βίντεο
        </button>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Video Player */}
          <div className="xl:col-span-2">
            <div className="bg-[#121212] border border-[#262626] rounded-xl overflow-hidden">
              <div className="aspect-video bg-black relative">
                {isYouTube(selectedVideo.video_url) ? (
                  <iframe src={getYouTubeEmbed(selectedVideo.video_url)} className="w-full h-full" allowFullScreen title={selectedVideo.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                ) : selectedVideo.video_url ? (
                  <video src={selectedVideo.video_url} controls className="w-full h-full" data-testid="video-player" />
                ) : (
                  <div className="flex items-center justify-center h-full text-zinc-500"><Video size={48} /></div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-['Bebas_Neue'] text-2xl text-white">{selectedVideo.title}</h3>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-zinc-500 bg-[#1a1a1a] px-2 py-0.5 rounded">{getTypeLabel(selectedVideo.video_type)}</span>
                  {selectedVideo.duration && <span className="text-xs text-zinc-500 flex items-center gap-1"><Clock size={12} /> {selectedVideo.duration}</span>}
                  <span className="text-xs text-zinc-500">{new Date(selectedVideo.created_at).toLocaleDateString('el-GR')}</span>
                </div>
                {selectedVideo.description && <p className="text-sm text-zinc-400 mt-3">{selectedVideo.description}</p>}
                {selectedVideo.tagged_players?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {selectedVideo.tagged_players.map((pid, i) => {
                      const p = players.find(pl => pl.id === pid);
                      return <span key={i} className="text-xs bg-[#F5A623]/10 text-[#F5A623] px-2 py-0.5 rounded">{p?.name || pid}</span>;
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Markers Panel */}
          <div className="bg-[#121212] border border-[#262626] rounded-xl p-4" data-testid="markers-panel">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-['Bebas_Neue'] text-xl text-white">Σημανσεις</h3>
              <button onClick={() => setShowMarkerForm(true)} className="admin-btn-primary text-xs" data-testid="add-marker-btn">
                <Plus size={12} /> Νέα
              </button>
            </div>

            {showMarkerForm && (
              <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4 mb-4 space-y-3" data-testid="marker-form">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Χρόνος</label>
                    <input value={markerForm.timestamp} onChange={e => {
                      const ts = e.target.value;
                      setMarkerForm({ ...markerForm, timestamp: ts });
                    }} placeholder="00:00:00" className="admin-input w-full text-sm" data-testid="marker-timestamp" />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Τύπος</label>
                    <select value={markerForm.marker_type} onChange={e => setMarkerForm({ ...markerForm, marker_type: e.target.value })} className="admin-input w-full text-sm" data-testid="marker-type">
                      {MARKER_TYPES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Τίτλος</label>
                  <input value={markerForm.label} onChange={e => setMarkerForm({ ...markerForm, label: e.target.value })} className="admin-input w-full text-sm" data-testid="marker-label" />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Σημείωση</label>
                  <textarea value={markerForm.description} onChange={e => setMarkerForm({ ...markerForm, description: e.target.value })} className="admin-input w-full text-sm" rows={2} data-testid="marker-desc" />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleAddMarker} className="admin-btn-primary text-xs flex-1" data-testid="save-marker"><Save size={12} /> Αποθήκευση</button>
                  <button onClick={() => setShowMarkerForm(false)} className="admin-btn-ghost text-xs">Ακύρωση</button>
                </div>
              </div>
            )}

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {(!selectedVideo.markers || selectedVideo.markers.length === 0) ? (
                <p className="text-zinc-500 text-sm text-center py-6">Δεν υπάρχουν σημάνσεις</p>
              ) : (
                selectedVideo.markers.sort((a, b) => (a.timestamp || "").localeCompare(b.timestamp || "")).map(m => (
                  <div key={m.id} className="flex items-start gap-3 py-2 border-b border-[#1e1e1e] last:border-0 group">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${getMarkerColor(m.marker_type)}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#F5A623] font-mono">{m.timestamp}</span>
                        <span className="text-xs text-zinc-500">{getMarkerLabel(m.marker_type)}</span>
                      </div>
                      <p className="text-sm text-white truncate">{m.label}</p>
                      {m.description && <p className="text-xs text-zinc-500 truncate">{m.description}</p>}
                    </div>
                    <button onClick={() => handleDeleteMarker(m.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity" data-testid={`del-marker-${m.id}`}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="video-analytics-panel">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h3 className="font-['Bebas_Neue'] text-2xl text-white tracking-wide">Βιντεο & Αναλυση</h3>
          <span className="text-sm text-zinc-400">{videos.length} βίντεο</span>
        </div>
        <div className="flex gap-2 items-center">
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="admin-input text-sm" data-testid="video-filter-type">
            <option value="">Όλα</option>
            {VIDEO_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <button onClick={openCreate} className="admin-btn-primary" data-testid="add-video-btn">
            <Plus size={14} /> Νέο Βίντεο
          </button>
        </div>
      </div>

      {/* Video Grid */}
      {filteredVideos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
          <Video size={48} strokeWidth={1} />
          <p className="mt-3 text-base">Δεν υπάρχουν βίντεο</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredVideos.map(v => (
            <div key={v.id} className="bg-[#121212] border border-[#262626] rounded-xl overflow-hidden group cursor-pointer hover:border-[#F5A623]/30 transition-colors" onClick={() => setSelectedVideo(v)} data-testid={`video-card-${v.id}`}>
              <div className="aspect-video bg-[#0a0a0a] relative flex items-center justify-center">
                {v.thumbnail_url ? (
                  <img src={v.thumbnail_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Video size={36} className="text-zinc-700" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play size={32} className="text-white" />
                </div>
                <span className="absolute top-2 right-2 text-xs bg-black/70 text-white px-2 py-0.5 rounded">{getTypeLabel(v.video_type)}</span>
                {v.markers?.length > 0 && (
                  <span className="absolute bottom-2 left-2 text-xs bg-[#F5A623]/90 text-black px-2 py-0.5 rounded font-medium">{v.markers.length} σημάνσεις</span>
                )}
              </div>
              <div className="p-3">
                <h4 className="text-white text-sm font-medium truncate">{v.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  {v.duration && <span className="text-xs text-zinc-500"><Clock size={10} className="inline mr-0.5" />{v.duration}</span>}
                  <span className="text-xs text-zinc-500">{new Date(v.created_at).toLocaleDateString('el-GR')}</span>
                </div>
                <div className="flex gap-1 mt-2">
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(v.id); }} className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 px-2 py-0.5 rounded" data-testid={`del-video-${v.id}`}>
                    <Trash2 size={10} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 py-4 border-b border-[#2a2a2a] sticky top-0 bg-[#161616] z-10">
              <h2 className="font-['Bebas_Neue'] text-2xl text-white">Νεο Βιντεο</h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Τίτλος *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="admin-input w-full" data-testid="video-title-input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">URL Βίντεο (YouTube ή αρχείο)</label>
                <div className="flex gap-2">
                  <input value={form.video_url} onChange={e => setForm({ ...form, video_url: e.target.value })} className="admin-input flex-1" placeholder="https://youtube.com/..." data-testid="video-url-input" />
                </div>
                <div className="mt-2">
                  <label className="inline-flex items-center gap-2 text-sm text-[#F5A623] cursor-pointer hover:text-[#e09620]">
                    <Upload size={14} />
                    <span>{uploading ? "Μεταφόρτωση..." : "Ανέβασμα αρχείου"}</span>
                    <input type="file" accept="video/*" className="hidden" onChange={handleFileUpload} disabled={uploading} data-testid="video-file-upload" />
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Τύπος</label>
                  <select value={form.video_type} onChange={e => setForm({ ...form, video_type: e.target.value })} className="admin-input w-full" data-testid="video-type-select">
                    {VIDEO_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Διάρκεια</label>
                  <input value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} className="admin-input w-full" placeholder="01:30:00" data-testid="video-duration-input" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Περιγραφή</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="admin-input w-full" rows={3} data-testid="video-desc-input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Παίκτες (tags)</label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {form.tagged_players.map((pid, i) => {
                    const p = players.find(pl => pl.id === pid);
                    return (
                      <span key={i} className="text-xs bg-[#F5A623]/10 text-[#F5A623] px-2 py-0.5 rounded flex items-center gap-1">
                        {p?.name || pid}
                        <button onClick={() => setForm({ ...form, tagged_players: form.tagged_players.filter((_, j) => j !== i) })} className="hover:text-red-400"><X size={10} /></button>
                      </span>
                    );
                  })}
                </div>
                <select onChange={e => {
                  if (e.target.value && !form.tagged_players.includes(e.target.value)) {
                    setForm({ ...form, tagged_players: [...form.tagged_players, e.target.value] });
                  }
                  e.target.value = "";
                }} className="admin-input w-full text-sm" data-testid="video-tag-player">
                  <option value="">+ Προσθήκη παίκτη</option>
                  {players.filter(p => !form.tagged_players.includes(p.id)).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-[#2a2a2a]">
              <button onClick={handleSave} disabled={saving} className="admin-btn-primary flex-1" data-testid="save-video">
                {saving ? <><RefreshCw size={14} className="animate-spin" /> Αποθήκευση...</> : <><Save size={14} /> Αποθήκευση</>}
              </button>
              <button onClick={() => setShowModal(false)} className="admin-btn-ghost flex-1">Ακύρωση</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoAnalyticsPanel;
