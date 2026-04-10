import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Check, ChevronLeft, ChevronRight, User, Users, Heart, FileText, CreditCard, AlertCircle } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL + "/api";

const STEPS = [
  { id: 1, label: "Παίκτης", icon: User },
  { id: 2, label: "Γονέας", icon: Users },
  { id: 3, label: "Ιατρικά", icon: Heart },
  { id: 4, label: "Όροι", icon: FileText },
  { id: 5, label: "Πληρωμή", icon: CreditCard },
];

// Signature Pad Component
const SignaturePad = ({ value, onChange }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    ctx.strokeStyle = "#F5A623";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (value) {
      const img = new window.Image();
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.offsetWidth, canvas.offsetHeight);
      img.src = value;
    }
  }, []);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  };

  const startDraw = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const ctx = canvasRef.current.getContext("2d");
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDraw = () => {
    setIsDrawing(false);
    if (canvasRef.current) onChange(canvasRef.current.toDataURL());
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange("");
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        className="w-full h-32 border border-[#333] rounded-lg bg-[#0d0d0d] cursor-crosshair touch-none"
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
        data-testid="signature-canvas"
      />
      <button type="button" onClick={clear} className="text-xs text-zinc-500 hover:text-[#F5A623] mt-1 transition-colors" data-testid="signature-clear">
        Καθαρισμός υπογραφής
      </button>
    </div>
  );
};

// Form field components
const FormField = ({ label, required, children, error }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-medium text-zinc-200">
      {label} {required && <span className="text-[#F5A623]">*</span>}
    </label>
    {children}
    {error && <p className="text-red-400 text-xs flex items-center gap-1"><AlertCircle size={12} />{error}</p>}
  </div>
);

const Input = ({ className = "", ...props }) => (
  <input className={`w-full bg-[#0d0d0d] border border-[#333] text-white rounded-lg px-4 py-3 text-sm focus:border-[#F5A623] focus:ring-1 focus:ring-[#F5A623]/30 outline-none transition-all placeholder:text-zinc-600 ${className}`} {...props} />
);

const Select = ({ className = "", ...props }) => (
  <select className={`w-full bg-[#0d0d0d] border border-[#333] text-white rounded-lg px-4 py-3 text-sm focus:border-[#F5A623] focus:ring-1 focus:ring-[#F5A623]/30 outline-none transition-all ${className}`} {...props} />
);

const Checkbox = ({ checked, onChange, label, testId }) => (
  <label className="flex items-start gap-3 cursor-pointer group" data-testid={testId}>
    <div className={`w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
      checked ? 'bg-[#F5A623] border-[#F5A623]' : 'border-[#444] group-hover:border-[#666]'
    }`}>
      {checked && <Check size={13} className="text-black" strokeWidth={3} />}
    </div>
    <input type="checkbox" checked={checked} onChange={onChange} className="hidden" />
    <span className="text-sm text-zinc-300 leading-relaxed">{label}</span>
  </label>
);

const RadioOption = ({ checked, onChange, label, testId }) => (
  <label className="flex items-center gap-3 cursor-pointer group" data-testid={testId}>
    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
      checked ? 'border-[#F5A623]' : 'border-[#444] group-hover:border-[#666]'
    }`}>
      {checked && <div className="w-2.5 h-2.5 rounded-full bg-[#F5A623]" />}
    </div>
    <input type="radio" checked={checked} onChange={onChange} className="hidden" />
    <span className="text-sm text-zinc-300">{label}</span>
  </label>
);

const INITIAL_FORM = {
  player_first_name: "", player_last_name: "", player_dob: "", player_gender: "",
  player_address: "", player_city: "", player_postal_code: "",
  parent_name: "", parent_relationship: "", parent_phone: "", parent_email: "",
  emergency_name: "", emergency_phone: "", emergency_relationship: "",
  has_allergies: false, allergies_details: "", has_conditions: false, conditions_details: "",
  has_medication: false, medication_details: "",
  consent_participation: false, consent_medical_auth: false, consent_gdpr: false,
  consent_media: null, consent_communications: false, comm_email: false, comm_sms: false,
  consent_liability: false, consent_financial: false,
  payment_method: "cash", signature_data: "", signature_date: new Date().toISOString().split("T")[0],
};

export default function RegistrationPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const set = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);

  const validateStep = () => {
    const e = {};
    if (step === 1) {
      if (!form.player_first_name.trim()) e.player_first_name = "Υποχρεωτικό";
      if (!form.player_last_name.trim()) e.player_last_name = "Υποχρεωτικό";
      if (!form.player_dob) e.player_dob = "Υποχρεωτικό";
      if (!form.player_gender) e.player_gender = "Υποχρεωτικό";
      if (!form.player_address.trim()) e.player_address = "Υποχρεωτικό";
      if (!form.player_city.trim()) e.player_city = "Υποχρεωτικό";
    }
    if (step === 2) {
      if (!form.parent_name.trim()) e.parent_name = "Υποχρεωτικό";
      if (!form.parent_relationship.trim()) e.parent_relationship = "Υποχρεωτικό";
      if (!form.parent_phone.trim()) e.parent_phone = "Υποχρεωτικό";
      if (!form.parent_email.trim()) e.parent_email = "Υποχρεωτικό";
      if (!form.emergency_name.trim()) e.emergency_name = "Υποχρεωτικό";
      if (!form.emergency_phone.trim()) e.emergency_phone = "Υποχρεωτικό";
    }
    if (step === 4) {
      if (!form.consent_participation) e.consent_participation = "Απαιτείται";
      if (!form.consent_medical_auth) e.consent_medical_auth = "Απαιτείται";
      if (!form.consent_gdpr) e.consent_gdpr = "Απαιτείται";
      if (form.consent_media === null) e.consent_media = "Επιλέξτε";
      if (!form.consent_liability) e.consent_liability = "Απαιτείται";
      if (!form.consent_financial) e.consent_financial = "Απαιτείται";
    }
    if (step === 5) {
      if (!form.signature_data) e.signature_data = "Υπογράψτε παρακαλώ";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextStep = () => { if (validateStep()) setStep(s => Math.min(s + 1, 5)); };
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    try {
      await axios.post(`${API}/registrations`, form);
      setSubmitted(true);
    } catch (e) {
      alert(e.response?.data?.detail || "Σφάλμα κατά την υποβολή");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4" data-testid="registration-success">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-[#F5A623]/15 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={40} className="text-[#F5A623]" />
          </div>
          <h1 className="font-['Bebas_Neue'] text-4xl text-white mb-4">Η Εγγραφη Υποβληθηκε!</h1>
          <p className="text-zinc-300 text-lg mb-2">Ευχαριστούμε για το ενδιαφέρον σας.</p>
          <p className="text-zinc-500 mb-8">Θα επικοινωνήσουμε μαζί σας σύντομα στο <strong className="text-zinc-300">{form.parent_email}</strong> για τα επόμενα βήματα.</p>
          <Link to="/" className="inline-flex items-center gap-2 bg-[#F5A623] text-black font-semibold px-6 py-3 rounded-lg hover:bg-[#e09520] transition-colors" data-testid="back-home-btn">
            Πίσω στην Αρχική
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-24 pb-12" data-testid="registration-page">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-block bg-[#F5A623]/15 text-[#F5A623] text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">Ακαδημια Ποδοσφαιρου</span>
          <h1 className="font-['Bebas_Neue'] text-4xl md:text-5xl text-white tracking-wide">
            Εντυπο <span className="text-[#F5A623]">Εγγραφης</span>
          </h1>
          <p className="text-zinc-400 mt-2 text-base">Συμπληρώστε τη φόρμα για να εγγράψετε τον αθλητή στην ακαδημία.</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-10 px-2" data-testid="step-indicator">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center relative">
                <button
                  onClick={() => { if (s.id < step) setStep(s.id); }}
                  className={`w-11 h-11 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                    step === s.id ? 'bg-[#F5A623] text-black shadow-lg shadow-[#F5A623]/20' :
                    step > s.id ? 'bg-[#F5A623]/20 text-[#F5A623]' :
                    'bg-[#1a1a1a] border border-[#333] text-zinc-500'
                  }`}
                  data-testid={`step-btn-${s.id}`}
                >
                  {step > s.id ? <Check size={16} strokeWidth={3} /> : <s.icon size={16} />}
                </button>
                <span className={`text-[10px] mt-1.5 whitespace-nowrap font-medium ${step >= s.id ? 'text-[#F5A623]' : 'text-zinc-600'}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 rounded-full transition-colors ${step > s.id ? 'bg-[#F5A623]/40' : 'bg-[#222]'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-[#121212] border border-[#262626] rounded-xl p-6 md:p-8" data-testid="form-card">
          {/* Step 1: Player Info */}
          {step === 1 && (
            <div className="space-y-5" data-testid="step-1">
              <h2 className="font-['Bebas_Neue'] text-2xl text-white mb-1">Στοιχεια Παικτη</h2>
              <p className="text-zinc-500 text-sm mb-4">Συμπληρώστε τα βασικά στοιχεία του αθλητή.</p>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Όνομα" required error={errors.player_first_name}>
                  <Input value={form.player_first_name} onChange={e => set("player_first_name", e.target.value)} placeholder="π.χ. Γιώργος" data-testid="player-first-name" />
                </FormField>
                <FormField label="Επώνυμο" required error={errors.player_last_name}>
                  <Input value={form.player_last_name} onChange={e => set("player_last_name", e.target.value)} placeholder="π.χ. Παπαδόπουλος" data-testid="player-last-name" />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Ημερομηνία Γέννησης" required error={errors.player_dob}>
                  <Input type="date" value={form.player_dob} onChange={e => set("player_dob", e.target.value)} data-testid="player-dob" />
                </FormField>
                <FormField label="Φύλο" required error={errors.player_gender}>
                  <Select value={form.player_gender} onChange={e => set("player_gender", e.target.value)} data-testid="player-gender">
                    <option value="">Επιλέξτε...</option>
                    <option value="male">Αγόρι</option>
                    <option value="female">Κορίτσι</option>
                  </Select>
                </FormField>
              </div>
              <FormField label="Διεύθυνση Κατοικίας" required error={errors.player_address}>
                <Input value={form.player_address} onChange={e => set("player_address", e.target.value)} placeholder="π.χ. Λεωφ. Μακαρίου 25" data-testid="player-address" />
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Πόλη" required error={errors.player_city}>
                  <Input value={form.player_city} onChange={e => set("player_city", e.target.value)} placeholder="π.χ. Λευκωσία" data-testid="player-city" />
                </FormField>
                <FormField label="Τ.Κ.">
                  <Input value={form.player_postal_code} onChange={e => set("player_postal_code", e.target.value)} placeholder="π.χ. 1060" data-testid="player-postal" />
                </FormField>
              </div>
            </div>
          )}

          {/* Step 2: Parent + Emergency */}
          {step === 2 && (
            <div className="space-y-5" data-testid="step-2">
              <h2 className="font-['Bebas_Neue'] text-2xl text-white mb-1">Στοιχεια Γονεα / Κηδεμονα</h2>
              <p className="text-zinc-500 text-sm mb-4">Κύρια στοιχεία επικοινωνίας του γονέα ή κηδεμόνα.</p>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Ονοματεπώνυμο" required error={errors.parent_name}>
                  <Input value={form.parent_name} onChange={e => set("parent_name", e.target.value)} data-testid="parent-name" />
                </FormField>
                <FormField label="Σχέση με τον Παίκτη" required error={errors.parent_relationship}>
                  <Select value={form.parent_relationship} onChange={e => set("parent_relationship", e.target.value)} data-testid="parent-relationship">
                    <option value="">Επιλέξτε...</option>
                    <option value="Πατέρας">Πατέρας</option>
                    <option value="Μητέρα">Μητέρα</option>
                    <option value="Κηδεμόνας">Κηδεμόνας</option>
                  </Select>
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Τηλέφωνο" required error={errors.parent_phone}>
                  <Input type="tel" value={form.parent_phone} onChange={e => set("parent_phone", e.target.value)} placeholder="+357 99 123456" data-testid="parent-phone" />
                </FormField>
                <FormField label="Email" required error={errors.parent_email}>
                  <Input type="email" value={form.parent_email} onChange={e => set("parent_email", e.target.value)} placeholder="parent@email.com" data-testid="parent-email" />
                </FormField>
              </div>

              <div className="border-t border-[#262626] pt-5 mt-6">
                <h3 className="font-['Bebas_Neue'] text-xl text-white mb-4">Στοιχεια Εκτακτης Αναγκης</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Ονοματεπώνυμο" required error={errors.emergency_name}>
                    <Input value={form.emergency_name} onChange={e => set("emergency_name", e.target.value)} data-testid="emergency-name" />
                  </FormField>
                  <FormField label="Τηλέφωνο" required error={errors.emergency_phone}>
                    <Input type="tel" value={form.emergency_phone} onChange={e => set("emergency_phone", e.target.value)} data-testid="emergency-phone" />
                  </FormField>
                </div>
                <div className="mt-4">
                  <FormField label="Σχέση με τον Παίκτη">
                    <Input value={form.emergency_relationship} onChange={e => set("emergency_relationship", e.target.value)} placeholder="π.χ. Θείος" data-testid="emergency-relationship" />
                  </FormField>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Medical */}
          {step === 3 && (
            <div className="space-y-5" data-testid="step-3">
              <h2 className="font-['Bebas_Neue'] text-2xl text-white mb-1">Ιατρικες Πληροφοριες</h2>
              <p className="text-zinc-500 text-sm mb-4">Δηλώστε τυχόν πληροφορίες που αφορούν την υγεία του παιδιού.</p>

              <div className="bg-[#0d0d0d] border border-[#262626] rounded-lg p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm font-medium">Αλλεργίες</span>
                  <div className="flex gap-4">
                    <RadioOption checked={form.has_allergies} onChange={() => set("has_allergies", true)} label="Ναι" testId="allergies-yes" />
                    <RadioOption checked={!form.has_allergies} onChange={() => set("has_allergies", false)} label="Όχι" testId="allergies-no" />
                  </div>
                </div>
                {form.has_allergies && (
                  <Input value={form.allergies_details} onChange={e => set("allergies_details", e.target.value)} placeholder="Περιγράψτε τις αλλεργίες..." data-testid="allergies-details" />
                )}
              </div>

              <div className="bg-[#0d0d0d] border border-[#262626] rounded-lg p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm font-medium">Ιατρικές Παθήσεις</span>
                  <div className="flex gap-4">
                    <RadioOption checked={form.has_conditions} onChange={() => set("has_conditions", true)} label="Ναι" testId="conditions-yes" />
                    <RadioOption checked={!form.has_conditions} onChange={() => set("has_conditions", false)} label="Όχι" testId="conditions-no" />
                  </div>
                </div>
                {form.has_conditions && (
                  <Input value={form.conditions_details} onChange={e => set("conditions_details", e.target.value)} placeholder="Περιγράψτε τις παθήσεις..." data-testid="conditions-details" />
                )}
              </div>

              <div className="bg-[#0d0d0d] border border-[#262626] rounded-lg p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm font-medium">Φαρμακευτική Αγωγή</span>
                  <div className="flex gap-4">
                    <RadioOption checked={form.has_medication} onChange={() => set("has_medication", true)} label="Ναι" testId="medication-yes" />
                    <RadioOption checked={!form.has_medication} onChange={() => set("has_medication", false)} label="Όχι" testId="medication-no" />
                  </div>
                </div>
                {form.has_medication && (
                  <Input value={form.medication_details} onChange={e => set("medication_details", e.target.value)} placeholder="Περιγράψτε τη φαρμακευτική αγωγή..." data-testid="medication-details" />
                )}
              </div>
            </div>
          )}

          {/* Step 4: Terms & Consents */}
          {step === 4 && (
            <div className="space-y-5" data-testid="step-4">
              <h2 className="font-['Bebas_Neue'] text-2xl text-white mb-1">Οροι & Συγκαταθεσεις</h2>
              <p className="text-zinc-500 text-sm mb-4">Διαβάστε και αποδεχτείτε τους όρους συμμετοχής.</p>

              {/* 6.1 Participation */}
              <div className="bg-[#0d0d0d] border border-[#262626] rounded-lg p-5 space-y-3">
                <h3 className="text-white text-sm font-semibold">6.1 Συμμετοχή σε Δραστηριότητες</h3>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Δηλώνω ότι συναινώ στη συμμετοχή του παιδιού μου στις προπονήσεις, αγώνες και λοιπές δραστηριότητες της Ακαδημίας. Αναγνωρίζω ότι η συμμετοχή σε αθλητικές δραστηριότητες ενέχει κινδύνους τραυματισμού.
                </p>
                <Checkbox checked={form.consent_participation} onChange={e => set("consent_participation", e.target.checked)} label="Συμφωνώ με τη συμμετοχή του παιδιού μου" testId="consent-participation" />
                {errors.consent_participation && <p className="text-red-400 text-xs">{errors.consent_participation}</p>}
              </div>

              {/* 6.2 Medical Auth */}
              <div className="bg-[#0d0d0d] border border-[#262626] rounded-lg p-5 space-y-3">
                <h3 className="text-white text-sm font-semibold">6.2 Ιατρική Εξουσιοδότηση</h3>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Σε περίπτωση έκτακτης ανάγκης, εξουσιοδοτώ την Ακαδημία να προβεί στις απαραίτητες ενέργειες για την παροχή ιατρικής φροντίδας, εφόσον δεν είναι δυνατή η άμεση επικοινωνία μαζί μου.
                </p>
                <Checkbox checked={form.consent_medical_auth} onChange={e => set("consent_medical_auth", e.target.checked)} label="Εξουσιοδοτώ την Ακαδημία για ιατρική φροντίδα" testId="consent-medical" />
                {errors.consent_medical_auth && <p className="text-red-400 text-xs">{errors.consent_medical_auth}</p>}
              </div>

              {/* 6.3 GDPR */}
              <div className="bg-[#0d0d0d] border border-[#262626] rounded-lg p-5 space-y-3">
                <h3 className="text-white text-sm font-semibold">6.3 Προστασία Δεδομένων (GDPR)</h3>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Η Ακαδημία επεξεργάζεται προσωπικά δεδομένα σύμφωνα με τον GDPR (ΕΕ 2016/679), αποκλειστικά για σκοπούς διαχείρισης εγγραφών, επικοινωνίας και ασφάλειας. Ο Γονέας/Κηδεμόνας διατηρεί δικαίωμα πρόσβασης, διόρθωσης ή διαγραφής δεδομένων.
                </p>
                <Checkbox checked={form.consent_gdpr} onChange={e => set("consent_gdpr", e.target.checked)} label="Αποδέχομαι την πολιτική προστασίας δεδομένων" testId="consent-gdpr" />
                {errors.consent_gdpr && <p className="text-red-400 text-xs">{errors.consent_gdpr}</p>}
              </div>

              {/* 6.4 Media Consent */}
              <div className="bg-[#0d0d0d] border border-[#262626] rounded-lg p-5 space-y-3">
                <h3 className="text-white text-sm font-semibold">6.4 Χρήση Οπτικοακουστικού Υλικού</h3>
                <p className="text-zinc-400 text-xs leading-relaxed mb-2">
                  Παρέχετε τη συγκατάθεσή σας για τη λήψη και χρήση φωτογραφιών/βίντεο του παιδιού σας για σκοπούς προβολής;
                </p>
                <div className="space-y-2">
                  <RadioOption checked={form.consent_media === true} onChange={() => set("consent_media", true)} label="Ναι, παρέχω τη συγκατάθεσή μου" testId="media-yes" />
                  <RadioOption checked={form.consent_media === false} onChange={() => set("consent_media", false)} label="Όχι, δεν παρέχω τη συγκατάθεσή μου" testId="media-no" />
                </div>
                {errors.consent_media && <p className="text-red-400 text-xs">{errors.consent_media}</p>}
              </div>

              {/* 6.5 Communications */}
              <div className="bg-[#0d0d0d] border border-[#262626] rounded-lg p-5 space-y-3">
                <h3 className="text-white text-sm font-semibold">6.5 Επικοινωνία & Ενημερώσεις</h3>
                <Checkbox checked={form.consent_communications} onChange={e => set("consent_communications", e.target.checked)} label="Συμφωνώ να λαμβάνω ενημερώσεις σχετικά με προπονήσεις, αγώνες και δραστηριότητες" testId="consent-comms" />
                {form.consent_communications && (
                  <div className="ml-8 space-y-2 mt-2">
                    <Checkbox checked={form.comm_email} onChange={e => set("comm_email", e.target.checked)} label="Email" testId="comm-email" />
                    <Checkbox checked={form.comm_sms} onChange={e => set("comm_sms", e.target.checked)} label="SMS / WhatsApp" testId="comm-sms" />
                  </div>
                )}
              </div>

              {/* 6.6 Liability */}
              <div className="bg-[#0d0d0d] border border-[#262626] rounded-lg p-5 space-y-3">
                <h3 className="text-white text-sm font-semibold">6.6 Περιορισμός Ευθύνης</h3>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Αποδέχομαι ότι η Ακαδημία δεν φέρει ευθύνη για τραυματισμούς ή απώλειες που ενδέχεται να προκύψουν κατά τη συμμετοχή, εκτός βαριάς αμέλειας.
                </p>
                <Checkbox checked={form.consent_liability} onChange={e => set("consent_liability", e.target.checked)} label="Αποδέχομαι τον περιορισμό ευθύνης" testId="consent-liability" />
                {errors.consent_liability && <p className="text-red-400 text-xs">{errors.consent_liability}</p>}
              </div>

              {/* 6.7 Financial */}
              <div className="bg-[#0d0d0d] border border-[#262626] rounded-lg p-5 space-y-3">
                <h3 className="text-white text-sm font-semibold">6.7 Οικονομικοί Όροι</h3>
                <div className="bg-[#F5A623]/10 border border-[#F5A623]/20 rounded-lg p-4 space-y-1">
                  <div className="flex justify-between text-sm"><span className="text-zinc-300">Τέλος εγγραφής (εφάπαξ)</span><span className="text-white font-semibold">€20</span></div>
                  <div className="flex justify-between text-sm"><span className="text-zinc-300">Μηνιαία συνδρομή</span><span className="text-white font-semibold">€60</span></div>
                  <div className="flex justify-between text-sm"><span className="text-zinc-300">Αδέλφια (συνολικά)</span><span className="text-white font-semibold">€100/μήνα</span></div>
                </div>
                <Checkbox checked={form.consent_financial} onChange={e => set("consent_financial", e.target.checked)} label="Αποδέχομαι τους οικονομικούς όρους" testId="consent-financial" />
                {errors.consent_financial && <p className="text-red-400 text-xs">{errors.consent_financial}</p>}
              </div>
            </div>
          )}

          {/* Step 5: Payment & Signature */}
          {step === 5 && (
            <div className="space-y-5" data-testid="step-5">
              <h2 className="font-['Bebas_Neue'] text-2xl text-white mb-1">Πληρωμη & Υπογραφη</h2>
              <p className="text-zinc-500 text-sm mb-4">Επιλέξτε τρόπο πληρωμής και υπογράψτε.</p>

              <FormField label="Τρόπος Πληρωμής" required>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { val: "cash", label: "Μετρητά" },
                    { val: "card", label: "Κάρτα" },
                    { val: "transfer", label: "Μεταφορά" },
                  ].map(opt => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => set("payment_method", opt.val)}
                      className={`py-3 px-4 rounded-lg border text-sm font-medium transition-all ${
                        form.payment_method === opt.val
                          ? 'border-[#F5A623] bg-[#F5A623]/10 text-[#F5A623]'
                          : 'border-[#333] text-zinc-400 hover:border-zinc-500'
                      }`}
                      data-testid={`payment-${opt.val}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </FormField>

              <div className="border-t border-[#262626] pt-5">
                <h3 className="font-['Bebas_Neue'] text-xl text-white mb-2">Τελικη Δηλωση</h3>
                <p className="text-zinc-400 text-xs leading-relaxed mb-4">
                  Δηλώνω υπεύθυνα ότι όλα τα ανωτέρω στοιχεία είναι αληθή και ότι αποδέχομαι πλήρως τους όρους της παρούσας Συμφωνίας.
                </p>
              </div>

              <FormField label="Υπογραφή Γονέα/Κηδεμόνα" required error={errors.signature_data}>
                <SignaturePad value={form.signature_data} onChange={val => set("signature_data", val)} />
              </FormField>

              <FormField label="Ημερομηνία">
                <Input type="date" value={form.signature_date} onChange={e => set("signature_date", e.target.value)} data-testid="signature-date" />
              </FormField>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-[#262626]">
            {step > 1 ? (
              <button onClick={prevStep} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium" data-testid="prev-step-btn">
                <ChevronLeft size={18} /> Πίσω
              </button>
            ) : (
              <Link to="/academy" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium">
                <ChevronLeft size={18} /> Ακαδημία
              </Link>
            )}

            {step < 5 ? (
              <button onClick={nextStep} className="flex items-center gap-2 bg-[#F5A623] text-black font-semibold px-6 py-3 rounded-lg hover:bg-[#e09520] transition-colors text-sm" data-testid="next-step-btn">
                Επόμενο <ChevronRight size={18} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting} className="flex items-center gap-2 bg-[#F5A623] text-black font-semibold px-6 py-3 rounded-lg hover:bg-[#e09520] transition-colors text-sm disabled:opacity-50" data-testid="submit-btn">
                {submitting ? "Υποβολή..." : "Υποβολή Εγγραφής"} <Check size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
