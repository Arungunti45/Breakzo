import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { User, ShoppingBag, Star, Heart, LogOut, Clock } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

function StudentProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const userId = localStorage.getItem('userId') || '1';

  useEffect(() => {
    fetchProfile();
    fetchFavorites();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/student/profile/${userId}`);
      if (res.ok) {
        const data = await res.json();
        const localRole = localStorage.getItem('role') || data.role;
        const localPhone = localStorage.getItem('phone') || data.mobile_number;
        const localName = localStorage.getItem('name');
        setProfile({
          ...data,
          name: localName || (localRole.charAt(0).toUpperCase() + localRole.slice(1) + ' User'),
          mobile_number: localPhone,
          role: localRole
        });
      } else {
        // Fallback mock data if user not found
        setProfile({
          name: 'Student User',
          mobile_number: '9876543210',
          role: localStorage.getItem('role') || 'student',
          recent_orders: []
        });
      }
    } catch (err) {
      setProfile({
        name: 'Student User',
        mobile_number: 'N/A',
        role: localStorage.getItem('role') || 'student',
        recent_orders: []
      });
    }
    setLoading(false);
  };

  const fetchFavorites = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/student/favorites/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setFavorites(data.favorites || []);
      }
    } catch (err) {
      console.error('Failed to fetch favorites', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    toast.success('Logged out');
    navigate('/login');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'preparing': return 'bg-yellow-100 text-yellow-700';
      case 'pending': return 'bg-blue-100 text-blue-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'ready': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500"></div>
        <div className="px-6 pb-6 -mt-10">
          <div className="flex items-end gap-4">
            <div className="w-20 h-20 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-500">
              <span className="text-white text-2xl font-bold">
                {(profile?.name || 'S').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="pb-1">
              <h2 className="text-xl font-bold text-gray-900">{profile?.name || 'Student'}</h2>
              <p className="text-sm text-gray-500">{profile?.mobile_number || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium capitalize">
              {profile?.role || 'student'}
            </span>
            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
              ID: {userId}
            </span>
          </div>
        </div>
      </div>

      {/* Favorites */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Heart size={18} className="text-red-500" />
          Your Favorites
        </h3>
        {favorites.length === 0 ? (
          <p className="text-gray-400 text-sm">No favorites yet — order more to build your list!</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {favorites.map((fav, i) => (
              <div key={i} className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-lg">
                <Star size={14} className="text-yellow-500" />
                <span className="text-sm font-medium text-gray-700">{fav.name}</span>
                <span className="text-xs text-gray-400">({fav.order_count}x)</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Clock size={18} className="text-blue-600" />
          Recent Orders
        </h3>
        {(!profile?.recent_orders || profile.recent_orders.length === 0) ? (
          <div className="text-center py-6">
            <ShoppingBag size={36} className="mx-auto mb-2 text-gray-300" />
            <p className="text-gray-400 text-sm">No orders yet</p>
            <button onClick={() => navigate('/user/menu')} className="mt-2 text-blue-600 text-sm font-medium hover:underline">
              Browse the menu →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {profile.recent_orders.map((order, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <ShoppingBag size={14} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Order #{order.order_id}</p>
                    <p className="text-xs text-gray-400">₹{order.total_amount.toFixed(2)}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 py-3 rounded-xl font-medium hover:bg-red-100 transition"
      >
        <LogOut size={18} /> Log Out
      </button>
    </div>
  );
}

export default StudentProfile;
