import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Users, Calendar, Plus, Edit2, Trash2, X, Check, ChevronRight, ChevronDown,
  Image, GraduationCap, MapPin, RefreshCw, ArrowLeftRight, BarChart3,
  Dumbbell, Video, Upload, Clock
} from "lucide-react";
import ImageUpload from "../../components/ImageUpload";
import InlineAttendance from "./InlineAttendance";
import TrainingSessionsPanel from "./TrainingSessionsPanel";
import VideoAnalyticsPanel from "./VideoAnalyticsPanel";
import { API, getAuthHeaders, stripGreekAccents, FormModal, Field, AdminInput, AdminSelect, AdminTextarea, TabHeader, EmptyState } from "./shared";

const EnhancedAcademyTab = ({ groups, players, opponents = [], facilities = [], onRefresh, AdminPlayerProfile, MatchStatsModal }) => {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [viewingPlayer, setViewingPlayer] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editGroup, setEditGroup] = useState(null);
  const [saving, setSaving] = useState(false);
  const [detailTab, setDetailTab] = useState("roster");
  const emptyGroup = { name: "", age_range: "", coach_name: "", training_schedule: "", description: "", max_players: 25, season: "2025/26", banner_url: "", display_order: 0 };
  const [form, setForm] = useState(emptyGroup);

  const [showPlayerForm, setShowPlayerForm] = useState(false);
  const [editPlayer, setEditPlayer] = useState(null);
  const [savingPlayer, setSavingPlayer] = useState(false);
  const emptyPlayer = { name: "", number: "", position: "Midfielder", nationality: "Cyprus", date_of_birth: "", image_url: "", bio: "", height: "", weight: "", preferred_foot: "Right", parent_name: "", parent_phone: "", parent_email: "" };
  const [playerForm, setPlayerForm] = useState(emptyPlayer);

  const [showTransfer, setShowTransfer] = useState(false);
  const [transferPlayer, setTransferPlayer] = useState(null);
  const [transferGroupIds, setTransferGroupIds] = useState([]);
  const [savingTransfer, setSavingTransfer] = useState(false);

  const [groupFixtures, setGroupFixtures] = useState([]);
  const [showFixtureForm, setShowFixtureForm] = useState(false);
  const [fixtureForm, setFixtureForm] = useState({ home_team: "LEFTERIA FC", away_team: "", away_team_logo: "", match_date: "", match_time: "", arrival_time: "", venue: "", venue_id: "", location: "", location_url: "", competition: "", season: "2025/26", opponent_id: "" });
  const [savingFixture, setSavingFixture] = useState(false);
  const [editFixture, setEditFixture] = useState(null);
  const [matchStatsFixture, setMatchStatsFixture] = useState(null);
  const [expandedAcadFixtureId, setExpandedAcadFixtureId] = useState(null);

  const [galleryItems, setGalleryItems] = useState([]);
  const [showGalleryForm, setShowGalleryForm] = useState(false);
  const [galleryForm, setGalleryForm] = useState({ title: "", image_url: "", category: "Training", description: "" });
  const [savingGallery, setSavingGallery] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const openCreate = () => { setForm(emptyGroup); setEditGroup(null); setShowForm(true); };
  const openEdit = (g) => { setForm({ name: g.name, age_range: g.age_range, coach_name: g.coach_name || "", training_schedule: g.training_schedule, description: g.description, max_players: g.max_players, season: g.season || "2025/26", banner_url: g.banner_url || "", display_order: g.display_order || 0 }); setEditGroup(g); setShowForm(true); };
  const handleSave = async () => {
    setSaving(true);
    try {
      const headers = getAuthHeaders();
      const payload = { ...form, max_players: parseInt(form.max_players) || 25, display_order: parseInt(form.display_order) || 0 };
      if (editGroup) await axios.put(`${API}/admin/academy-groups/${editGroup.id}`, payload, { headers });
      else await axios.post(`${API}/admin/academy-groups`, payload, { headers });
      setShowForm(false); onRefresh();
    } catch (e) { alert(e.response?.data?.detail || "Σφάλμα"); } finally { setSaving(false); }
  };
  const handleDeleteGroup = async (id) => {
    if (!window.confirm("Διαγραφή ομάδας;")) return;
    try { await axios.delete(`${API}/admin/academy-groups/${id}`, { headers: getAuthHeaders() }); if (selectedGroup?.id === id) setSelectedGroup(null); onRefresh(); } catch (e) { alert("Σφάλμα"); }
  };

  const handleGroupBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await axios.post(`${API}/admin/upload-image`, fd, { headers: { ...getAuthHeaders(), "Content-Type": "multipart/form-data" } });
      setForm(prev => ({ ...prev, banner_url: res.data.image_url || res.data.url }));
    } catch (err) { alert("Σφάλμα ανεβάσματος"); } finally { setUploadingBanner(false); }
  };

  const calcAge = (dob) => { if (!dob) return ""; try { return Math.floor((new Date() - new Date(dob)) / 31557600000); } catch { return ""; } };

  const academyOpponents = opponents.filter(o => o.team_type === "Academy");
  const academyFacilities = facilities.filter(f => f.team_type === "Academy");

  const openCreatePlayer = () => { setPlayerForm({...emptyPlayer}); setEditPlayer(null); setShowPlayerForm(true); };
  const openEditPlayer = (p) => {
    setPlayerForm({
      name: p.name || "", number: p.number || "", position: p.position || "Midfielder", nationality: p.nationality || "Cyprus",
      date_of_birth: p.date_of_birth || "", image_url: p.image_url || "", bio: p.bio || "",
      height: p.height || "", weight: p.weight || "", preferred_foot: p.preferred_foot || "Right",
      parent_name: p.parent_name || "", parent_phone: p.parent_phone || "", parent_email: p.parent_email || ""
    });
    setEditPlayer(p); setShowPlayerForm(true);
  };
  const handleSavePlayer = async () => {
    setSavingPlayer(true);
    try {
      const headers = getAuthHeaders();
      const age = calcAge(playerForm.date_of_birth);
      const payload = {
        ...playerForm, number: parseInt(playerForm.number) || 0, age: parseInt(age) || 0,
        team_type: "Academy", academy_group_id: selectedGroup.id, academy_group_ids: [selectedGroup.id]
      };
      if (editPlayer) {
        payload.academy_group_ids = editPlayer.academy_group_ids?.length ? editPlayer.academy_group_ids : [selectedGroup.id];
        await axios.put(`${API}/admin/players/${editPlayer.id}`, payload, { headers });
      } else {
        await axios.post(`${API}/admin/players`, payload, { headers });
      }
      setShowPlayerForm(false); onRefresh();
    } catch (e) { alert(e.response?.data?.detail || "Σφάλμα"); } finally { setSavingPlayer(false); }
  };
  const handleDeletePlayer = async (id) => {
    if (!window.confirm("Διαγραφή παίκτη;")) return;
    try { await axios.delete(`${API}/admin/players/${id}`, { headers: getAuthHeaders() }); onRefresh(); } catch (e) { alert("Σφάλμα"); }
  };

  const openTransfer = (p) => {
    setTransferPlayer(p);
    setTransferGroupIds(p.academy_group_ids?.length ? [...p.academy_group_ids] : (p.academy_group_id ? [p.academy_group_id] : []));
    setShowTransfer(true);
  };
  const toggleTransferGroup = (gid) => {
    setTransferGroupIds(prev => prev.includes(gid) ? prev.filter(id => id !== gid) : [...prev, gid]);
  };
  const handleTransfer = async () => {
    if (transferGroupIds.length === 0) { alert("Επιλέξτε τουλάχιστον μία ομάδα"); return; }
    setSavingTransfer(true);
    try {
      await axios.post(`${API}/admin/players/${transferPlayer.id}/transfer`, { group_ids: transferGroupIds, primary_group_id: transferGroupIds[0] }, { headers: getAuthHeaders() });
      setShowTransfer(false); onRefresh();
    } catch (e) { alert("Σφάλμα"); } finally { setSavingTransfer(false); }
  };

  const fetchFixtures = useCallback(async () => {
    if (!selectedGroup) return;
    try { const res = await axios.get(`${API}/academy-groups/${selectedGroup.id}/fixtures`); setGroupFixtures(res.data); } catch (e) { console.error(e); }
  }, [selectedGroup]);
  useEffect(() => { if (detailTab === "schedule" && selectedGroup) fetchFixtures(); }, [detailTab, selectedGroup, fetchFixtures]);

  const openCreateFixture = () => { setFixtureForm({ home_team: "LEFTERIA FC", away_team: "", match_date: "", venue: "", competition: "", season: "2025/26" }); setEditFixture(null); setShowFixtureForm(true); };
  const handleSaveFixture = async () => {
    setSavingFixture(true);
    try {
      await axios.post(`${API}/admin/academy-groups/${selectedGroup.id}/fixtures`, fixtureForm, { headers: getAuthHeaders() });
      setShowFixtureForm(false); fetchFixtures();
    } catch (e) { alert("Σφάλμα"); } finally { setSavingFixture(false); }
  };
  const handleDeleteFixture = async (fid) => {
    if (!window.confirm("Διαγραφή αγώνα;")) return;
    try { await axios.delete(`${API}/admin/fixtures/${fid}`, { headers: getAuthHeaders() }); fetchFixtures(); } catch (e) { alert("Σφάλμα"); }
  };

  const fetchGallery = useCallback(async () => {
    if (!selectedGroup) return;
    try { const res = await axios.get(`${API}/gallery?academy_group_id=${selectedGroup.id}`); setGalleryItems(res.data); } catch (e) { console.error(e); }
  }, [selectedGroup]);
  useEffect(() => { if (detailTab === "gallery" && selectedGroup) fetchGallery(); }, [detailTab, selectedGroup, fetchGallery]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploadingFile(true);
    try { const fd = new FormData(); fd.append("file", file); const res = await axios.post(`${API}/admin/gallery/upload`, fd, { headers: { ...getAuthHeaders(), "Content-Type": "multipart/form-data" } }); setGalleryForm(prev => ({...prev, image_url: res.data.url})); } catch (e) { alert("Σφάλμα"); } finally { setUploadingFile(false); }
  };
  const handleSaveGallery = async () => {
    setSavingGallery(true);
    try { await axios.post(`${API}/admin/gallery`, {...galleryForm, academy_group_id: selectedGroup.id}, { headers: getAuthHeaders() }); setShowGalleryForm(false); fetchGallery(); setGalleryForm({ title: "", image_url: "", category: "Training", description: "" }); } catch (e) { alert("Σφάλμα"); } finally { setSavingGallery(false); }
  };
  const handleDeleteGallery = async (id) => { if (!window.confirm("Διαγραφή;")) return; try { await axios.delete(`${API}/admin/gallery/${id}`, { headers: getAuthHeaders() }); fetchGallery(); } catch (e) { alert("Σφάλμα"); } };

  if (selectedGroup) {
    const groupPlayers = players.filter(p =>
      p.academy_group_id === selectedGroup.id ||
      (p.academy_group_ids && p.academy_group_ids.includes(selectedGroup.id))
    );

    if (viewingPlayer) {
      const freshPlayer = players.find(p => p.id === viewingPlayer.id) || viewingPlayer;
      return (
        <div data-testid="academy-detail-view">
          <AdminPlayerProfile player={freshPlayer} academyGroups={groups} onBack={() => setViewingPlayer(null)} onRefresh={onRefresh} />
        </div>
      );
    }

    return (
      <div data-testid="academy-detail-view">
        <button onClick={() => setSelectedGroup(null)} className="admin-btn-ghost text-sm mb-4" data-testid="back-to-academy">
          <ChevronRight size={14} className="rotate-180" /> Πίσω στις ομάδες
        </button>
        {selectedGroup.banner_url && (
          <div className="h-32 rounded-xl overflow-hidden mb-4 border border-[#262626]">
            <img src={selectedGroup.banner_url.startsWith("/") ? `${process.env.REACT_APP_BACKEND_URL}${selectedGroup.banner_url}` : selectedGroup.banner_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="mb-6">
          <h2 className="font-['Bebas_Neue'] text-4xl text-[#10B981] tracking-wide">{stripGreekAccents(selectedGroup.name)}</h2>
          <div className="flex items-center gap-3 mt-2 text-sm text-zinc-300 flex-wrap">
            <span className="admin-badge admin-badge-green">{selectedGroup.age_range}</span>
            {selectedGroup.coach_name && <span>Προπονητής: {selectedGroup.coach_name}</span>}
            {selectedGroup.training_schedule && <span className="flex items-center gap-1"><Clock size={14} /> {selectedGroup.training_schedule}</span>}
          </div>
        </div>

        <div className="flex gap-1 mb-6 border-b border-[#262626] pb-0 overflow-x-auto">
          {[
            { id: "roster", label: "Ρόστερ", icon: Users, count: groupPlayers.length },
            { id: "schedule", label: "Αγώνες", icon: Calendar, count: groupFixtures.length },
            { id: "training", label: "Προπονήσεις", icon: Dumbbell, count: null },
            { id: "videos", label: "Βίντεο", icon: Video, count: null },
            { id: "gallery", label: "Γκαλερί", icon: Image, count: galleryItems.length },
          ].map(tab => (
            <button key={tab.id} onClick={() => setDetailTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-[1px] whitespace-nowrap ${
                detailTab === tab.id ? 'border-[#10B981] text-[#10B981]' : 'border-transparent text-zinc-400 hover:text-white'
              }`} data-testid={`academy-tab-${tab.id}`}>
              <tab.icon size={15} /> {tab.label}
              <span className="text-xs ml-1 opacity-60">({tab.count})</span>
            </button>
          ))}
        </div>

        {detailTab === "roster" && (
          <div>
            <div className="flex justify-end mb-4 gap-2">
              <button onClick={openCreatePlayer} className="admin-btn-primary" data-testid="add-academy-player-btn"><Plus size={14} /> Νέος Παίκτης</button>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table" data-testid="academy-players-table">
                <thead><tr><th>#</th><th></th><th>Όνομα</th><th>Θέση</th><th>Ηλικία</th><th>Γονέας</th><th>Τηλ.</th><th></th></tr></thead>
                <tbody>
                  {groupPlayers.map(p => (
                    <tr key={p.id} className="cursor-pointer hover:bg-white/[0.03]" onClick={() => setViewingPlayer(p)}>
                      <td className="font-mono text-zinc-400">{p.number}</td>
                      <td>{p.image_url ? <img src={p.image_url} alt="" className="w-9 h-9 object-cover rounded-full" /> : <div className="w-9 h-9 bg-[#1a1a1a] rounded-full flex items-center justify-center"><Users size={14} className="text-zinc-600" /></div>}</td>
                      <td className="font-medium text-[#10B981] hover:underline" data-testid={`view-academy-player-${p.id}`}>{p.name}</td>
                      <td className="text-zinc-300">{p.position}</td>
                      <td className="text-zinc-300">{p.age || calcAge(p.date_of_birth) || "-"}</td>
                      <td className="text-zinc-400 text-sm">{p.parent_name || "-"}</td>
                      <td className="text-zinc-400 text-sm">{p.parent_phone || "-"}</td>
                      <td>
                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                          <button onClick={() => openEditPlayer(p)} className="admin-icon-btn" data-testid={`edit-academy-player-${p.id}`}><Edit2 size={14} /></button>
                          <button onClick={() => openTransfer(p)} className="admin-icon-btn text-blue-400/70 hover:text-blue-300" title="Μεταφορά" data-testid={`transfer-player-${p.id}`}><ArrowLeftRight size={14} /></button>
                          <button onClick={() => handleDeletePlayer(p.id)} className="admin-icon-btn text-red-500/70 hover:text-red-400" data-testid={`delete-academy-player-${p.id}`}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {groupPlayers.length === 0 && <tr><td colSpan={8}><EmptyState icon={Users} text="Δεν υπάρχουν παίκτες" /></td></tr>}
                </tbody>
              </table>
            </div>

            {showPlayerForm && (
              <FormModal title={editPlayer ? "Επεξεργασία Παίκτη" : "Νέος Παίκτης"} onClose={() => setShowPlayerForm(false)} onSave={handleSavePlayer} saving={savingPlayer}>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Ονοματεπώνυμο *"><AdminInput value={playerForm.name} onChange={e => setPlayerForm({...playerForm, name: e.target.value})} data-testid="academy-player-name" /></Field>
                  <Field label="Αριθμός"><AdminInput type="number" value={playerForm.number} onChange={e => setPlayerForm({...playerForm, number: e.target.value})} data-testid="academy-player-number" /></Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Ημ. Γέννησης *">
                    <AdminInput type="date" value={playerForm.date_of_birth} onChange={e => setPlayerForm({...playerForm, date_of_birth: e.target.value})} data-testid="academy-player-dob" />
                    {playerForm.date_of_birth && <span className="text-xs text-[#10B981] mt-1 block">Ηλικία: {calcAge(playerForm.date_of_birth)} ετών</span>}
                  </Field>
                  <Field label="Θέση">
                    <AdminSelect value={playerForm.position} onChange={e => setPlayerForm({...playerForm, position: e.target.value})}>
                      <option value="Goalkeeper">Τερματοφύλακας</option><option value="Defender">Αμυντικός</option><option value="Midfielder">Μέσος</option><option value="Forward">Επιθετικός</option>
                    </AdminSelect>
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Εθνικότητα"><AdminInput value={playerForm.nationality} onChange={e => setPlayerForm({...playerForm, nationality: e.target.value})} /></Field>
                  <Field label="Ύψος"><AdminInput placeholder="1.45m" value={playerForm.height} onChange={e => setPlayerForm({...playerForm, height: e.target.value})} /></Field>
                  <Field label="Βάρος"><AdminInput placeholder="35kg" value={playerForm.weight} onChange={e => setPlayerForm({...playerForm, weight: e.target.value})} /></Field>
                </div>
                <ImageUpload currentUrl={playerForm.image_url} onImageChange={url => setPlayerForm({...playerForm, image_url: url})} playerId={editPlayer?.id} />
                <div className="border-t border-[#262626] pt-4 mt-2">
                  <h4 className="text-white text-sm font-semibold mb-3">Στοιχεία Γονέα / Κηδεμόνα</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Ονοματεπώνυμο"><AdminInput value={playerForm.parent_name} onChange={e => setPlayerForm({...playerForm, parent_name: e.target.value})} data-testid="academy-player-parent-name" /></Field>
                    <Field label="Τηλέφωνο"><AdminInput value={playerForm.parent_phone} onChange={e => setPlayerForm({...playerForm, parent_phone: e.target.value})} data-testid="academy-player-parent-phone" /></Field>
                  </div>
                  <Field label="Email"><AdminInput type="email" value={playerForm.parent_email} onChange={e => setPlayerForm({...playerForm, parent_email: e.target.value})} data-testid="academy-player-parent-email" /></Field>
                </div>
                <Field label="Βιογραφικό"><AdminTextarea rows={2} value={playerForm.bio} onChange={e => setPlayerForm({...playerForm, bio: e.target.value})} /></Field>
              </FormModal>
            )}

            {showTransfer && transferPlayer && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowTransfer(false)}>
                <div className="bg-[#161616] border border-[#2a2a2a] rounded-lg w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()} data-testid="transfer-modal">
                  <div className="flex justify-between items-center px-6 py-4 border-b border-[#2a2a2a]">
                    <h2 className="font-['Bebas_Neue'] text-2xl text-white">Μεταφορα: {transferPlayer.name}</h2>
                    <button onClick={() => setShowTransfer(false)} className="text-zinc-400 hover:text-white"><X size={18} /></button>
                  </div>
                  <div className="p-6 space-y-3">
                    <p className="text-sm text-zinc-400 mb-2">Επιλέξτε τις ομάδες στις οποίες ανήκει ο παίκτης:</p>
                    {groups.map(g => (
                      <label key={g.id} className="flex items-center gap-3 p-3 bg-[#0d0d0d] border border-[#262626] rounded-lg cursor-pointer hover:border-[#10B981]/40 transition-colors" data-testid={`transfer-group-${g.id}`}>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${transferGroupIds.includes(g.id) ? 'bg-[#10B981] border-[#10B981]' : 'border-[#444]'}`}>
                          {transferGroupIds.includes(g.id) && <Check size={13} className="text-black" strokeWidth={3} />}
                        </div>
                        <input type="checkbox" checked={transferGroupIds.includes(g.id)} onChange={() => toggleTransferGroup(g.id)} className="hidden" />
                        <div>
                          <span className="text-white text-sm font-medium">{g.name}</span>
                          <span className="text-zinc-500 text-xs ml-2">{g.age_range}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-3 px-6 py-4 border-t border-[#2a2a2a]">
                    <button onClick={handleTransfer} disabled={savingTransfer} className="admin-btn-primary flex-1" data-testid="confirm-transfer-btn">
                      {savingTransfer ? "Μεταφορά..." : "Αποθήκευση"}
                    </button>
                    <button onClick={() => setShowTransfer(false)} className="admin-btn-ghost flex-1">Ακύρωση</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {detailTab === "schedule" && (
          <div>
            <div className="flex justify-end mb-4">
              <button onClick={openCreateFixture} className="admin-btn-primary" data-testid="add-academy-fixture-btn"><Plus size={14} /> Νέος Αγώνας</button>
            </div>
            <div className="space-y-2" data-testid="academy-fixtures-list">
              {groupFixtures.map(f => {
                const isExpanded = expandedAcadFixtureId === f.id;
                return (
                  <div key={f.id} className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl overflow-hidden" data-testid={`academy-fixture-card-${f.id}`}>
                    <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/[0.02]" onClick={() => setExpandedAcadFixtureId(isExpanded ? null : f.id)}>
                      <div className={`w-1 h-10 rounded-full ${f.status === 'Completed' ? 'bg-emerald-500' : 'bg-[#10B981]'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm font-medium ${f.home_team === 'LEFTERIA FC' ? 'text-[#10B981]' : 'text-white'}`}>{f.home_team}</span>
                          <span className="font-['Bebas_Neue'] text-zinc-400 text-sm">{f.status === 'Completed' ? `${f.home_score ?? 0} - ${f.away_score ?? 0}` : 'vs'}</span>
                          <span className={`text-sm font-medium ${f.away_team === 'LEFTERIA FC' ? 'text-[#10B981]' : 'text-white'}`}>{f.away_team}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded border ${f.status === 'Completed' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-[#10B981]/30 text-[#10B981] bg-[#10B981]/10'}`}>
                            {f.status === 'Completed' ? 'Ολοκλ.' : 'Προγρ.'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                          {f.match_date && <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(f.match_date).toLocaleDateString('el-GR')}</span>}
                          {f.match_time && <span>{f.match_time}</span>}
                          {f.venue && <span className="flex items-center gap-1"><MapPin size={10} /> {f.venue}</span>}
                          {f.arrival_time && <span className="flex items-center gap-1"><Clock size={10} /> Άφιξη: {f.arrival_time}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                        {f.status === 'Scheduled' && (
                          <button onClick={() => setMatchStatsFixture(f)} className="admin-icon-btn text-green-400/70 hover:text-green-300" title="Ολοκλήρωση & Στατιστικά" data-testid={`complete-fixture-${f.id}`}><Check size={14} /></button>
                        )}
                        {f.status === 'Completed' && (
                          <button onClick={() => setMatchStatsFixture(f)} className="admin-icon-btn text-[#F5A623]/70 hover:text-[#F5A623]" title="Στατιστικά Αγώνα" data-testid={`edit-stats-${f.id}`}><BarChart3 size={14} /></button>
                        )}
                        <button onClick={() => handleDeleteFixture(f.id)} className="admin-icon-btn text-red-500/70 hover:text-red-400" data-testid={`delete-fixture-${f.id}`}><Trash2 size={14} /></button>
                      </div>
                      {isExpanded ? <ChevronDown size={14} className="text-zinc-500" /> : <ChevronRight size={14} className="text-zinc-500" />}
                    </div>
                    {isExpanded && (
                      <div className="border-t border-[#1e1e1e] p-4">
                        <InlineAttendance eventId={f.id} players={groupPlayers} />
                      </div>
                    )}
                  </div>
                );
              })}
              {groupFixtures.length === 0 && (
                <div className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl p-12 text-center">
                  <Calendar size={36} className="text-zinc-700 mx-auto mb-2" />
                  <p className="text-zinc-500 text-sm">Δεν υπάρχουν αγώνες</p>
                </div>
              )}
            </div>
            {showFixtureForm && (
              <FormModal title="Νέος Αγώνας" onClose={() => setShowFixtureForm(false)} onSave={handleSaveFixture} saving={savingFixture}>
                <Field label="Γηπεδούχος *"><AdminInput value={fixtureForm.home_team} onChange={e => setFixtureForm({...fixtureForm, home_team: e.target.value})} /></Field>
                <Field label="Αντίπαλος *">
                  <AdminSelect value={fixtureForm.opponent_id} onChange={e => { const opp = academyOpponents.find(o => o.id === e.target.value); if (opp) setFixtureForm({...fixtureForm, away_team: opp.name, away_team_logo: opp.logo_url, opponent_id: opp.id, location_url: opp.location_url || fixtureForm.location_url}); }}>
                    <option value="">— Επιλέξτε ή πληκτρολογήστε —</option>
                    {academyOpponents.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </AdminSelect>
                  <AdminInput value={fixtureForm.away_team} onChange={e => setFixtureForm({...fixtureForm, away_team: e.target.value})} placeholder="Ή πληκτρολογήστε" className="mt-1" />
                </Field>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Ημερομηνία *"><AdminInput type="date" value={fixtureForm.match_date?.split('T')[0] || fixtureForm.match_date} onChange={e => setFixtureForm({...fixtureForm, match_date: e.target.value})} /></Field>
                  <Field label="Ώρα Έναρξης"><AdminInput type="time" value={fixtureForm.match_time} onChange={e => setFixtureForm({...fixtureForm, match_time: e.target.value})} /></Field>
                  <Field label="Ώρα Άφιξης"><AdminInput type="time" value={fixtureForm.arrival_time} onChange={e => setFixtureForm({...fixtureForm, arrival_time: e.target.value})} /></Field>
                </div>
                <Field label="Γήπεδο">
                  <AdminSelect value={fixtureForm.venue_id} onChange={e => { const fac = academyFacilities.find(f => f.id === e.target.value); if (fac) setFixtureForm({...fixtureForm, venue: fac.name, venue_id: fac.id, location_url: fac.location_url || fixtureForm.location_url}); }}>
                    <option value="">— Επιλέξτε ή πληκτρολογήστε —</option>
                    {academyFacilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </AdminSelect>
                  <AdminInput value={fixtureForm.venue} onChange={e => setFixtureForm({...fixtureForm, venue: e.target.value})} placeholder="Ή πληκτρολογήστε" className="mt-1" />
                </Field>
                <Field label="Google Maps Link"><AdminInput value={fixtureForm.location_url} onChange={e => setFixtureForm({...fixtureForm, location_url: e.target.value})} placeholder="https://maps.google.com/..." /></Field>
                <Field label="Διοργάνωση"><AdminInput value={fixtureForm.competition} onChange={e => setFixtureForm({...fixtureForm, competition: e.target.value})} placeholder="Πρωτάθλημα U12" /></Field>
              </FormModal>
            )}
            {matchStatsFixture && (
              <MatchStatsModal
                fixture={matchStatsFixture}
                players={players.filter(p => p.academy_group_id === selectedGroup.id || (p.academy_group_ids && p.academy_group_ids.includes(selectedGroup.id)))}
                onClose={() => setMatchStatsFixture(null)}
                onSaved={() => { fetchFixtures(); onRefresh(); }}
              />
            )}
          </div>
        )}

        {detailTab === "training" && (
          <TrainingSessionsPanel academyGroupId={selectedGroup.id} facilities={academyFacilities} players={groupPlayers} />
        )}

        {detailTab === "videos" && (
          <VideoAnalyticsPanel academyGroupId={selectedGroup.id} players={groupPlayers} />
        )}

        {detailTab === "gallery" && (
          <div>
            <div className="flex justify-end mb-4">
              <button onClick={() => setShowGalleryForm(true)} className="admin-btn-primary" data-testid="add-academy-gallery-btn"><Plus size={14} /> Νέα Φωτογραφία</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {galleryItems.map(item => (
                <div key={item.id} className="bg-[#151515] border border-[#262626] rounded-lg overflow-hidden group">
                  <div className="aspect-[4/3] overflow-hidden"><img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /></div>
                  <div className="p-3">
                    <p className="text-white text-sm font-medium truncate">{item.title}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="admin-badge admin-badge-default text-xs">{item.category}</span>
                      <button onClick={() => handleDeleteGallery(item.id)} className="admin-icon-btn text-red-500/60 hover:text-red-400"><Trash2 size={13} /></button>
                    </div>
                  </div>
                </div>
              ))}
              {galleryItems.length === 0 && <div className="col-span-full"><EmptyState icon={Image} text="Δεν υπάρχουν φωτογραφίες" /></div>}
            </div>
            {showGalleryForm && (
              <FormModal title="Νέα Φωτογραφία" onClose={() => setShowGalleryForm(false)} onSave={handleSaveGallery} saving={savingGallery}>
                <Field label="Τίτλος *"><AdminInput value={galleryForm.title} onChange={e => setGalleryForm({...galleryForm, title: e.target.value})} /></Field>
                <Field label="Εικόνα *">
                  <div className="flex gap-2">
                    <AdminInput value={galleryForm.image_url} onChange={e => setGalleryForm({...galleryForm, image_url: e.target.value})} placeholder="URL εικόνας" className="flex-1" />
                    <label className="admin-btn-ghost cursor-pointer flex items-center"><input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />{uploadingFile ? <RefreshCw size={14} className="animate-spin" /> : "Upload"}</label>
                  </div>
                </Field>
                <Field label="Περιγραφή"><AdminInput value={galleryForm.description} onChange={e => setGalleryForm({...galleryForm, description: e.target.value})} /></Field>
              </FormModal>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div data-testid="admin-academy-enhanced-tab">
      <TabHeader title="Ομάδες Ακαδημίας" count={groups.length}>
        <button onClick={openCreate} className="admin-btn-primary" data-testid="add-academy-group-btn"><Plus size={14} /> Νέα Ομάδα</button>
      </TabHeader>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...groups].sort((a, b) => (a.display_order || 999) - (b.display_order || 999)).map(g => {
          const playerCount = players.filter(p => p.academy_group_id === g.id || (p.academy_group_ids && p.academy_group_ids.includes(g.id))).length;
          return (
            <div key={g.id} className="admin-card overflow-hidden cursor-pointer hover:border-[#10B981]/40 transition-colors group" onClick={() => { setSelectedGroup(g); setDetailTab("roster"); }} data-testid={`academy-group-${g.id}`}>
              {g.banner_url && (
                <div className="h-20 overflow-hidden">
                  <img src={g.banner_url.startsWith("/") ? `${process.env.REACT_APP_BACKEND_URL}${g.banner_url}` : g.banner_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              )}
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-['Bebas_Neue'] text-2xl text-[#10B981] group-hover:text-white transition-colors">{g.name}</span>
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEdit(g)} className="admin-icon-btn"><Edit2 size={14} /></button>
                    <button onClick={() => handleDeleteGroup(g.id)} className="admin-icon-btn text-red-500/60 hover:text-red-400"><Trash2 size={14} /></button>
                  </div>
                </div>
                <span className="admin-badge admin-badge-green mb-2">{g.age_range}</span>
                {g.display_order > 0 && <span className="admin-badge ml-1 mb-2" style={{background: "rgba(245,166,35,0.15)", color: "#F5A623"}}>#{g.display_order}</span>}
                <p className="text-zinc-200 text-sm mb-1">{g.coach_name}</p>
                <p className="text-zinc-400 text-sm flex items-center gap-1"><Clock size={13} /> {g.training_schedule}</p>
                <div className="flex items-center mt-3 text-sm text-zinc-400">
                  <Users size={13} className="mr-1" /> {playerCount} παίκτες
                  <ChevronRight size={16} className="text-zinc-600 group-hover:text-[#10B981] ml-auto transition-colors" />
                </div>
              </div>
            </div>
          );
        })}
        {groups.length === 0 && <EmptyState icon={GraduationCap} text="Δεν υπάρχουν ομάδες ακαδημίας" />}
      </div>
      {showForm && (
        <FormModal title={editGroup ? "Επεξεργασία" : "Νέα Ομάδα"} onClose={() => setShowForm(false)} onSave={handleSave} saving={saving}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Όνομα *"><AdminInput placeholder="U12" value={form.name} onChange={e => setForm({...form, name: e.target.value})} data-testid="group-name-input" /></Field>
            <Field label="Ηλικίες *"><AdminInput placeholder="16-18 ετών" value={form.age_range} onChange={e => setForm({...form, age_range: e.target.value})} /></Field>
          </div>
          <Field label="Προπονητής"><AdminInput value={form.coach_name} onChange={e => setForm({...form, coach_name: e.target.value})} /></Field>
          <Field label="Πρόγραμμα"><AdminInput value={form.training_schedule} onChange={e => setForm({...form, training_schedule: e.target.value})} /></Field>
          <Field label="Περιγραφή"><AdminTextarea rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Σειρα Εμφανισης"><AdminInput type="number" placeholder="1, 2, 3..." value={form.display_order} onChange={e => setForm({...form, display_order: e.target.value})} data-testid="group-display-order" /></Field>
            <div />
          </div>
          <Field label="Banner Ομάδας">
            <div className="flex items-center gap-3">
              {form.banner_url && (
                <div className="relative h-16 w-32 rounded overflow-hidden border border-[#262626]">
                  <img src={form.banner_url.startsWith("/") ? `${process.env.REACT_APP_BACKEND_URL}${form.banner_url}` : form.banner_url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setForm({...form, banner_url: ""})} className="absolute top-0.5 right-0.5 bg-black/60 rounded p-0.5 text-red-400 hover:text-red-300"><X size={12} /></button>
                </div>
              )}
              <label className="admin-btn-ghost cursor-pointer flex items-center gap-1.5" data-testid="group-banner-upload">
                <input type="file" accept="image/*" onChange={handleGroupBannerUpload} className="hidden" />
                {uploadingBanner ? <RefreshCw size={14} className="animate-spin" /> : <><Upload size={14} /> {form.banner_url ? "Αλλαγή" : "Ανέβασμα"}</>}
              </label>
            </div>
            <AdminInput value={form.banner_url} onChange={e => setForm({...form, banner_url: e.target.value})} placeholder="Ή επικολλήστε URL" className="mt-2" data-testid="group-banner-url" />
          </Field>
        </FormModal>
      )}
    </div>
  );
};

export default EnhancedAcademyTab;
