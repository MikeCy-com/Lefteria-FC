import { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Edit2, Trash2, Upload, RefreshCw, X, Crown, Award, Medal, Heart, ExternalLink, Handshake, ChevronDown, ChevronUp, Image, Type, Gift, BarChart3, Images } from "lucide-react";
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
  { value: "first_team", label: "Πρωτη Ομαδα" },
  { value: "academy", label: "Ακαδημια" },
];

const BLOCK_TYPES = [
  { value: "text", label: "Κειμενο", icon: Type },
  { value: "banner", label: "Banner", icon: Image },
  { value: "offer", label: "Προσφορα", icon: Gift },
  { value: "highlight", label: "Στατιστικα", icon: BarChart3 },
  { value: "gallery", label: "Gallery", icon: Images },
];

const imgUrl = (url) => url ? (url.startsWith("http") ? url : `${process.env.REACT_APP_BACKEND_URL}${url}`) : null;

// ==================== CONTENT BLOCK EDITOR ====================
const ContentBlockEditor = ({ blocks, onChange }) => {
  const addBlock = (type) => {
    const newBlock = { id: `block_${Date.now()}`, type, title: "", content: "", image_url: "", link_url: "", link_text: "", items: [], images: [] };
    onChange([...blocks, newBlock]);
  };

  const updateBlock = (idx, field, value) => {
    const updated = [...blocks];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange(updated);
  };

  const removeBlock = (idx) => {
    onChange(blocks.filter((_, i) => i !== idx));
  };

  const moveBlock = (idx, dir) => {
    const arr = [...blocks];
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    onChange(arr);
  };

  const uploadBlockImage = async (idx, field) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await axios.post(`${API}/admin/sponsors/upload-logo`, fd, { headers: { ...getAuthHeaders(), "Content-Type": "multipart/form-data" } });
        updateBlock(idx, field, res.data.image_url);
      } catch { alert("Upload failed"); }
    };
    input.click();
  };

  const addHighlightItem = (idx) => {
    const block = blocks[idx];
    const items = [...(block.items || []), { value: "", label: "" }];
    updateBlock(idx, "items", items);
  };

  const updateHighlightItem = (blockIdx, itemIdx, field, value) => {
    const block = blocks[blockIdx];
    const items = [...(block.items || [])];
    items[itemIdx] = { ...items[itemIdx], [field]: value };
    updateBlock(blockIdx, "items", items);
  };

  const addGalleryImage = async (idx) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await axios.post(`${API}/admin/sponsors/upload-logo`, fd, { headers: { ...getAuthHeaders(), "Content-Type": "multipart/form-data" } });
        const block = blocks[idx];
        updateBlock(idx, "images", [...(block.images || []), res.data.image_url]);
      } catch { alert("Upload failed"); }
    };
    input.click();
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-500 mb-2">Προσθεσε περιεχομενο στη σελιδα του χορηγου:</p>

      {blocks.map((block, idx) => {
        const bt = BLOCK_TYPES.find(b => b.value === block.type);
        return (
          <div key={block.id || idx} className="bg-[#0a0a0a] border border-[#262626] rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {bt && <bt.icon size={14} className="text-[#F5A623]" />}
                <span className="text-xs text-zinc-300 font-medium">{bt?.label || block.type}</span>
                <span className="text-[9px] text-zinc-600">#{idx + 1}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => moveBlock(idx, -1)} disabled={idx === 0} className="admin-icon-btn p-1"><ChevronUp size={12} /></button>
                <button onClick={() => moveBlock(idx, 1)} disabled={idx === blocks.length - 1} className="admin-icon-btn p-1"><ChevronDown size={12} /></button>
                <button onClick={() => removeBlock(idx)} className="admin-icon-btn p-1 text-red-500/60 hover:text-red-400"><X size={12} /></button>
              </div>
            </div>

            {/* Title field for text, banner, offer, gallery */}
            {["text", "banner", "offer", "gallery"].includes(block.type) && (
              <AdminInput placeholder="Τιτλος (προαιρετικο)" value={block.title || ""} onChange={e => updateBlock(idx, "title", e.target.value)} className="mb-2" />
            )}

            {/* Content field for text, banner, offer */}
            {["text", "banner", "offer"].includes(block.type) && (
              <AdminTextarea rows={3} placeholder="Περιεχομενο..." value={block.content || ""} onChange={e => updateBlock(idx, "content", e.target.value)} className="mb-2" />
            )}

            {/* Image for banner */}
            {block.type === "banner" && (
              <div className="flex items-center gap-2 mb-2">
                {block.image_url && <img src={imgUrl(block.image_url)} alt="" className="h-12 w-20 object-cover rounded border border-[#262626]" />}
                <button onClick={() => uploadBlockImage(idx, "image_url")} className="admin-btn-ghost text-xs"><Upload size={12} /> Εικονα</button>
                {block.image_url && <AdminInput value={block.image_url} onChange={e => updateBlock(idx, "image_url", e.target.value)} placeholder="URL εικονας" className="flex-1" />}
              </div>
            )}

            {/* Link for banner, offer */}
            {["banner", "offer"].includes(block.type) && (
              <div className="grid grid-cols-2 gap-2">
                <AdminInput placeholder="Link URL" value={block.link_url || ""} onChange={e => updateBlock(idx, "link_url", e.target.value)} />
                {block.type === "offer" && <AdminInput placeholder="Κειμενο κουμπιου" value={block.link_text || ""} onChange={e => updateBlock(idx, "link_text", e.target.value)} />}
              </div>
            )}

            {/* Highlight items */}
            {block.type === "highlight" && (
              <div className="space-y-2">
                {(block.items || []).map((item, i) => (
                  <div key={i} className="grid grid-cols-2 gap-2">
                    <AdminInput placeholder="Τιμη (π.χ. 10+)" value={item.value} onChange={e => updateHighlightItem(idx, i, "value", e.target.value)} />
                    <AdminInput placeholder="Ετικετα" value={item.label} onChange={e => updateHighlightItem(idx, i, "label", e.target.value)} />
                  </div>
                ))}
                <button onClick={() => addHighlightItem(idx)} className="admin-btn-ghost text-xs"><Plus size={12} /> Προσθεσε στατιστικο</button>
              </div>
            )}

            {/* Gallery images */}
            {block.type === "gallery" && (
              <div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(block.images || []).map((img, i) => (
                    <div key={i} className="relative w-16 h-12 rounded overflow-hidden border border-[#262626]">
                      <img src={imgUrl(img)} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => { const imgs = [...(block.images || [])]; imgs.splice(i, 1); updateBlock(idx, "images", imgs); }} className="absolute top-0 right-0 bg-black/70 p-0.5"><X size={8} className="text-red-400" /></button>
                    </div>
                  ))}
                </div>
                <button onClick={() => addGalleryImage(idx)} className="admin-btn-ghost text-xs"><Upload size={12} /> Ανεβασε εικονα</button>
              </div>
            )}
          </div>
        );
      })}

      {/* Add block buttons */}
      <div className="flex flex-wrap gap-2 pt-2">
        {BLOCK_TYPES.map(bt => (
          <button key={bt.value} onClick={() => addBlock(bt.value)} className="admin-btn-ghost text-xs flex items-center gap-1.5">
            <bt.icon size={12} /> {bt.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// ==================== SPONSORS TAB ====================
const SponsorsTab = () => {
  const [sponsors, setSponsors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editSponsor, setEditSponsor] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [filterType, setFilterType] = useState("all");

  const emptyForm = { name: "", description: "", logo_url: "", banner_url: "", website: "", facebook: "", instagram: "", twitter: "", youtube: "", linkedin: "", level: "supporter", sponsor_type: "first_team", display_order: 0, content_blocks: [] };
  const [form, setForm] = useState(emptyForm);

  const fetchSponsors = () => {
    axios.get(`${API}/sponsors`, { headers: getAuthHeaders() }).then(res => setSponsors(res.data)).catch(() => {});
  };

  useEffect(() => { fetchSponsors(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditSponsor(null); setShowForm(true); };
  const openEdit = (s) => {
    setForm({
      name: s.name, description: s.description || "", logo_url: s.logo_url || "",
      banner_url: s.banner_url || "", website: s.website || "",
      facebook: s.facebook || "", instagram: s.instagram || "", twitter: s.twitter || "", youtube: s.youtube || "", linkedin: s.linkedin || "",
      level: s.level || "supporter",
      sponsor_type: s.sponsor_type || "first_team", display_order: s.display_order || 0,
      content_blocks: s.content_blocks || [],
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
    if (!window.confirm("Διαγραφη χορηγου;")) return;
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
    } catch { alert("Upload failed"); }
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
    } catch { alert("Upload failed"); }
    finally { setUploadingBanner(false); }
  };

  const filtered = filterType === "all" ? sponsors : sponsors.filter(s => s.sponsor_type === filterType);
  const sorted = [...filtered].sort((a, b) => (a.display_order || 999) - (b.display_order || 999));

  return (
    <div data-testid="sponsors-tab">
      <TabHeader title="Χορηγοι" count={sponsors.length}>
        <div className="flex items-center gap-2">
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-[#1a1a1a] border border-[#262626] text-white text-sm rounded-lg px-3 py-2">
            <option value="all">Ολοι</option>
            <option value="first_team">Πρωτη Ομαδα</option>
            <option value="academy">Ακαδημια</option>
          </select>
          <button onClick={openCreate} className="admin-btn-primary" data-testid="add-sponsor-btn"><Plus size={14} /> Νεος Χορηγος</button>
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
                        <span className="text-[10px] text-zinc-500">{s.sponsor_type === "first_team" ? "Α' Ομαδα" : "Ακαδημια"}</span>
                        {(s.content_blocks?.length || 0) > 0 && <span className="text-[9px] text-emerald-500">{s.content_blocks.length} blocks</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(s)} className="admin-icon-btn"><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(s.id)} className="admin-icon-btn text-red-500/60 hover:text-red-400"><Trash2 size={14} /></button>
                  </div>
                </div>
                {s.description && <p className="text-zinc-400 text-xs line-clamp-2">{s.description}</p>}
              </div>
            </div>
          );
        })}
        {sorted.length === 0 && <EmptyState icon={Handshake} text="Δεν υπαρχουν χορηγοι" />}
      </div>

      {showForm && (
        <FormModal title={editSponsor ? "Επεξεργασια Χορηγου" : "Νεος Χορηγος"} onClose={() => setShowForm(false)} onSave={handleSave} saving={saving}>
          <Field label="Ονομα *"><AdminInput placeholder="Ονομα χορηγου" value={form.name} onChange={e => setForm({...form, name: e.target.value})} data-testid="sponsor-name-input" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Επιπεδο">
              <AdminSelect value={form.level} onChange={e => setForm({...form, level: e.target.value})}>
                {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </AdminSelect>
            </Field>
            <Field label="Τυπος">
              <AdminSelect value={form.sponsor_type} onChange={e => setForm({...form, sponsor_type: e.target.value})}>
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </AdminSelect>
            </Field>
          </div>
          <Field label="Περιγραφη"><AdminTextarea rows={3} placeholder="Περιγραφη χορηγου..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></Field>
          <Field label="Ιστοσελιδα"><AdminInput placeholder="www.example.com" value={form.website} onChange={e => setForm({...form, website: e.target.value})} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Σειρα Εμφανισης"><AdminInput type="number" placeholder="1, 2, 3..." value={form.display_order} onChange={e => setForm({...form, display_order: e.target.value})} /></Field>
            <div />
          </div>
          <Field label="Logo">
            <div className="flex items-center gap-3">
              {form.logo_url && (
                <div className="relative h-14 w-20 rounded overflow-hidden border border-[#262626] bg-white/5 flex items-center justify-center">
                  <img src={imgUrl(form.logo_url)} alt="" className="max-w-full max-h-full object-contain p-1" />
                  <button type="button" onClick={() => setForm({...form, logo_url: ""})} className="absolute top-0.5 right-0.5 bg-black/60 rounded p-0.5 text-red-400"><X size={10} /></button>
                </div>
              )}
              <label className="admin-btn-ghost cursor-pointer flex items-center gap-1.5">
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                {uploadingLogo ? <RefreshCw size={14} className="animate-spin" /> : <><Upload size={14} /> {form.logo_url ? "Αλλαγη" : "Ανεβασμα"}</>}
              </label>
            </div>
          </Field>
          <Field label="Banner">
            <div className="flex items-center gap-3">
              {form.banner_url && (
                <div className="relative h-14 w-28 rounded overflow-hidden border border-[#262626]">
                  <img src={imgUrl(form.banner_url)} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setForm({...form, banner_url: ""})} className="absolute top-0.5 right-0.5 bg-black/60 rounded p-0.5 text-red-400"><X size={10} /></button>
                </div>
              )}
              <label className="admin-btn-ghost cursor-pointer flex items-center gap-1.5">
                <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                {uploadingBanner ? <RefreshCw size={14} className="animate-spin" /> : <><Upload size={14} /> {form.banner_url ? "Αλλαγη" : "Ανεβασμα"}</>}
              </label>
            </div>
          </Field>

          {/* Social Media */}
          <div className="border-t border-[#262626] pt-4 mt-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Social Media Χορηγου</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Facebook"><AdminInput placeholder="https://facebook.com/..." value={form.facebook} onChange={e => setForm({...form, facebook: e.target.value})} data-testid="sponsor-facebook" /></Field>
              <Field label="Instagram"><AdminInput placeholder="https://instagram.com/..." value={form.instagram} onChange={e => setForm({...form, instagram: e.target.value})} data-testid="sponsor-instagram" /></Field>
              <Field label="Twitter / X"><AdminInput placeholder="https://twitter.com/..." value={form.twitter} onChange={e => setForm({...form, twitter: e.target.value})} /></Field>
              <Field label="YouTube"><AdminInput placeholder="https://youtube.com/..." value={form.youtube} onChange={e => setForm({...form, youtube: e.target.value})} /></Field>
              <Field label="LinkedIn"><AdminInput placeholder="https://linkedin.com/..." value={form.linkedin} onChange={e => setForm({...form, linkedin: e.target.value})} /></Field>
            </div>
          </div>

          {/* Content Blocks Editor */}
          <div className="border-t border-[#262626] pt-4 mt-4">
            <Field label="Περιεχομενο Σελιδας Χορηγου">
              <ContentBlockEditor blocks={form.content_blocks || []} onChange={(blocks) => setForm({...form, content_blocks: blocks})} />
            </Field>
          </div>
        </FormModal>
      )}
    </div>
  );
};

export default SponsorsTab;
