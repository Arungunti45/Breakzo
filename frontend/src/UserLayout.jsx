import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import WeatherVibe from './WeatherVibe';
import { Home, Utensils, Clock, User, LogOut, ShoppingBag, Menu as MenuIcon, X, Bell, Wallet, Leaf, Settings, Sun, Moon, Tag, Search } from 'lucide-react';

const socket = io('http://localhost:8000');

function UserLayout() {
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
    socket.on('order_updated', (data) => {
      const statusMessages = {
        'accepted': '👨‍🍳 Your order has been accepted!',
        'preparing': '🔥 Your order is being prepared!',
        'ready': '✅ Your order is ready for pickup!',
        'completed': '🎉 Order picked up successfully!',
        'cancelled': '❌ Your order was cancelled.'
      };
      const msg = statusMessages[data.status] || `Order #${data.order_id}: ${data.status}`;
      toast(msg, { icon: data.status === 'ready' ? '🔔' : '📋', duration: 5000 });
      
      // Trigger native push notification
      if ('Notification' in window && Notification.permission === 'granted' && navigator.serviceWorker) {
        navigator.serviceWorker.ready.then(reg => {
          reg.showNotification('Campus Food Update', {
            body: msg,
            icon: '/vite.svg',
            vibrate: [200, 100, 200]
          });
        });
      }

      setNotifications(prev => [{ message: msg, time: new Date(), status: data.status }, ...prev].slice(0, 15));
      setUnreadCount(prev => prev + 1);
    });

    socket.on('canteen_status_updated', (data) => {
      const msg = data.is_manually_closed 
        ? '⛔ A canteen has been temporarily closed.' 
        : '🟢 A canteen is now open and accepting orders!';
      
      toast(msg, { icon: data.is_manually_closed ? '⛔' : '🟢', duration: 6000 });
      
      if ('Notification' in window && Notification.permission === 'granted' && navigator.serviceWorker) {
        navigator.serviceWorker.ready.then(reg => {
          reg.showNotification('Campus Food Update', {
            body: msg,
            icon: '/vite.svg',
            vibrate: [200, 100, 200]
          });
        });
      }
      
      setNotifications(prev => [{ message: msg, time: new Date(), type: 'system' }, ...prev].slice(0, 15));
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      socket.off('order_updated');
      socket.off('canteen_status_updated');
    };
  }, []);

  const navItems = [
    { name: 'Canteens', path: '/user', icon: <Home size={20} /> },
    { name: 'Menu', path: '/user/menu', icon: <Utensils size={20} /> },
    { name: 'Tracker', path: '/user/tracker', icon: <Clock size={20} /> },
    { name: 'Offers', path: '/user/offers', icon: <Tag size={20} /> },
    { name: 'Wallet', path: '/user/wallet', icon: <Wallet size={20} /> },
    { name: 'Activity', path: '/user/activity', icon: <ShoppingBag size={20} /> },
    { name: 'Profile', path: '/user/profile', icon: <User size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-blue-50 dark:bg-slate-900 overflow-hidden font-sans relative transition-colors duration-300">
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
        <div className="h-20 flex items-center justify-between px-6 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center">
            <img src="/breakzo.png" alt="Breakzo Logo" className="h-14 w-auto mr-3 border-[5px] border-slate-900 rounded-[2rem] p-1 bg-white drop-shadow-sm" />
            <span className="text-white font-bold text-xl tracking-wide">Campus Food</span>
          </div>
          <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6">
          <nav className="space-y-2 px-4">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
                  location.pathname === item.path 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/50' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <Link to="/login" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors font-medium">
            <LogOut size={20} />
            <span>Logout</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white dark:bg-slate-800 shadow-sm flex items-center justify-between px-4 sm:px-8 z-10 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white" onClick={() => setIsSidebarOpen(true)}>
              <MenuIcon size={24} />
            </button>
            <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-700 px-4 py-2.5 rounded-full w-64 md:w-96 border border-slate-200 dark:border-slate-600 transition-colors duration-300">
              <Search size={18} className="text-slate-400 mr-2" />
              <input type="text" placeholder="Search canteens, dishes..." className="bg-transparent border-none focus:outline-none w-full text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400" />
            </div>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-5 text-slate-500">
            {/* Notifications */}
            <div className="relative flex items-center justify-center">
              <button
                onClick={() => { setShowNotifs(!showNotifs); setUnreadCount(0); }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-400 transition-colors relative flex items-center justify-center"
              >
                <Bell size={22} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold border-2 border-white dark:border-slate-800">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {showNotifs && (
                <div className="absolute -right-12 sm:right-0 top-12 w-[300px] sm:w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 z-50 max-h-96 overflow-y-auto">
                  <div className="p-3 border-b border-gray-100 dark:border-slate-700 font-semibold text-gray-800 dark:text-slate-200 text-sm">Notifications</div>
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-gray-400 text-sm">No notifications yet</div>
                  ) : (
                    notifications.map((n, i) => (
                      <div key={i} className={`px-4 py-3 border-b border-gray-50 dark:border-slate-700/50 text-sm hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors`}>
                        <p className="text-gray-800 dark:text-slate-200">{n.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{n.time.toLocaleTimeString()}</p>
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
            <Link to="/user/profile" className="h-10 w-10 bg-gradient-to-tr from-blue-600 to-blue-400 text-white rounded-full flex items-center justify-center font-bold shadow-md hover:shadow-lg transition-all border-2 border-transparent hover:border-blue-200">
              A
            </Link>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-900 relative transition-colors duration-300">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
            <div className="w-full">
               <WeatherVibe />
            </div>
            <div className="flex-1">
              <Outlet />
            </div>
          </div>
          
          {/* Footer */}
          <footer className="mt-12 py-8 border-t border-slate-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 text-sm transition-colors duration-300">
             &copy; 2026 Campus Food Operations System. All rights reserved.
          </footer>
        </main>
      </div>
    </div>
  );
}

export default UserLayout;
