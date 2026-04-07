import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useMobileAuth } from "./MobileAuthContext";
import MobileHeader from "./components/MobileHeader";
import BottomNav from "./components/BottomNav";
import ParentDashboard from "./pages/ParentDashboard";
import CoachDashboard from "./pages/CoachDashboard";
import PlayerDashboard from "./pages/PlayerDashboard";
import ManagementDashboard from "./pages/ManagementDashboard";
import SchedulePage from "./pages/SchedulePage";
import NewsPage from "./pages/NewsPage";
import ProfilePage from "./pages/ProfilePage";
import { RefreshCw } from "lucide-react";

const HEADER_TITLES = {
  home: "ΛΕΥΤΕΡΙΑ FC",
  schedule: "Πρόγραμμα",
  news: "Ανακοινώσεις",
  profile: "Προφίλ",
  team: "Ομάδα",
  teams: "Ομάδες",
  stats: "Στατιστικά",
  financial: "Οικονομικά",
};

const MobileApp = () => {
  const { user, loading } = useMobileAuth();
  const [activeTab, setActiveTab] = useState("home");

  // Register service worker for PWA
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw-mobile.js").catch(() => {});
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <RefreshCw size={24} className="animate-spin text-[#F5A623]" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/app/login" replace />;
  }

  const role = user.role;

  const renderContent = () => {
    switch (activeTab) {
      case "schedule":
        return <SchedulePage />;
      case "news":
        return <NewsPage />;
      case "profile":
        return <ProfilePage />;
      case "team":
      case "teams":
        // Coach/Management team view reuses their dashboard team section
        if (role === "coach") return <CoachDashboard onTabChange={setActiveTab} />;
        if (role === "management") return <ManagementDashboard onTabChange={setActiveTab} />;
        return null;
      case "stats":
        // Player stats reuses player dashboard
        if (role === "player") return <PlayerDashboard onTabChange={setActiveTab} />;
        return null;
      case "financial":
        if (role === "management") return <ManagementDashboard onTabChange={setActiveTab} />;
        return null;
      case "home":
      default:
        switch (role) {
          case "parent": return <ParentDashboard onTabChange={setActiveTab} />;
          case "coach": return <CoachDashboard onTabChange={setActiveTab} />;
          case "player": return <PlayerDashboard onTabChange={setActiveTab} />;
          case "management": return <ManagementDashboard onTabChange={setActiveTab} />;
          default: return <ParentDashboard onTabChange={setActiveTab} />;
        }
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] max-w-lg mx-auto relative" data-testid="mobile-app">
      <MobileHeader title={HEADER_TITLES[activeTab]} />
      <main className="pb-16">
        {renderContent()}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default MobileApp;
