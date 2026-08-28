import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Leaf, TrendingDown, AlertTriangle, Plus, BarChart3, RefreshCw } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

function AdminSupplierWaste() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ item_name: '', quantity_unsold: '', reason: 'overproduction' });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/waste/analytics`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Failed to fetch waste analytics', err);
    }
    setLoading(false);
  };

  const handleLogWaste = async (e) => {
    e.preventDefault();
    if (!form.item_name || !form.quantity_unsold) {
      toast.error('Please fill all fields');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/waste/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_name: form.item_name,
          quantity_unsold: parseInt(form.quantity_unsold),
          reason: form.reason
        })
      });
      if (res.ok) {
        toast.success('Waste logged successfully');
        setForm({ item_name: '', quantity_unsold: '', reason: 'overproduction' });
        setShowForm(false);
        fetchAnalytics();
      } else {
        toast.error('Failed to log waste');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'from-green-400 to-green-600';
    if (score >= 50) return 'from-yellow-400 to-yellow-600';
    return 'from-red-400 to-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Waste &amp; Sustainability</h1>
          <p className="text-gray-500 text-sm">Track food waste and optimize production</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchAnalytics} className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition font-medium">
            <RefreshCw size={16} /> Refresh
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition font-medium"
          >
            <Plus size={18} /> Log Waste
          </button>
        </div>
      </div>

      {/* Waste Log Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Log Food Waste</h3>
          <form onSubmit={handleLogWaste} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text" value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })}
              placeholder="Item name (e.g. Rice)" className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            />
            <input
              type="number" value={form.quantity_unsold} onChange={(e) => setForm({ ...form, quantity_unsold: e.target.value })}
              placeholder="Qty unsold" className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            />
            <select
              value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            >
              <option value="overproduction">Overproduction</option>
              <option value="expired">Expired</option>
              <option value="damaged">Damaged</option>
              <option value="low_demand">Low Demand</option>
            </select>
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-medium">
              Submit
            </button>
          </form>
        </div>
      )}

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sustainability Score */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
          <Leaf size={28} className="mx-auto mb-2 text-green-600" />
          <p className="text-sm text-gray-500 font-medium">Sustainability Score</p>
          <p className={`text-5xl font-bold mt-2 ${getScoreColor(analytics?.sustainability_score ?? 100)}`}>
            {analytics?.sustainability_score ?? 100}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
            <div
              className={`bg-gradient-to-r ${getScoreBg(analytics?.sustainability_score ?? 100)} h-2 rounded-full transition-all`}
              style={{ width: `${analytics?.sustainability_score ?? 100}%` }}
            ></div>
          </div>
        </div>

        {/* Daily Waste */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
          <TrendingDown size={28} className="mx-auto mb-2 text-orange-600" />
          <p className="text-sm text-gray-500 font-medium">Daily Food Waste</p>
          <p className="text-5xl font-bold mt-2 text-orange-600">
            {analytics?.daily_waste_kg ?? 0}
          </p>
          <p className="text-sm text-gray-400 mt-1">kilograms</p>
        </div>

        {/* Overproduced Count */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
          <BarChart3 size={28} className="mx-auto mb-2 text-purple-600" />
          <p className="text-sm text-gray-500 font-medium">Overproduced Items</p>
          <p className="text-5xl font-bold mt-2 text-purple-600">
            {analytics?.overproduced_items?.length ?? 0}
          </p>
          <p className="text-sm text-gray-400 mt-1">items flagged</p>
        </div>
      </div>

      {/* Overproduced Items Detail */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <AlertTriangle size={18} className="text-orange-600" />
          Overproduced Items &amp; Recommendations
        </h3>
        {(!analytics?.overproduced_items || analytics.overproduced_items.length === 0) ? (
          <p className="text-gray-400 text-center py-4">No waste data yet. Start logging waste to see analytics.</p>
        ) : (
          <div className="space-y-3">
            {analytics.overproduced_items.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.wasted_units} units wasted • Est. loss: ₹{item.estimated_loss?.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-medium">
                    {item.recommendation}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminSupplierWaste;
