import { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Edit2, Trash2, Upload, RefreshCw, X, Crown, Award, Medal, Heart, ExternalLink, Handshake } from "lucide-react";
import { TabHeader, FormModal, Field, AdminInput, AdminTextarea, AdminSelect, EmptyState } from "./shared";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const getAuthHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("admin_token")}` });

const LEVELS = [
  { value: "mega", label: "Mega Sponsor", icon: Crown, color: "#F5A623" },
  { value: "gold", label: "Gold Sponsor", icon: Award, color: "#EAB308" },
  { value: "silver", label: "Silver Sponsor", icon: Medal, color: "#94A3B8" },
  { value: "supporter", label: "Supporter", icon: Heart, color: "#10B981" },
];

const TYPES = [
  { value: "first_team", label: "Πρώτη Ομάδα" },
  { value: "academy", label: "Ακαδημία" },
];

const SponsorsTab = () => {
  const [sponsors, setSponsors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editSponsor, setEditSponsor] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [filterType, setFilterType] = useState("all");

  const emptyForm = { name: "", description: "", logo_url: "", banner_url: "", website: "", level: "supporter", sponsor_type: "first_team", display_order: 0 };
  const [form, setForm] = useState(emptyForm);

  const fetchSponsors = () => {
    axios.get(`${API}/sponsors`, { headers: getAuthHeaders() }).then(res => setSponsors(res.data)).catch(() => {});
  };

  useEffect(() => { fetchSponsors(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditSponsor(null); setShowForm(true); };
  const openEdit = (s) => {
    setForm({
      name: s.name, description: s.description || "", logo_url: s.logo_url || "",
      banner_url: s.banner_url || "", website: s.website || "", level: s.level || "supporter",
      sponsor_type: s.sponsor_type || "first_team", display_order: s.display_order || 0,
    });
    setEditSponsor(s);
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, display_order: parseInt(form.display_order) || 0 };
      if (editSponsor) {
        await axios.put(`${API}/admin/sponsors/${editSponsor.id}`, payload, { headers: getAuthHeaders() });
      } else {
        await axios.post(`${API}/admin/sponsors`, payload, { headers: getAuthHeaders() });
      }
      setShowForm(false);
      fetchSponsors();
    } catch (e) { alert(e.response?.data?.detail || "Error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Διαγραφή χορηγού;")) return;
    await axios.delete(`${API}/admin/sponsors/${id}`, { headers: getAuthHeaders() });
    fetchSponsors();
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingLogo(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await axios.post(`${API}/admin/sponsors/upload-logo`, fd, { headers: { ...getAuthHeaders(), "Content-Type": "multipart/form-data" } });
      setForm(prev => ({ ...prev, logo_url: res.data.image_url }));
    } catch (e) { alert("Upload failed"); }
    finally { setUploadingLogo(false); }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingBanner(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await axios.post(`${API}/admin/sponsors/upload-logo`, fd, { headers: { ...getAuthHeaders(), "Content-Type": "multipart/form-data" } });
      setForm(prev => ({ ...prev, banner_url: res.data.image_url }));
    } catch (e) { alert("Upload failed"); }
    finally { setUploadingBanner(false); }
  };

  const imgUrl = (url) => url ? (url.startsWith("http") ? url : `${process.env.REACT_APP_BACKEND_URL}${url}`) : null;

  const filtered = filterType === "all" ? sponsors : sponsors.filter(s => s.sponsor_type === filterType);
  const sorted = [...filtered].sort((a, b) => (a.display_order || 999) - (b.display_order || 999));

  return (
    <div data-testid="sponsors-tab">
      <TabHeader title="Χορηγοί" count={sponsors.length}>
        <div className="flex items-center gap-2">
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-[#1a1a1a] border border-[#262626] text-white text-sm rounded-lg px-3 py-2">
            <option value="all">Όλοι</option>
            <option value="first_team">Πρώτη Ομάδα</option>
            <option value="academy">Ακαδημία</option>
          </select>
          <button onClick={openCreate} className="admin-btn-primary" data-testid="add-sponsor-btn"><Plus size={14} /> Νέος Χορηγός</button>
        </div>
      </TabHeader>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map(s => {
          const lvl = LEVELS.find(l => l.value === s.level) || LEVELS[3];
          return (
            <div key={s.id} className="admin-card overflow-hidden" data-testid={`sponsor-${s.id}`}>
              {s.banner_url && (
                <div className="h-20 overflow-hidden">
                  <img src={imgUrl(s.banner_url)} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    {s.logo_url && (
                      <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center overflow-hidden border border-white/[0.06]">
                        <img src={imgUrl(s.logo_url)} alt="" className="max-w-full max-h-full object-contain p-1" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-white font-semibold">{s.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${lvl.color}20`, color: lvl.color }}>{lvl.label}</span>
                        <span className="text-[10px] text-zinc-500">{s.sponsor_type === "first_team" ? "Α' Ομάδα" : "Ακαδημία"}</span>
                        {s.display_order > 0 && <span className="text-[10px] text-zinc-600">#{s.display_order}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(s)} className="admin-icon-btn"><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(s.id)} className="admin-icon-btn text-red-500/60 hover:text-red-400"><Trash2 size={14} /></button>
                  </div>
                </div>
                {s.description && <p className="text-zinc-400 text-xs line-clamp-2 mb-2">{s.description}</p>}
                {s.website && (
                  <a href={s.website.startsWith("http") ? s.website : `https://${s.website}`} target="_blank" rel="noreferrer" className="text-[#F5A623] text-xs flex items-center gap-1 hover:underline">
                    <ExternalLink size={11} /> {s.website}
                  </a>
                )}
              </div>
            </div>
          );
        })}
        {sorted.length === 0 && <EmptyState icon={Handshake} text="Δεν υπάρχουν χορηγοί" />}
      </div>

      {showForm && (
        <FormModal title={editSponsor ? "Επεξεργασία Χορηγού" : "Νέος Χορηγός"} onClose={() => setShowForm(false)} onSave={handleSave} saving={saving}>
          <Field label="Όνομα *"><AdminInput placeholder="Όνομα χορηγού" value={form.name} onChange={e => setForm({...form, name: e.target.value})} data-testid="sponsor-name-input" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Επίπεδο">
              <AdminSelect value={form.level} onChange={e => setForm({...form, level: e.target.value})}>
                {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </AdminSelect>
            </Field>
            <Field label="Τύπος">
              <AdminSelect value={form.sponsor_type} onChange={e => setForm({...form, sponsor_type: e.target.value})}>
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </AdminSelect>
            </Field>
          </div>
          <Field label="Περιγραφή"><AdminTextarea rows={3} placeholder="Περιγραφή χορηγού..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></Field>
          <Field label="Ιστοσελίδα"><AdminInput placeholder="www.example.com" value={form.website} onChange={e => setForm({...form, website: e.target.value})} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Σειρά Εμφάνισης"><AdminInput type="number" placeholder="1, 2, 3..." value={form.display_order} onChange={e => setForm({...form, display_order: e.target.value})} /></Field>
            <div />
          </div>
          <Field label="Logo">
            <div className="flex items-center gap-3">
              {form.logo_url && (
                <div className="relative h-16 w-24 rounded overflow-hidden border border-[#262626] bg-white/5 flex items-center justify-center">
                  <img src={imgUrl(form.logo_url)} alt="" className="max-w-full max-h-full object-contain p-1" />
                  <button type="button" onClick={() => setForm({...form, logo_url: ""})} className="absolute top-0.5 right-0.5 bg-black/60 rounded p-0.5 text-red-400"><X size={12} /></button>
                </div>
              )}
              <label className="admin-btn-ghost cursor-pointer flex items-center gap-1.5">
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                {uploadingLogo ? <RefreshCw size={14} className="animate-spin" /> : <><Upload size={14} /> {form.logo_url ? "Αλλαγή" : "Ανέβασμα"}</>}
              </label>
            </div>
            <AdminInput value={form.logo_url} onChange={e => setForm({...form, logo_url: e.target.value})} placeholder="Ή επικολλήστε URL" className="mt-2" />
          </Field>
          <Field label="Banner">
            <div className="flex items-center gap-3">
              {form.banner_url && (
                <div className="relative h-16 w-32 rounded overflow-hidden border border-[#262626]">
                  <img src={imgUrl(form.banner_url)} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setForm({...form, banner_url: ""})} className="absolute top-0.5 right-0.5 bg-black/60 rounded p-0.5 text-red-400"><X size={12} /></button>
                </div>
              )}
              <label className="admin-btn-ghost cursor-pointer flex items-center gap-1.5">
                <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                {uploadingBanner ? <RefreshCw size={14} className="animate-spin" /> : <><Upload size={14} /> {form.banner_url ? "Αλλαγή" : "Ανέβασμα"}</>}
              </label>
            </div>
            <AdminInput value={form.banner_url} onChange={e => setForm({...form, banner_url: e.target.value})} placeholder="Ή επικολλήστε URL" className="mt-2" />
          </Field>
        </FormModal>
      )}
    </div>
  );
};

export default SponsorsTab;
