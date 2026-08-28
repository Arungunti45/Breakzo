import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000'); // Assuming backend runs on 5000

function KitchenDashboard() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // Fetch existing active orders on load
    const fetchActiveOrders = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/orders/active');
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        }
      } catch (err) {
        console.error("Failed to fetch active orders", err);
      }
    };
    fetchActiveOrders();

    // Polling fallback every 3 seconds (in case real-time sockets fail)
    const intervalId = setInterval(fetchActiveOrders, 3000);

    // Listen for incoming real-time orders
    socket.on('new_order', (order) => {
      setOrders(prevOrders => {
        if (prevOrders.some(o => o.order_id === order.order_id)) return prevOrders;
        return [order, ...prevOrders];
      });
    });

    socket.on('order_status_updated', (data) => {
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.order_id === data.order_id ? { ...order, status: data.status } : order
        )
      );
    });

    return () => {
      clearInterval(intervalId);
      socket.off('new_order');
      socket.off('order_status_updated');
    };
  }, []);

  const updateStatus = async (orderId, newStatus) => {
    try {
      await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.order_id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order? It will be sent to the Refund Management queue.")) return;
    try {
      await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      });
      setOrders(prevOrders => prevOrders.filter(order => order.order_id !== orderId));
    } catch (err) {
      console.error("Failed to cancel order", err);
    }
  };

  return (
    <div className="p-4">
      <div className="bg-white p-4 rounded-xl shadow border border-slate-200 mb-6 flex gap-4 items-center">
        <h3 className="font-bold text-slate-700">Enter Pickup Code</h3>
        <input 
          type="text" 
          placeholder="Enter 6-digit Code"
          className="border border-slate-300 rounded px-3 py-2 w-64"
          onKeyDown={async (e) => {
            if (e.key === 'Enter' && e.target.value) {
              try {
                const res = await fetch('http://localhost:5000/api/pickup/verify', {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify({qr_data: e.target.value, counter_id: 1})
                });
                const data = await res.json();
                if (res.ok) {
                  alert(`Code Verified! Order #${data.order_id} completed.`);
                  setOrders(prev => prev.filter(o => o.order_id !== data.order_id));
                  e.target.value = '';
                } else {
                  alert(data.detail || "Invalid Code");
                }
              } catch (err) {
                console.error(err);
              }
            }
          }}
        />
        <span className="text-sm text-slate-500">Type code and press Enter</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {orders.map(order => (
          <div key={order.order_id} className={`border p-4 rounded shadow ${order.status === 'ready' ? 'bg-green-100' : 'bg-white'}`}>
            <div className="flex justify-between items-start border-b pb-3 mb-3 border-slate-200">
              <div>
                <h3 className="text-2xl font-black text-slate-800">Order #{order.order_id}</h3>
                <p className="text-slate-500 font-medium">Status: <span className={`font-bold uppercase ${order.status === 'pending' ? 'text-red-500' : order.status === 'preparing' ? 'text-yellow-600' : order.status === 'ready' ? 'text-green-600' : 'text-blue-600'}`}>{order.status}</span></p>
              </div>
              
              {/* User Details Block */}
              {order.user && (
                <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg text-right min-w-[150px]">
                  <p className="font-bold text-slate-700 text-sm uppercase tracking-wider mb-1">Customer Info</p>
                  <p className="font-black text-slate-900 text-lg">{order.user.name}</p>
                  <p className="text-slate-500 font-medium">{order.user.mobile_number}</p>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {order.status === 'pending' && (
                <button 
                  onClick={() => updateStatus(order.order_id, 'accepted')}
                  className="bg-blue-500 text-white px-4 py-2 rounded font-medium"
                >
                  Accept Order
                </button>
              )}
              {(order.status === 'pending' || order.status === 'accepted') && (
                <button 
                  onClick={() => updateStatus(order.order_id, 'preparing')}
                  className="bg-yellow-500 text-white px-4 py-2 rounded font-medium"
                >
                  Start Preparing
                </button>
              )}
              {order.status === 'preparing' && (
                <button 
                  onClick={() => updateStatus(order.order_id, 'ready')}
                  className="bg-green-500 text-white px-4 py-2 rounded font-medium"
                >
                  Mark Ready
                </button>
              )}
              {order.status === 'ready' && (
                <p className="text-sm font-bold text-green-700 mt-2">Waiting for student pickup (Scan QR)</p>
              )}
              <button 
                onClick={() => cancelOrder(order.order_id)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded ml-auto"
              >
                Cancel
              </button>
            </div>
          </div>
        ))}
        {orders.length === 0 && <p className="text-gray-500">Waiting for incoming orders...</p>}
      </div>
    </div>
  );
}

export default KitchenDashboard;

2026-08-26T17:11:24+05:30
2026-08-26T17:11:27+05:30
///c:/abhivorn/food_app/frontend/src/WalletAndLoyalty.jsx with requested content.
2026-08-26T17:11:46+05:30
2026-08-26T17:11:46+05:30
`file:///c:/abhivorn/food_app/frontend/src/App.jsx`
48
1740
<line_number>: <original_line>. Please note that any changes targeting the original code should remove the line number, colon, and leading space.
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import LoginOTP from './LoginOTP';
import Menu from './Menu';
import OrderTracker from './OrderTracker';
import KitchenDashboard from './KitchenDashboard';
import AdminDashboard from './AdminDashboard';
import AdminMenuManager from './AdminMenuManager';
import AdminRefunds from './AdminRefunds';
import AdminSupplierWaste from './AdminSupplierWaste';
import StudentProfile from './StudentProfile';
import MultiCanteen from './MultiCanteen';
import UserLayout from './UserLayout';
import AdminLayout from './AdminLayout';
import { Toaster } from 'react-hot-toast';
import './index.css';

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        {/* Default route redirect to login */}
        <Route path="/" element={<LoginOTP />} />
        <Route path="/login" element={<LoginOTP />} />

        {/* User Dashboard Routes */}
        <Route path="/user" element={<UserLayout />}>
          <Route index element={<MultiCanteen />} />
          <Route path="menu" element={<Menu />} />
          <Route path="tracker" element={<OrderTracker />} />
          <Route path="profile" element={<StudentProfile />} />
        </Route>

        {/* Admin Dashboard Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="kitchen" element={<KitchenDashboard />} />
          <Route path="menu" element={<AdminMenuManager />} />
          <Route path="refunds" element={<AdminRefunds />} />
          <Route path="waste" element={<AdminSupplierWaste />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

2026-08-26T17:11:46+05:30
2026-08-26T17:11:47+05:30
`file:///c:/abhivorn/food_app/frontend/src/UserLayout.jsx`
151
6561
<line_number>: <original_line>. Please note that any changes targeting the original code should remove the line number, colon, and leading space.
import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import WeatherVibe from './WeatherVibe';
import { Home, Utensils, Clock, User, LogOut, ShoppingBag, Menu as MenuIcon, X } from 'lucide-react';

function UserLayout() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Canteens', path: '/user', icon: <Home size={18} /> },
    { name: 'Menu', path: '/user/menu', icon: <Utensils size={18} /> },
    { name: 'Tracker', path: '/user/tracker', icon: <Clock size={18} /> },
    { name: 'Profile', path: '/user/profile', icon: <User size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col font-sans">
      {/* Modern Top Navbar */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center gap-3">
              <img src="/food_img.jpeg" alt="BZ Logo" className="h-12 w-auto drop-shadow-md rounded-xl" />
              <div className="flex flex-col">
                <span className="font-extrabold text-2xl tracking-tight text-blue-900 leading-none">Campus Food</span>
                <span className="text-xs text-blue-500 font-semibold tracking-widest uppercase">Smart Operations</span>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex space-x-1 items-center bg-slate-100 p-1 rounded-full">
              {navItems.map((item) => (
                <Link 
                  key={item.name}
                  to={item.path} 
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                    location.pathname === item.path 
                      ? 'bg-white text-blue-700 shadow-sm' 
                      : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Right Actions & Mobile Toggle */}
            <div className="flex items-center gap-2 sm:gap-4">
              <button className="bg-orange-100 text-orange-600 hover:bg-orange-200 p-2 sm:p-3 rounded-full transition-colors relative">
                <ShoppingBag size={20} />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                  3
                </span>
              </button>
              <Link to="/login" className="hidden sm:flex items-center gap-2 text-slate-500 hover:text-red-500 transition-colors font-semibold ml-2">
                <LogOut size={18} />
                <span>Logout</span>
              </Link>
              <button 
                className="md:hidden p-2 text-slate-600 hover:text-slate-900"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
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

2026-08-26T17:12:14+05:30
2026-08-26T17:12:19+05:30
`file:///c:/abhivorn/food_app/frontend/src/Menu.jsx`
252
10496
<line_number>: <original_line>. Please note that any changes targeting the original code should remove the line number, colon, and leading space.
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function Menu() {
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/canteens/1/menu');
      const data = await res.json();
      setMenuItems(data.filter(item => item.is_available));
    } catch (err) {
      toast.error('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    toast.success(`${item.name} added to cart`);
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);

  const initiateCheckout = () => {
    if (cart.length === 0) return toast.error('Your cart is empty');
    setShowPayment(true);
  };

  const handlePaymentAndCheckout = async () => {
    setCheckoutLoading(true);

    const storedUserId = localStorage.getItem('userId');
    const payload = {
      user_id: storedUserId ? parseInt(storedUserId) : 1,
      canteen_id: 1,
      total_amount: totalAmount,
      items: cart.map(item => ({
        menu_item_id: item.id,
        quantity: item.quantity,
        price: item.price
      }))
    };

    try {
      const res = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success('Payment successful! Order placed.');
        setCart([]);
        setShowPayment(false);
        navigate('/user/tracker', { state: { orderId: data.order_id } });
      } else {
        toast.error(data.detail || data.error || 'Payment failed');
      }
    } catch (err) {
      toast.error('Server connection error');
    }
    setCheckoutLoading(false);
  };

  if (loading) return <div className="p-4 animate-pulse">Loading delicious food...</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto">
      
      {/* Menu List */}
      <div className="flex-1">
        <h2 className="text-3xl font-bold text-slate-800 mb-6">Today's Menu</h2>
        {menuItems.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow border border-slate-100 text-center text-slate-500">
            No items available right now. Check back later!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {menuItems.map(item => (
              <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition flex flex-col overflow-hidden justify-between">
                <div>
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-48 object-cover bg-slate-50" />
                  ) : (
                    <div className="w-full h-48 bg-slate-100 flex items-center justify-center text-slate-400">
                      No Image
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-slate-800">{item.name}</h3>
                      <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded font-medium">{item.category}</span>
                    </div>
                    <p className="text-sm text-slate-500 mb-0">{item.description}</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center px-5 pb-5 mt-auto pt-4 border-t border-slate-100">
                  <div>
                    <p className="text-xl font-black text-blue-700">${Number(item.price).toFixed(2)}</p>
                    <p className={`text-xs font-bold ${item.stock_quantity < 5 ? 'text-red-500' : 'text-slate-500'}`}>
                      {item.stock_quantity > 0 ? `${item.stock_quantity} available` : 'Sold out'}
                    </p>
                  </div>
                  <button 
                    onClick={() => addToCart(item)}
                    disabled={item.stock_quantity < 1}
                    className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 ${
                      item.stock_quantity < 1 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                    }`}
                  >
                    {item.stock_quantity < 1 ? 'Out of Stock' : (
                      <>
                        <Plus size={18} /> Add
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shopping Cart Sidebar */}
      <div className="w-full lg:w-96">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 sticky top-24 overflow-hidden flex flex-col max-h-[80vh]">
          <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <ShoppingCart size={20} /> Your Order
            </h3>
            <span className="bg-blue-600 px-2 py-1 rounded-full text-xs font-bold">{cart.length} items</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {cart.length === 0 ? (
              <p className="text-center text-slate-400 py-8">Your cart is empty.</p>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-800">{item.name}</h4>
                    <p className="text-sm text-slate-500">${Number(item.price).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-slate-100 rounded-lg p-1">
                      <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-white rounded hover:shadow-sm text-slate-600"><Minus size={14} /></button>
                      <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-white rounded hover:shadow-sm text-slate-600"><Plus size={14} /></button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 p-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-600 font-medium">Total Amount</span>
              <span className="text-2xl font-black text-slate-900">${totalAmount.toFixed(2)}</span>
            </div>
            <button 
              onClick={initiateCheckout}
              disabled={cart.length === 0}
              className={`w-full py-3 rounded-lg font-bold text-lg transition shadow-sm ${
                cart.length === 0 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              Proceed to Payment
            </button>
          </div>
        </div>
      </div>
      
      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl relative">
            <div className="flex justify-between items-center border-b pb-4 mb-6">
              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                <CreditCard className="text-blue-600" />
                Payment Processing
              </h2>
              <button onClick={() => setShowPayment(false)} className="text-slate-400 hover:text-slate-700 text-xl font-bold">&times;</button>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl mb-6">
              <p className="text-slate-500 mb-1">Amount to Pay</p>
              <p className="text-4xl font-black text-blue-700">${totalAmount.toFixed(2)}</p>
            </div>

            <p className="text-slate-600 mb-6 text-center">
              Your payment will be securely processed. Once completed, your order will be sent to the kitchen instantly.
            </p>

            <button 
              onClick={handlePaymentAndCheckout}
              disabled={checkoutLoading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xl transition flex justify-center items-center gap-2 disabled:bg-slate-400"
            >
              {checkoutLoading ? 'Processing...' : 'Pay & Place Order'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Menu;

2026-08-26T17:12:14+05:30
2026-08-26T17:12:19+05:30
`file:///c:/abhivorn/food_app/frontend/src/OrderTracker.jsx`
85
2660
<line_number>: <original_line>. Please note that any changes targeting the original code should remove the line number, colon, and leading space.
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import { useLocation, useNavigate } from 'react-router-dom';

const socket = io('http://localhost:5000');

function OrderTracker() {
  const location = useLocation();
  const navigate = useNavigate();
  const orderId = location.state?.orderId;
  const [status, setStatus] = useState('pending');
  const [pickupCode, setPickupCode] = useState('');

  useEffect(() => {
    if (!orderId) return;

    // Fetch initial status
    const fetchStatus = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/orders/${orderId}`);
        if (res.ok) {
          const data = await res.json();
          setStatus(data.status);
          setPickupCode(data.qr_code); // The backend returns it in qr_code
        }
      } catch (err) {
        console.error("Failed to fetch order status", err);
      }
    };
    fetchStatus();

    // Polling fallback every 3 seconds (in case real-time sockets fail)
    const intervalId = setInterval(fetchStatus, 3000);

    // Listen for status updates for this specific order
    socket.on('order_updated', (data) => {
      if (data.order_id == orderId) {
        setStatus(data.status);
      }
    });

    return () => {
      clearInterval(intervalId);
      socket.off('order_updated');
    };
  }, [orderId]);

  if (!orderId) {
    return (
      <div className="p-4 text-center mt-10">
        <h2 className="text-xl font-bold mb-4">No active order to track.</h2>
        <button onClick={() => navigate('/user/menu')} className="bg-blue-600 text-white px-4 py-2 rounded">Go to Menu</button>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded shadow max-w-sm mx-auto mt-10 text-center">
      <h2 className="text-2xl font-bold mb-4">Order #{orderId} Tracker</h2>
      
      <div className="mb-6">
        <p className="text-lg">Current Status:</p>
        <p className={`text-2xl font-bold uppercase ${
          status === 'ready' ? 'text-green-600' : 
          status === 'preparing' ? 'text-yellow-600' : 'text-gray-600'
        }`}>
          {status}
        </p>
      </div>

      {status === 'ready' && (
        <div className="flex flex-col items-center">
          <p className="mb-2 font-bold text-green-700">Show this code at the pickup counter!</p>
          <div className="bg-slate-100 px-6 py-4 rounded-xl border border-slate-300">
             <p className="text-4xl font-black tracking-widest text-slate-800">{pickupCode}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderTracker;

2026-08-26T17:14:37+05:30
2026-08-26T17:14:37+05:30
`file:///c:/abhivorn/food_app/frontend/src/AdminDashboard.jsx`
116
4636
<line_number>: <original_line>. Please note that any changes targeting the original code should remove the line number, colon, and leading space.
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

function AdminDashboard() {
  const [alerts, setAlerts] = useState([]);
  const [metrics, setMetrics] = useState({
    daily_orders: 0,
    revenue_today: 0,
    popular_items: ['Loading...']
  });
  
  const foodWasteSaved = '12 kg';

  useEffect(() => {
    // Fetch metrics
    const fetchMetrics = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/analytics/dashboard');
        if (res.ok) {
          const data = await res.json();
          setMetrics(data);
        }
      } catch (err) {
        console.error("Failed to fetch analytics", err);
      }
    };
    fetchMetrics();
    
    // Polling fallback every 3 seconds for live dashboard updates
    const intervalId = setInterval(fetchMetrics, 3000);

    // Listen for low stock alerts from the backend
    socket.on('low_stock_alert', (data) => {
      setAlerts(prev => [...prev, data]);
    });

    return () => {
      clearInterval(intervalId);
      socket.off('low_stock_alert');
    };
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Admin Analytics & Inventory</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-purple-100 p-6 rounded-lg shadow border border-purple-200">
          <h3 className="text-xl font-bold text-purple-800 mb-2">Total Revenue</h3>
          <p className="text-4xl font-black text-purple-900">${metrics.revenue_today.toFixed(2)}</p>
        </div>
        <div className="bg-blue-100 p-6 rounded-lg shadow border border-blue-200">
          <h3 className="text-xl font-bold text-blue-800 mb-2">Total Orders</h3>
          <p className="text-4xl font-bold">{metrics.daily_orders}</p>
        </div>
        <div className="bg-green-100 p-6 rounded-lg shadow border border-green-200">
          <h3 className="text-xl font-bold text-green-800 mb-2">Popular Item</h3>
          <p className="text-2xl font-bold">{metrics.popular_items[0]}</p>
        </div>
        <div className="bg-yellow-100 p-6 rounded-lg shadow border border-yellow-200">
          <h3 className="text-xl font-bold text-yellow-800 mb-2">Food Waste Saved</h3>
          <p className="text-4xl font-bold">{foodWasteSaved}</p>
        </div>
      </div>

      <div className="mb-8 bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 shadow-lg text-white">
        <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
          🤖 AI Demand Forecasting
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/10 p-4 rounded-lg">
            <p className="text-slate-300 text-sm font-bold uppercase tracking-wider mb-1">Predicted Lunch Orders</p>
            <p className="text-3xl font-black text-blue-300">450</p>
          </div>
          <div className="bg-white/10 p-4 rounded-lg">
            <p className="text-slate-300 text-sm font-bold uppercase tracking-wider mb-1">Expected Peak Hour</p>
            <p className="text-3xl font-black text-orange-300">12:30 PM</p>
          </div>
          <div className="bg-white/10 p-4 rounded-lg">
            <p className="text-slate-300 text-sm font-bold uppercase tracking-wider mb-1">AI Recommendation</p>
            <p className="text-lg font-medium text-emerald-300">Increase staff at Counter 2 due to expected high volume.</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-2xl font-bold text-red-600 mb-4 flex items-center">
          ⚠️ Low Stock Alerts
        </h3>
        
        {alerts.length === 0 ? (
          <p className="text-gray-500">All inventory levels are optimal.</p>
        ) : (
          <ul className="space-y-3">
            {alerts.map((alert, idx) => (
              <li key={idx} className="bg-red-50 p-4 rounded border border-red-200 flex justify-between items-center">
                <div>
                  <p className="font-bold text-red-800">{alert.name} is running low!</p>
                  <p className="text-sm text-red-600">Item ID: {alert.menu_item_id} | Canteen ID: {alert.canteen_id}</p>
                </div>
                <div className="bg-red-600 text-white font-bold py-1 px-3 rounded">
                  {alert.remaining_stock} left
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;

2026-08-26T17:14:37+05:30
2026-08-26T17:14:38+05:30
`file:///c:/abhivorn/food_app/frontend/src/AdminLayout.jsx`
111
4934
<line_number>: <original_line>. Please note that any changes targeting the original code should remove the line number, colon, and leading space.
import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, ChefHat, LogOut, Bell, Search, Settings, Menu as MenuIcon, X, ClipboardList, Wallet, Leaf } from 'lucide-react';

function AdminLayout() {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { name: 'Analytics Dashboard', path: '/admin', icon: <LayoutDashboard size={20} /> },
    { name: 'Live Kitchen Ops', path: '/admin/kitchen', icon: <ChefHat size={20} /> },
    { name: 'Menu Management', path: '/admin/menu', icon: <ClipboardList size={20} /> },
    { name: 'Refund Management', path: '/admin/refunds', icon: <Wallet size={20} /> },
    { name: 'Waste Management', path: '/admin/waste', icon: <Leaf size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans relative">
      {/* Mobile Sidebar Overlay */}
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
            <img src="/food_img.jpeg" alt="BZ Logo" className="h-8 w-auto rounded bg-white p-1 mr-3" />
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
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-4 sm:px-6 z-10">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-slate-500 hover:text-slate-900" onClick={() => setIsSidebarOpen(true)}>
              <MenuIcon size={24} />
            </button>
            <div className="hidden sm:flex items-center bg-slate-100 px-3 py-2 rounded-lg w-64 md:w-96 border border-slate-200">
              <Search size={18} className="text-slate-400 mr-2" />
              <input type="text" placeholder="Search orders, menus, users..." className="bg-transparent border-none focus:outline-none w-full text-sm text-slate-700" />
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-slate-500">
            <button className="hover:text-blue-600 transition-colors relative">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 bg-red-500 w-2 h-2 rounded-full"></span>
            </button>
            <button className="hover:text-blue-600 transition-colors">
              <Settings size={20} />
            </button>
            <div className="h-8 w-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold shadow-sm ml-2">
              A
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-auto p-6 bg-slate-50 relative">
          <Outlet />
        </main>
        
        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-3 px-6 text-sm text-slate-500 text-center">
          &copy; 2026 Campus Food Operations System. All rights reserved.
        </footer>
      </div>
    </div>
  );
}

export default AdminLayout;

2026-08-26T17:15:01+05:30
2026-08-26T17:15:03+05:30
///c:/abhivorn/food_app/frontend/src/SustainabilityDashboard.jsx with requested content.