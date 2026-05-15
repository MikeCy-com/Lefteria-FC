import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Trophy } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const POSITIONS = ["Goalkeeper", "Defender", "Midfielder", "Forward"];
const POSITION_LABELS = {
  Goalkeeper: "Τερματοφύλακας",
  Defender: "Αμυντικός",
  Midfielder: "Μέσος",
  Forward: "Επιθετικός",
};
const FOOT_OPTIONS = [
  { value: "Right", label: "Δεξί" },
  { value: "Left", label: "Αριστερό" },
  { value: "Both", label: "Και τα δύο" },
];

const initialForm = {
  full_name: "",
  date_of_birth: "",
  phone: "",
  email: "",
  position: "",
  preferred_foot: "",
  previous_club: "",
  years_played: "",
  height_cm: "",
  weight_kg: "",
  notes: "",
};

export default function TrialsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get(`${API}/trials/settings`)
      .then((r) => setSettings(r.data))
      .catch(() => setSettings({ open: false, closed_message: "Οι εγγραφές είναι κλειστές αυτή τη στιγμή." }))
      .finally(() => setLoading(false));
  }, []);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await axios.post(`${API}/trials/submit`, form);
      setSuccess(true);
      setForm(initialForm);
    } catch (err) {
      setError(err?.response?.data?.detail || "Παρουσιάστηκε σφάλμα. Δοκιμάστε ξανά.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-32 min-h-screen flex items-center justify-center" data-testid="trials-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="pt-24 min-h-screen bg-[#0a0a0a]" data-testid="trials-page">
      <section className="py-12 md:py-20 px-4 md:px-6">
        <div className="max-w-3xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-[#F5A623] text-sm mb-6" data-testid="trials-back-link">
            <ArrowLeft size={16} /> Πίσω στην αρχική
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <Trophy className="text-[#F5A623]" size={28} />
            <span className="badge badge-primary">Πρωτη Ομαδα</span>
          </div>
          <h1 className="font-['Bebas_Neue'] text-4xl md:text-5xl text-white mb-4" data-testid="trials-headline">
            {settings?.headline || "Ετοιμος να Ξεκινησεις το Ταξιδι σου;"}
          </h1>
          <p className="text-zinc-400 mb-10" data-testid="trials-subtitle">
            {settings?.subtitle}
          </p>

          {!settings?.open ? (
            <div className="card p-8 text-center" data-testid="trials-closed">
              <p className="text-zinc-300 text-lg">{settings?.closed_message}</p>
            </div>
          ) : success ? (
            <div className="card p-10 text-center" data-testid="trials-success">
              <CheckCircle2 className="text-emerald-500 mx-auto mb-4" size={48} />
              <h3 className="font-['Bebas_Neue'] text-2xl text-white mb-2">Η αίτησή σας καταχωρήθηκε!</h3>
              <p className="text-zinc-400 mb-6">Θα επικοινωνήσουμε μαζί σας σύντομα.</p>
              <button onClick={() => setSuccess(false)} className="btn-secondary" data-testid="trials-submit-another-btn">
                Νέα αίτηση
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="card p-6 md:p-8 space-y-5" data-testid="trials-form">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-md p-3" data-testid="trials-error">
                  {error}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Ονοματεπώνυμο *" testId="trials-name">
                  <input required value={form.full_name} onChange={update("full_name")} className="input" data-testid="trials-name-input" />
                </Field>
                <Field label="Ημερομηνία Γέννησης *" testId="trials-dob">
                  <input required type="date" value={form.date_of_birth} onChange={update("date_of_birth")} className="input" data-testid="trials-dob-input" />
                </Field>
                <Field label="Τηλέφωνο *" testId="trials-phone">
                  <input required type="tel" value={form.phone} onChange={update("phone")} className="input" data-testid="trials-phone-input" />
                </Field>
                <Field label="Email *" testId="trials-email">
                  <input required type="email" value={form.email} onChange={update("email")} className="input" data-testid="trials-email-input" />
                </Field>
                <Field label="Θέση *" testId="trials-position">
                  <select required value={form.position} onChange={update("position")} className="input" data-testid="trials-position-select">
                    <option value="">Επιλέξτε...</option>
                    {POSITIONS.map((p) => (
                      <option key={p} value={p}>{POSITION_LABELS[p]}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Προτιμώμενο Πόδι *" testId="trials-foot">
                  <select required value={form.preferred_foot} onChange={update("preferred_foot")} className="input" data-testid="trials-foot-select">
                    <option value="">Επιλέξτε...</option>
                    {FOOT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Προηγούμενος Σύλλογος" testId="trials-prev-club">
                  <input value={form.previous_club} onChange={update("previous_club")} className="input" data-testid="trials-prev-club-input" />
                </Field>
                <Field label="Χρόνια που Έπαιξε" testId="trials-years">
                  <input value={form.years_played} onChange={update("years_played")} className="input" placeholder="π.χ. 5 χρόνια" data-testid="trials-years-input" />
                </Field>
                <Field label="Ύψος (cm)" testId="trials-height">
                  <input type="number" value={form.height_cm} onChange={update("height_cm")} className="input" data-testid="trials-height-input" />
                </Field>
                <Field label="Βάρος (kg)" testId="trials-weight">
                  <input type="number" value={form.weight_kg} onChange={update("weight_kg")} className="input" data-testid="trials-weight-input" />
                </Field>
              </div>

              <Field label="Σημειώσεις / Μήνυμα" testId="trials-notes">
                <textarea
                  rows={4}
                  value={form.notes}
                  onChange={update("notes")}
                  className="input"
                  placeholder="Πες μας για την εμπειρία σου, τις δυνατότητές σου, οποιαδήποτε επιπλέον πληροφορία..."
                  data-testid="trials-notes-input"
                />
              </Field>

              <div className="pt-2">
                <button type="submit" disabled={submitting} className="btn-primary w-full md:w-auto disabled:opacity-50" data-testid="trials-submit-btn">
                  {submitting ? "Αποστολή..." : "Υποβολή Αίτησης"}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

const Field = ({ label, children, testId }) => (
  <label className="block" data-testid={testId}>
    <span className="text-sm text-zinc-400 mb-1.5 block">{label}</span>
    {children}
  </label>
);
