import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, Save, Package, Search } from 'lucide-react';
import { io } from 'socket.io-client';
import Pagination from './Pagination';

const socket = io('http://localhost:8000');
const API_BASE = 'http://localhost:8000';

const emptyItem = {
  canteen_id: 1,
  name: '',
  description: '',
  price: '',
  category: 'BREAKFAST',
  stock_quantity: 50,
  is_available: true,
  image_url: '',
  is_vegan: false,
  is_vegetarian: true,
  customization_options: { sizes: [], addons: [] }
};

const MASTER_CATEGORIES = [
  "BREAKFAST", "SOUTH INDIAN", "NORTH INDIAN", "RICE & BIRYANI", "NOODLES & PASTA",
  "FAST FOOD", "SNACKS", "CHAAT", "ROLLS & MOMOS", "SOUTH INDIAN SPECIALS", 
  "NON-VEGETARIAN", "VEGETARIAN", "PANEER SPECIALS", "EGG ITEMS", "BEVERAGES - HOT", 
  "BEVERAGES - COLD", "FRESH JUICES", "MOCKTAILS", "DESSERTS", "BAKERY", 
  "HEALTHY / FITNESS", "COMBOS", "STUDENT BUDGET ITEMS", "PACKAGED ITEMS", "SPECIAL / DAILY ITEMS"
];

function AdminMenuManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyItem });
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
      const res = await fetch(`${API_BASE}/api/canteens/1/menu`);
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      toast.error('Failed to load menu items');
    }
    setLoading(false);
  };

  const dynamicCategories = Array.from(new Set([...MASTER_CATEGORIES, ...items.map(i => i.category)]));
  const displayCategories = ['All', ...dynamicCategories];
  
  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  // Get current page items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      toast.error('Name and price are required');
      return;
    }

    const payload = {
      ...form,
      price: parseFloat(form.price),
      stock_quantity: parseInt(form.stock_quantity)
    };

    try {
      let res;
      if (editingId) {
        res = await fetch(`${API_BASE}/api/menu_items/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_BASE}/api/menu_items/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        toast.success(editingId ? 'Item updated!' : 'Item created!');
        setShowForm(false);
        setEditingId(null);
        setForm({ ...emptyItem });
        fetchItems();
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Operation failed');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  const handleEdit = (item) => {
    setForm({
      canteen_id: item.canteen_id || 1,
      name: item.name,
      description: item.description || '',
      price: item.price,
      category: item.category || 'Main Course',
      stock_quantity: item.stock_quantity || 0,
      is_available: item.is_available !== false,
      image_url: item.image_url || '',
      customization_options: typeof item.customization_options === 'string' 
        ? JSON.parse(item.customization_options) 
        : (item.customization_options || { sizes: [], addons: [] })
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/menu_items/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Item deleted');
        fetchItems();
      }
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const toggleAvailability = async (item) => {
    const payload = {
      canteen_id: item.canteen_id || 1,
      name: item.name,
      description: item.description || '',
      price: parseFloat(item.price),
      category: item.category || 'Main Course',
      stock_quantity: item.stock_quantity || 0,
      is_available: !item.is_available,
      image_url: item.image_url || ''
    };
    try {
      const res = await fetch(`${API_BASE}/api/menu_items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast.success(`${item.name} ${!item.is_available ? 'enabled' : 'disabled'}`);
        fetchItems();
      }
    } catch (err) {
      toast.error('Update failed');
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
          <p className="text-gray-500 text-sm">{items.length} items in menu</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm({ ...emptyItem }); }}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2.5 rounded-lg hover:opacity-90 transition font-medium"
        >
          <Plus size={18} /> Add Item
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Bar */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search items by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition"
          />
        </div>
        
        {/* Category Dropdown */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white min-w-[200px] cursor-pointer hover:border-blue-300 transition"
        >
          {displayCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{editingId ? 'Edit Item' : 'Add New Item'}</h2>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Paneer Butter Masala"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" rows={2}
                  placeholder="Rich and creamy paneer curry..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
                  <input
                    type="number" step="0.5" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="120"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Qty</label>
                  <input
                    type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {dynamicCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input
                  type="text" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox" checked={form.is_available}
                  onChange={(e) => setForm({ ...form, is_available: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label className="text-sm text-gray-700">Available for ordering</label>
              </div>

              {/* Sizes Section */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="font-semibold text-gray-700 mb-2">Sizes (Optional)</h3>
                {(form.customization_options?.sizes || []).map((size, idx) => (
                  <div key={idx} className="flex gap-2 mb-2 items-center">
                    <input type="text" value={size.name} onChange={e => {
                      const newSizes = [...form.customization_options.sizes];
                      newSizes[idx].name = e.target.value;
                      setForm({...form, customization_options: {...form.customization_options, sizes: newSizes}});
                    }} placeholder="Size (e.g. Large)" className="w-1/2 px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="number" step="0.5" value={size.price} onChange={e => {
                      const newSizes = [...form.customization_options.sizes];
                      newSizes[idx].price = parseFloat(e.target.value) || 0;
                      setForm({...form, customization_options: {...form.customization_options, sizes: newSizes}});
                    }} placeholder="Extra Price (₹)" className="w-1/3 px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    <button type="button" onClick={() => {
                      const newSizes = form.customization_options.sizes.filter((_, i) => i !== idx);
                      setForm({...form, customization_options: {...form.customization_options, sizes: newSizes}});
                    }} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={16}/></button>
                  </div>
                ))}
                <button type="button" onClick={() => {
                  setForm({...form, customization_options: {
                    ...form.customization_options, 
                    sizes: [...(form.customization_options?.sizes || []), {name: '', price: 0}]
                  }});
                }} className="text-sm text-blue-600 font-medium hover:underline">+ Add Size Option</button>
              </div>

              {/* Add-ons Section */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="font-semibold text-gray-700 mb-2">Add-ons (Optional)</h3>
                {(form.customization_options?.addons || []).map((addon, idx) => (
                  <div key={idx} className="flex gap-2 mb-2 items-center">
                    <input type="text" value={addon.name} onChange={e => {
                      const newAddons = [...form.customization_options.addons];
                      newAddons[idx].name = e.target.value;
                      setForm({...form, customization_options: {...form.customization_options, addons: newAddons}});
                    }} placeholder="Add-on (e.g. Extra Cheese)" className="w-1/2 px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="number" step="0.5" value={addon.price} onChange={e => {
                      const newAddons = [...form.customization_options.addons];
                      newAddons[idx].price = parseFloat(e.target.value) || 0;
                      setForm({...form, customization_options: {...form.customization_options, addons: newAddons}});
                    }} placeholder="Extra Price (₹)" className="w-1/3 px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    <button type="button" onClick={() => {
                      const newAddons = form.customization_options.addons.filter((_, i) => i !== idx);
                      setForm({...form, customization_options: {...form.customization_options, addons: newAddons}});
                    }} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={16}/></button>
                  </div>
                ))}
                <button type="button" onClick={() => {
                  setForm({...form, customization_options: {
                    ...form.customization_options, 
                    addons: [...(form.customization_options?.addons || []), {name: '', price: 0}]
                  }});
                }} className="text-sm text-blue-600 font-medium hover:underline">+ Add Add-on Option</button>
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 rounded-lg hover:opacity-90 transition font-medium"
              >
                <Save size={18} /> {editingId ? 'Update Item' : 'Create Item'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Items Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Item</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Price</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Stock</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    <Package size={40} className="mx-auto mb-2 opacity-40" />
                    <p>No menu items yet. Add your first item!</p>
                  </td>
                </tr>
              ) : (
                currentItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-400 truncate max-w-xs">{item.description}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">₹{parseFloat(item.price).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${item.stock_quantity < 10 ? 'text-red-600' : 'text-gray-700'}`}>
                        {item.stock_quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleAvailability(item)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                          item.is_available
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {item.is_available ? 'Available' : 'Unavailable'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(item.id, item.name)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filteredItems.length > itemsPerPage && (
          <Pagination
            itemsPerPage={itemsPerPage}
            totalItems={filteredItems.length}
            paginate={setCurrentPage}
            currentPage={currentPage}
          />
        )}
      </div>
    </div>
  );
}

export default AdminMenuManager;
