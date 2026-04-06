import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  MapPin, Plus, X, Save, RefreshCw, Calendar, Clock, ChevronLeft,
  ChevronRight, Edit2, Trash2, Check, Sun, Moon, Lightbulb, Users,
  Building2, Layers
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const FACILITY_TYPES = [
  { value: "field", label: "Γήπεδο" },
  { value: "gym", label: "Γυμναστήριο" },
  { value: "pool", label: "Πισίνα" },
  { value: "indoor", label: "Κλειστό" },
  { value: "other", label: "Άλλο" },
];

const SURFACE_TYPES = [
  { value: "grass", label: "Χλοοτάπητας" },
  { value: "turf", label: "Συνθετικός" },
  { value: "indoor", label: "Κλειστό δάπεδο" },
  { value: "clay", label: "Χώμα" },
];

const BOOKING_TYPES = [
  { value: "training", label: "Προπόνηση", color: "bg-blue-500" },
  { value: "match", label: "Αγώνας", color: "bg-emerald-500" },
  { value: "event", label: "Εκδήλωση", color: "bg-purple-500" },
  { value: "maintenance", label: "Συντήρηση", color: "bg-orange-500" },
];

const DAYS_GR = ["Δευ", "Τρι", "Τετ", "Πεμ", "Παρ", "Σαβ", "Κυρ"];
const MONTHS_GR = ["Ιανουάριος", "Φεβρουάριος", "Μάρτιος", "Απρίλιος", "Μάιος", "Ιούνιος",
  "Ιούλιος", "Αύγουστος", "Σεπτέμβριος", "Οκτώβριος", "Νοέμβριος", "Δεκέμβριος"];

const ResourceManagement = ({ teams = [], academyGroups = [] }) => {
  const [facilities, setFacilities] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("facilities"); // facilities, calendar, availability
  const [showFacilityModal, setShowFacilityModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [editingFacility, setEditingFacility] = useState(null);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [calMonth, setCalMonth] = useState(new Date());
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [saving, setSaving] = useState(false);

  const [facForm, setFacForm] = useState({
    name: "", type: "field", surface: "grass", capacity: "",
    dimensions: "", has_lighting: false, has_changing_rooms: false,
    address: "", notes: "",
  });

  const [bookForm, setBookForm] = useState({
    facility_id: "", facility_name: "", title: "", description: "",
    booking_type: "training", team_id: "", academy_group_id: "",
    team_name: "", date: "", start_time: "", end_time: "",
    recurring: false, recurring_until: "", notes: "",
  });

  const fetchData = useCallback(async () => {
    try {
      const monthStr = `${calMonth.getFullYear()}-${String(calMonth.getMonth() + 1).padStart(2, "0")}`;
      const [facRes, bookRes] = await Promise.all([
        axios.get(`${API}/admin/facilities`, { headers: getAuthHeaders() }),
        axios.get(`${API}/admin/bookings`, { headers: getAuthHeaders(), params: { month: monthStr } }),
      ]);
      setFacilities(facRes.data);
      setBookings(bookRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [calMonth]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchAvailability = useCallback(async () => {
    if (!selectedFacility || !selectedDate) return;
    try {
      const res = await axios.get(`${API}/admin/facilities/${selectedFacility.id}/availability`, {
        headers: getAuthHeaders(), params: { date: selectedDate },
      });
      setAvailabilitySlots(res.data.slots || []);
    } catch (e) {
      console.error(e);
    }
  }, [selectedFacility, selectedDate]);

  useEffect(() => { if (view === "availability") fetchAvailability(); }, [view, fetchAvailability]);

  // Facility CRUD
  const handleSaveFacility = async () => {
    if (!facForm.name) return;
    setSaving(true);
    try {
      const payload = { ...facForm, capacity: parseInt(facForm.capacity) || 0 };
      if (editingFacility) {
        await axios.put(`${API}/admin/facilities/${editingFacility.id}`, payload, { headers: getAuthHeaders() });
      } else {
        await axios.post(`${API}/admin/facilities`, payload, { headers: getAuthHeaders() });
      }
      setShowFacilityModal(false);
      setEditingFacility(null);
      resetFacForm();
      fetchData();
    } catch (e) {
      alert(e.response?.data?.detail || "Σφάλμα");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFacility = async (id) => {
    if (!window.confirm("Διαγραφή εγκατάστασης;")) return;
    try {
      await axios.delete(`${API}/admin/facilities/${id}`, { headers: getAuthHeaders() });
      fetchData();
    } catch (e) {
      alert("Σφάλμα");
    }
  };

  // Booking CRUD
  const handleSaveBooking = async () => {
    if (!bookForm.facility_id || !bookForm.date || !bookForm.start_time || !bookForm.end_time) {
      alert("Συμπληρώστε όλα τα υποχρεωτικά πεδία");
      return;
    }
    setSaving(true);
    try {
      await axios.post(`${API}/admin/bookings`, bookForm, { headers: getAuthHeaders() });
      setShowBookingModal(false);
      resetBookForm();
      fetchData();
      if (view === "availability") fetchAvailability();
    } catch (e) {
      alert(e.response?.data?.detail || "Σφάλμα");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelBooking = async (id) => {
    if (!window.confirm("Ακύρωση κράτησης;")) return;
    try {
      await axios.delete(`${API}/admin/bookings/${id}`, { headers: getAuthHeaders() });
      fetchData();
      if (view === "availability") fetchAvailability();
    } catch (e) {
      alert("Σφάλμα");
    }
  };

  const resetFacForm = () => setFacForm({ name: "", type: "field", surface: "grass", capacity: "", dimensions: "", has_lighting: false, has_changing_rooms: false, address: "", notes: "" });
  const resetBookForm = () => setBookForm({ facility_id: "", facility_name: "", title: "", description: "", booking_type: "training", team_id: "", academy_group_id: "", team_name: "", date: "", start_time: "", end_time: "", recurring: false, recurring_until: "", notes: "" });

  const openEditFacility = (fac) => {
    setFacForm({ ...fac, capacity: String(fac.capacity || "") });
    setEditingFacility(fac);
    setShowFacilityModal(true);
  };

  const openCreateFacility = () => {
    resetFacForm();
    setEditingFacility(null);
    setShowFacilityModal(true);
  };

  const openCreateBooking = (date = "", facilityId = "") => {
    resetBookForm();
    const fac = facilities.find(f => f.id === facilityId);
    setBookForm(prev => ({ ...prev, date, facility_id: facilityId, facility_name: fac?.name || "" }));
    setShowBookingModal(true);
  };

  const getBookingColor = (type) => BOOKING_TYPES.find(bt => bt.value === type)?.color || "bg-zinc-500";
  const getBookingLabel = (type) => BOOKING_TYPES.find(bt => bt.value === type)?.label || type;
  const getTypeLabel = (type) => FACILITY_TYPES.find(ft => ft.value === type)?.label || type;

  // Calendar helpers
  const calYear = calMonth.getFullYear();
  const calMon = calMonth.getMonth();
  const daysInMonth = new Date(calYear, calMon + 1, 0).getDate();
  const firstDay = (new Date(calYear, calMon, 1).getDay() + 6) % 7; // Mon=0
  const prevMonth = () => setCalMonth(new Date(calYear, calMon - 1, 1));
  const nextMonth = () => setCalMonth(new Date(calYear, calMon + 1, 1));

  const getBookingsForDay = (day) => {
    const dateStr = `${calYear}-${String(calMon + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return bookings.filter(b => b.date === dateStr);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <RefreshCw size={24} className="animate-spin text-[#F5A623]" />
    </div>
  );

  return (
    <div data-testid="resource-management">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h2 className="font-['Bebas_Neue'] text-3xl text-white tracking-wide">Γήπεδα & Εγκαταστάσεις</h2>
          <span className="text-sm text-zinc-400">{facilities.length} εγκαταστάσεις</span>
        </div>
        <div className="flex gap-2 items-center">
          {["facilities", "calendar", "availability"].map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${view === v ? 'bg-[#F5A623] text-black' : 'bg-[#1a1a1a] text-zinc-400 hover:text-white border border-[#262626]'}`}
              data-testid={`res-view-${v}`}>
              {v === "facilities" ? "Εγκαταστάσεις" : v === "calendar" ? "Ημερολόγιο" : "Διαθεσιμότητα"}
            </button>
          ))}
        </div>
      </div>

      {/* Facilities List */}
      {view === "facilities" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={openCreateFacility} className="admin-btn-primary" data-testid="add-facility-btn">
              <Plus size={14} /> Νέα Εγκατάσταση
            </button>
          </div>
          {facilities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
              <MapPin size={48} strokeWidth={1} />
              <p className="mt-3">Δεν υπάρχουν εγκαταστάσεις</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {facilities.map(fac => (
                <div key={fac.id} className="bg-[#121212] border border-[#262626] rounded-xl p-5 hover:border-[#F5A623]/30 transition-colors" data-testid={`facility-card-${fac.id}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-white font-medium text-lg">{fac.name}</h3>
                      <span className="text-xs text-zinc-500">{getTypeLabel(fac.type)}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEditFacility(fac)} className="text-zinc-400 hover:text-white p-1" data-testid={`edit-fac-${fac.id}`}><Edit2 size={14} /></button>
                      <button onClick={() => handleDeleteFacility(fac.id)} className="text-red-400 hover:text-red-300 p-1" data-testid={`del-fac-${fac.id}`}><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    {fac.surface && (
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Layers size={13} /> {SURFACE_TYPES.find(s => s.value === fac.surface)?.label || fac.surface}
                      </div>
                    )}
                    {fac.dimensions && (
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Building2 size={13} /> {fac.dimensions}
                      </div>
                    )}
                    {fac.capacity > 0 && (
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Users size={13} /> Χωρητικότητα: {fac.capacity}
                      </div>
                    )}
                    <div className="flex gap-3 mt-2">
                      {fac.has_lighting && (
                        <span className="text-xs text-yellow-400 flex items-center gap-1"><Lightbulb size={11} /> Φωτισμός</span>
                      )}
                      {fac.has_changing_rooms && (
                        <span className="text-xs text-blue-400 flex items-center gap-1"><Building2 size={11} /> Αποδυτήρια</span>
                      )}
                    </div>
                    {fac.address && <p className="text-xs text-zinc-500 mt-2"><MapPin size={11} className="inline mr-1" />{fac.address}</p>}
                  </div>
                  <button onClick={() => { setSelectedFacility(fac); setView("availability"); }} className="mt-3 text-xs text-[#F5A623] hover:text-[#e09620]" data-testid={`avail-fac-${fac.id}`}>
                    Προβολή διαθεσιμότητας →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Calendar View */}
      {view === "calendar" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button onClick={prevMonth} className="admin-btn-ghost p-2"><ChevronLeft size={16} /></button>
              <span className="font-['Bebas_Neue'] text-xl text-white">{MONTHS_GR[calMon]} {calYear}</span>
              <button onClick={nextMonth} className="admin-btn-ghost p-2"><ChevronRight size={16} /></button>
            </div>
            <button onClick={() => openCreateBooking()} className="admin-btn-primary" data-testid="add-booking-btn">
              <Plus size={14} /> Νέα Κράτηση
            </button>
          </div>

          <div className="bg-[#121212] border border-[#262626] rounded-xl overflow-hidden" data-testid="booking-calendar">
            <div className="grid grid-cols-7">
              {DAYS_GR.map(d => (
                <div key={d} className="text-center py-2 text-xs text-zinc-500 font-medium border-b border-[#262626]">{d}</div>
              ))}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`e-${i}`} className="min-h-[80px] border-b border-r border-[#1e1e1e] bg-[#0a0a0a]" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayBookings = getBookingsForDay(day);
                const isToday = new Date().toISOString().split("T")[0] === `${calYear}-${String(calMon + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const dateStr = `${calYear}-${String(calMon + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                return (
                  <div key={day} className={`min-h-[80px] border-b border-r border-[#1e1e1e] p-1.5 cursor-pointer hover:bg-white/[0.02] ${isToday ? 'bg-[#F5A623]/5' : ''}`} onClick={() => openCreateBooking(dateStr)}>
                    <span className={`text-xs font-medium ${isToday ? 'text-[#F5A623]' : 'text-zinc-400'}`}>{day}</span>
                    <div className="mt-1 space-y-0.5">
                      {dayBookings.slice(0, 3).map(b => (
                        <div key={b.id} className={`text-[10px] px-1 py-0.5 rounded truncate text-white ${getBookingColor(b.booking_type)}`} title={`${b.start_time}-${b.end_time} ${b.title}`}>
                          {b.start_time} {b.title || b.facility_name}
                        </div>
                      ))}
                      {dayBookings.length > 3 && <span className="text-[10px] text-zinc-500">+{dayBookings.length - 3}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Today's bookings */}
          <div className="bg-[#121212] border border-[#262626] rounded-xl p-4" data-testid="today-bookings">
            <h3 className="font-['Bebas_Neue'] text-lg text-white mb-3">Σημερινές Κρατήσεις</h3>
            {bookings.filter(b => b.date === new Date().toISOString().split("T")[0]).length === 0 ? (
              <p className="text-sm text-zinc-500">Δεν υπάρχουν κρατήσεις σήμερα</p>
            ) : (
              <div className="space-y-2">
                {bookings.filter(b => b.date === new Date().toISOString().split("T")[0]).map(b => (
                  <div key={b.id} className="flex items-center justify-between py-2 border-b border-[#1e1e1e] last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-8 rounded-full ${getBookingColor(b.booking_type)}`} />
                      <div>
                        <span className="text-sm text-white">{b.title || getBookingLabel(b.booking_type)}</span>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <Clock size={10} /> {b.start_time} - {b.end_time}
                          <span>• {b.facility_name}</span>
                          {b.team_name && <span>• {b.team_name}</span>}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleCancelBooking(b.id)} className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 px-2 py-0.5 rounded" data-testid={`cancel-booking-${b.id}`}>
                      Ακύρωση
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Availability View */}
      {view === "availability" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <select value={selectedFacility?.id || ""} onChange={e => setSelectedFacility(facilities.find(f => f.id === e.target.value) || null)} className="admin-input" data-testid="avail-facility-select">
              <option value="">Επιλέξτε εγκατάσταση</option>
              {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="admin-input" data-testid="avail-date" />
            <button onClick={fetchAvailability} className="admin-btn-primary text-sm" data-testid="check-avail-btn">
              <RefreshCw size={14} /> Έλεγχος
            </button>
          </div>

          {selectedFacility && availabilitySlots.length > 0 && (
            <div className="bg-[#121212] border border-[#262626] rounded-xl p-4" data-testid="availability-grid">
              <h3 className="font-['Bebas_Neue'] text-lg text-white mb-3">
                {selectedFacility.name} — {new Date(selectedDate + "T00:00:00").toLocaleDateString("el-GR", { weekday: "long", day: "numeric", month: "long" })}
              </h3>
              <div className="space-y-1">
                {availabilitySlots.map(slot => (
                  <div key={slot.start} className={`flex items-center justify-between px-3 py-2 rounded ${slot.available ? 'bg-emerald-500/5 border border-emerald-500/20 hover:bg-emerald-500/10 cursor-pointer' : 'bg-red-500/5 border border-red-500/20'}`}
                    onClick={() => slot.available && openCreateBooking(selectedDate, selectedFacility.id)}
                    data-testid={`slot-${slot.start}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono text-zinc-300">{slot.start} - {slot.end}</span>
                      {slot.available ? (
                        <span className="text-xs text-emerald-400 flex items-center gap-1"><Check size={12} /> Διαθέσιμο</span>
                      ) : (
                        <span className="text-xs text-red-400">{slot.booking?.title || getBookingLabel(slot.booking?.booking_type)} ({slot.booking?.team_name || ""})</span>
                      )}
                    </div>
                    {slot.available && <span className="text-xs text-emerald-400">+ Κράτηση</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Facility Modal */}
      {showFacilityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowFacilityModal(false)}>
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 py-4 border-b border-[#2a2a2a] sticky top-0 bg-[#161616] z-10">
              <h2 className="font-['Bebas_Neue'] text-2xl text-white">{editingFacility ? "Επεξεργασία" : "Νέα Εγκατάσταση"}</h2>
              <button onClick={() => setShowFacilityModal(false)} className="text-zinc-400 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Όνομα *</label>
                <input value={facForm.name} onChange={e => setFacForm({ ...facForm, name: e.target.value })} className="admin-input w-full" data-testid="fac-name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Τύπος</label>
                  <select value={facForm.type} onChange={e => setFacForm({ ...facForm, type: e.target.value })} className="admin-input w-full" data-testid="fac-type">
                    {FACILITY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Επιφάνεια</label>
                  <select value={facForm.surface} onChange={e => setFacForm({ ...facForm, surface: e.target.value })} className="admin-input w-full" data-testid="fac-surface">
                    {SURFACE_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Χωρητικότητα</label>
                  <input type="number" value={facForm.capacity} onChange={e => setFacForm({ ...facForm, capacity: e.target.value })} className="admin-input w-full" data-testid="fac-capacity" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Διαστάσεις</label>
                  <input value={facForm.dimensions} onChange={e => setFacForm({ ...facForm, dimensions: e.target.value })} placeholder="π.χ. 105x68m" className="admin-input w-full" data-testid="fac-dimensions" />
                </div>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                  <input type="checkbox" checked={facForm.has_lighting} onChange={e => setFacForm({ ...facForm, has_lighting: e.target.checked })} className="accent-[#F5A623]" data-testid="fac-lighting" />
                  <Lightbulb size={14} /> Φωτισμός
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                  <input type="checkbox" checked={facForm.has_changing_rooms} onChange={e => setFacForm({ ...facForm, has_changing_rooms: e.target.checked })} className="accent-[#F5A623]" data-testid="fac-changing" />
                  <Building2 size={14} /> Αποδυτήρια
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Διεύθυνση</label>
                <input value={facForm.address} onChange={e => setFacForm({ ...facForm, address: e.target.value })} className="admin-input w-full" data-testid="fac-address" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Σημειώσεις</label>
                <textarea value={facForm.notes} onChange={e => setFacForm({ ...facForm, notes: e.target.value })} className="admin-input w-full" rows={2} data-testid="fac-notes" />
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-[#2a2a2a]">
              <button onClick={handleSaveFacility} disabled={saving} className="admin-btn-primary flex-1" data-testid="save-facility">
                {saving ? <><RefreshCw size={14} className="animate-spin" /> Αποθήκευση...</> : <><Save size={14} /> Αποθήκευση</>}
              </button>
              <button onClick={() => setShowFacilityModal(false)} className="admin-btn-ghost flex-1">Ακύρωση</button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowBookingModal(false)}>
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 py-4 border-b border-[#2a2a2a] sticky top-0 bg-[#161616] z-10">
              <h2 className="font-['Bebas_Neue'] text-2xl text-white">Νέα Κράτηση</h2>
              <button onClick={() => setShowBookingModal(false)} className="text-zinc-400 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Εγκατάσταση *</label>
                <select value={bookForm.facility_id} onChange={e => {
                  const f = facilities.find(fac => fac.id === e.target.value);
                  setBookForm({ ...bookForm, facility_id: e.target.value, facility_name: f?.name || "" });
                }} className="admin-input w-full" data-testid="book-facility">
                  <option value="">— Επιλέξτε —</option>
                  {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Τίτλος</label>
                <input value={bookForm.title} onChange={e => setBookForm({ ...bookForm, title: e.target.value })} className="admin-input w-full" data-testid="book-title" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Τύπος</label>
                  <select value={bookForm.booking_type} onChange={e => setBookForm({ ...bookForm, booking_type: e.target.value })} className="admin-input w-full" data-testid="book-type">
                    {BOOKING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Ημερομηνία *</label>
                  <input type="date" value={bookForm.date} onChange={e => setBookForm({ ...bookForm, date: e.target.value })} className="admin-input w-full" data-testid="book-date" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Ώρα Έναρξης *</label>
                  <input type="time" value={bookForm.start_time} onChange={e => setBookForm({ ...bookForm, start_time: e.target.value })} className="admin-input w-full" data-testid="book-start" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Ώρα Λήξης *</label>
                  <input type="time" value={bookForm.end_time} onChange={e => setBookForm({ ...bookForm, end_time: e.target.value })} className="admin-input w-full" data-testid="book-end" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Ομάδα</label>
                <select value={bookForm.team_id || bookForm.academy_group_id || ""} onChange={e => {
                  const val = e.target.value;
                  const team = teams.find(t => t.id === val);
                  const group = academyGroups.find(g => g.id === val);
                  setBookForm({
                    ...bookForm,
                    team_id: team ? val : "",
                    academy_group_id: group ? val : "",
                    team_name: team?.name || group?.name || "",
                  });
                }} className="admin-input w-full" data-testid="book-team">
                  <option value="">— Προαιρετικό —</option>
                  <optgroup label="Ομάδες">
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </optgroup>
                  <optgroup label="Ακαδημία">
                    {academyGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </optgroup>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                <input type="checkbox" checked={bookForm.recurring} onChange={e => setBookForm({ ...bookForm, recurring: e.target.checked })} className="accent-[#F5A623]" data-testid="book-recurring" />
                Επαναλαμβανόμενη (εβδομαδιαία)
              </label>
              {bookForm.recurring && (
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Έως</label>
                  <input type="date" value={bookForm.recurring_until} onChange={e => setBookForm({ ...bookForm, recurring_until: e.target.value })} className="admin-input w-full" data-testid="book-recurring-until" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Σημειώσεις</label>
                <textarea value={bookForm.notes} onChange={e => setBookForm({ ...bookForm, notes: e.target.value })} className="admin-input w-full" rows={2} data-testid="book-notes" />
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-[#2a2a2a]">
              <button onClick={handleSaveBooking} disabled={saving} className="admin-btn-primary flex-1" data-testid="save-booking">
                {saving ? <><RefreshCw size={14} className="animate-spin" /> Αποθήκευση...</> : <><Save size={14} /> Αποθήκευση</>}
              </button>
              <button onClick={() => setShowBookingModal(false)} className="admin-btn-ghost flex-1">Ακύρωση</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceManagement;
