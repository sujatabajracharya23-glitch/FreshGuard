import { useEffect, useState } from 'react';
import { api } from './api';

const TYPE_LABEL = {
  expiry: 'Inventory Alert',
  donation: 'Donation Update',
  meal: 'Meal Planning Reminder',
  account: 'Account Alert',
};

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr.replace(' ', 'T') + 'Z');
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)} day(s) ago`;
}

export default function NotificationsPage({ refreshSignal, onNavigateToInventory }) {
  const [notifications, setNotifications] = useState([]);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    const data = await api.getNotifications();
    setNotifications(data);
  };

  useEffect(() => {
    load();
  }, [refreshSignal]);

  const openNotification = async (n) => {
    if (!n.is_read) {
      await api.markNotificationRead(n.id);
      await load();
    }
    const detail = await api.getNotification(n.id);
    setSelected(detail);
  };

  const markAllRead = async () => {
    await api.markAllRead();
    await load();
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="page">
      <div className="page-header">
        <h2>Notifications {unreadCount > 0 && <span className="badge-count">{unreadCount}</span>}</h2>
        <p className="muted">Use Case 5 — expiry alerts, donation updates and reminders.</p>
      </div>

      <div className="box">
        <div className="list-header">
          <h3>Recent Alerts</h3>
          {notifications.length > 0 && (
            <button className="btn small" onClick={markAllRead}>Mark all as read</button>
          )}
        </div>

        {notifications.length === 0 ? (
          <p className="muted">No new notifications</p>
        ) : (
          <ul className="notif-list">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`notif-item ${n.is_read ? '' : 'notif-unread'}`}
                onClick={() => openNotification(n)}
              >
                <div className="notif-type">{TYPE_LABEL[n.type] || n.type}</div>
                <div className="notif-message">{n.message}</div>
                <div className="notif-time">{timeAgo(n.created_at)}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal box" onClick={(e) => e.stopPropagation()}>
            <h3>{TYPE_LABEL[selected.type] || selected.type}</h3>
            <p>{selected.message}</p>
            <p className="muted">{selected.created_at}</p>
            {selected.related_item && (
              <div className="box" style={{ marginTop: 12, marginBottom: 12 }}>
                <strong>{selected.related_item.item_name}</strong>
                <p className="hint" style={{ marginTop: 4 }}>
                  {selected.related_item.quantity} {selected.related_item.unit} &middot; {selected.related_item.category}
                  {' '}&middot; expires {selected.related_item.expiry_date}
                  {' '}&middot; status: <span className={`status status-${selected.related_item.status}`}>{selected.related_item.status}</span>
                </p>
              </div>
            )}
            <div className="form-actions" style={{ gridColumn: 'auto', display: 'flex', gap: 10 }}>
              {selected.related_item && (
                <button
                  className="btn primary"
                  onClick={() => {
                    setSelected(null);
                    onNavigateToInventory?.();
                  }}
                >
                  View in Inventory
                </button>
              )}
              <button className="btn" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
