import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { api } from "../api/client.js";

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get("email") || "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [expired, setExpired] = useState(false);
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();

  async function handleVerify(e) {
    e.preventDefault();
    setError("");
    setExpired(false);
    setSuccess("");

    if (!email || !code) {
      setError("Please complete all required fields");
      return;
    }

    setLoading(true);
    try {
      const res = await api.verifyEmail({ email, code, newPassword: newPassword || undefined });
      setSuccess(res.message);
      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      // Line 6: invalid or expired verification code
      setError(err.body?.error || "Verification failed.");
      setExpired(Boolean(err.body?.expired));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    setSuccess("");
    if (!email) {
      setError("Enter your email address first so we know where to send the new code.");
      return;
    }
    setResending(true);
    try {
      const res = await api.resendCode({ email });
      setSuccess(res.message);
      setExpired(false);
    } catch (err) {
      setError(err.body?.error || "Could not resend the code.");
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="page">
      <p className="eyebrow">Use Case 1 &middot; Register Users &amp; Privacy Settings</p>
      <h1>Confirm your email</h1>
      <p className="page-intro">
        Enter the 6-digit code we emailed you. You can optionally set a new password here too.
      </p>

      <div className="card">
        {error && (
          <div className="alert alert-error" role="alert">
            {error}
            {expired && (
              <div style={{ marginTop: 8 }}>
                <button className="link-btn" onClick={handleResend} disabled={resending}>
                  {resending ? "Sending..." : "Request a new code"}
                </button>
              </div>
            )}
          </div>
        )}
        {success && <div className="alert alert-success" role="status">{success}</div>}

        <form className="form-grid" onSubmit={handleVerify} noValidate>
          <div className="field">
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="code">6-digit verification code</label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
            />
          </div>

          <div className="field">
            <label htmlFor="newPassword">New password (optional)</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Leave blank to keep your current password"
            />
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Verifying..." : "Activate account"}
          </button>
          <button type="button" className="link-btn" onClick={handleResend} disabled={resending}>
            {resending ? "Sending..." : "Didn't get a code? Resend"}
          </button>
        </form>
      </div>

      <p style={{ marginTop: 18, color: "var(--color-muted)" }}>
        <Link to="/register">Back to registration</Link>
      </p>
    </main>
  );
}
