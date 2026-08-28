import { useState } from 'react';
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

const socket = io('http://localhost:8000');

function OrderTracker() {
  const location = useLocation();
  const navigate = useNavigate();
  const orderId = location.state?.orderId;
  const [status, setStatus] = useState('pending');
  const [pickupCode, setPickupCode] = useState('');
  const [estimatedWaitTime, setEstimatedWaitTime] = useState(null);
  const [createdAt, setCreatedAt] = useState(null);

  useEffect(() => {
    if (!orderId) return;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/orders/${orderId}`);
        if (res.ok) {
          const data = await res.json();
          setStatus(data.status);
          setPickupCode(data.qr_code);
          setEstimatedWaitTime(data.estimated_wait_time);
          if (data.created_at) {
            setCreatedAt(new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch order status', err);
      }
    };
    fetchStatus();
    const intervalId = setInterval(fetchStatus, 3000);

    socket.on('order_updated', (data) => {
      if (data.order_id === orderId) {
        setStatus(data.status);
        if (data.qr_code) setPickupCode(data.qr_code);
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
        <p className={`text-2xl font-bold uppercase ${status === 'ready' ? 'text-green-600' : status === 'preparing' ? 'text-yellow-600' : 'text-gray-600'}`}>{status}</p>
        
        {createdAt && (
          <p className="mt-2 text-sm text-slate-500">
            Order placed at: <span className="font-bold">{createdAt}</span>
          </p>
        )}

        {estimatedWaitTime && status !== 'ready' && status !== 'completed' && (
          <p className="mt-2 text-slate-600">
            Estimated Wait Time: <span className="font-bold text-blue-600">{estimatedWaitTime} mins</span>
          </p>
        )}
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
