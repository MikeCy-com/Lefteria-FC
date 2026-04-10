import { useState } from "react";
import { useMobileAuth } from "./MobileAuthContext";
import BottomNav from "./components/BottomNav";
import MobileLoginPage from "./pages/MobileLoginPage";
import ParentDashboard from "./pages/ParentDashboard";
import SchedulePage from "./pages/SchedulePage";
import MatchesPage from "./pages/MatchesPage";
import ChatPage from "./pages/ChatPage";
import ProfilePage from "./pages/ProfilePage";
import CoachDashboard from "./pages/CoachDashboard";
import PlayerDashboard from "./pages/PlayerDashboard";
import ManagementDashboard from "./pages/ManagementDashboard";

const MobileApp = () => {
  const { user } = useMobileAuth();
  const [activeTab, setActiveTab] = useState("home");

  if (!user) return <MobileLoginPage />;

  const renderContent = () => {
    const role = user.role;
    switch (activeTab) {
      case "home":
        if (role === "coach") return <CoachDashboard onTabChange={setActiveTab} />;
        if (role === "player") return <PlayerDashboard onTabChange={setActiveTab} />;
        if (role === "management") return <ManagementDashboard onTabChange={setActiveTab} />;
        return <ParentDashboard onTabChange={setActiveTab} />;
      case "calendar":
        return <SchedulePage />;
      case "matches":
        return <MatchesPage />;
      case "chat":
        return <ChatPage />;
      case "profile":
        return <ProfilePage />;
      default:
        return <ParentDashboard onTabChange={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white max-w-md mx-auto relative" data-testid="mobile-app">
      <div className="pb-20">
        {renderContent()}
      </div>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default MobileApp;
