import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Mail, Phone, Calendar, Flag, Award, GraduationCap, Briefcase, User } from "lucide-react";
import { extractStaffId } from "../utils/playerHelpers";
import ShareButton from "../components/ShareButton";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ROLE_LABELS = {
  "Head Coach": "Προπονητής",
  "Assistant Coach": "Βοηθός Προπονητή",
  "Goalkeeper Coach": "Προπονητής Τερματοφυλάκων",
  "Fitness Coach": "Γυμναστής",
  "Physiotherapist": "Φυσιοθεραπευτής",
  "Team Manager": "Διευθυντής Ομάδας",
  "Academy Director": "Διευθυντής Ακαδημίας",
  "Doctor": "Ιατρός",
  "Scout": "Παρατηρητής",
  "Analyst": "Αναλυτής",
};

const calcAge = (dob) => {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const diff = Date.now() - birth.getTime();
  const age = new Date(diff).getUTCFullYear() - 1970;
  return age > 0 ? age : null;
};

const resolveImg = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${process.env.REACT_APP_BACKEND_URL}${url}`;
};

export default function StaffProfilePage() {
  const { staffId: rawParam } = useParams();
  const staffId = extractStaffId(rawParam);
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await axios.get(`${API}/staff/${staffId}`);
        setStaff(res.data);
      } catch (e) {
        setError(e?.response?.status === 404 ? "not_found" : "error");
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, [staffId]);

  if (loading) {
    return (
      <div className="pt-32 min-h-screen flex items-center justify-center" data-testid="staff-loading">
        <div className="spinner" />
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div className="pt-32 min-h-screen px-4" data-testid="staff-not-found">
        <div className="max-w-3xl mx-auto text-center py-20">
          <h1 className="font-['Bebas_Neue'] text-4xl text-white mb-4">Μέλος Επιτελείου δεν Βρέθηκε</h1>
          <p className="text-zinc-400 mb-6">Το προφίλ που ζητήσατε δεν είναι διαθέσιμο.</p>
          <Link to="/team" className="btn-primary" data-testid="staff-back-btn">
            <ArrowLeft size={16} /> Πίσω στην Ομάδα
          </Link>
        </div>
      </div>
    );
  }

  const img = resolveImg(staff.image_url);
  const roleLabel = ROLE_LABELS[staff.role] || staff.role;
  const age = calcAge(staff.date_of_birth);
  const backLink = staff.team_type === "Academy" ? "/academy" : "/team";

  return (
    <div className="pt-24 min-h-screen bg-[#0a0a0a]" data-testid="staff-profile-page">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#161616] via-[#0a0a0a] to-[#0a0a0a] border-b border-[#1e1e1e]">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, #F5A623 0%, transparent 50%)" }} />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-16">
          <Link to={backLink} className="inline-flex items-center gap-2 text-zinc-400 hover:text-[#F5A623] text-sm mb-8" data-testid="staff-back-link">
            <ArrowLeft size={16} /> {staff.team_type === "Academy" ? "Πίσω στην Ακαδημία" : "Πίσω στην Ομάδα"}
          </Link>

          <div className="grid md:grid-cols-[280px_1fr] gap-8 items-start">
            {/* Photo */}
            <div className="w-full max-w-[280px] mx-auto md:mx-0 aspect-square rounded-xl overflow-hidden bg-[#1a1a1a] border border-[#262626] flex items-center justify-center">
              {img ? (
                <img src={img} alt={staff.name} className="w-full h-full object-cover" data-testid="staff-photo" />
              ) : (
                <User size={96} className="text-zinc-700" />
              )}
            </div>

            {/* Info */}
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <span className="badge badge-primary" data-testid="staff-role-badge">{roleLabel}</span>
                <ShareButton kind="staff" id={staff.id} title={`${staff.name} — ${roleLabel}`} />
              </div>
              <h1 className="font-['Bebas_Neue'] text-4xl md:text-6xl text-white leading-tight uppercase tracking-wide" data-testid="staff-name">
                {staff.name}
              </h1>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                {staff.nationality && (
                  <div className="flex items-center gap-2 text-zinc-300" data-testid="staff-nationality">
                    <Flag size={14} className="text-[#F5A623]" />
                    <span>{staff.nationality}</span>
                  </div>
                )}
                {age !== null && (
                  <div className="flex items-center gap-2 text-zinc-300" data-testid="staff-age">
                    <Calendar size={14} className="text-[#F5A623]" />
                    <span>{age} ετών</span>
                  </div>
                )}
                {staff.joined_date && (
                  <div className="flex items-center gap-2 text-zinc-300" data-testid="staff-joined">
                    <Briefcase size={14} className="text-[#F5A623]" />
                    <span>Στον σύλλογο από {new Date(staff.joined_date).toLocaleDateString("el-GR")}</span>
                  </div>
                )}
              </div>

              {/* Contact */}
              {(staff.email || staff.phone) && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {staff.email && (
                    <a href={`mailto:${staff.email}`} className="btn-secondary text-xs" data-testid="staff-email-link">
                      <Mail size={14} /> {staff.email}
                    </a>
                  )}
                  {staff.phone && (
                    <a href={`tel:${staff.phone}`} className="btn-secondary text-xs" data-testid="staff-phone-link">
                      <Phone size={14} /> {staff.phone}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="py-10 md:py-14 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
          {/* Bio */}
          <div className="md:col-span-2 space-y-6">
            {staff.bio && (
              <div className="card p-6" data-testid="staff-bio-card">
                <h2 className="font-['Bebas_Neue'] text-2xl text-white mb-3 tracking-wide">Βιογραφικο</h2>
                <p className="text-zinc-300 leading-relaxed whitespace-pre-line">{staff.bio}</p>
              </div>
            )}

            {Array.isArray(staff.previous_experience) && staff.previous_experience.length > 0 && (
              <div className="card p-6" data-testid="staff-experience-card">
                <h2 className="font-['Bebas_Neue'] text-2xl text-white mb-4 tracking-wide flex items-center gap-2">
                  <Briefcase size={20} className="text-[#F5A623]" /> Προηγουμενη Εμπειρια
                </h2>
                <ul className="space-y-3">
                  {staff.previous_experience.map((exp, i) => (
                    <li key={i} className="border-l-2 border-[#F5A623]/40 pl-4 py-1">
                      {exp.role && <div className="text-white font-medium">{exp.role}</div>}
                      {exp.club && <div className="text-zinc-400 text-sm">{exp.club}</div>}
                      {exp.years && <div className="text-zinc-500 text-xs mt-0.5">{exp.years}</div>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Qualifications sidebar */}
          <div className="space-y-6">
            {Array.isArray(staff.qualifications) && staff.qualifications.length > 0 && (
              <div className="card p-6" data-testid="staff-qualifications-card">
                <h2 className="font-['Bebas_Neue'] text-2xl text-white mb-4 tracking-wide flex items-center gap-2">
                  <GraduationCap size={20} className="text-[#F5A623]" /> Προσοντα
                </h2>
                <ul className="space-y-2">
                  {staff.qualifications.map((q, i) => (
                    <li key={i} className="flex items-start gap-2 text-zinc-300 text-sm">
                      <Award size={14} className="text-[#F5A623] mt-0.5 flex-shrink-0" />
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!staff.bio && !(staff.previous_experience?.length) && !(staff.qualifications?.length) && (
              <div className="card p-6 text-center text-zinc-500 text-sm" data-testid="staff-no-info">
                Λεπτομέρειες σύντομα.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
