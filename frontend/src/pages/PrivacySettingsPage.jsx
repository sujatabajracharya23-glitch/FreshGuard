import React, { useState } from "react";
import { api } from "../api/client.js";

const VISIBILITY_OPTIONS = [
  { value: "public", label: "Public - visible to all FreshGuard users" },
  { value: "household_only", label: "Household only - visible to your household" },
  { value: "private", label: "Private - hidden from listings" },
];

export default function PrivacySettingsPage({ session }) {
  const [twoFaEnabled, setTwoFaEnabled] = useState(Boolean(session.user?.two_fa_enabled));
  const [visibility, setVisibility] = useState(session.user?.listing_visibility || "public");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      await api.updatePrivacy(session.user.user_id, {
        twoFaEnabled,
        listingVisibility: visibility,
      });
      setSuccess("Privacy settings updated.");
    } catch (err) {
      setError(err.body?.error || "Could not update privacy settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="page">
      <p className="eyebrow">Use Case 1 &middot; Register Users &amp; Privacy Settings</p>
      <h1>Privacy &amp; security settings</h1>
      <p className="page-intro">
        These settings can be updated anytime from your account dashboard.
      </p>

      <div className="card">
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        {success && <div className="alert alert-success" role="status">{success}</div>}

        <div className="settings-row">
          <div>
            <div className="label">Two-factor authentication (2FA)</div>
            <div className="desc">Require a one-time email code every time you log in.</div>
          </div>
          <button
            type="button"
            className={`toggle ${twoFaEnabled ? "on" : ""}`}
            role="switch"
            aria-checked={twoFaEnabled}
            aria-label="Toggle two-factor authentication"
            onClick={() => setTwoFaEnabled((v) => !v)}
          >
            <span className="knob" />
          </button>
        </div>

        <div className="settings-row" style={{ display: "block" }}>
          <div className="label" style={{ marginBottom: 4 }}>
            Food listing visibility
          </div>
          <div className="desc" style={{ marginBottom: 10 }}>
            Controls who can see items you list for donation.
          </div>
          <select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
            {VISIBILITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: 22 }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </main>
  );
}
