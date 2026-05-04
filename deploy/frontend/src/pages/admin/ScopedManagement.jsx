import { useState } from "react";
import { Plus, Edit2, Trash2, Shield, MapPin, X, RefreshCw, Upload } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const getAuthHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("adminToken")}` });
const BACKEND = process.env.REACT_APP_BACKEND_URL;

const imgSrc = (url) => url ? (url.startsWith("/") ? `${BACKEND}${url}` : url) : "";

// ========== OPPONENTS TAB ==========
export const OpponentsTab = ({ opponents = [], teamType, onRefresh }) => {
  const scopedOpponents = opponents.filter(o => o.team_type === teamType);
  const [showForm, setShowForm] = useState(false);
  const [editOpp, setEditOpp] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", logo_url: "" });
  const accentColor = teamType === "First Team" ? "#F5A623" : "#10B981";

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      const payload = { ...form, team_type: teamType };
      if (editOpp) await axios.put(`${API}/admin/opponents/${editOpp.id}`, payload, { headers: getAuthHeaders() });
      else await axios.post(`${API}/admin/opponents`, payload, { headers: getAuthHeaders() });
      setShowForm(false); setEditOpp(null); onRefresh();
    } catch (e) { alert("Σφάλμα"); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Διαγραφή αντίπαλου;")) return;
    try { await axios.delete(`${API}/admin/opponents/${id}`, { headers: getAuthHeaders() }); onRefresh(); } catch (e) { alert("Σφάλμα"); }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await axios.post(`${API}/admin/opponents/upload-logo`, fd, { headers: { ...getAuthHeaders(), "Content-Type": "multipart/form-data" } });
      setForm(prev => ({ ...prev, logo_url: res.data.url }));
    } catch (e) { alert("Σφάλμα"); }
  };

  const openCreate = () => { setForm({ name: "", logo_url: "" }); setEditOpp(null); setShowForm(true); };
  const openEdit = (o) => { setForm({ name: o.name, logo_url: o.logo_url || "" }); setEditOpp(o); setShowForm(true); };

  return (
    <div data-testid={`${teamType === "First Team" ? "club" : "academy"}-opponents-tab`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Αντίπαλοι {teamType === "Academy" ? "Ακαδημίας" : "Συλλόγου"}</h2>
          {teamType === "Academy" && <p className="text-xs text-zinc-500 mt-1">Κοινοί αντίπαλοι για όλες τις ομάδες ακαδημίας</p>}
        </div>
        <button onClick={openCreate} className="admin-btn-primary" data-testid="add-opponent-btn"><Plus size={14} /> Νέος Αντίπαλος</button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {scopedOpponents.map(o => (
          <div key={o.id} className="admin-card p-4 flex items-center gap-3" data-testid={`opponent-${o.id}`}>
            {o.logo_url ? (
              <img src={imgSrc(o.logo_url)} alt="" className="w-12 h-12 rounded-full object-cover border border-[#262626]" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#1a1a1a] flex items-center justify-center"><Shield size={18} className="text-zinc-600" /></div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{o.name}</p>
              {o.venue && <p className="text-zinc-500 text-xs mt-0.5 flex items-center gap-1"><MapPin size={10} /> {o.venue}</p>}
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => openEdit(o)} className="admin-icon-btn" data-testid={`edit-opp-${o.id}`}><Edit2 size={13} /></button>
              <button onClick={() => handleDelete(o.id)} className="admin-icon-btn text-red-500/60 hover:text-red-400"><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
      </div>

      {scopedOpponents.length === 0 && (
        <div className="text-center py-12 bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl">
          <Shield size={36} className="text-zinc-700 mx-auto mb-2" />
          <p className="text-zinc-500 text-sm">Δεν υπάρχουν αντίπαλοι</p>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center" data-testid="opponent-form-modal">
          <div className="bg-[#121212] border border-[#262626] rounded-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-5 border-b border-[#262626]">
              <h2 className="font-['Bebas_Neue'] text-xl text-white">{editOpp ? "Επεξεργασια Αντιπαλου" : "Νεος Αντιπαλος"}</h2>
              <button onClick={() => setShowForm(false)} className="admin-icon-btn"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block uppercase tracking-wider">Ονομα *</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white focus:outline-none" style={{ borderColor: form.name ? accentColor : undefined }}
                  data-testid="opponent-name-input" placeholder="Π.χ. ΑΠΟΕΛ" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block uppercase tracking-wider">Logo</label>
                <div className="flex items-center gap-3">
                  {form.logo_url && <img src={imgSrc(form.logo_url)} alt="" className="w-12 h-12 rounded-full object-cover border border-[#262626]" />}
                  <label className="admin-btn-ghost text-xs cursor-pointer flex items-center gap-1.5" data-testid="opponent-logo-upload">
                    <Upload size={13} /> {form.logo_url ? "Αλλαγή" : "Ανέβασμα"} Logo
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-[#262626]">
              <button onClick={() => setShowForm(false)} className="admin-btn-ghost">Ακύρωση</button>
              <button onClick={handleSave} disabled={saving} className="admin-btn-primary" data-testid="save-opponent-btn">
                {saving ? <RefreshCw size={14} className="animate-spin" /> : "Αποθήκευση"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ========== VENUES TAB ==========
export const VenuesTab = ({ facilities = [], teamType, onRefresh }) => {
  const scopedVenues = facilities.filter(f => f.team_type === teamType);
  const [showForm, setShowForm] = useState(false);
  const [editVenue, setEditVenue] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", location_url: "", surface: "" });
  const accentColor = teamType === "First Team" ? "#F5A623" : "#10B981";

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      const payload = { ...form, team_type: teamType };
      if (editVenue) await axios.put(`${API}/admin/facilities/${editVenue.id}`, payload, { headers: getAuthHeaders() });
      else await axios.post(`${API}/admin/facilities`, payload, { headers: getAuthHeaders() });
      setShowForm(false); setEditVenue(null); onRefresh();
    } catch (e) { alert("Σφάλμα"); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Διαγραφή γηπέδου;")) return;
    try { await axios.delete(`${API}/admin/facilities/${id}`, { headers: getAuthHeaders() }); onRefresh(); } catch (e) { alert("Σφάλμα"); }
  };

  const openCreate = () => { setForm({ name: "", address: "", location_url: "", surface: "" }); setEditVenue(null); setShowForm(true); };
  const openEdit = (v) => { setForm({ name: v.name, address: v.address || "", location_url: v.location_url || "", surface: v.surface || "" }); setEditVenue(v); setShowForm(true); };

  return (
    <div data-testid={`${teamType === "First Team" ? "club" : "academy"}-venues-tab`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Γήπεδα {teamType === "Academy" ? "Ακαδημίας" : "Συλλόγου"}</h2>
          {teamType === "Academy" && <p className="text-xs text-zinc-500 mt-1">Κοινά γήπεδα για όλες τις ομάδες ακαδημίας</p>}
        </div>
        <button onClick={openCreate} className="admin-btn-primary" data-testid="add-venue-btn"><Plus size={14} /> Νέο Γήπεδο</button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {scopedVenues.map(v => (
          <div key={v.id} className="admin-card p-5" data-testid={`venue-${v.id}`}>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium text-white text-sm">{v.name}</h3>
              <div className="flex gap-1.5">
                <button onClick={() => openEdit(v)} className="admin-icon-btn" data-testid={`edit-venue-${v.id}`}><Edit2 size={13} /></button>
                <button onClick={() => handleDelete(v.id)} className="admin-icon-btn text-red-500/60 hover:text-red-400"><Trash2 size={13} /></button>
              </div>
            </div>
            {v.address && <p className="text-zinc-500 text-xs flex items-center gap-1"><MapPin size={11} /> {v.address}</p>}
            {v.surface && <p className="text-zinc-600 text-xs mt-1">{v.surface}</p>}
            {v.location_url && <a href={v.location_url} target="_blank" rel="noreferrer" className="text-blue-400 text-xs mt-1.5 hover:underline flex items-center gap-1 w-fit"><MapPin size={10} /> Google Maps</a>}
          </div>
        ))}
      </div>

      {scopedVenues.length === 0 && (
        <div className="text-center py-12 bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl">
          <MapPin size={36} className="text-zinc-700 mx-auto mb-2" />
          <p className="text-zinc-500 text-sm">Δεν υπάρχουν γήπεδα</p>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center" data-testid="venue-form-modal">
          <div className="bg-[#121212] border border-[#262626] rounded-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-5 border-b border-[#262626]">
              <h2 className="font-['Bebas_Neue'] text-xl text-white">{editVenue ? "Επεξεργασια Γηπεδου" : "Νεο Γηπεδο"}</h2>
              <button onClick={() => setShowForm(false)} className="admin-icon-btn"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block uppercase tracking-wider">Ονομα *</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white focus:outline-none" style={{ borderColor: form.name ? accentColor : undefined }}
                  data-testid="venue-name-input" placeholder="Π.χ. Γήπεδο Λευτεριά" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block uppercase tracking-wider">Διευθυνση</label>
                <input value={form.address} onChange={e => setForm({...form, address: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white focus:outline-none"
                  placeholder="Οδός, Πόλη" data-testid="venue-address-input" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block uppercase tracking-wider">Google Maps Link</label>
                <input value={form.location_url} onChange={e => setForm({...form, location_url: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white focus:outline-none"
                  placeholder="https://maps.google.com/..." data-testid="venue-maps-input" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block uppercase tracking-wider">Επιφανεια</label>
                <input value={form.surface} onChange={e => setForm({...form, surface: e.target.value})}
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-sm text-white focus:outline-none"
                  placeholder="Φυσικός χλοοτάπητας, τεχνητός..." data-testid="venue-surface-input" />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-[#262626]">
              <button onClick={() => setShowForm(false)} className="admin-btn-ghost">Ακύρωση</button>
              <button onClick={handleSave} disabled={saving} className="admin-btn-primary" data-testid="save-venue-btn">
                {saving ? <RefreshCw size={14} className="animate-spin" /> : "Αποθήκευση"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
