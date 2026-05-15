import React, { useState, useEffect } from "react";
import axios from "axios";
import { Trophy, Download, Trash2, Settings, RefreshCw, CheckCircle2, XCircle, MessageCircle, Phone, Mail } from "lucide-react";
import { API, getAuthHeaders, stripGreekAccents } from "./shared";

const STATUS_OPTIONS = [
  { value: "new", label: "Νέο", className: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  { value: "contacted", label: "Επικοινωνία", className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  { value: "approved", label: "Εγκρίθηκε", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  { value: "rejected", label: "Απορρίφθηκε", className: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" },
];

const POSITION_LABELS = { Goalkeeper: "Τερματοφύλακας", Defender: "Αμυντικός", Midfielder: "Μέσος", Forward: "Επιθετικός" };
const FOOT_LABELS = { Right: "Δεξί", Left: "Αριστερό", Both: "Και τα δύο" };

const fmtDate = (iso) => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("el-GR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
};

export default function TrialsTab() {
  const [trials, setTrials] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [trialsRes, settingsRes] = await Promise.all([
        axios.get(`${API}/admin/trials`, { headers: getAuthHeaders() }),
        axios.get(`${API}/admin/trials/settings`, { headers: getAuthHeaders() }),
      ]);
      setTrials(trialsRes.data || []);
      setSettings(settingsRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = filter === "all" ? trials : trials.filter((t) => t.status === filter);
  const counts = STATUS_OPTIONS.reduce((acc, s) => ({ ...acc, [s.value]: trials.filter((t) => t.status === s.value).length }), {});

  const updateStatus = async (id, status) => {
    await axios.patch(`${API}/admin/trials/${id}`, { status }, { headers: getAuthHeaders() });
    setTrials((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    if (selected?.id === id) setSelected({ ...selected, status });
  };

  const deleteTrial = async (id) => {
    if (!window.confirm("Διαγραφή της αίτησης;")) return;
    await axios.delete(`${API}/admin/trials/${id}`, { headers: getAuthHeaders() });
    setTrials((prev) => prev.filter((t) => t.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const exportCsv = () => {
    const token = localStorage.getItem("token");
    fetch(`${API}/admin/trials/export.csv`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `trials-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      });
  };

  return (
    <div className="space-y-5" data-testid="trials-tab">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#F5A623]/15 border border-[#F5A623]/30 flex items-center justify-center">
            <Trophy size={18} className="text-[#F5A623]" />
          </div>
          <div>
            <h2 className="font-['Bebas_Neue'] text-2xl text-white tracking-wide">{stripGreekAccents("Δοκιμαστικά Πρώτης Ομάδας")}</h2>
            <p className="text-xs text-zinc-500">{trials.length} αιτήσεις · Φόρμα: {settings?.open ? <span className="text-emerald-400">Ανοιχτή</span> : <span className="text-rose-400">Κλειστή</span>}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowSettings(true)} className="admin-btn-ghost" data-testid="trials-settings-btn">
            <Settings size={14} /> Ρυθμίσεις
          </button>
          <button onClick={exportCsv} className="admin-btn-ghost" data-testid="trials-export-csv-btn">
            <Download size={14} /> CSV
          </button>
          <button onClick={fetchAll} className="admin-btn-ghost" data-testid="trials-refresh-btn">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        <FilterPill active={filter === "all"} onClick={() => setFilter("all")} label={`Όλες (${trials.length})`} testId="trials-filter-all" />
        {STATUS_OPTIONS.map((s) => (
          <FilterPill
            key={s.value}
            active={filter === s.value}
            onClick={() => setFilter(s.value)}
            label={`${s.label} (${counts[s.value] || 0})`}
            testId={`trials-filter-${s.value}`}
          />
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-10 text-zinc-500">Φόρτωση...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl p-10 text-center text-zinc-500" data-testid="trials-empty">
          Δεν υπάρχουν αιτήσεις σε αυτή την κατηγορία.
        </div>
      ) : (
        <div className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0f0f0f] text-zinc-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3">Ημερομηνία</th>
                  <th className="text-left px-4 py-3">Ονοματεπώνυμο</th>
                  <th className="text-left px-4 py-3">Θέση</th>
                  <th className="text-left px-4 py-3">Τηλέφωνο</th>
                  <th className="text-left px-4 py-3">Κατάσταση</th>
                  <th className="text-right px-4 py-3">Ενέργειες</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const status = STATUS_OPTIONS.find((s) => s.value === t.status) || STATUS_OPTIONS[0];
                  return (
                    <tr key={t.id} className="border-t border-[#1e1e1e] hover:bg-[#0f0f0f] transition-colors" data-testid={`trial-row-${t.id}`}>
                      <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">{fmtDate(t.created_at)}</td>
                      <td className="px-4 py-3 text-white font-medium">{t.full_name}</td>
                      <td className="px-4 py-3 text-zinc-300">{POSITION_LABELS[t.position] || t.position}</td>
                      <td className="px-4 py-3 text-zinc-300 whitespace-nowrap">{t.phone}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex text-xs px-2 py-1 rounded-md border ${status.className}`}>{status.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => setSelected(t)} className="admin-btn-ghost text-xs" data-testid={`trial-view-${t.id}`}>
                            Προβολή
                          </button>
                          <button onClick={() => deleteTrial(t.id)} className="text-rose-400 hover:text-rose-300 p-1.5 rounded hover:bg-rose-500/10" data-testid={`trial-delete-${t.id}`}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <DetailModal
          trial={selected}
          onClose={() => setSelected(null)}
          onStatusChange={(s) => updateStatus(selected.id, s)}
          onDelete={() => deleteTrial(selected.id)}
        />
      )}

      {/* Settings modal */}
      {showSettings && settings && (
        <SettingsModal
          settings={settings}
          onClose={() => setShowSettings(false)}
          onSaved={(s) => { setSettings(s); setShowSettings(false); }}
        />
      )}
    </div>
  );
}

const FilterPill = ({ active, onClick, label, testId }) => (
  <button
    onClick={onClick}
    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
      active ? "bg-[#F5A623]/15 text-[#F5A623] border-[#F5A623]/30" : "bg-transparent text-zinc-400 border-[#2a2a2a] hover:text-zinc-200"
    }`}
    data-testid={testId}
  >
    {label}
  </button>
);

const DetailModal = ({ trial, onClose, onStatusChange, onDelete }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose} data-testid="trial-detail-modal">
    <div className="bg-[#161616] border border-[#2a2a2a] rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
      <div className="flex justify-between items-center px-6 py-4 border-b border-[#2a2a2a]">
        <h2 className="font-['Bebas_Neue'] text-2xl text-white tracking-wide">{trial.full_name}</h2>
        <button onClick={onClose} className="text-zinc-400 hover:text-white" data-testid="trial-detail-close">
          <XCircle size={20} />
        </button>
      </div>

      <div className="p-6 space-y-5">
        {/* Status selector */}
        <div>
          <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">Κατάσταση</label>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s.value}
                onClick={() => onStatusChange(s.value)}
                className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                  trial.status === s.value ? s.className : "bg-transparent text-zinc-500 border-[#2a2a2a] hover:text-zinc-300"
                }`}
                data-testid={`trial-status-${s.value}`}
              >
                {trial.status === s.value && <CheckCircle2 size={12} className="inline mr-1" />}
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contact quick actions */}
        <div className="flex flex-wrap gap-2">
          <a href={`tel:${trial.phone}`} className="admin-btn-ghost text-xs" data-testid="trial-call-link">
            <Phone size={12} /> {trial.phone}
          </a>
          <a href={`mailto:${trial.email}`} className="admin-btn-ghost text-xs" data-testid="trial-email-link">
            <Mail size={12} /> {trial.email}
          </a>
          <a
            href={`https://wa.me/${(trial.phone || "").replace(/\D/g, "")}`}
            target="_blank"
            rel="noreferrer"
            className="admin-btn-ghost text-xs"
            data-testid="trial-whatsapp-link"
          >
            <MessageCircle size={12} /> WhatsApp
          </a>
        </div>

        {/* Details grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Info label="Ημερομηνία Γέννησης" value={trial.date_of_birth} />
          <Info label="Θέση" value={POSITION_LABELS[trial.position] || trial.position} />
          <Info label="Προτιμώμενο Πόδι" value={FOOT_LABELS[trial.preferred_foot] || trial.preferred_foot} />
          <Info label="Προηγούμενος Σύλλογος" value={trial.previous_club || "—"} />
          <Info label="Χρόνια" value={trial.years_played || "—"} />
          <Info label="Ύψος" value={trial.height_cm ? `${trial.height_cm} cm` : "—"} />
          <Info label="Βάρος" value={trial.weight_kg ? `${trial.weight_kg} kg` : "—"} />
          <Info label="Υποβλήθηκε" value={fmtDate(trial.created_at)} />
        </div>

        {trial.notes && (
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5">Σημειώσεις Αιτούντος</div>
            <div className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-md p-3 text-zinc-200 text-sm whitespace-pre-wrap">{trial.notes}</div>
          </div>
        )}

        <div className="pt-3 border-t border-[#1e1e1e]">
          <button onClick={onDelete} className="text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1.5" data-testid="trial-detail-delete-btn">
            <Trash2 size={14} /> Διαγραφή αίτησης
          </button>
        </div>
      </div>
    </div>
  </div>
);

const Info = ({ label, value }) => (
  <div>
    <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{label}</div>
    <div className="text-zinc-200 text-sm">{value}</div>
  </div>
);

const SettingsModal = ({ settings, onClose, onSaved }) => {
  const [form, setForm] = useState({
    open: settings.open || false,
    headline: settings.headline || "",
    subtitle: settings.subtitle || "",
    button_text: settings.button_text || "",
    closed_message: settings.closed_message || "",
  });
  const [saving, setSaving] = useState(false);
  const upd = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/admin/trials/settings`, form, { headers: getAuthHeaders() });
      onSaved(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose} data-testid="trial-settings-modal">
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-lg w-full max-w-xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#2a2a2a]">
          <h2 className="font-['Bebas_Neue'] text-2xl text-white tracking-wide">Ρυθμίσεις Δοκιμαστικών</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white" data-testid="trial-settings-close">
            <XCircle size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Open toggle */}
          <div className="flex items-center justify-between bg-[#0a0a0a] border border-[#1e1e1e] rounded-md p-4">
            <div>
              <div className="text-white font-medium">Ανοιχτή Φόρμα</div>
              <div className="text-xs text-zinc-500">Όταν είναι ενεργή, εμφανίζεται στην αρχική σελίδα και δέχεται αιτήσεις.</div>
            </div>
            <button
              onClick={() => setForm((f) => ({ ...f, open: !f.open }))}
              className={`relative w-12 h-7 rounded-full transition-colors ${form.open ? "bg-emerald-500" : "bg-zinc-700"}`}
              data-testid="trial-settings-open-toggle"
            >
              <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full transition-transform ${form.open ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>

          <Field label="Επικεφαλίδα">
            <input value={form.headline} onChange={upd("headline")} data-testid="trial-settings-headline" />
          </Field>
          <Field label="Υπότιτλος">
            <textarea rows={3} value={form.subtitle} onChange={upd("subtitle")} data-testid="trial-settings-subtitle" />
          </Field>
          <Field label="Κείμενο Κουμπιού">
            <input value={form.button_text} onChange={upd("button_text")} data-testid="trial-settings-button-text" />
          </Field>
          <Field label="Μήνυμα Όταν είναι Κλειστή">
            <textarea rows={2} value={form.closed_message} onChange={upd("closed_message")} data-testid="trial-settings-closed-message" />
          </Field>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-[#2a2a2a]">
          <button onClick={save} disabled={saving} className="admin-btn-primary flex-1" data-testid="trial-settings-save-btn">
            {saving ? "Αποθήκευση..." : "Αποθήκευση"}
          </button>
          <button onClick={onClose} className="admin-btn-ghost flex-1" data-testid="trial-settings-cancel-btn">Ακύρωση</button>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, children }) => (
  <label className="block">
    <span className="text-xs text-zinc-400 uppercase tracking-wider mb-1.5 block">{label}</span>
    {children}
  </label>
);
