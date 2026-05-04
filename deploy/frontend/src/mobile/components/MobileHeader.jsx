import { useMobileAuth } from "../MobileAuthContext";
import { Bell } from "lucide-react";
import { stripGreekAccents } from "../../utils/greekText";

const CLUB_LOGO = "https://customer-assets.emergentagent.com/job_club-academy-portal/artifacts/v5ncw8ht_Leyteria%20FC%20-%201_20260404_161502_0000.png";

const ROLE_LABELS = {
  parent: "Γονεας",
  coach: "Προπονητης",
  player: "Παικτης",
  management: "Διοικηση",
};

const MobileHeader = ({ title }) => {
  const { user } = useMobileAuth();

  return (
    <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-[#1e1e1e]" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2.5">
          <img src={CLUB_LOGO} alt="" className="w-10 h-10" />
          <div>
            <h1 className="text-white text-xs font-semibold leading-tight tracking-wide">{stripGreekAccents(title || "ΛΕΥΤΕΡΙΑ FC")}</h1>
            <span className="text-[10px] text-[#F5A623]">{ROLE_LABELS[user?.role] || ""}</span>
          </div>
        </div>
        <button className="relative text-zinc-400 hover:text-white p-2" data-testid="notifications-btn">
          <Bell size={20} />
        </button>
      </div>
    </header>
  );
};

export default MobileHeader;
