// Main App shell: manages navigation, authentication loading, responsive views, toasts, and offline banners

import React, { useEffect, useState } from "react";
import { TOKENS } from "./tokens.js";
import { bootstrapSession } from "./lib/supabase.js";
import { apiFetch } from "./lib/api.js";
import { t } from "./lib/copy.js";

// Import Screens
import Onboarding from "./screens/Onboarding.jsx";
import Home from "./screens/Home.jsx";
import Week from "./screens/Week.jsx";
import ReportPage from "./screens/ReportPage.jsx";
import Profile from "./screens/Profile.jsx";
import ComposerSheet from "./assistant/ComposerSheet.jsx";

// Import icons
import { Home as HomeIcon, Calendar, FileText, User, MessageCircle, AlertCircle, Sparkles } from "lucide-react";

export function App() {
  const [sessionLoading, setSessionLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState("home"); // home, week, report, profile
  const [targets, setTargets] = useState(null);
  
  // Composer & Toast States
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [toast, setToast] = useState(null); // { key, slots }
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

  // Display toast with automatic dimming
  const showToast = (key, slots = {}) => {
    setToast({ key, slots });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const handleOnboardingFinished = (computedTargets, reportId) => {
    setTargets(computedTargets);
    setOnboardingCompleted(true);
    setActiveTab("home");
    
    if (reportId) {
      showToast("toast.plainConfirm");
    } else {
      showToast("toast.plainConfirm");
    }
  };

  const handleLogCommitted = (confirmRes) => {
    showToast(confirmRes.toast_key, confirmRes.toast_slots);
    // Reload active tab state by remounting or direct trigger (handled by re-fetching inside screens)
    if (activeTab === "home") {
      // Reload home
      setActiveTab("week");
      setTimeout(() => setActiveTab("home"), 50);
    }
  };

  const handleReset = () => {
    setOnboardingCompleted(false);
    setTargets(null);
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

  return (
    <div style={{ background: TOKENS.colors.bg, minHeight: "100vh" }}>
      <style>{animationStyles}</style>

      {/* Global Offline Banner */}
      {!isOnline && (
        <div style={{
          background: TOKENS.colors.doctorsTerritory,
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

      {/* Toast Alert Banner */}
      {toast && (
        <div style={{
          position: "fixed",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          background: TOKENS.colors.primary,
          color: "#ffffff",
          padding: "12px 24px",
          borderRadius: TOKENS.borderRadius.badge,
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
          zIndex: 2000,
          fontSize: "14px",
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontFamily: TOKENS.fonts.data,
          animation: "fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
        }}>
          <Sparkles size={16} />
          <span>{t(toast.key, toast.slots)}</span>
        </div>
      )}

      {/* Main Flow Logic */}
      {!onboardingCompleted ? (
        <Onboarding onCompleted={handleOnboardingFinished} />
      ) : (
        /* Authenticated Main App Shell */
        <div style={{ display: "flex", minHeight: "100vh" }}>
          
          {/* Responsive Shell Switcher Layout */}
          
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
                fontWeight: "bold", 
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
                  onClick={() => setActiveTab("week")} 
                  style={sidebarBtnStyle(activeTab === "week")}
                >
                  <Calendar size={18} /> Week
                </button>
                <button 
                  onClick={() => setActiveTab("report")} 
                  style={sidebarBtnStyle(activeTab === "report")}
                >
                  <FileText size={18} /> Report
                </button>
                <button 
                  onClick={() => setActiveTab("profile")} 
                  style={sidebarBtnStyle(activeTab === "profile")}
                >
                  <User size={18} /> Profile
                </button>
              </div>
            </div>

            {/* Persistent Sidebar Composer Trigger */}
            <button
              onClick={() => setIsComposerOpen(true)}
              style={{
                width: "100%",
                padding: "12px",
                background: TOKENS.colors.primary,
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
              <MessageCircle size={18} /> Speak or Type
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
            {activeTab === "home" && <Home onNavigateToReport={() => setActiveTab("report")} />}
            {activeTab === "week" && <Week />}
            {activeTab === "report" && <ReportPage />}
            {activeTab === "profile" && <Profile onReset={handleReset} />}
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
            <button onClick={() => setActiveTab("home")} style={navBtnStyle(activeTab === "home")}>
              <HomeIcon size={20} />
              <span style={{ fontSize: "10px", marginTop: "2px" }}>Home</span>
            </button>
            <button onClick={() => setActiveTab("week")} style={navBtnStyle(activeTab === "week")}>
              <Calendar size={20} />
              <span style={{ fontSize: "10px", marginTop: "2px" }}>Week</span>
            </button>
            
            {/* Center Floating FAB trigger */}
            <button 
              onClick={() => setIsComposerOpen(true)}
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: TOKENS.colors.primary,
                color: "#ffffff",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 3px 10px rgba(44, 82, 52, 0.3)",
                transform: "translateY(-12px)",
                cursor: "pointer"
              }}
            >
              <MessageCircle size={22} />
            </button>

            <button onClick={() => setActiveTab("report")} style={navBtnStyle(activeTab === "report")}>
              <FileText size={20} />
              <span style={{ fontSize: "10px", marginTop: "2px" }}>Report</span>
            </button>
            <button onClick={() => setActiveTab("profile")} style={navBtnStyle(activeTab === "profile")}>
              <User size={20} />
              <span style={{ fontSize: "10px", marginTop: "2px" }}>You</span>
            </button>
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
            onClose={() => setIsComposerOpen(false)} 
            onLogCommitted={handleLogCommitted}
          />
        </div>
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
