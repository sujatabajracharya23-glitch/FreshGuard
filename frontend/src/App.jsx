import React, { useState, useEffect } from "react";
import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import RegisterPage from "./pages/RegisterPage.jsx";
import VerifyEmailPage from "./pages/VerifyEmailPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import PrivacySettingsPage from "./pages/PrivacySettingsPage.jsx";
import AnalyticsDashboard from "./pages/AnalyticsDashboard.jsx";

export default function App() {
  const [session, setSession] = useState(() => {
    const raw = localStorage.getItem("freshguard_session");
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    if (session) localStorage.setItem("freshguard_session", JSON.stringify(session));
    else localStorage.removeItem("freshguard_session");
  }, [session]);

  return (
    <div className="app-shell">
      <nav className="top-nav">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          FreshGuard
        </div>
        <div className="nav-links">
          {!session && (
            <>
              <NavLink to="/register">Register</NavLink>
              <NavLink to="/login">Log in</NavLink>
            </>
          )}
          {session && (
            <>
              <NavLink to="/analytics">Food Analytics</NavLink>
              <NavLink to="/privacy-settings">Privacy Settings</NavLink>
              <button className="link-btn" style={{ color: "#fff" }} onClick={() => setSession(null)}>
                Log out
              </button>
            </>
          )}
        </div>
      </nav>

      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/login" element={<LoginPage onLogin={setSession} />} />
        <Route
          path="/privacy-settings"
          element={session ? <PrivacySettingsPage session={session} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/analytics"
          element={session ? <AnalyticsDashboard session={session} /> : <Navigate to="/login" replace />}
        />
        <Route path="*" element={<Navigate to={session ? "/analytics" : "/register"} replace />} />
      </Routes>
    </div>
  );
}
