import { Home, CalendarDays, MessageCircle, User, Trophy } from "lucide-react";

const TABS = [
  { id: "home", label: "Αρχικη", icon: Home },
  { id: "calendar", label: "Ημερολογιο", icon: CalendarDays },
  { id: "matches", label: "Αγωνες", icon: Trophy, isCenter: true },
  { id: "chat", label: "Μηνυματα", icon: MessageCircle },
  { id: "profile", label: "Προφιλ", icon: User },
];

const BottomNav = ({ activeTab, onTabChange, unreadCount = 0 }) => {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[9999]"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)", marginBottom: "32px" }}
      data-testid="bottom-nav"
    >
      <div className="bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-white/[0.06]">
        <div className="flex items-end justify-around h-16 max-w-md mx-auto px-2">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;

            if (tab.isCenter) {
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className="relative -mt-3 flex flex-col items-center justify-center"
                  data-testid={`nav-${tab.id}`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    isActive
                      ? "bg-[#F5A623] shadow-lg shadow-[#F5A623]/30"
                      : "bg-[#1a1a1a] border border-white/[0.08]"
                  }`}>
                    <tab.icon size={22} strokeWidth={isActive ? 2.2 : 1.5} className={isActive ? "text-black" : "text-zinc-400"} />
                  </div>
                  <span className={`text-[8px] mt-1 font-medium tracking-wide ${isActive ? "text-[#F5A623]" : "text-zinc-600"}`}>
                    {tab.label}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="relative flex flex-col items-center justify-center w-14 h-full pb-1.5 transition-all"
                data-testid={`nav-${tab.id}`}
              >
                <div className="relative">
                  <tab.icon
                    size={21}
                    strokeWidth={isActive ? 2.2 : 1.5}
                    className={`transition-colors duration-200 ${isActive ? "text-[#F5A623]" : "text-zinc-500"}`}
                  />
                  {tab.id === "chat" && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-[8px] font-bold text-white flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
                <span className={`text-[8px] mt-1 font-medium tracking-wide transition-colors duration-200 ${
                  isActive ? "text-[#F5A623]" : "text-zinc-600"
                }`}>
                  {tab.label}
                </span>
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-[#F5A623]" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
