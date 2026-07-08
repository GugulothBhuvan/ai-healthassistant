// Main App shell — v3 navigation: Home · Trends · [Mic FAB] · Health · You
// Manages navigation, authentication loading, responsive views, toasts, and offline banners.

import React, { useEffect, useState } from "react";
import { TOKENS } from "./tokens.js";
import { bootstrapSession } from "./lib/supabase.js";
import { apiFetch } from "./lib/api.js";
import { t } from "./lib/copy.js";
import { useToast } from "./ui/Feedback.jsx";
import { AppStateProvider } from "./lib/useAppState.jsx";

// Import Screens
import Onboarding from "./screens/Onboarding.jsx";
import Home from "./screens/Home.jsx";
import Trends from "./screens/Trends.jsx";
import Health from "./screens/Health.jsx";
import Profile from "./screens/Profile.jsx";
import ComposerSheet from "./assistant/ComposerSheet.jsx";
import GuidedTour from "./screens/GuidedTour.jsx";

// Import icons
import { Home as HomeIcon, TrendingUp, Heart, User, Mic, AlertCircle, Sparkles } from "lucide-react";

export function App() {
  const [sessionLoading, setSessionLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState("home"); // home, trends, health, profile
  const [targets, setTargets] = useState(null);

  // Composer & network state
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerMode, setComposerMode] = useState("text"); // text | camera
  const [composerPlaceholder, setComposerPlaceholder] = useState("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showTour, setShowTour] = useState(false);
  const toast = useToast();

  // Authenticate session and check profile status
  const initializeApp = async () => {
    try {
      setSessionLoading(true);
      await bootstrapSession();

      // Fetch home to see if onboarding profile was already completed
      const data = await apiFetch("/home");
      if (data.profile_completed) {
        setTargets(data.targets);
        setOnboardingCompleted(true);
        // Show guided tour for returning users who haven't seen it
        if (!localStorage.getItem("aarogya_tour_seen")) {
          setTimeout(() => setShowTour(true), 800);
        }
      } else {
        setOnboardingCompleted(false);
      }
    } catch (err) {
      console.error("Initialization failed:", err.message);
      // Fallback in case backend is offline on startup
      setOnboardingCompleted(false);
    } finally {
      setSessionLoading(false);
    }
  };

  useEffect(() => {
    initializeApp();

    // Setup network listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleOnboardingFinished = (computedTargets, reportId) => {
    setTargets(computedTargets);
    setOnboardingCompleted(true);
    setActiveTab("home");
    toast(t("toast.plainConfirm"), { tone: "success" });
    // Show guided tour if not seen before
    if (!localStorage.getItem("aarogya_tour_seen")) {
      setTimeout(() => setShowTour(true), 600); // brief delay so DOM renders
    }
  };

  const handleLogCommitted = (confirmRes) => {
    toast(t(confirmRes.toast_key, confirmRes.toast_slots), { tone: "success" });
    // Reload active tab state by remounting
    if (activeTab === "home") {
      setActiveTab("trends");
      setTimeout(() => setActiveTab("home"), 50);
    }
  };

  const handleReset = () => {
    setOnboardingCompleted(false);
    setTargets(null);
    setShowTour(false);
    // Clear tour flag so it replays after re-onboarding
    localStorage.removeItem("aarogya_tour_seen");
  };

  const openAssistant = (mode = "text", placeholder = "") => {
    setComposerMode(mode);
    setComposerPlaceholder(placeholder);
    setIsComposerOpen(true);
  };

  if (sessionLoading) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: TOKENS.colors.bg,
        fontFamily: TOKENS.fonts.data,
        color: TOKENS.colors.textDark
      }}>
        <div style={{
          width: "40px",
          height: "40px",
          border: `4px solid ${TOKENS.colors.border}`,
          borderTopColor: TOKENS.colors.primary,
          borderRadius: "50%",
          animation: "spin 1s linear infinite"
        }} />
        <p style={{ marginTop: "16px", fontSize: "14px", color: TOKENS.colors.textMuted }}>
          Connecting to Aarogya...
        </p>
      </div>
    );
  }

  // Keyframes for animations
  const animationStyles = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes slideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translate(-50%, -20px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }
  `;

  // Nav items definition
  const navItems = [
    { id: "home", label: "Home", icon: HomeIcon },
    { id: "trends", label: "Trends", icon: TrendingUp },
    { id: "__fab__", label: "" },
    { id: "health", label: "Health", icon: Heart },
    { id: "profile", label: "You", icon: User },
  ];

  return (
    <div style={{ background: TOKENS.colors.bg, minHeight: "100vh" }}>
      <style>{animationStyles}</style>

      {/* Global Offline Banner */}
      {!isOnline && (
        <div style={{
          background: TOKENS.colors.red,
          color: "#ffffff",
          padding: "8px",
          textAlign: "center",
          fontSize: "12px",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          fontFamily: TOKENS.fonts.data
        }}>
          <AlertCircle size={14} />
          <span>Working offline. Logs will queue and sync when back online.</span>
        </div>
      )}

      {/* Main Flow Logic */}
      {!onboardingCompleted ? (
        <Onboarding onCompleted={handleOnboardingFinished} />
      ) : (
        /* Authenticated Main App Shell */
        <AppStateProvider>
          <div style={{ display: "flex", minHeight: "100vh" }}>

            {/* 1. WIDE VIEW: Left Sidebar Navigation (min-width: 640px) */}
            <div className="wide-sidebar" style={{
              width: "240px",
              background: TOKENS.colors.surface,
              borderRight: `1px solid ${TOKENS.colors.border}`,
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxSizing: "border-box"
            }}>
              <div>
                {/* Logo */}
                <div style={{
                  fontFamily: TOKENS.fonts.assistant,
                  fontSize: "22px",
                  fontWeight: 500,
                  color: TOKENS.colors.primary,
                  marginBottom: "32px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <Sparkles size={20} />
                  <span>Aarogya</span>
                </div>

                {/* Sidebar Links */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <button
                    onClick={() => setActiveTab("home")}
                    style={sidebarBtnStyle(activeTab === "home")}
                  >
                    <HomeIcon size={18} /> Home
                  </button>
                  <button
                    id="sidebar-trends"
                    onClick={() => setActiveTab("trends")}
                    style={sidebarBtnStyle(activeTab === "trends")}
                  >
                    <TrendingUp size={18} /> Trends
                  </button>
                  <button
                    id="sidebar-health"
                    onClick={() => setActiveTab("health")}
                    style={sidebarBtnStyle(activeTab === "health")}
                  >
                    <Heart size={18} /> Health
                  </button>
                  <button
                    onClick={() => setActiveTab("profile")}
                    style={sidebarBtnStyle(activeTab === "profile")}
                  >
                    <User size={18} /> You
                  </button>
                </div>
              </div>

              {/* Persistent Sidebar Composer Trigger */}
              <button
                id="sidebar-mic"
                onClick={() => openAssistant("text")}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: TOKENS.gradients.fab,
                  color: "#ffffff",
                  border: "none",
                  borderRadius: TOKENS.borderRadius.input,
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                <Mic size={18} /> Speak or Type
              </button>
            </div>

            {/* Core Content Area */}
            <div style={{
              flex: 1,
              padding: "24px 20px",
              maxWidth: "600px",
              margin: "0 auto",
              boxSizing: "border-box"
            }}>
              {activeTab === "home" && <Home onOpenAssistant={openAssistant} onNavigateToHealth={() => setActiveTab("health")} />}
              {activeTab === "trends" && <Trends />}
              {activeTab === "health" && <Health onOpenAssistant={openAssistant} />}
              {activeTab === "profile" && (
                <Profile
                  onReset={handleReset}
                  onReplayTour={() => {
                    localStorage.removeItem("aarogya_tour_seen");
                    setActiveTab("home");
                    setTimeout(() => {
                      setShowTour(true);
                    }, 150);
                  }}
                />
              )}
            </div>

            {/* 2. NARROW VIEW: Bottom Navigation Bar (<640px) */}
            <div className="narrow-bottom-nav" style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              height: "64px",
              background: TOKENS.colors.surface,
              borderTop: `1px solid ${TOKENS.colors.border}`,
              boxShadow: TOKENS.shadows.bottomNav,
              display: "flex",
              justifyContent: "space-around",
              alignItems: "center",
              padding: "0 10px",
              zIndex: 900
            }}>
              {navItems.map((item) => {
                if (item.id === "__fab__") {
                  return (
                    <button
                      key="fab"
                      id="fab-mic"
                      onClick={() => openAssistant("text")}
                      style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "50%",
                        background: TOKENS.gradients.fab,
                        color: "#ffffff",
                        border: "3px solid #FFFFFF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 3px 10px rgba(23, 89, 74, 0.3)",
                        marginTop: "-28px",
                        cursor: "pointer"
                      }}
                    >
                      <Mic size={22} />
                    </button>
                  );
                }
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`tab-${item.id}`}
                    onClick={() => setActiveTab(item.id)}
                    style={navBtnStyle(isActive)}
                  >
                    <Icon size={20} />
                    <span style={{ fontSize: "10px", marginTop: "2px" }}>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Style toggler to support responsive hiding via media queries */}
            <style>{`
              @media (max-width: 640px) {
                .wide-sidebar { display: none !important; }
                .narrow-bottom-nav { display: flex !important; }
              }
              @media (min-width: 641px) {
                .wide-sidebar { display: flex !important; }
                .narrow-bottom-nav { display: none !important; }
              }
            `}</style>

            {/* Assistant overlay ComposerSheet */}
            <ComposerSheet
              isOpen={isComposerOpen}
              onClose={() => { setIsComposerOpen(false); setComposerMode("text"); setComposerPlaceholder(""); }}
              onLogCommitted={handleLogCommitted}
              initialMode={composerMode}
              initialPlaceholder={composerPlaceholder}
            />

            {/* Guided Tour (post-onboarding spotlight walkthrough) */}
            {showTour && (
              <GuidedTour onComplete={() => setShowTour(false)} />
            )}
          </div>
        </AppStateProvider>
      )}
    </div>
  );
}

// Nav button styles (bottom bar)
const navBtnStyle = (isActive) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  background: "none",
  border: "none",
  color: isActive ? TOKENS.colors.primary : TOKENS.colors.textMuted,
  cursor: "pointer",
  fontFamily: TOKENS.fonts.data
});

// Sidebar button styles
const sidebarBtnStyle = (isActive) => ({
  display: "flex",
  alignItems: "center",
  gap: "10px",
  width: "100%",
  padding: "12px 16px",
  borderRadius: "8px",
  border: "none",
  background: isActive ? TOKENS.colors.primaryLight : "transparent",
  color: isActive ? TOKENS.colors.primary : TOKENS.colors.textDark,
  fontSize: "14px",
  fontWeight: isActive ? 600 : 500,
  textAlign: "left",
  cursor: "pointer",
  fontFamily: TOKENS.fonts.data,
  transition: "all 0.2s ease"
});

export default App;
