import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import WeatherVibe from './WeatherVibe';
import { Home, Utensils, Clock, User, LogOut, ShoppingBag, Menu, X, Bell, Wallet, Leaf, Settings, Sun, Moon } from 'lucide-react';

const socket = io('http://localhost:8000');



function UserLayout() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
      setNotifications(prev => [{ message: msg, time: new Date(), status: data.status }, ...prev].slice(0, 15));
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      socket.off('order_updated');
    };
  }, []);


  const navItems = [
    { name: 'Canteens', path: '/user', icon: <Home size={18} /> },
    { name: 'Menu', path: '/user/menu', icon: <Utensils size={18} /> },
    { name: 'Tracker', path: '/user/tracker', icon: <Clock size={18} /> },
    { name: 'Wallet', path: '/user/wallet', icon: <Wallet size={18} /> },
    { name: 'Sustainability', path: '/user/sustainability', icon: <Leaf size={18} /> },
    { name: 'Profile', path: '/user/profile', icon: <User size={18} /> },
  ];



  return (
    <div className="min-h-screen bg-blue-50 dark:bg-slate-900 flex flex-col font-sans transition-colors duration-300">
      {/* Modern Top Navbar */}

      <nav className="bg-white dark:bg-slate-800 shadow-md sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex justify-between h-20 items-center">

            

            {/* Logo */}

            <div className="flex-shrink-0 flex items-center">
              <img src="/food_img.jpeg" alt="BZ Logo" className="h-12 w-auto drop-shadow-md rounded-xl" />
            </div>



            {/* Navigation Links */}

            {/* Navigation Links */}
            <div className="hidden md:flex space-x-1 items-center bg-slate-100 dark:bg-slate-700 p-1 rounded-full transition-colors duration-300">
              {navItems.map((item) => (

                <Link 

                  key={item.name}

                  to={item.path} 

                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                    location.pathname === item.path 
                      ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-sm' 
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >

                  {item.icon}

                  {item.name}

                </Link>

              ))}

            </div>



            {/* Right Actions & Mobile Toggle */}
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="hidden sm:flex items-center gap-5 text-slate-500">
                {/* Notifications */}
                <div className="relative flex items-center justify-center">
                  <button
                    onClick={() => { setShowNotifs(!showNotifs); setUnreadCount(0); }}
                    className="p-2 hover:bg-slate-100 rounded-full hover:text-blue-600 transition-colors relative flex items-center justify-center"
                  >
                    <Bell size={22} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold border-2 border-white">
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
                          <div key={i} className={`px-3 py-2.5 border-b border-gray-50 text-sm hover:bg-gray-50 bg-blue-50`}>
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

              <button 
                className="md:hidden p-2 text-slate-600 hover:text-slate-900"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>

          </div>

        </div>



        {/* Mobile Navigation Dropdown */}

        {isMobileMenuOpen && (

          <div className="md:hidden border-t border-slate-200 bg-white">

            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">

              {navItems.map((item) => (

                <Link

                  key={item.name}

                  to={item.path}

                  onClick={() => setIsMobileMenuOpen(false)}

                  className={`flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium ${

                    location.pathname === item.path 

                      ? 'bg-blue-50 text-blue-700' 

                      : 'text-slate-700 hover:bg-slate-100'

                  }`}

                >

                  {item.icon}

                  {item.name}

                </Link>

              ))}

              <Link

                to="/login"

                onClick={() => setIsMobileMenuOpen(false)}

                className="flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium text-red-600 hover:bg-red-50"

              >

                <LogOut size={18} />

                Logout

              </Link>

            </div>

          </div>

        )}

      </nav>



      {/* Main Content Area */}

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">

        {/* Weather Vibe Banner */}

        <div className="w-full">

           <WeatherVibe />

        </div>

        

        {/* Page Content */}

        <div className="flex-1">

          <Outlet />

        </div>

      </main>



      {/* Footer */}

      <footer className="bg-slate-900 text-slate-400 py-12 text-sm">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">

          <div>

            <h4 className="text-white text-lg font-bold mb-4 flex items-center gap-2">

              <img src="/food_img.jpeg" className="h-6 w-auto rounded bg-white p-0.5" alt="Logo" />

              Campus Food

            </h4>

            <p>Smart operations platform powered by AI. Never wait in long queues again.</p>

          </div>

          <div>

            <h4 className="text-white text-lg font-bold mb-4">Quick Links</h4>

            <ul className="space-y-2">

              <li><Link to="/user" className="hover:text-blue-400 transition-colors">Home</Link></li>

              <li><Link to="/user/menu" className="hover:text-blue-400 transition-colors">Browse Menu</Link></li>

              <li><Link to="/user/tracker" className="hover:text-blue-400 transition-colors">Track Order</Link></li>

            </ul>

          </div>

          <div>

            <h4 className="text-white text-lg font-bold mb-4">Support</h4>

            <p>Experiencing issues with your order?</p>

            <p className="mt-2 text-blue-400 font-medium cursor-pointer hover:underline">Contact Campus Helpdesk</p>

          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-800 text-center text-slate-500">

           &copy; 2026 Campus Food Operations System. All rights reserved.

        </div>

      </footer>

    </div>

  );

}



export default UserLayout;



