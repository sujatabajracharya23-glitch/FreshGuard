import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api/client.js";

const initialForm = { fullName: "", email: "", password: "", householdSize: "" };

export default function RegisterPage() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.fullName || !form.email || !form.password) {
      setError("Please complete all required fields");
      return;
    }

    setLoading(true);
    try {
      const res = await api.register({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        householdSize: form.householdSize ? Number(form.householdSize) : null,
      });
      setSuccess(res.message);
      setTimeout(() => navigate(`/verify-email?email=${encodeURIComponent(form.email)}`), 900);
    } catch (err) {
      // 3a: email already registered by another user
      setError(err.body?.error || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <p className="eyebrow">Use Case 1 &middot; Register Users &amp; Privacy Settings</p>
      <h1>Create your FreshGuard account</h1>
      <p className="page-intro">
        Track your household's food, cut down on waste, and share extras with your community.
        We'll email you a 6-digit code to confirm your address before your account goes live.
      </p>

      <div className="card">
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        {success && <div className="alert alert-success" role="status">{success}</div>}

        <form className="form-grid" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="fullName">Full name</label>
            <input
              id="fullName"
              type="text"
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              placeholder="e.g. Simran Gopali"
            />
          </div>

          <div className="field">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="At least 8 characters"
            />
            <span className="hint">Use at least 8 characters.</span>
          </div>

          <div className="field">
            <label htmlFor="householdSize">Household size (optional)</label>
            <input
              id="householdSize"
              type="number"
              min="1"
              value={form.householdSize}
              onChange={(e) => update("householdSize", e.target.value)}
              placeholder="e.g. 4"
            />
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>
      </div>

      <p style={{ marginTop: 18, color: "var(--color-muted)" }}>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </main>
  );
}
