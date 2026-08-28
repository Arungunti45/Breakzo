import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { TrendingUp, ShoppingBag, DollarSign, Clock, AlertTriangle, Package, Users, Activity, BarChart3, Calendar, Sparkles, Power } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const socket = io('http://localhost:8000');

function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [capacity, setCapacity] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [canteens, setCanteens] = useState([]);
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
      const [metricsRes, capacityRes, canteensRes] = await Promise.all([
        fetch('http://localhost:8000/api/analytics/dashboard'),
        fetch('http://localhost:8000/api/orders/capacity'),
        fetch('http://localhost:8000/api/canteens')
      ]);
      if (metricsRes.ok) setMetrics(await metricsRes.json());
      if (capacityRes.ok) setCapacity(await capacityRes.json());
      if (canteensRes.ok) setCanteens(await canteensRes.json());
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

  const handleToggleCanteen = async (canteen) => {
    const newStatus = !canteen.is_manually_closed;
    try {
      const res = await fetch(`http://localhost:8000/api/canteens/${canteen.id}/toggle-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_manually_closed: newStatus })
      });
      if (res.ok) {
        toast.success(newStatus ? `${canteen.name} is now CLOSED` : `${canteen.name} is now OPEN`);
        setCanteens(prev => prev.map(c => c.id === canteen.id ? { ...c, is_manually_closed: newStatus } : c));
      } else {
        toast.error('Failed to update canteen status');
      }
    } catch (err) {
      toast.error('Network error updating status');
    }
  };

  const statCards = [
    {
      title: 'Total Orders',
      value: metrics?.daily_orders ?? 0,
      icon: <ShoppingBag size={24} />,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      title: 'Revenue Today',
      value: `₹${(metrics?.revenue_today ?? 0).toFixed(2)}`,
      icon: <DollarSign size={24} />,
      color: 'from-emerald-400 to-emerald-600',
    },
    {
      title: 'Weekly Income',
      value: `₹${(metrics?.revenue_weekly ?? 0).toFixed(2)}`,
      icon: <BarChart3 size={24} />,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      title: 'Monthly Income',
      value: `₹${(metrics?.revenue_monthly ?? 0).toFixed(2)}`,
      icon: <Calendar size={24} />,
      color: 'from-teal-500 to-cyan-600',
    },
    {
      title: 'Active Orders',
      value: capacity?.active_orders ?? 0,
      icon: <Activity size={24} />,
      color: 'from-orange-400 to-orange-600',
    },
    {
      title: 'Kitchen Load',
      value: capacity ? `${capacity.active_orders}/${capacity.max_capacity}` : '—',
      icon: <Users size={24} />,
      color: capacity?.is_full ? 'from-red-500 to-rose-600' : 'from-purple-500 to-fuchsia-600',
      shadow: capacity?.is_full ? 'shadow-red-500/30' : 'shadow-purple-500/30'
    }
  ];

  return (
    <div className="p-4 sm:p-8 space-y-8 bg-slate-50 min-h-screen">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between border border-slate-700">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl"></div>
        
        <div className="relative z-10 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center justify-center sm:justify-start gap-3 tracking-tight">
            <Sparkles className="text-blue-400" size={32} />
            Command Center
          </h1>
          <p className="text-slate-400 text-sm sm:text-base mt-2 font-medium">Real-time campus canteen analytics & operations</p>
        </div>
        
        <div className="relative z-10 mt-6 sm:mt-0 flex flex-col items-end gap-3">
          {capacity?.is_full && (
            <div className="flex items-center gap-3 bg-red-500/20 border border-red-500/30 text-red-100 px-6 py-3 rounded-2xl font-bold shadow-lg shadow-red-500/20 backdrop-blur-md animate-pulse">
              <AlertTriangle size={22} className="text-red-400" />
              Kitchen at Full Capacity!
            </div>
          )}
          
          <div className="flex flex-wrap justify-end gap-3">
            {canteens.map(canteen => (
              <button
                key={canteen.id}
                onClick={() => handleToggleCanteen(canteen)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold transition-all duration-300 backdrop-blur-md border shadow-lg ${
                  canteen.is_manually_closed 
                    ? 'bg-red-500/10 border-red-500/30 text-red-200 hover:bg-red-500/20 hover:shadow-red-500/20' 
                    : 'bg-green-500/10 border-green-500/30 text-green-200 hover:bg-green-500/20 hover:shadow-green-500/20'
                }`}
              >
                <Power size={18} className={canteen.is_manually_closed ? 'text-red-400' : 'text-green-400'} />
                {canteen.name}: {canteen.is_manually_closed ? 'CLOSED' : 'OPEN'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, i) => (
          <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 group relative overflow-hidden">
            {/* Subtle glow effect behind card */}
            <div className={`absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br ${card.color} opacity-5 group-hover:opacity-10 rounded-full blur-2xl transition-opacity duration-500`}></div>
            
            <div className="flex items-center justify-between mb-6 relative z-10">
              <span className="text-slate-500 text-sm font-bold uppercase tracking-widest">{card.title}</span>
              <div className={`bg-gradient-to-br ${card.color} text-white p-3.5 rounded-2xl shadow-lg ${card.shadow || 'shadow-slate-200'} group-hover:scale-110 transition-transform duration-500`}>
                {card.icon}
              </div>
            </div>
            <p className="text-4xl font-black text-slate-800 tracking-tight relative z-10 group-hover:translate-x-1 transition-transform duration-500">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart Section */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-xl transition-shadow duration-500">
        <h3 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-3">
          <div className="p-2 bg-green-100 text-green-600 rounded-xl">
            <TrendingUp size={24} />
          </div>
          Revenue Trend (Last 7 Days)
        </h3>
        <div className="h-80 w-full">
          {metrics?.chart_data ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} dy={10} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}}
                  tickFormatter={(value) => `₹${value}`}
                  dx={-10}
                />
                <Tooltip 
                  formatter={(value) => [`₹${value}`, 'Revenue']}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}}
                  itemStyle={{color: '#10b981'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  activeDot={{ r: 8, strokeWidth: 0, fill: '#059669', style: { filter: 'drop-shadow(0px 4px 6px rgba(16, 185, 129, 0.5))' } }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">Loading chart data...</div>
          )}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Popular Items & Peak Hours */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-xl transition-shadow duration-500">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
              <TrendingUp size={24} />
            </div>
            Popular Items
          </h3>
          <div className="space-y-4">
            {(metrics?.popular_items || []).map((item, i) => (
              <div key={i} className="flex items-center gap-4 group">
                <span className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300 flex items-center justify-center text-sm font-black shadow-sm">
                  {i + 1}
                </span>
                <span className="text-slate-700 font-bold text-lg group-hover:text-blue-600 transition-colors duration-300">{item}</span>
              </div>
            ))}
          </div>

          <h3 className="text-xl font-bold text-slate-800 mt-10 mb-6 flex items-center gap-3">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
              <Clock size={24} />
            </div>
            Peak Ordering Periods
          </h3>
          <div className="flex flex-wrap gap-3">
            {(metrics?.peak_ordering_periods || []).map((time, i) => (
              <span key={i} className="bg-orange-50 border border-orange-100 text-orange-700 px-5 py-2.5 rounded-2xl text-sm font-bold shadow-sm hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all duration-300 cursor-default">
                {time}
              </span>
            ))}
          </div>
        </div>

        {/* Live Notifications */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col hover:shadow-xl transition-shadow duration-500">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
              <div className="p-2 bg-slate-100 text-slate-600 rounded-xl">
                <Package size={24} />
              </div>
              Live Notifications
            </h3>
            {notifications.length > 0 && (
              <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-black shadow-md shadow-blue-500/30 animate-pulse">
                {notifications.length} New
              </span>
            )}
          </div>
          
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 flex-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4 opacity-50 py-10">
                <Package size={48} />
                <p className="font-medium">No active notifications.</p>
              </div>
            ) : (
              notifications.map((n, i) => (
                <div key={i} className={`p-4 rounded-2xl text-sm border font-medium shadow-sm transition-all duration-300 hover:-translate-y-1 ${
                  n.type === 'order' ? 'bg-blue-50/50 border-blue-100 text-blue-900' :
                  n.type === 'stock' || n.type === 'ingredient' ? 'bg-red-50/50 border-red-100 text-red-900' :
                  'bg-slate-50/50 border-slate-100 text-slate-900'
                }`}>
                  <p className="text-base">{n.message}</p>
                  <p className="text-xs font-bold opacity-50 mt-2 flex items-center gap-1">
                    <Clock size={12} />
                    {n.time.toLocaleTimeString()}
                  </p>
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
