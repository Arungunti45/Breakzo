import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { RefreshCw, CheckCircle, AlertCircle, DollarSign, User } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

function AdminRefunds() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/payments/refunds/pending`);
      if (res.ok) {
        const data = await res.json();
        setRefunds(data);
      }
    } catch (err) {
      console.error('Failed to fetch refunds', err);
    }
    setLoading(false);
  };

  const processRefund = async (orderId) => {
    setProcessing(orderId);
    try {
      const res = await fetch(`${API_BASE}/api/payments/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId })
      });
      if (res.ok) {
        toast.success(`Refund for order #${orderId} processed!`);
        fetchRefunds();
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Refund failed');
      }
    } catch (err) {
      toast.error('Network error');
    }
    setProcessing(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Refund Management</h1>
          <p className="text-gray-500 text-sm">{refunds.length} pending refund{refunds.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={fetchRefunds}
          className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition font-medium"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {refunds.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <CheckCircle size={48} className="mx-auto mb-4 text-green-400" />
          <h3 className="text-lg font-semibold text-gray-700">No Pending Refunds</h3>
          <p className="text-gray-400 text-sm mt-1">All refund requests have been processed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {refunds.map((refund) => (
            <div key={refund.order_id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-red-100 p-3 rounded-lg">
                    <AlertCircle size={24} className="text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Order #{refund.order_id}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <User size={14} /> {refund.name || 'Unknown'}
                      </span>
                      <span>{refund.mobile_number || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900 flex items-center gap-1">
                      <DollarSign size={16} />₹{parseFloat(refund.total_amount).toFixed(2)}
                    </p>
                    <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium">
                      {refund.status}
                    </span>
                  </div>
                  <button
                    onClick={() => processRefund(refund.order_id)}
                    disabled={processing === refund.order_id}
                    className="bg-gradient-to-r from-green-500 to-green-700 text-white px-5 py-2.5 rounded-lg hover:opacity-90 transition font-medium disabled:opacity-50 flex items-center gap-2"
                  >
                    {processing === refund.order_id ? (
                      <><RefreshCw size={16} className="animate-spin" /> Processing...</>
                    ) : (
                      <><CheckCircle size={16} /> Approve Refund</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminRefunds;
