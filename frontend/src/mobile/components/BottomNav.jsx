import { Home, Calendar, MessageCircle, User } from "lucide-react";
import { useMobileAuth } from "../MobileAuthContext";

const TABS = [
  { id: "home", label: "Αρχική", icon: Home },
  { id: "schedule", label: "Πρόγραμμα", icon: Calendar },
  { id: "chat", label: "Μηνύματα", icon: MessageCircle },
  { id: "profile", label: "Προφίλ", icon: User },
];

const BottomNav = ({ activeTab, onTabChange }) => {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/95 backdrop-blur-lg border-t border-[#1e1e1e] z-[9999]"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      data-testid="bottom-nav"
    >
      <div className="flex items-center justify-around h-14 max-w-md mx-auto">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center w-16 h-full transition-all ${
                isActive ? "text-[#F5A623]" : "text-zinc-500"
              }`}
              data-testid={`nav-${tab.id}`}
            >
              <tab.icon size={20} strokeWidth={isActive ? 2.2 : 1.5} />
              <span className={`text-[9px] mt-0.5 ${isActive ? "font-semibold" : ""}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
