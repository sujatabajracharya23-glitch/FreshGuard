import { useState } from 'react';
import InventoryPage from './InventoryPage';
import NotificationsPage from './NotificationsPage';
import './index.css';

export default function App() {
  const [tab, setTab] = useState('inventory');
  const [refreshSignal, setRefreshSignal] = useState(0);

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">🥗</span>
          <div>
            <h1>FreshGuard</h1>
            <span className="muted small">Guarding Food From Waste — Iteration 1 Prototype</span>
          </div>
        </div>
        <nav className="tabs">
          <button className={`tab ${tab === 'inventory' ? 'tab-active' : ''}`} onClick={() => setTab('inventory')}>
            Food Inventory
          </button>
          <button className={`tab ${tab === 'notifications' ? 'tab-active' : ''}`} onClick={() => setTab('notifications')}>
            Notifications
          </button>
        </nav>
      </header>

      <main className="app-main">
        {tab === 'inventory' && <InventoryPage onDataChanged={() => setRefreshSignal((s) => s + 1)} />}
       {tab === 'notifications' && (
          <NotificationsPage refreshSignal={refreshSignal} onNavigateToInventory={() => setTab('inventory')} />
        )}
      </main>

      <footer className="app-footer">
        <span>Module owner: Sujata Bajracharya — UC2 Manage Food Inventory · UC5 View Notifications</span>
      </footer>
    </div>
  );
}
