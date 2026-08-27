import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { TrendingUp, ShoppingBag, DollarSign, Clock, AlertTriangle, Package, Users, Activity } from 'lucide-react';

const socket = io('http://localhost:8000');

function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [capacity, setCapacity] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 15000);

    // Real-time socket listeners
    socket.on('new_order', (data) => {
      const notif = { type: 'order', message: `New order #${data.order_id} — ₹${data.total_amount}`, time: new Date() };
      setNotifications(prev => [notif, ...prev].slice(0, 20));
      toast.success(`🛒 New order #${data.order_id}!`);
      fetchDashboardData();
    });

    socket.on('low_stock_alert', (data) => {
      const notif = { type: 'stock', message: `⚠️ Low stock: ${data.name} — ${data.remaining_stock} left`, time: new Date() };
      setNotifications(prev => [notif, ...prev].slice(0, 20));
      toast.error(`Low stock: ${data.name}`);
    });

    socket.on('low_ingredient_alert', (data) => {
      const notif = { type: 'ingredient', message: `🔴 Low ingredient: ${data.name} — ${data.current_stock} remaining`, time: new Date() };
      setNotifications(prev => [notif, ...prev].slice(0, 20));
      toast.error(`Low ingredient: ${data.name}`);
    });

    socket.on('order_status_updated', (data) => {
      const notif = { type: 'status', message: `Order #${data.order_id} → ${data.status}`, time: new Date() };
      setNotifications(prev => [notif, ...prev].slice(0, 20));
    });

    return () => {
      clearInterval(interval);
      socket.off('new_order');
      socket.off('low_stock_alert');
      socket.off('low_ingredient_alert');
      socket.off('order_status_updated');
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [metricsRes, capacityRes] = await Promise.all([
        fetch('http://localhost:8000/api/analytics/dashboard'),
        fetch('http://localhost:8000/api/orders/capacity')
      ]);
      if (metricsRes.ok) setMetrics(await metricsRes.json());
      if (capacityRes.ok) setCapacity(await capacityRes.json());
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Orders',
      value: metrics?.daily_orders ?? 0,
      icon: <ShoppingBag size={24} />,
      color: 'from-blue-500 to-blue-700',
      bg: 'bg-blue-50'
    },
    {
      title: 'Revenue',
      value: `₹${(metrics?.revenue_today ?? 0).toFixed(2)}`,
      icon: <DollarSign size={24} />,
      color: 'from-green-500 to-green-700',
      bg: 'bg-green-50'
    },
    {
      title: 'Active Orders',
      value: capacity?.active_orders ?? 0,
      icon: <Activity size={24} />,
      color: 'from-orange-500 to-orange-700',
      bg: 'bg-orange-50'
    },
    {
      title: 'Kitchen Load',
      value: capacity ? `${capacity.active_orders}/${capacity.max_capacity}` : '—',
      icon: <Users size={24} />,
      color: capacity?.is_full ? 'from-red-500 to-red-700' : 'from-purple-500 to-purple-700',
      bg: capacity?.is_full ? 'bg-red-50' : 'bg-purple-50'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-500 text-sm">Real-time campus canteen metrics</p>
        </div>
        {capacity?.is_full && (
          <div className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-lg font-medium animate-pulse">
            <AlertTriangle size={18} />
            Kitchen at Full Capacity!
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className={`${card.bg} rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-600 text-sm font-medium">{card.title}</span>
              <div className={`bg-gradient-to-r ${card.color} text-white p-2 rounded-lg`}>
                {card.icon}
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Items & Peak Hours */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-600" />
            Popular Items
          </h3>
          <div className="space-y-3">
            {(metrics?.popular_items || []).map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                <span className="text-gray-700">{item}</span>
              </div>
            ))}
          </div>

          <h3 className="font-semibold text-gray-800 mt-6 mb-3 flex items-center gap-2">
            <Clock size={18} className="text-orange-600" />
            Peak Ordering Periods
          </h3>
          <div className="flex flex-wrap gap-2">
            {(metrics?.peak_ordering_periods || []).map((time, i) => (
              <span key={i} className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
                {time}
              </span>
            ))}
          </div>
        </div>

        {/* Live Notifications */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Package size={18} className="text-green-600" />
            Live Notifications
            {notifications.length > 0 && (
              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold">
                {notifications.length}
              </span>
            )}
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No notifications yet. They'll appear here in real-time.</p>
            ) : (
              notifications.map((n, i) => (
                <div key={i} className={`p-3 rounded-lg text-sm ${
                  n.type === 'order' ? 'bg-blue-50 text-blue-800' :
                  n.type === 'stock' || n.type === 'ingredient' ? 'bg-red-50 text-red-800' :
                  'bg-gray-50 text-gray-800'
                }`}>
                  <p>{n.message}</p>
                  <p className="text-xs opacity-60 mt-1">{n.time.toLocaleTimeString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
