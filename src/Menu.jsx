import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Clock, Zap, Search, Info, X, Star, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const socket = io('http://localhost:8000');

function Menu() {
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [walletBalance, setWalletBalance] = useState(0);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchItems();

    socket.on('menu_updated', () => {
      fetchItems();
    });

    return () => {
      socket.off('menu_updated');
    };
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/canteens/1/menu');
      const data = await res.json();
      setMenuItems(data.filter(item => item.is_available));
    } catch (err) {
      toast.error('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', ...Array.from(new Set(menuItems.map(item => item.category)))];
  
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const [activeItem, setActiveItem] = useState(null);
  
  // For Info Modal
  const [showInfo, setShowInfo] = useState(false);
  const [itemDetails, setItemDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // For Customization Modal
  const [showCustomize, setShowCustomize] = useState(false);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);

  const handleInfoClick = async (item) => {
    setActiveItem(item);
    setShowInfo(true);
    setLoadingDetails(true);
    try {
      const res = await fetch(`http://localhost:8000/api/canteens/1/menu/${item.id}/details`);
      const data = await res.json();
      setItemDetails(data);
    } catch (err) {
      toast.error('Failed to load item details');
    }
    setLoadingDetails(false);
  };

  const handleAddToCartClick = (item) => {
    if (item.customization_options && (item.customization_options.sizes?.length > 0 || item.customization_options.addons?.length > 0)) {
      setActiveItem(item);
      setSelectedSize(item.customization_options.sizes?.[0] || null);
      setSelectedAddons([]);
      setShowCustomize(true);
    } else {
      addToCart(item, null, []);
    }
  };

  const addToCart = (item, size, addons) => {
    setCart(prev => {
      const optionsHash = JSON.stringify({ size, addons });
      const cartItemId = `${item.id}_${optionsHash}`;
      
      const existing = prev.find(i => i.cartItemId === cartItemId);
      if (existing) {
        return prev.map(i => i.cartItemId === cartItemId ? { ...i, quantity: i.quantity + 1 } : i);
      }
      
      let finalPrice = Number(item.price);
      if (size) finalPrice += Number(size.price);
      addons.forEach(a => finalPrice += Number(a.price));

      return [...prev, { 
        ...item, 
        cartItemId,
        quantity: 1, 
        price: finalPrice, 
        selected_options: { size, addons } 
      }];
    });
    toast.success(`${item.name} added to cart`);
    setShowCustomize(false);
  };

  const updateQuantity = (cartItemId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.cartItemId === cartItemId) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (cartItemId) => {
    setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
  };

  const totalAmount = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  const initiateCheckout = async () => {
    if (cart.length === 0) return toast.error('Your cart is empty');
    
    // Fetch wallet balance
    try {
      const storedUserId = localStorage.getItem('userId') || 1;
      const res = await fetch(`http://localhost:8000/api/wallet/${storedUserId}`);
      if (res.ok) {
        const data = await res.json();
        setWalletBalance(data.balance);
      }
    } catch (err) {
      console.error(err);
    }
    
    setShowPayment(true);
  };

  const handlePaymentAndCheckout = async () => {
    setCheckoutLoading(true);
    const storedUserId = localStorage.getItem('userId');
    const payload = {
      user_id: storedUserId ? parseInt(storedUserId) : 1,
      canteen_id: 1,
      total_amount: totalAmount,
      items: cart.map(item => ({
        menu_item_id: item.id,
        quantity: item.quantity,
        price: item.price,
        selected_options: item.selected_options || {}
      })),
      payment_method: paymentMethod
    };
    try {
      const res = await fetch('http://localhost:8000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Payment successful! Order placed.');
        setCart([]);
        setShowPayment(false);
        navigate('/user/tracker', { state: { orderId: data.order_id } });
      } else {
        toast.error(data.detail || data.error || 'Payment failed');
      }
    } catch (err) {
      toast.error('Server connection error');
    }
    setCheckoutLoading(false);
  };

  if (loading) return <div className="p-4 animate-pulse">Loading delicious food...</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto">
      {/* Menu List */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex flex-col mb-4">
          <h2 className="text-3xl font-bold text-slate-800 mb-4">Menu</h2>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Bar */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search food items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition"
              />
            </div>
            
            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white min-w-[200px] cursor-pointer hover:border-blue-300 transition"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow border border-slate-100 text-center text-slate-500">
            No items available in this category.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredItems.map(item => (
              <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition flex flex-col overflow-hidden justify-between">
                <div>
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-48 object-cover bg-slate-50" />
                  ) : (
                    <div className="w-full h-48 bg-slate-100 flex items-center justify-center text-slate-400">No Image</div>
                  )}
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        {item.name}
                        <button onClick={() => handleInfoClick(item)} className="text-slate-400 hover:text-blue-600 transition" title="View Info">
                          <Info size={16} />
                        </button>
                      </h3>
                      <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded font-medium ml-2 text-right shrink-0">{item.category}</span>
                    </div>
                    <p className="text-sm text-slate-500 mb-0">{item.description}</p>
                    
                    {/* Dietary Badges */}
                    <div className="flex gap-1 mt-2">
                      {item.is_vegan && <span className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 rounded font-bold">VEGAN</span>}
                      {item.is_vegetarian && !item.is_vegan && <span className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded font-bold">VEG</span>}
                      {!item.is_vegetarian && <span className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0.5 rounded font-bold">NON-VEG</span>}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center px-5 pb-5 mt-auto pt-4 border-t border-slate-100">
                  <div>
                    <p className="text-xl font-black text-blue-700">₹{Number(item.price).toFixed(2)}</p>
                    <p className={`text-xs font-bold ${item.stock_quantity < 5 ? 'text-red-500' : 'text-slate-500'}`}>
                      {item.stock_quantity > 0 ? `${item.stock_quantity} available` : 'Sold out'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAddToCartClick(item)}
                    disabled={item.stock_quantity < 1}
                    className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 ${item.stock_quantity < 1 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'}`}
                  >
                    {item.stock_quantity < 1 ? 'Out of Stock' : <><Plus size={18} /> Add</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Shopping Cart Sidebar */}
      <div className="w-full lg:w-96">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 sticky top-24 overflow-hidden flex flex-col max-h-[80vh]">
          <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <ShoppingCart size={20} /> Your Order
            </h3>
            <span className="bg-blue-600 px-2 py-1 rounded-full text-xs font-bold">{cart.length} items</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {cart.length === 0 ? (
              <p className="text-center text-slate-400 py-8">Your cart is empty.</p>
            ) : (
              cart.map(item => (
                <div key={item.cartItemId} className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-800">{item.name}</h4>
                    {item.selected_options?.size && (
                      <p className="text-xs text-blue-600 font-medium">Size: {item.selected_options.size.name}</p>
                    )}
                    {item.selected_options?.addons?.length > 0 && (
                      <p className="text-xs text-slate-500">
                        + {item.selected_options.addons.map(a => a.name).join(', ')}
                      </p>
                    )}
                    <p className="text-sm text-slate-500 mt-1">₹{Number(item.price).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-slate-100 rounded-lg p-1">
                      <button onClick={() => updateQuantity(item.cartItemId, -1)} className="p-1 hover:bg-white rounded hover:shadow-sm text-slate-600"><Minus size={14} /></button>
                      <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.cartItemId, 1)} className="p-1 hover:bg-white rounded hover:shadow-sm text-slate-600"><Plus size={14} /></button>
                    </div>
                    <button onClick={() => removeFromCart(item.cartItemId)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-600 font-medium">Total Amount</span>
              <span className="text-2xl font-black text-slate-900">₹{totalAmount.toFixed(2)}</span>
            </div>
            <button
              onClick={initiateCheckout}
              disabled={cart.length === 0}
              className={`w-full py-3 rounded-lg font-bold text-lg transition shadow-sm ${cart.length === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'}`}
            >
              Proceed to Payment
            </button>
          </div>
        </div>
        {/* Payment Modal */}
        {showPayment && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b pb-4 mb-6">
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2"><CreditCard className="text-blue-600" /> Checkout</h2>
                <button onClick={() => setShowPayment(false)} className="text-slate-400 hover:text-slate-700 text-xl font-bold">&times;</button>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-xl mb-6 flex justify-between items-center">
                <div>
                  <p className="text-slate-500 mb-1 text-sm font-bold uppercase">Total Amount</p>
                  <p className="text-3xl font-black text-blue-700">₹{totalAmount.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-slate-500 mb-2 text-sm font-bold uppercase">Payment Method</p>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setPaymentMethod('online')}
                    className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition ${paymentMethod === 'online' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:border-blue-300'}`}
                  >
                    <CreditCard size={18} /> UPI / Card
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('wallet')}
                    className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition ${paymentMethod === 'wallet' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:border-blue-300'}`}
                  >
                    <Wallet size={18} /> Wallet (₹{walletBalance.toFixed(2)})
                  </button>
                </div>
                {paymentMethod === 'wallet' && walletBalance < totalAmount && (
                  <p className="text-red-500 text-xs font-bold mt-2 flex items-center gap-1"><Info size={12} /> Insufficient wallet balance.</p>
                )}
              </div>

              <p className="text-slate-600 mb-6 text-center">Your payment will be securely processed. Once completed, your order will be sent to the kitchen instantly.</p>
              <button
                onClick={handlePaymentAndCheckout}
                disabled={checkoutLoading || (paymentMethod === 'wallet' && walletBalance < totalAmount)}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xl transition flex justify-center items-center gap-2 disabled:bg-slate-400"
              >
                {checkoutLoading ? 'Processing...' : 'Pay & Place Order'}
              </button>
            </div>
          </div>
        )}

        {/* Info Modal */}
        {showInfo && activeItem && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button onClick={() => setShowInfo(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"><X size={24} /></button>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">{activeItem.name}</h2>
              <div className="flex gap-2 mb-4">
                {activeItem.is_vegan && <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-bold">VEGAN</span>}
                {activeItem.is_vegetarian && !activeItem.is_vegan && <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded font-bold">VEG</span>}
                {!activeItem.is_vegetarian && <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded font-bold">NON-VEG</span>}
                <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded font-bold">{activeItem.spice_level?.toUpperCase() || 'NONE'}</span>
                {activeItem.calories > 0 && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded font-bold">{activeItem.calories} kcal</span>}
              </div>
              
              {loadingDetails ? (
                <div className="py-8 text-center text-slate-500">Loading details...</div>
              ) : itemDetails ? (
                <div className="space-y-4">
                  {itemDetails.average_rating > 0 && (
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star fill="currentColor" size={18} />
                      <span className="font-bold text-slate-700">{itemDetails.average_rating} / 5</span>
                      <span className="text-sm text-slate-400">({itemDetails.reviews.length} reviews)</span>
                    </div>
                  )}
                  {activeItem.allergens && (
                    <div>
                      <h4 className="font-bold text-slate-700 mb-1">Allergens</h4>
                      <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{activeItem.allergens}</p>
                    </div>
                  )}
                  {itemDetails.ingredients?.length > 0 && (
                    <div>
                      <h4 className="font-bold text-slate-700 mb-1">Ingredients</h4>
                      <div className="flex flex-wrap gap-1">
                        {itemDetails.ingredients.map((ing, i) => (
                          <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">{ing.name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {itemDetails.reviews?.length > 0 && (
                    <div>
                      <h4 className="font-bold text-slate-700 mb-2">Recent Reviews</h4>
                      <div className="space-y-2">
                        {itemDetails.reviews.slice(0, 3).map((r, i) => (
                          <div key={i} className="bg-slate-50 p-3 rounded text-sm">
                            <div className="flex justify-between mb-1">
                              <span className="font-bold text-slate-700">{r.user_name || 'Anonymous'}</span>
                              <span className="text-amber-500 flex items-center gap-1"><Star size={12} fill="currentColor"/> {r.rating}</span>
                            </div>
                            <p className="text-slate-600">{r.comment}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500">Failed to load details.</div>
              )}
            </div>
          </div>
        )}

        {/* Customization Modal */}
        {showCustomize && activeItem && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button onClick={() => setShowCustomize(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"><X size={24} /></button>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Customize {activeItem.name}</h2>
              
              {activeItem.customization_options?.sizes?.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold text-slate-700 mb-3">Choose Size</h3>
                  <div className="space-y-2">
                    {activeItem.customization_options.sizes.map((size, idx) => (
                      <label key={idx} className={`flex justify-between items-center p-3 border rounded-xl cursor-pointer transition ${selectedSize?.name === size.name ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                        <div className="flex items-center gap-3">
                          <input 
                            type="radio" 
                            name="size" 
                            checked={selectedSize?.name === size.name} 
                            onChange={() => setSelectedSize(size)}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="font-medium text-slate-700">{size.name}</span>
                        </div>
                        <span className="text-slate-500 font-medium">+{size.price ? `₹${size.price}` : 'Free'}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {activeItem.customization_options?.addons?.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold text-slate-700 mb-3">Add-ons</h3>
                  <div className="space-y-2">
                    {activeItem.customization_options.addons.map((addon, idx) => (
                      <label key={idx} className={`flex justify-between items-center p-3 border rounded-xl cursor-pointer transition ${selectedAddons.some(a => a.name === addon.name) ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            checked={selectedAddons.some(a => a.name === addon.name)} 
                            onChange={(e) => {
                              if (e.target.checked) setSelectedAddons([...selectedAddons, addon]);
                              else setSelectedAddons(selectedAddons.filter(a => a.name !== addon.name));
                            }}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="font-medium text-slate-700">{addon.name}</span>
                        </div>
                        <span className="text-slate-500 font-medium">+{addon.price ? `₹${addon.price}` : 'Free'}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-slate-200 pt-4 mt-4">
                <div className="flex justify-between items-center mb-4 text-lg font-bold">
                  <span>Total Item Price</span>
                  <span className="text-blue-700">₹{(Number(activeItem.price) + (selectedSize ? Number(selectedSize.price) : 0) + selectedAddons.reduce((sum, a) => sum + Number(a.price), 0)).toFixed(2)}</span>
                </div>
                <button 
                  onClick={() => addToCart(activeItem, selectedSize, selectedAddons)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg transition flex justify-center items-center gap-2"
                >
                  <ShoppingCart size={20} /> Add to Cart
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Menu;
