import { useMobileAuth } from "../MobileAuthContext";
import { useNavigate } from "react-router-dom";
import { User, Phone, Shield, LogOut, ChevronRight, Bell, Moon, Info } from "lucide-react";

const CLUB_LOGO = "https://customer-assets.emergentagent.com/job_club-academy-portal/artifacts/v5ncw8ht_Leyteria%20FC%20-%201_20260404_161502_0000.png";

const ROLE_LABELS = {
  parent: "Γονέας / Κηδεμόνας",
  coach: "Προπονητής",
  player: "Παίκτης",
  management: "Διοίκηση",
};

const ProfilePage = () => {
  const { user, logout } = useMobileAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/app/login", { replace: true });
  };

  return (
    <div className="px-4 pb-20" data-testid="profile-page">
      {/* User Info */}
      <div className="flex flex-col items-center pt-6 pb-4">
        <div className="w-20 h-20 rounded-full bg-[#1a1a1a] border-2 border-[#F5A623]/30 overflow-hidden mb-3">
          {user?.avatar_url ? (
            <img src={user.avatar_url.startsWith("http") ? user.avatar_url : `${process.env.REACT_APP_BACKEND_URL}${user.avatar_url}`} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#F5A623] text-2xl font-bold">{user?.name?.[0]}</div>
          )}
        </div>
        <h2 className="text-white text-lg font-semibold">{user?.name}</h2>
        <span className="text-sm text-[#F5A623]">{ROLE_LABELS[user?.role] || user?.role}</span>
        <span className="text-xs text-zinc-500 mt-1">{user?.phone}</span>
      </div>

      {/* Menu Items */}
      <div className="bg-[#121212] border border-[#1e1e1e] rounded-2xl overflow-hidden mt-4">
        <MenuItem icon={User} label="Στοιχεία Λογαριασμού" />
        <MenuItem icon={Bell} label="Ειδοποιήσεις" />
        <MenuItem icon={Phone} label="Επικοινωνία" />
        <MenuItem icon={Info} label="Σχετικά" />
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
        className="w-full mt-6 bg-red-500/10 border border-red-500/20 rounded-2xl py-3.5 text-red-400 font-medium flex items-center justify-center gap-2"
        data-testid="logout-btn"
      >
        <LogOut size={18} />
        Αποσύνδεση
      </button>
    </div>
  );
};

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
