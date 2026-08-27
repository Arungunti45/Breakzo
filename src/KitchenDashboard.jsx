

import { useState } from 'react';
import { useEffect } from 'react';

import { io } from 'socket.io-client';



const socket = io('http://localhost:8000'); // Assuming backend runs on 5000



function KitchenDashboard() {

  const [orders, setOrders] = useState([]);



  useEffect(() => {

    // Fetch existing active orders on load

    const fetchActiveOrders = async () => {

      try {

        const res = await fetch('http://localhost:8000/api/orders/active');

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

      await fetch(`http://localhost:8000/api/orders/${orderId}/status`, {

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

      await fetch(`http://localhost:8000/api/orders/${orderId}/status`, {

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

                const res = await fetch('http://localhost:8000/api/pickup/verify', {

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
                {order.created_at && (
                  <p className="text-slate-500 text-sm mt-1">Received: <span className="font-bold">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></p>
                )}

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








