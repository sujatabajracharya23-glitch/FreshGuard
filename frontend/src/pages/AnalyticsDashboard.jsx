import React, { useEffect, useState, useCallback } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { api } from "../api/client.js";

const RANGES = [
  { value: "weekly", label: "Past 7 days" },
  { value: "monthly", label: "Past 30 days" },
  { value: "all", label: "All time" },
];

const SLICE_COLORS = ["#2f6b4f", "#4a8f6d", "#e6a13d", "#c1503b", "#8fb9a1", "#a9c9b7"];

export default function AnalyticsDashboard({ session }) {
  const [range, setRange] = useState("all");
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getAnalyticsSummary(session.user.user_id, range);
      setSummary(data);
    } catch (err) {
      setError(err.body?.error || "Could not load your analytics.");
    } finally {
      setLoading(false);
    }
  }, [range, session.user.user_id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main className="page">
      <p className="eyebrow">Use Case 4 &middot; Food Analytics</p>
      <h1>Track your impact</h1>
      <p className="page-intro">
        See how much food you've saved from waste and how much you've donated back to the community.
      </p>

      <div className="filter-bar">
        <label htmlFor="range" style={{ fontSize: "0.85rem", fontWeight: 600 }}>
          Show:
        </label>
        <select id="range" value={range} onChange={(e) => setRange(e.target.value)}>
          {RANGES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      {loading && <p style={{ color: "var(--color-muted)" }}>Loading your analytics...</p>}

      {!loading && summary && !summary.hasData && (
        <div className="empty-state">
          <div className="empty-icon" aria-hidden="true">
            🌱
          </div>
          <h3>No activity yet</h3>
          <p>{summary.message}</p>
        </div>
      )}

      {!loading && summary && summary.hasData && (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-value">{summary.itemsSaved}</div>
              <div className="stat-label">Items saved from waste</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{summary.quantitySaved}</div>
              <div className="stat-label">Total quantity saved</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{summary.donationsMade}</div>
              <div className="stat-label">Donations completed</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{summary.donatedQuantity}</div>
              <div className="stat-label">Quantity donated</div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 8 }}>
            <h3 style={{ marginBottom: 18 }}>Saved items by category</h3>
            {summary.categoryBreakdown.length === 0 ? (
              <p style={{ color: "var(--color-muted)" }}>No category data for this range yet.</p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
                <div style={{ width: 320, height: 260 }}>
                  <ResponsiveContainer>
                    <BarChart data={summary.categoryBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e3e0d6" />
                      <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#2f6b4f" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ width: 320, height: 260 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={summary.categoryBreakdown}
                        dataKey="count"
                        nameKey="category"
                        outerRadius={90}
                        label
                      >
                        {summary.categoryBreakdown.map((entry, idx) => (
                          <Cell key={entry.category} fill={SLICE_COLORS[idx % SLICE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}
