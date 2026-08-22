import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api/client.js";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFACode, setTwoFACode] = useState("");
  const [pendingUserId, setPendingUserId] = useState(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!email || !password) {
      setError("Please complete all required fields");
      return;
    }

    setLoading(true);
    try {
      const res = await api.login({ email, password });
      if (res.requires2FA) {
        setPendingUserId(res.userId);
        setInfo(res.message);
      } else {
        onLogin({ token: res.token, user: res.user });
        navigate("/analytics");
      }
    } catch (err) {
      setError(err.body?.error || "Login failed.");
      if (err.body?.needsVerification) {
        setTimeout(() => navigate(`/verify-email?email=${encodeURIComponent(email)}`), 1200);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify2FA(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.verify2FA({ userId: pendingUserId, code: twoFACode });
      onLogin({ token: res.token, user: res.user });
      navigate("/analytics");
    } catch (err) {
      setError(err.body?.error || "2FA verification failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <p className="eyebrow">Use Case 1 &middot; Register Users &amp; Privacy Settings</p>
      <h1>Welcome back</h1>
      <p className="page-intro">Log in to view your food-saving analytics and manage your privacy settings.</p>

      <div className="card">
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        {info && <div className="alert alert-success" role="status">{info}</div>}

        {!pendingUserId ? (
          <form className="form-grid" onSubmit={handleLogin} noValidate>
            <div className="field">
              <label htmlFor="email">Email address</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>
        ) : (
          <form className="form-grid" onSubmit={handleVerify2FA} noValidate>
            <div className="field">
              <label htmlFor="twoFACode">2FA code</label>
              <input
                id="twoFACode"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={twoFACode}
                onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Verifying..." : "Verify and log in"}
            </button>
          </form>
        )}
      </div>

      <p style={{ marginTop: 18, color: "var(--color-muted)" }}>
        New to FreshGuard? <Link to="/register">Create an account</Link>
      </p>
    </main>
  );
}
