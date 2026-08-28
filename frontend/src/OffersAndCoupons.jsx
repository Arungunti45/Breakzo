import { useState, useEffect } from 'react';
import { Tag, Sparkles, Gift, Clock, Copy, CheckCircle2 } from 'lucide-react';

function OffersAndCoupons() {
  const [copiedCoupon, setCopiedCoupon] = useState(null);
  const [festOffers, setFestOffers] = useState([]);
  const [coupons, setCoupons] = useState([]);

  useEffect(() => {
    fetch('http://localhost:8000/api/offers/fest_offers')
      .then(res => res.json())
      .then(data => setFestOffers(data))
      .catch(err => console.error(err));
      
    fetch('http://localhost:8000/api/offers/coupons')
      .then(res => res.json())
      .then(data => setCoupons(data))
      .catch(err => console.error(err));
  }, []);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-fade-in">
      {/* Header section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 p-8 sm:p-12 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-20">
          <Sparkles size={200} />
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight drop-shadow-md">Campus Offers & Fest Deals</h1>
          <p className="text-lg sm:text-xl font-medium text-pink-100 max-w-2xl">Grab the best deals, apply coupons at checkout, and save on your daily campus cravings.</p>
        </div>
      </div>

      {/* Fest Offers Section */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-red-100 text-red-600 rounded-xl">
            <Gift size={24} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Active Fest Offers</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {festOffers.map((offer) => (
            <div key={offer.id} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${offer.color} p-6 sm:p-8 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
              <div className="absolute top-0 right-0 p-4 bg-white/20 backdrop-blur-md rounded-bl-3xl">
                <span className="font-black text-xl">{offer.discount}</span>
              </div>
              <h3 className="text-2xl font-bold mb-3 mt-2 pr-16">{offer.title}</h3>
              <p className="text-white/90 leading-relaxed">{offer.description}</p>
              <button className="mt-6 bg-white text-slate-900 font-bold px-6 py-2 rounded-full hover:bg-slate-100 transition-colors shadow-sm text-sm">
                Explore Deals
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Coupons Section */}
      <div className="pt-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
            <Tag size={24} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Your Coupons</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map((coupon) => (
            <div key={coupon.code} className="bg-white dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col justify-between hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-500"></div>
              
              <div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-lg font-mono font-bold text-lg text-slate-800 dark:text-white tracking-widest border border-slate-200 dark:border-slate-600">
                    {coupon.code}
                  </div>
                  <button 
                    onClick={() => handleCopy(coupon.code)}
                    className="p-2 text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors bg-white dark:bg-slate-800 rounded-full shadow-sm"
                    title="Copy code"
                  >
                    {copiedCoupon === coupon.code ? <CheckCircle2 size={20} className="text-emerald-500" /> : <Copy size={20} />}
                  </button>
                </div>
                <p className="text-slate-600 dark:text-slate-300 font-medium relative z-10">{coupon.description}</p>
              </div>
              
              <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg w-max relative z-10">
                <Clock size={14} />
                {coupon.valid_until ? new Date(coupon.valid_until).toLocaleDateString() : 'No expiry'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default OffersAndCoupons;
