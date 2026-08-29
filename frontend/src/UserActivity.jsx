import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ShoppingBag, Star, Clock, Calendar, CheckCircle, Tag, Store } from 'lucide-react';
import Pagination from './Pagination';

export default function UserActivity() {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'reviews'
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPageOrders, setCurrentPageOrders] = useState(1);
  const [currentPageReviews, setCurrentPageReviews] = useState(1);
  const itemsPerPage = 5;

  const userId = localStorage.getItem('userId') || '1';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, reviewsRes] = await Promise.all([
        fetch(`http://localhost:8000/api/student/orders/${userId}`),
        fetch(`http://localhost:8000/api/student/reviews/${userId}`)
      ]);

      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (reviewsRes.ok) setReviews(await reviewsRes.json());
    } catch (err) {
      toast.error('Failed to load activity data');
    }
    setLoading(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'preparing': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'pending': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      case 'ready': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const calculateETA = (createdAt, waitMinutes) => {
    if (!createdAt || !waitMinutes) return null;
    const orderTime = new Date(createdAt).getTime();
    const readyTime = orderTime + (waitMinutes * 60000);
    const now = new Date().getTime();
    const diff = readyTime - now;
    
    if (diff <= 0) return 'Ready soon!';
    const mins = Math.ceil(diff / 60000);
    return `${mins} min${mins > 1 ? 's' : ''}`;
  };

  // Re-render every minute to keep ETA live
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading your activity...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-3xl font-black text-slate-800">My Activity</h1>
        <p className="text-slate-500 mt-2">View your past orders and feedback history.</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1 mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 py-3 px-6 rounded-lg font-bold flex items-center justify-center gap-2 transition min-w-[150px] ${
            activeTab === 'orders' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
        >
          <ShoppingBag size={20} /> Order History
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex-1 py-3 px-6 rounded-lg font-bold flex items-center justify-center gap-2 transition min-w-[150px] ${
            activeTab === 'reviews' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
        >
          <Star size={20} /> My Reviews
        </button>
      </div>

      {/* Content */}
      {activeTab === 'orders' ? (
        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-slate-100">
              <ShoppingBag size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-xl font-bold text-slate-700">No Orders Yet</h3>
              <p className="text-slate-500 mt-2">You haven't placed any orders. Time to grab a bite!</p>
            </div>
          ) : (
            <>
              {orders.slice((currentPageOrders - 1) * itemsPerPage, currentPageOrders * itemsPerPage).map(order => (
                <div key={order.order_id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-4 gap-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                      Order #{order.order_id}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500 font-medium">
                      <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(order.created_at).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><Clock size={14} /> {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {order.coupon_code && (
                        <span className="flex items-center gap-1 text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                          <Tag size={12} /> {order.coupon_code}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className={`px-4 py-1.5 rounded-full text-sm font-bold border uppercase tracking-wider inline-block ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    {['pending', 'preparing'].includes(order.status) && order.estimated_wait_time > 0 && (
                      <div className="mt-2 flex items-center justify-start sm:justify-end gap-1 text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 animate-pulse">
                        <Clock size={14} /> ETA: {calculateETA(order.created_at, order.estimated_wait_time)}
                      </div>
                    )}
                    <p className="text-2xl font-black text-slate-900 mt-2">₹{order.total_amount.toFixed(2)}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Items Eaten</h4>
                  {order.items && order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 flex items-center justify-center bg-white rounded-lg font-bold text-slate-700 shadow-sm border border-slate-200">
                          {item.quantity}x
                        </span>
                        <span className="font-semibold text-slate-800">{item.item_name}</span>
                      </div>
                      <span className="font-bold text-slate-700">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  {(!order.items || order.items.length === 0) && (
                    <p className="text-sm text-slate-500 italic">Item details unavailable.</p>
                  )}
                </div>
              </div>
            ))}
            {orders.length > itemsPerPage && (
              <Pagination
                itemsPerPage={itemsPerPage}
                totalItems={orders.length}
                paginate={setCurrentPageOrders}
                currentPage={currentPageOrders}
              />
            )}
          </>
        )}
      </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-2xl shadow-sm border border-slate-100">
              <Star size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-xl font-bold text-slate-700">No Feedback Yet</h3>
              <p className="text-slate-500 mt-2">You haven't left any reviews. Share your thoughts on items you eat!</p>
            </div>
          ) : (
            <>
              {reviews.slice((currentPageReviews - 1) * itemsPerPage, currentPageReviews * itemsPerPage).map(review => (
                <div key={review.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{review.item_name}</h3>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-1">
                      <Store size={12} /> {review.canteen_name || 'Canteen 1'}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} size={18} fill={star <= review.rating ? "currentColor" : "none"} className={star <= review.rating ? "text-amber-500" : "text-slate-200"} />
                  ))}
                  <span className="text-slate-700 font-bold ml-2 text-sm">{review.rating} / 5</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex-1">
                  <p className="text-slate-700 italic text-sm">
                    "{review.comment || 'No written feedback provided.'}"
                  </p>
                </div>
              </div>
            ))}
            {reviews.length > itemsPerPage && (
              <div className="col-span-full">
                <Pagination
                  itemsPerPage={itemsPerPage}
                  totalItems={reviews.length}
                  paginate={setCurrentPageReviews}
                  currentPage={currentPageReviews}
                />
              </div>
            )}
          </>
        )}
      </div>
    )}
  </div>
  );
}
