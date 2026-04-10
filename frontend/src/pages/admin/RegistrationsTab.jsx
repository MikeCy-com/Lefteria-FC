import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { ChevronRight, Check, X, Trash2, ClipboardList, Clock } from "lucide-react";
import { API, getAuthHeaders, TabHeader, EmptyState } from "./shared";

const RegistrationsTab = ({ academyGroups, onRefresh }) => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReg, setSelectedReg] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [assignGroupId, setAssignGroupId] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchRegistrations = useCallback(async () => {
    try {
      const headers = getAuthHeaders();
      const url = filterStatus === "all" ? `${API}/admin/registrations` : `${API}/admin/registrations?status=${filterStatus}`;
      const res = await axios.get(url, { headers });
      setRegistrations(res.data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [filterStatus]);

  useEffect(() => { fetchRegistrations(); }, [fetchRegistrations]);

  const handleStatus = async (regId, status) => {
    setProcessing(true);
    try {
      const headers = getAuthHeaders();
      const body = { status, admin_notes: adminNotes };
      if (status === "approved" && assignGroupId) body.assigned_group_id = assignGroupId;
      await axios.put(`${API}/admin/registrations/${regId}/status`, body, { headers });
      fetchRegistrations(); setSelectedReg(null); onRefresh();
    } catch (e) { alert(e.response?.data?.detail || "Σφάλμα"); } finally { setProcessing(false); }
  };

  const handleDelete = async (regId) => {
    if (!window.confirm("Διαγραφή εγγραφής;")) return;
    try {
      await axios.delete(`${API}/admin/registrations/${regId}`, { headers: getAuthHeaders() });
      fetchRegistrations(); if (selectedReg?.id === regId) setSelectedReg(null);
    } catch (e) { alert("Σφάλμα"); }
  };

  const statusBadge = (s) => {
    const map = { pending: "admin-badge admin-badge-gold", approved: "admin-badge admin-badge-green", rejected: "admin-badge admin-badge-default" };
    const labels = { pending: "Εκκρεμεί", approved: "Εγκρίθηκε", rejected: "Απορρίφθηκε" };
    return <span className={map[s] || map.pending}>{labels[s] || s}</span>;
  };

  if (selectedReg) {
    const r = selectedReg;
    return (
      <div data-testid="registration-detail-view">
        <button onClick={() => setSelectedReg(null)} className="admin-btn-ghost text-sm mb-4" data-testid="back-to-registrations">
          <ChevronRight size={14} className="rotate-180" /> Πίσω στις εγγραφές
        </button>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-['Bebas_Neue'] text-3xl text-white">{r.player_first_name} {r.player_last_name}</h2>
            <div className="flex items-center gap-3 mt-1">{statusBadge(r.status)} <span className="text-zinc-400 text-sm">{new Date(r.created_at).toLocaleDateString("el-GR")}</span></div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="admin-card p-5">
            <h3 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">Στοιχεια Παικτη</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-zinc-400">Ημ. Γέννησης</span><span className="text-white">{r.player_dob}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Φύλο</span><span className="text-white">{r.player_gender === "male" ? "Αγόρι" : "Κορίτσι"}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Διεύθυνση</span><span className="text-white">{r.player_address}, {r.player_city} {r.player_postal_code}</span></div>
            </div>
          </div>
          <div className="admin-card p-5">
            <h3 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">Γονεας / Κηδεμονας</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-zinc-400">Όνομα</span><span className="text-white">{r.parent_name}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Σχέση</span><span className="text-white">{r.parent_relationship}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Τηλ.</span><span className="text-white">{r.parent_phone}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Email</span><span className="text-white">{r.parent_email}</span></div>
            </div>
          </div>
          <div className="admin-card p-5">
            <h3 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">Εκτακτη Αναγκη</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-zinc-400">Όνομα</span><span className="text-white">{r.emergency_name}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Τηλ.</span><span className="text-white">{r.emergency_phone}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Σχέση</span><span className="text-white">{r.emergency_relationship || "-"}</span></div>
            </div>
          </div>
          <div className="admin-card p-5">
            <h3 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">Ιατρικα</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-zinc-400">Αλλεργίες</span><span className="text-white">{r.has_allergies ? r.allergies_details || "Ναι" : "Όχι"}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Παθήσεις</span><span className="text-white">{r.has_conditions ? r.conditions_details || "Ναι" : "Όχι"}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Φάρμακα</span><span className="text-white">{r.has_medication ? r.medication_details || "Ναι" : "Όχι"}</span></div>
            </div>
          </div>
          <div className="admin-card p-5">
            <h3 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">Συγκαταθεσεις</h3>
            <div className="space-y-1.5 text-sm">
              {[
                ["Συμμετοχή", r.consent_participation],
                ["Ιατρική Εξ.", r.consent_medical_auth],
                ["GDPR", r.consent_gdpr],
                ["Οπτικοακ. Υλικό", r.consent_media],
                ["Ευθύνη", r.consent_liability],
                ["Οικον. Όροι", r.consent_financial],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between"><span className="text-zinc-400">{l}</span><span className={v ? "text-green-400" : v === false ? "text-red-400" : "text-zinc-600"}>{v === true ? "Ναι" : v === false ? "Όχι" : "-"}</span></div>
              ))}
            </div>
          </div>
          <div className="admin-card p-5">
            <h3 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">Πληρωμη & Υπογραφη</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-zinc-400">Πληρωμή</span><span className="text-white">{r.payment_method === "cash" ? "Μετρητά" : r.payment_method === "card" ? "Κάρτα" : "Μεταφορά"}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Ημ/νία</span><span className="text-white">{r.signature_date}</span></div>
            </div>
            {r.signature_data && (
              <div className="mt-3 border border-[#262626] rounded-lg p-2 bg-[#0d0d0d]">
                <img src={r.signature_data} alt="Υπογραφή" className="h-16 mx-auto" />
              </div>
            )}
          </div>
        </div>

        {r.status === "pending" && (
          <div className="admin-card p-5 mt-4" data-testid="admin-actions">
            <h3 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">Ενεργειες</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-300 mb-1.5">Ανάθεση σε Ομάδα Ακαδημίας</label>
                <select className="admin-input" value={assignGroupId} onChange={e => setAssignGroupId(e.target.value)} data-testid="assign-group-select">
                  <option value="">-- Επιλέξτε ομάδα --</option>
                  {academyGroups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.age_range})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-zinc-300 mb-1.5">Σημειώσεις</label>
                <textarea className="admin-input" rows={2} value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="Σημειώσεις διαχειριστή..." data-testid="admin-notes" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => handleStatus(r.id, "approved")} disabled={processing} className="admin-btn-primary flex-1" data-testid="approve-btn">
                  <Check size={14} /> Έγκριση
                </button>
                <button onClick={() => handleStatus(r.id, "rejected")} disabled={processing} className="admin-btn-ghost flex-1 border-red-500/30 text-red-400 hover:text-red-300 hover:border-red-500/50" data-testid="reject-btn">
                  <X size={14} /> Απόρριψη
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div data-testid="admin-registrations-tab">
      <TabHeader title="Εγγραφές Ακαδημίας" count={registrations.length}>
        <div className="flex gap-2">
          {["all", "pending", "approved", "rejected"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${filterStatus === s ? 'bg-[#F5A623]/15 text-[#F5A623]' : 'text-zinc-400 hover:text-white'}`}
              data-testid={`filter-${s}`}>
              {s === "all" ? "Όλες" : s === "pending" ? "Εκκρεμεί" : s === "approved" ? "Εγκρίθηκαν" : "Απορρίφθηκαν"}
            </button>
          ))}
        </div>
      </TabHeader>
      {loading ? (
        <div className="text-center py-12 text-zinc-500">Φόρτωση...</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table" data-testid="registrations-table">
            <thead><tr><th>Παίκτης</th><th>Γονέας</th><th>Τηλ.</th><th>Ημ/νία</th><th>Κατάσταση</th><th></th></tr></thead>
            <tbody>
              {registrations.map(r => (
                <tr key={r.id} className="cursor-pointer" onClick={() => { setSelectedReg(r); setAssignGroupId(r.assigned_group_id || ""); setAdminNotes(r.admin_notes || ""); }}>
                  <td className="font-medium text-white">{r.player_first_name} {r.player_last_name}</td>
                  <td className="text-zinc-300">{r.parent_name}</td>
                  <td className="text-zinc-300">{r.parent_phone}</td>
                  <td className="text-zinc-400 text-sm">{new Date(r.created_at).toLocaleDateString("el-GR")}</td>
                  <td>{statusBadge(r.status)}</td>
                  <td>
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      <button onClick={() => handleDelete(r.id)} className="admin-icon-btn text-red-500/60 hover:text-red-400"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {registrations.length === 0 && <tr><td colSpan={6}><EmptyState icon={ClipboardList} text="Δεν υπάρχουν εγγραφές" /></td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RegistrationsTab;
