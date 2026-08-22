const BASE_URL = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.error || "Request failed");
    error.status = res.status;
    error.body = data;
    throw error;
  }
  return data;
}

export const api = {
  register: (payload) => request("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  verifyEmail: (payload) => request("/auth/verify-email", { method: "POST", body: JSON.stringify(payload) }),
  resendCode: (payload) => request("/auth/resend-code", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload) => request("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  verify2FA: (payload) => request("/auth/verify-2fa", { method: "POST", body: JSON.stringify(payload) }),
  updatePrivacy: (userId, payload) =>
    request(`/auth/privacy-settings/${userId}`, { method: "PATCH", body: JSON.stringify(payload) }),
  getAnalyticsSummary: (userId, range = "all", category = "") =>
    request(`/analytics/summary?userId=${userId}&range=${range}${category ? `&category=${category}` : ""}`),
};
