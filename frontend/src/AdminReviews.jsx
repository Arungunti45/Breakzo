import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Star, MessageSquare } from 'lucide-react';
import Pagination from './Pagination';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/canteens/1/reviews');
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      } else {
        toast.error('Failed to load reviews');
      }
    } catch (err) {
      toast.error('Server error while loading reviews');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4 text-slate-500">Loading student feedback...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-amber-100 p-3 rounded-xl text-amber-600">
          <MessageSquare size={28} />
        </div>
        <div>
          <h2 className="text-3xl font-black text-slate-800">Student Feedback</h2>
          <p className="text-slate-500 font-medium">See what students are saying about your food.</p>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-100 text-center flex flex-col items-center">
          <Star className="text-slate-300 w-16 h-16 mb-4" />
          <h3 className="text-xl font-bold text-slate-700">No Feedback Yet</h3>
          <p className="text-slate-500 mt-2">When students leave reviews on menu items, they will appear here.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(review => (
              <div key={review.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col hover:shadow-md transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{review.item_name}</h3>
                  <div className="flex items-center gap-1 mt-1 text-amber-500">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} size={16} fill={star <= review.rating ? "currentColor" : "none"} className={star <= review.rating ? "text-amber-500" : "text-slate-200"} />
                    ))}
                    <span className="text-slate-700 font-bold ml-2 text-sm">{review.rating} / 5</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex-1 mb-4">
                <p className="text-slate-700 italic text-sm">
                  "{review.comment || 'No written feedback provided.'}"
                </p>
              </div>

              <div className="border-t border-slate-100 pt-3 mt-auto flex items-center justify-between">
                <span className="font-bold text-slate-700 text-sm">{review.user_name}</span>
                <span className="text-xs text-slate-500 font-medium">{review.mobile_number}</span>
              </div>
            </div>
            ))}
          </div>
          {reviews.length > itemsPerPage && (
            <Pagination
              itemsPerPage={itemsPerPage}
              totalItems={reviews.length}
              paginate={setCurrentPage}
              currentPage={currentPage}
            />
          )}
        </>
      )}
    </div>
  );
}
