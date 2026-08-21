import { useEffect, useState } from 'react';
import { api } from './api';

const CATEGORIES = ['Canned', 'Frozen', 'Fresh Produce', 'Dairy', 'Bakery', 'Dry Goods', 'Other'];
const UNIT_OPTIONS = ['pcs', 'kg', 'g', 'liters', 'ml', 'pack', 'bottle'];

const emptyForm = {
  item_name: '',
  quantity: '',
  unit: 'pcs',
  category: '',
  storage_location: '',
  expiry_date: '',
  remarks: '',
};

export default function InventoryPage({ onDataChanged }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [donateTarget, setDonateTarget] = useState(null);
  const [donateForm, setDonateForm] = useState({ pickup_location: '', availability: '' });
  const [filter, setFilter] = useState('all');

  const load = async () => {
    const data = await api.getInventory(filter === 'all' ? undefined : filter);
    setItems(data);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    try {
      if (editingId) {
        await api.updateItem(editingId, form);
        setNotice('Item updated.');
      } else {
        await api.addItem(form);
        setNotice('Item added to inventory.');
      }
      resetForm();
      await load();
      onDataChanged?.();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      item_name: item.item_name,
      quantity: item.quantity,
      unit: item.unit || 'pcs',
      category: item.category,
      storage_location: item.storage_location || '',
      expiry_date: item.expiry_date,
      remarks: item.remarks || '',
    });
    setError('');
    setNotice('');
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this item from your inventory?')) return;
    await api.deleteItem(id);
    await load();
    onDataChanged?.();
  };

  const handleMarkUsed = async (id) => {
    await api.markUsed(id);
    await load();
    onDataChanged?.();
  };

  const openDonateModal = (item) => {
    setDonateTarget(item);
    setDonateForm({ pickup_location: '', availability: '' });
    setError('');
  };

  const submitDonate = async (e) => {
    e.preventDefault();
    try {
      await api.donateItem(donateTarget.id, donateForm);
      setDonateTarget(null);
      setNotice(`"${donateTarget.item_name}" posted as a donation listing.`);
      await load();
      onDataChanged?.();
    } catch (err) {
      setError(err.message);
    }
  };

  const daysUntil = (dateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Manage Food Inventory</h2>
        <p className="muted">Use Case 2 — add, edit, track and donate household food items.</p>
      </div>

      <div className="box form-box">
        <h3>{editingId ? 'Edit Food Item' : 'Add Food Item'}</h3>
        <form onSubmit={handleSubmit} className="grid-form" noValidate>
          <label>
            Item name *
            <input name="item_name" value={form.item_name} onChange={handleChange} placeholder="e.g. Milk" />
          </label>
          <label>
            Quantity *
            <input name="quantity" type="number" min="1" value={form.quantity} onChange={handleChange} placeholder="e.g. 2" />
          </label>
          <label>
            Unit *
            <select name="unit" value={form.unit} onChange={handleChange}>
              {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </label>
          <label>
            Category *
            <select name="category" value={form.category} onChange={handleChange}>
              <option value="">Select category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Expiry date *
            <input name="expiry_date" type="date" value={form.expiry_date} onChange={handleChange} />
          </label>
          <label>
            Storage location
            <input name="storage_location" value={form.storage_location} onChange={handleChange} placeholder="Fridge / Pantry / Freezer" />
          </label>
          <label>
            Remarks
            <input name="remarks" value={form.remarks} onChange={handleChange} placeholder="Optional notes" />
          </label>

          <div className="form-actions">
            <button type="submit" className="btn primary">{editingId ? 'Save Changes' : 'Add Item'}</button>
            {editingId && <button type="button" className="btn" onClick={resetForm}>Cancel</button>}
          </div>
        </form>
        {error && <p className="alert error">{error}</p>}
        {notice && <p className="alert success">{notice}</p>}
      </div>

      <div className="box">
        <div className="list-header">
          <h3>Your Inventory</h3>
          <div className="filter-group">
            {['all', 'active', 'donation', 'used'].map((f) => (
              <button
                key={f}
                className={`chip ${filter === f ? 'chip-active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f[0].toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {items.length === 0 ? (
          <p className="muted">No items found. Please adjust your filters or add a food item above.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Category</th>
                <th>Storage</th>
                <th>Expiry</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const d = daysUntil(item.expiry_date);
                const soon = item.status === 'active' && d <= 3;
                return (
                  <tr key={item.id} className={soon ? 'row-warning' : ''}>
                    <td>{item.item_name}{item.remarks ? <span className="hint"> — {item.remarks}</span> : null}</td>
                    <td>{item.quantity} {item.unit}</td>
                    <td>{item.category}</td>
                    <td>{item.storage_location || '—'}</td>
                    <td>{item.expiry_date}{soon && <span className="badge">expiring soon</span>}</td>
                    <td><span className={`status status-${item.status}`}>{item.status}</span></td>
                    <td className="actions">
                      {item.status === 'active' && (
                        <>
                          <button className="btn small" onClick={() => startEdit(item)}>Edit</button>
                          <button className="btn small" onClick={() => handleMarkUsed(item.id)}>Mark Used</button>
                          <button className="btn small primary" onClick={() => openDonateModal(item)}>Convert to Donation</button>
                        </>
                      )}
                      <button className="btn small danger" onClick={() => handleDelete(item.id)}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {donateTarget && (
        <div className="modal-backdrop" onClick={() => setDonateTarget(null)}>
          <div className="modal box" onClick={(e) => e.stopPropagation()}>
            <h3>Convert "{donateTarget.item_name}" to Donation</h3>
            <p className="muted">Confirm and provide pickup details to create the donation listing.</p>
            <form onSubmit={submitDonate} className="grid-form">
              <label>
                Pickup location *
                <input
                  value={donateForm.pickup_location}
                  onChange={(e) => setDonateForm({ ...donateForm, pickup_location: e.target.value })}
                  placeholder="e.g. Block A Lobby"
                />
              </label>
              <label>
                Availability *
                <input
                  value={donateForm.availability}
                  onChange={(e) => setDonateForm({ ...donateForm, availability: e.target.value })}
                  placeholder="e.g. Evenings 6–9pm"
                />
              </label>
              <div className="form-actions">
                <button type="submit" className="btn primary">Confirm Donation</button>
                <button type="button" className="btn" onClick={() => setDonateTarget(null)}>Cancel</button>
              </div>
            </form>
            {error && <p className="alert error">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
