import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Tag, Gift, Trash2, PlusCircle } from 'lucide-react';
import Pagination from './Pagination';

function AdminOffersManager() {
  const [coupons, setCoupons] = useState([]);
  const [festOffers, setFestOffers] = useState([]);
  
  // Forms state
  const [couponForm, setCouponForm] = useState({ code: '', desc: '', discount: '' });
  const [offerForm, setOfferForm] = useState({ title: '', desc: '', discount: '', color: 'from-blue-500 to-indigo-500' });

  // Pagination state
  const [currentPageOffers, setCurrentPageOffers] = useState(1);
  const [currentPageCoupons, setCurrentPageCoupons] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchCoupons();
    fetchFestOffers();
  }, []);

  const fetchCoupons = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/offers/coupons');
      const data = await res.json();
      setCoupons(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchFestOffers = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/offers/fest_offers');
      const data = await res.json();
      setFestOffers(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if(!couponForm.code) return;
    try {
      const res = await fetch('http://localhost:8000/api/offers/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponForm.code.toUpperCase(),
          description: couponForm.desc,
          discount_percentage: parseFloat(couponForm.discount) || 0,
          is_active: true
        })
      });
      if (res.ok) {
        toast.success("Coupon created!");
        setCouponForm({ code: '', desc: '', discount: '' });
        fetchCoupons();
      }
    } catch (e) {
      toast.error("Failed to create coupon");
    }
  };

  const handleCreateOffer = async (e) => {
    e.preventDefault();
    if(!offerForm.title) return;
    try {
      const res = await fetch('http://localhost:8000/api/offers/fest_offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: offerForm.title,
          description: offerForm.desc,
          discount: offerForm.discount,
          color: offerForm.color,
          is_active: true
        })
      });
      if (res.ok) {
        toast.success("Fest offer created!");
        setOfferForm({ title: '', desc: '', discount: '', color: 'from-blue-500 to-indigo-500' });
        fetchFestOffers();
      }
    } catch (e) {
      toast.error("Failed to create offer");
    }
  };

  const handleDeleteCoupon = async (id) => {
    try {
      await fetch(`http://localhost:8000/api/offers/coupons/${id}`, { method: 'DELETE' });
      toast.success("Coupon deleted");
      fetchCoupons();
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  const handleDeleteOffer = async (id) => {
    try {
      await fetch(`http://localhost:8000/api/offers/fest_offers/${id}`, { method: 'DELETE' });
      toast.success("Offer deleted");
      fetchFestOffers();
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Offers & Coupons Management</h2>
        <p className="text-slate-500 dark:text-slate-400">Create special fest offers and generate discount coupons for students.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Fest Offers Management */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
              <Gift className="text-pink-500" /> Create Fest Offer
            </h3>
            <form onSubmit={handleCreateOffer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
                <input required type="text" value={offerForm.title} onChange={e => setOfferForm({...offerForm, title: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500" placeholder="e.g. Diwali Dhamaka" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea required value={offerForm.desc} onChange={e => setOfferForm({...offerForm, desc: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500" placeholder="Valid on all thalis..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Discount Text</label>
                  <input required type="text" value={offerForm.discount} onChange={e => setOfferForm({...offerForm, discount: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500" placeholder="e.g. 50% OFF" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Color Theme</label>
                  <select value={offerForm.color} onChange={e => setOfferForm({...offerForm, color: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500">
                    <option value="from-blue-500 to-indigo-500">Blue-Indigo</option>
                    <option value="from-orange-500 to-red-500">Orange-Red</option>
                    <option value="from-purple-500 to-pink-500">Purple-Pink</option>
                    <option value="from-emerald-500 to-teal-500">Emerald-Teal</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
                <PlusCircle size={20} /> Create Offer
              </button>
            </form>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-slate-700 dark:text-slate-300">Active Fest Offers</h3>
            {festOffers.slice((currentPageOffers - 1) * itemsPerPage, currentPageOffers * itemsPerPage).map(o => (
              <div key={o.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center shadow-sm">
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white">{o.title} <span className="text-xs bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full ml-2">{o.discount}</span></h4>
                  <p className="text-sm text-slate-500 truncate max-w-sm">{o.description}</p>
                </div>
                <button onClick={() => handleDeleteOffer(o.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            {festOffers.length === 0 && <p className="text-slate-400 text-sm">No active fest offers.</p>}
            {festOffers.length > itemsPerPage && (
              <Pagination
                itemsPerPage={itemsPerPage}
                totalItems={festOffers.length}
                paginate={setCurrentPageOffers}
                currentPage={currentPageOffers}
              />
            )}
          </div>
        </div>

        {/* Coupons Management */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
              <Tag className="text-emerald-500" /> Create Coupon Code
            </h3>
            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Coupon Code</label>
                  <input required type="text" value={couponForm.code} onChange={e => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white font-mono uppercase focus:ring-2 focus:ring-emerald-500" placeholder="e.g. GET50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Discount %</label>
                  <input type="number" min="1" max="100" value={couponForm.discount} onChange={e => setCouponForm({...couponForm, discount: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500" placeholder="e.g. 20" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <input required type="text" value={couponForm.desc} onChange={e => setCouponForm({...couponForm, desc: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500" placeholder="Flat 20% off on all orders..." />
              </div>
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
                <PlusCircle size={20} /> Create Coupon
              </button>
            </form>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-slate-700 dark:text-slate-300">Active Coupons</h3>
            {coupons.slice((currentPageCoupons - 1) * itemsPerPage, currentPageCoupons * itemsPerPage).map(c => (
              <div key={c.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center shadow-sm">
                <div>
                  <h4 className="font-mono font-bold text-slate-800 dark:text-white tracking-wider">{c.code} <span className="font-sans text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full ml-2">{c.discount_percentage}% OFF</span></h4>
                  <p className="text-sm text-slate-500 mt-1">{c.description}</p>
                </div>
                <button onClick={() => handleDeleteCoupon(c.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            {coupons.length === 0 && <p className="text-slate-400 text-sm">No active coupons.</p>}
            {coupons.length > itemsPerPage && (
              <Pagination
                itemsPerPage={itemsPerPage}
                totalItems={coupons.length}
                paginate={setCurrentPageCoupons}
                currentPage={currentPageCoupons}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminOffersManager;
