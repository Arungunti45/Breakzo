import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Star, Clock, Users } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

const FALLBACK_CANTEENS = [
  { id: 1, name: 'Main Canteen', location: 'Building A — Ground Floor', rating: 4.5, status: 'open' },
  { id: 2, name: 'Café Corner', location: 'Building B — 1st Floor', rating: 4.2, status: 'open' },
  { id: 3, name: 'Quick Bites', location: 'Building C — Near Library', rating: 4.0, status: 'closed' },
];

function MultiCanteen() {
  const navigate = useNavigate();
  const [canteens, setCanteens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCanteens();
  }, []);

  const fetchCanteens = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/canteens/`);
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          setCanteens(data);
        } else {
          setCanteens(FALLBACK_CANTEENS);
        }
      } else {
        setCanteens(FALLBACK_CANTEENS);
      }
    } catch {
      setCanteens(FALLBACK_CANTEENS);
    }
    setLoading(false);
  };

  const gradients = [
    'from-blue-500 to-indigo-600',
    'from-orange-400 to-pink-500',
    'from-green-400 to-emerald-600',
    'from-purple-500 to-violet-600',
    'from-rose-400 to-red-500',
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Campus Canteens</h1>
        <p className="text-gray-500 text-sm mt-1">Choose a canteen to explore the menu</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {canteens.map((canteen, i) => {
          const isOpen = canteen.status !== 'closed' && canteen.is_open !== false;
          return (
            <div
              key={canteen.id}
              onClick={() => {
                localStorage.setItem('selectedCanteenId', canteen.id);
                navigate('/user/menu?canteen=' + canteen.id);
              }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
            >
              {/* Gradient Header */}
              <div className={`h-32 bg-gradient-to-r ${gradients[i % gradients.length]} flex items-center justify-center relative`}>
                <span className="text-5xl">🍽️</span>
                {/* Status badge */}
                <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold ${
                  isOpen ? 'bg-green-400/90 text-white' : 'bg-red-400/90 text-white'
                }`}>
                  {isOpen ? '● Open' : '● Closed'}
                </span>
              </div>

              {/* Info */}
              <div className="p-5">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition">
                  {canteen.name}
                </h3>

                <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                  <MapPin size={14} />
                  <span>{canteen.location || 'Campus'}</span>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1">
                    <Star size={14} className="text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-semibold text-gray-700">{canteen.rating || '4.0'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-400 text-sm">
                    <Clock size={14} />
                    <span>~15 min</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MultiCanteen;
