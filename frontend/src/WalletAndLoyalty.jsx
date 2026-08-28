import { useState } from 'react';
import { useEffect } from 'react';

function WalletAndLoyalty() {
  const [wallet, setWallet] = useState({ balance: 0.00 });
  const [loyalty, setLoyalty] = useState({ points: 0, current_streak: 0, highest_streak: 0 });
  const [transactions, setTransactions] = useState([]);
  const [amountToAdd, setAmountToAdd] = useState('');

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/wallet/1'); // Mock user 1
      if (res.ok) {
        const data = await res.json();
        setWallet({ balance: data.balance });
        setTransactions(data.transactions.map(t => ({
          id: t.id,
          type: t.transaction_type,
          amount: parseFloat(t.amount),
          date: new Date(t.created_at).toLocaleString(),
          status: t.status
        })));
      }
    } catch (e) {
      console.error("Failed to fetch wallet", e);
    }
  };

  const handleTopUp = async () => {
    if (!amountToAdd || isNaN(amountToAdd) || amountToAdd <= 0) return;
    
    try {
      const added = parseFloat(amountToAdd);
      const res = await fetch('http://localhost:8000/api/wallet/1/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: added })
      });
      if (res.ok) {
        const data = await res.json();
        setWallet({ balance: data.new_balance });
        fetchWalletData();
        setAmountToAdd('');
        alert(`Successfully added ₹${added} to your Campus Wallet!`);
      }
    } catch (e) {
      console.error("Topup failed", e);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <h2 className="text-3xl font-black text-slate-800 mb-6">Wallet & Rewards</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Wallet Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-blue-500 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M21 18v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1h-9a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h9zm-9-2h10V8H12v8zm4-2.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>
          </div>
          <p className="text-blue-100 font-medium mb-1">Available Balance</p>
          <h3 className="text-4xl font-black mb-6">₹{wallet.balance.toFixed(2)}</h3>
          
          <div className="flex gap-2">
            <input 
              type="number" 
              placeholder="Amount (₹)" 
              value={amountToAdd}
              onChange={(e) => setAmountToAdd(e.target.value)}
              className="px-4 py-2 rounded-lg text-slate-800 w-32 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button 
              onClick={handleTopUp}
              className="bg-white text-blue-600 px-6 py-2 rounded-lg font-bold hover:bg-blue-50 transition-colors shadow-lg"
            >
              Top Up
            </button>
          </div>
        </div>

        {/* Loyalty Card */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-400 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          </div>
          <p className="text-orange-100 font-medium mb-1">Campus Points</p>
          <h3 className="text-4xl font-black mb-6">{loyalty.points} pts</h3>
          
          <div className="flex gap-6">
            <div>
              <p className="text-orange-100 text-sm">Current Streak</p>
              <p className="font-bold text-xl">{loyalty.current_streak} 🔥</p>
            </div>
            <div>
              <p className="text-orange-100 text-sm">Highest Streak</p>
              <p className="font-bold text-xl">{loyalty.highest_streak} 🏆</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-xl font-bold text-slate-800 mb-4">Recent Transactions</h3>
        <div className="space-y-4">
          {transactions.map(tx => (
            <div key={tx.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg transition-colors border-b border-slate-100 last:border-0">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'topup' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {tx.type === 'topup' ? '+' : '-'}
                </div>
                <div>
                  <p className="font-bold text-slate-700 capitalize">{tx.type === 'topup' ? 'Wallet Top Up' : 'Canteen Payment'}</p>
                  <p className="text-sm text-slate-500">{tx.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-black ${tx.type === 'topup' ? 'text-green-600' : 'text-slate-800'}`}>
                  {tx.type === 'topup' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                </p>
                <p className="text-xs font-medium text-slate-400 capitalize">{tx.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default WalletAndLoyalty;
