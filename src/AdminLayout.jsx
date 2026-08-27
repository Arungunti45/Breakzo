import { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { LayoutDashboard, ChefHat, LogOut, Bell, Search, Settings, Menu as MenuIcon, X, ClipboardList, Wallet, Leaf, Sun, Moon } from 'lucide-react';

const socket = io('http://localhost:8000');

function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    socket.on('new_order', (data) => {
      const notif = { message: `New order #${data.order_id} — ₹${data.total_amount}`, time: new Date(), type: 'order' };
      setNotifications(prev => [notif, ...prev].slice(0, 30));
      setUnreadCount(prev => prev + 1);
      toast.success(`🛒 New order #${data.order_id}!`);
    });

    socket.on('low_stock_alert', (data) => {
      const notif = { message: `Low stock: ${data.name} (${data.remaining_stock} left)`, time: new Date(), type: 'warning' };
      setNotifications(prev => [notif, ...prev].slice(0, 30));
      setUnreadCount(prev => prev + 1);
      toast.error(`⚠️ Low stock: ${data.name}`);
    });

    socket.on('low_ingredient_alert', (data) => {
      const notif = { message: `Low ingredient: ${data.name}`, time: new Date(), type: 'warning' };
      setNotifications(prev => [notif, ...prev].slice(0, 30));
      setUnreadCount(prev => prev + 1);
      toast.error(`🔴 Low ingredient: ${data.name}`);
    });

    socket.on('order_status_updated', (data) => {
      const notif = { message: `Order #${data.order_id} → ${data.status}`, time: new Date(), type: 'info' };
      setNotifications(prev => [notif, ...prev].slice(0, 30));
    });

    return () => {
      socket.off('new_order');
      socket.off('low_stock_alert');
      socket.off('low_ingredient_alert');
      socket.off('order_status_updated');
    };
  }, []);

  const navItems = [
    { name: 'Analytics Dashboard', path: '/admin', icon: <LayoutDashboard size={20} /> },
    { name: 'Live Kitchen Ops', path: '/admin/kitchen', icon: <ChefHat size={20} /> },
    { name: 'Menu Management', path: '/admin/menu', icon: <ClipboardList size={20} /> },
    { name: 'Refund Management', path: '/admin/refunds', icon: <Wallet size={20} /> },
    { name: 'Waste Management', path: '/admin/waste', icon: <Leaf size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 overflow-hidden font-sans relative transition-colors duration-300">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`absolute md:relative z-50 w-64 h-full bg-slate-900 text-slate-300 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="h-16 flex items-center justify-between px-6 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center">
            <img src="/breakzo.png" alt="Breakzo Logo" className="h-8 w-auto rounded bg-white p-1 mr-3" />
            <span className="text-white font-bold text-xl tracking-wide">Admin Portal</span>
          </div>
          <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                  location.pathname === item.path 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <Link to="/login" className="flex items-center gap-3 px-3 py-3 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors">
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-800 shadow-sm flex items-center justify-between px-4 sm:px-6 z-10 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-slate-500 hover:text-slate-900" onClick={() => setIsSidebarOpen(true)}>
              <MenuIcon size={24} />
            </button>
            <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-lg w-64 md:w-96 border border-slate-200 dark:border-slate-600 transition-colors duration-300">
              <Search size={18} className="text-slate-400 mr-2" />
              <input type="text" placeholder="Search orders, menus, users..." className="bg-transparent border-none focus:outline-none w-full text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400" />
            </div>
          </div>
          
          <div className="flex items-center gap-5 text-slate-500">
            {/* Notifications */}
            <div className="relative flex items-center justify-center">
              <button
                onClick={() => { setShowNotifs(!showNotifs); setUnreadCount(0); }}
                className="p-2 hover:bg-slate-100 rounded-full hover:text-blue-600 transition-colors relative flex items-center justify-center"
              >
                <Bell size={22} />
                {unreadCount > 0 && (
                  <span className="absolute 1 top-1 right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold border-2 border-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {showNotifs && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                  <div className="p-3 border-b border-gray-100 font-semibold text-gray-800 text-sm">Notifications</div>
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-gray-400 text-sm">No notifications yet</div>
                  ) : (
                    notifications.map((n, i) => (
                      <div key={i} className={`px-3 py-2.5 border-b border-gray-50 text-sm hover:bg-gray-50 ${
                        n.type === 'warning' ? 'bg-red-50' : n.type === 'order' ? 'bg-blue-50' : ''
                      }`}>
                        <p className="text-gray-800">{n.message}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{n.time.toLocaleTimeString()}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            
            {/* Theme Toggle */}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-400 transition-colors flex items-center justify-center"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
            </button>
            
            {/* Profile Avatar */}
            <Link to="/user/profile" className="h-10 w-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold shadow-sm hover:bg-blue-200 transition-colors border-2 border-transparent hover:border-blue-300">
              A
            </Link>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-auto p-6 bg-slate-50 dark:bg-slate-900 relative transition-colors duration-300">
          <Outlet />
        </main>
        
        {/* Footer */}
        <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 py-3 px-6 text-sm text-slate-500 dark:text-slate-400 text-center transition-colors duration-300">
          &copy; 2026 Campus Food Operations System. All rights reserved.
        </footer>
      </div>
    </div>
  );
}

export default AdminLayout;
