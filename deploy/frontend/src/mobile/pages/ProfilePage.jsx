import { useState, useRef } from "react";
import { useMobileAuth } from "../MobileAuthContext";
import { useNavigate } from "react-router-dom";
import { User, Phone, LogOut, Camera, Save, ChevronRight, Bell, Info, Mail, Lock } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CLUB_LOGO = "https://customer-assets.emergentagent.com/job_club-academy-portal/artifacts/v5ncw8ht_Leyteria%20FC%20-%201_20260404_161502_0000.png";

const ROLE_LABELS = {
  parent: "Γονεας / Κηδεμονας",
  coach: "Προπονητης",
  player: "Παικτης",
  management: "Διοικηση",
};

const ProfilePage = () => {
  const { user, logout, getHeaders, login } = useMobileAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || "", email: user?.email || "" });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const handleLogout = () => {
    logout();
    navigate("/app/login", { replace: true });
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await axios.post(`${API}/mobile/profile/avatar`, fd, {
        headers: { ...getHeaders(), "Content-Type": "multipart/form-data" },
      });
      // Update user in context
      if (res.data.avatar_url) {
        const token = localStorage.getItem("mobile_token");
        const meRes = await axios.get(`${API}/mobile/auth/me`, { headers: getHeaders() });
        login(token, meRes.data);
      }
    } catch (err) {
      console.error("Avatar upload error:", err);
      setAvatarPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await axios.put(`${API}/mobile/profile`, form, { headers: getHeaders() });
      // Refresh user
      const token = localStorage.getItem("mobile_token");
      const meRes = await axios.get(`${API}/mobile/auth/me`, { headers: getHeaders() });
      login(token, meRes.data);
      setEditing(false);
    } catch (err) {
      console.error("Profile save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const avatarUrl = avatarPreview || (user?.avatar_url
    ? (user.avatar_url.startsWith("http") ? user.avatar_url : `${process.env.REACT_APP_BACKEND_URL}${user.avatar_url}`)
    : null);

  return (
    <div className="px-4 pb-20" data-testid="profile-page">
      {/* Avatar & Name */}
      <div className="flex flex-col items-center pt-6 pb-4">
        <div className="relative mb-3">
          <div className="w-24 h-24 rounded-full bg-[#1a1a1a] border-2 border-[#F5A623]/30 overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#F5A623] text-3xl font-bold">{user?.name?.[0]}</div>
            )}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#F5A623] flex items-center justify-center shadow-lg"
            data-testid="avatar-upload-btn"
            disabled={uploading}
          >
            {uploading ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Camera size={14} className="text-black" />
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} data-testid="avatar-file-input" />
        </div>
        <h2 className="text-white text-sm font-semibold">{user?.name}</h2>
        <span className="text-sm text-[#F5A623]">{ROLE_LABELS[user?.role] || user?.role}</span>
      </div>

      {/* Editable Profile Fields */}
      <div className="bg-[#121212] border border-[#1e1e1e] rounded-2xl overflow-hidden mt-2">
        {editing ? (
          <div className="p-4 space-y-4">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Ονομα</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#F5A623] outline-none"
                data-testid="profile-name-input"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Email</label>
              <input
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#F5A623] outline-none"
                placeholder="email@example.com"
                data-testid="profile-email-input"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 flex items-center gap-1"><Lock size={10} /> Τηλεφωνο (κλειδωμενο)</label>
              <input
                value={user?.phone || ""}
                disabled
                className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2.5 text-sm text-zinc-600 cursor-not-allowed"
                data-testid="profile-phone-locked"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={handleSave} disabled={saving}
                className="flex-1 bg-[#F5A623] text-black font-medium py-2.5 rounded-lg text-sm flex items-center justify-center gap-1.5"
                data-testid="profile-save-btn">
                {saving ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <><Save size={14} /> Αποθηκευση</>}
              </button>
              <button onClick={() => { setEditing(false); setForm({ name: user?.name || "", email: user?.email || "" }); }}
                className="flex-1 bg-[#1a1a1a] text-zinc-400 border border-[#333] font-medium py-2.5 rounded-lg text-sm"
                data-testid="profile-cancel-btn">
                Ακυρωση
              </button>
            </div>
          </div>
        ) : (
          <>
            <ProfileRow icon={User} label="Ονομα" value={user?.name} />
            <ProfileRow icon={Mail} label="Email" value={user?.email || "—"} />
            <ProfileRow icon={Phone} label="Τηλεφωνο" value={user?.phone} locked />
            <button onClick={() => setEditing(true)}
              className="w-full text-center py-3 text-[#F5A623] text-sm font-medium border-t border-[#1e1e1e] hover:bg-white/[0.02]"
              data-testid="profile-edit-btn">
              Επεξεργασια Προφιλ
            </button>
          </>
        )}
      </div>

      {/* Settings */}
      <div className="bg-[#121212] border border-[#1e1e1e] rounded-2xl overflow-hidden mt-4">
        <MenuItem icon={Bell} label="Ειδοποιησεις" />
        <MenuItem icon={Info} label="Σχετικα" />
      </div>

      {/* Club Info */}
      <div className="bg-[#121212] border border-[#1e1e1e] rounded-2xl p-4 mt-4 flex items-center gap-3">
        <img src={CLUB_LOGO} alt="" className="w-10 h-10" />
        <div>
          <p className="text-white font-medium text-sm">ΛΕΥΤΕΡΙΑ FC</p>
          <p className="text-xs text-zinc-500">Academy App v1.0</p>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full mt-6 mb-10 bg-red-500/10 border border-red-500/20 rounded-2xl py-3.5 text-red-400 font-medium flex items-center justify-center gap-2"
        data-testid="logout-btn"
      >
        <LogOut size={18} />
        Αποσυνδεση
      </button>
    </div>
  );
};

const ProfileRow = ({ icon: Icon, label, value, locked }) => (
  <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#1e1e1e] last:border-0">
    <div className="flex items-center gap-3">
      <Icon size={16} className="text-zinc-500" />
      <div>
        <p className="text-[10px] text-zinc-600">{label}</p>
        <p className="text-sm text-white">{value || "—"}</p>
      </div>
    </div>
    {locked && <Lock size={12} className="text-zinc-700" />}
  </div>
);

const MenuItem = ({ icon: Icon, label, onClick }) => (
  <button onClick={onClick} className="w-full flex items-center justify-between px-4 py-3.5 border-b border-[#1e1e1e] last:border-0 text-left hover:bg-white/[0.02] transition-colors">
    <div className="flex items-center gap-3">
      <Icon size={18} className="text-zinc-400" />
      <span className="text-sm text-white">{label}</span>
    </div>
    <ChevronRight size={16} className="text-zinc-600" />
  </button>
);

export default ProfilePage;
