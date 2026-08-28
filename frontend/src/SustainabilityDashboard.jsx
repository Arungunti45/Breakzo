import { useState } from 'react';
import { useEffect } from 'react';
import { Leaf } from 'lucide-react';
import { Droplet } from 'lucide-react';
import { Recycle } from 'lucide-react';
import { TrendingDown } from 'lucide-react';

function SustainabilityDashboard() {
  const [wasteMetrics, setWasteMetrics] = useState({
    totalWasteKg: 0,
    costLost: 0,
    carbonFootprint: 0,
    itemsWasted: []
  });

  useEffect(() => {
    // Mock fetch sustainability data
    setWasteMetrics({
      totalWasteKg: 14.5,
      costLost: 450.00,
      carbonFootprint: 36.2, // kg CO2
      itemsWasted: [
        { name: 'Veg Sandwich', qty: 12, reason: 'Expired', cost: 120 },
        { name: 'Fruit Juice', qty: 5, reason: 'Damaged', cost: 75 },
        { name: 'Pasta', qty: 8, reason: 'Overproduced', cost: 160 }
      ]
    });
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 flex items-center gap-2">
            <Leaf className="text-green-600" size={32} />
            Sustainability & Waste Analytics
          </h2>
          <p className="text-slate-500 font-medium mt-1">Track food waste, carbon footprint, and drive campus sustainability goals.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl shadow-sm border border-green-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-green-800 font-bold mb-1 uppercase tracking-wider text-sm">Total Food Waste</p>
              <h3 className="text-4xl font-black text-green-900">{wasteMetrics.totalWasteKg} <span className="text-2xl text-green-700">kg</span></h3>
            </div>
            <div className="bg-white p-3 rounded-full text-green-600 shadow-sm"><Recycle size={24} /></div>
          </div>
          <p className="text-sm font-bold text-green-700 mt-4 flex items-center gap-1">
            <TrendingDown size={16} /> -2.4% from last week
          </p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-2xl shadow-sm border border-red-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-red-800 font-bold mb-1 uppercase tracking-wider text-sm">Financial Loss</p>
              <h3 className="text-4xl font-black text-red-900">${wasteMetrics.costLost.toFixed(2)}</h3>
            </div>
            <div className="bg-white p-3 rounded-full text-red-600 shadow-sm"><TrendingDown size={24} /></div>
          </div>
          <p className="text-sm font-bold text-red-700 mt-4">Due to overproduction & expiry</p>
        </div>

        <div className="bg-gradient-to-br from-slate-700 to-slate-900 p-6 rounded-2xl shadow-sm border border-slate-800 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-300 font-bold mb-1 uppercase tracking-wider text-sm">Carbon Footprint</p>
              <h3 className="text-4xl font-black text-white">{wasteMetrics.carbonFootprint} <span className="text-2xl text-slate-400">kg CO₂</span></h3>
            </div>
            <div className="bg-white/10 p-3 rounded-full text-emerald-400"><Droplet size={24} /></div>
          </div>
          <p className="text-sm font-medium text-emerald-300 mt-4">Estimated emissions from wasted food</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waste Breakdown Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-4">Detailed Waste Log</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase text-xs font-bold tracking-wider">
                  <th className="py-3 px-2">Item</th>
                  <th className="py-3 px-2 text-center">Qty</th>
                  <th className="py-3 px-2">Reason</th>
                  <th className="py-3 px-2 text-right">Cost Impact</th>
                </tr>
              </thead>
              <tbody>
                {wasteMetrics.itemsWasted.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition">
                    <td className="py-3 px-2 font-bold text-slate-700">{item.name}</td>
                    <td className="py-3 px-2 text-center font-medium">{item.qty}</td>
                    <td className="py-3 px-2 text-sm text-slate-500">{item.reason}</td>
                    <td className="py-3 px-2 text-right font-black text-red-600">${item.cost.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-6">
          <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
            🤖 AI Sustainability Recommendations
          </h3>
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
              <h4 className="font-bold text-slate-800 mb-1">Reduce Pasta Production</h4>
              <p className="text-sm text-slate-600">Pasta wastage is up 15%. AI recommends reducing batch size by 20% for the dinner slot to prevent overproduction.</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
              <h4 className="font-bold text-slate-800 mb-1">Near-Closing Discount</h4>
              <p className="text-sm text-slate-600">You have 12 Veg Sandwiches nearing expiry. Recommend triggering a 50% "Happy Hour" push notification at 4:30 PM.</p>
              <button className="mt-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-4 rounded text-sm transition">Trigger Offer Now</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SustainabilityDashboard;
