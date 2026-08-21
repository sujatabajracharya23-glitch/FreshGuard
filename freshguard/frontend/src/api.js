// api.js - small fetch wrapper for the FreshGuard backend (UC2 + UC5)
const BASE_URL = 'http://localhost:5000/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong');
  }
  return data;
}

export const api = {
  // UC2 - Manage Food Inventory
  getInventory: (status) => request(`/inventory${status ? `?status=${status}` : ''}`),
  addItem: (item) => request('/inventory', { method: 'POST', body: JSON.stringify(item) }),
  updateItem: (id, item) => request(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(item) }),
  deleteItem: (id) => request(`/inventory/${id}`, { method: 'DELETE' }),
  markUsed: (id) => request(`/inventory/${id}/used`, { method: 'POST' }),
  donateItem: (id, details) => request(`/inventory/${id}/donate`, { method: 'POST', body: JSON.stringify(details) }),

  // UC5 - View Notifications
  getNotifications: () => request('/notifications'),
  getNotification: (id) => request(`/notifications/${id}`),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllRead: () => request('/notifications/read-all', { method: 'PUT' }),
};
