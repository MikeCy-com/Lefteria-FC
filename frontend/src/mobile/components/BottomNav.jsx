import { Home, Calendar, Bell, User, BarChart3, Users, Euro, ClipboardList } from "lucide-react";
import { useMobileAuth } from "../MobileAuthContext";

const ROLE_TABS = {
  parent: [
    { id: "home", label: "Αρχική", icon: Home },
    { id: "schedule", label: "Πρόγραμμα", icon: Calendar },
    { id: "news", label: "Νέα", icon: Bell },
    { id: "profile", label: "Προφίλ", icon: User },
  ],
  coach: [
    { id: "home", label: "Αρχική", icon: Home },
    { id: "team", label: "Ομάδα", icon: Users },
    { id: "schedule", label: "Πρόγραμμα", icon: Calendar },
    { id: "news", label: "Νέα", icon: Bell },
    { id: "profile", label: "Προφίλ", icon: User },
  ],
  player: [
    { id: "home", label: "Αρχική", icon: Home },
    { id: "stats", label: "Στατιστικά", icon: BarChart3 },
    { id: "schedule", label: "Πρόγραμμα", icon: Calendar },
    { id: "news", label: "Νέα", icon: Bell },
    { id: "profile", label: "Προφίλ", icon: User },
  ],
  management: [
    { id: "home", label: "Αρχική", icon: Home },
    { id: "teams", label: "Ομάδες", icon: Users },
    { id: "financial", label: "Οικονομικά", icon: Euro },
    { id: "news", label: "Νέα", icon: Bell },
    { id: "profile", label: "Προφίλ", icon: User },
  ],
};

const BottomNav = ({ activeTab, onTabChange }) => {
  const { user } = useMobileAuth();
  const role = user?.role || "parent";
  const tabs = ROLE_TABS[role] || ROLE_TABS.parent;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-[#1e1e1e] z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      data-testid="bottom-nav"
    >
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 transition-colors ${
                isActive ? "text-[#F5A623]" : "text-zinc-500"
              }`}
              data-testid={`nav-${tab.id}`}
            >
              <tab.icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
