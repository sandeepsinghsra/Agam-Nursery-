/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  ShoppingCart, 
  History, 
  Settings as SettingsIcon, 
  Search, 
  Download, 
  Share2, 
  MessageCircle, 
  Mail, 
  Smartphone,
  Check,
  X,
  ChevronRight,
  Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Settings, SaleItem, Sale } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'billing' | 'products' | 'history' | 'settings'>('billing');
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<Settings>({
    shop_name: 'Agam Nursery',
    address: '',
    phone: '',
    email: '',
    gst_number: ''
  });
  const [sales, setSales] = useState<Sale[]>([]);
  
  // Billing State
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discount, setDiscount] = useState(0);
  const [manualTotal, setManualTotal] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Product Form State
  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prodRes, setRes, salesRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/settings'),
        fetch('/api/sales')
      ]);
      
      const prodData = await prodRes.json();
      const setData = await setRes.json();
      const salesData = await salesRes.json();
      
      setProducts(prodData);
      if (setData) setSettings(setData);
      setSales(salesData.map((s: any) => ({ ...s, items: JSON.parse(s.items) })));
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) return;
    
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProduct.name,
          price: parseFloat(newProduct.price),
          category: newProduct.category
        })
      });
      if (res.ok) {
        setNewProduct({ name: '', price: '', category: '' });
        fetchData();
      }
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  const deleteProduct = async (id: number) => {
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const updateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      alert("Settings updated successfully!");
    } catch (error) {
      console.error("Error updating settings:", error);
    }
  };

  // Billing Logic
  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1, total: product.price }]);
    }
    setManualTotal(null);
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
    setManualTotal(null);
  };

  const updateQuantity = (id: number, qty: number) => {
    if (qty < 1) return;
    setCart(cart.map(item => 
      item.id === id 
        ? { ...item, quantity: qty, total: qty * item.price }
        : item
    ));
    setManualTotal(null);
  };

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.total, 0), [cart]);
  const calculatedTotal = subtotal - discount;
  const finalTotal = manualTotal !== null ? manualTotal : calculatedTotal;

  const generateBill = async () => {
    if (cart.length === 0) return;
    
    const saleData = {
      customer_name: customerName,
      customer_phone: customerPhone,
      total_amount: subtotal,
      discount: discount,
      final_amount: finalTotal,
      items: cart
    };

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      });
      
      if (res.ok) {
        const { id } = await res.json();
        alert(`Bill generated successfully! ID: ${id}`);
        setCart([]);
        setCustomerName('');
        setCustomerPhone('');
        setDiscount(0);
        setManualTotal(null);
        fetchData();
      }
    } catch (error) {
      console.error("Error generating bill:", error);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const shareBill = (type: 'whatsapp' | 'email' | 'sms', sale: Sale) => {
    const billText = `
*${settings.shop_name}*
Bill No: ${sale.id}
Date: ${new Date(sale.created_at).toLocaleDateString()}
Customer: ${sale.customer_name || 'N/A'}
--------------------------
${sale.items.map(item => `${item.name} x ${item.quantity} = ₹${item.total}`).join('\n')}
--------------------------
Subtotal: ₹${sale.total_amount}
Discount: ₹${sale.discount}
*Total: ₹${sale.final_amount}*
--------------------------
Thank you for shopping with us!
${settings.address}
${settings.phone}
    `.trim();

    const encodedText = encodeURIComponent(billText);
    
    if (type === 'whatsapp') {
      window.open(`https://wa.me/${sale.customer_phone}?text=${encodedText}`, '_blank');
    } else if (type === 'sms') {
      window.open(`sms:${sale.customer_phone}?body=${encodedText}`, '_blank');
    } else if (type === 'email') {
      window.open(`mailto:?subject=Bill from ${settings.shop_name}&body=${encodedText}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <nav className="w-full md:w-64 bg-nursery-green text-white p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <ShoppingCart className="text-white" />
          </div>
          <h1 className="font-serif text-xl font-bold tracking-tight">Agam Nursery</h1>
        </div>

        <div className="flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('billing')}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'billing' ? 'bg-white/20 shadow-inner' : 'hover:bg-white/10'}`}
          >
            <ShoppingCart size={20} />
            <span className="font-medium">Billing</span>
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'products' ? 'bg-white/20 shadow-inner' : 'hover:bg-white/10'}`}
          >
            <Plus size={20} />
            <span className="font-medium">Products</span>
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'history' ? 'bg-white/20 shadow-inner' : 'hover:bg-white/10'}`}
          >
            <History size={20} />
            <span className="font-medium">Sales History</span>
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-white/20 shadow-inner' : 'hover:bg-white/10'}`}
          >
            <SettingsIcon size={20} />
            <span className="font-medium">Settings</span>
          </button>
        </div>

        <div className="mt-auto pt-6 border-t border-white/10">
          <p className="text-xs text-white/60 font-medium uppercase tracking-widest">Shop Info</p>
          <p className="mt-2 font-serif italic">{settings.shop_name}</p>
          <p className="text-sm text-white/80">{settings.phone}</p>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-nursery-light">
        <AnimatePresence mode="wait">
          {activeTab === 'billing' && (
            <motion.div 
              key="billing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Product Selection */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="glass-card p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="Search plants, pots, seeds..." 
                        className="w-full pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {filteredProducts.map(product => (
                      <button
                        key={product.id}
                        onClick={() => addToCart(product)}
                        className="p-4 rounded-xl border border-slate-100 bg-white hover:border-nursery-green hover:shadow-md transition-all text-left group"
                      >
                        <p className="text-xs text-nursery-accent font-bold uppercase tracking-tighter mb-1">{product.category || 'General'}</p>
                        <h3 className="font-medium text-slate-800 group-hover:text-nursery-green transition-colors">{product.name}</h3>
                        <p className="text-lg font-serif font-bold mt-2">₹{product.price}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cart & Billing */}
              <div className="flex flex-col gap-6">
                <div className="glass-card p-6 flex flex-col h-full">
                  <h2 className="font-serif text-2xl font-bold mb-6 flex items-center gap-2">
                    <ShoppingCart className="text-nursery-green" />
                    Current Bill
                  </h2>

                  <div className="flex-1 overflow-y-auto max-h-[400px] mb-6 pr-2">
                    {cart.length === 0 ? (
                      <div className="text-center py-12 text-slate-400">
                        <ShoppingCart size={48} className="mx-auto mb-4 opacity-20" />
                        <p>Your cart is empty</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {cart.map(item => (
                          <div key={item.id} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{item.name}</h4>
                              <p className="text-xs text-slate-500">₹{item.price} each</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100"
                              >
                                -
                              </button>
                              <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100"
                              >
                                +
                              </button>
                            </div>
                            <div className="text-right min-w-[60px]">
                              <p className="font-bold text-sm">₹{item.total}</p>
                              <button 
                                onClick={() => removeFromCart(item.id)}
                                className="text-red-400 hover:text-red-600 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-6 flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-400 uppercase">Customer Name</label>
                        <input 
                          type="text" 
                          placeholder="Name" 
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-400 uppercase">Phone Number</label>
                        <input 
                          type="text" 
                          placeholder="Phone" 
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 bg-nursery-green/5 p-4 rounded-2xl border border-nursery-green/10">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Subtotal</span>
                        <span className="font-medium">₹{subtotal}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Discount (₹)</span>
                        <input 
                          type="number" 
                          value={discount}
                          onChange={(e) => {
                            setDiscount(parseFloat(e.target.value) || 0);
                            setManualTotal(null);
                          }}
                          className="w-20 text-right py-1 px-2 text-sm"
                        />
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-nursery-green/10">
                        <span className="font-bold text-nursery-green">Grand Total</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">₹</span>
                          <input 
                            type="number" 
                            value={finalTotal}
                            onChange={(e) => setManualTotal(parseFloat(e.target.value))}
                            className="w-24 text-right font-serif text-xl font-bold bg-transparent border-none focus:ring-0 p-0 text-nursery-green"
                          />
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={generateBill}
                      disabled={cart.length === 0}
                      className="btn-primary w-full justify-center py-4 text-lg shadow-lg shadow-nursery-green/20 disabled:opacity-50 disabled:shadow-none"
                    >
                      Generate Bill
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'products' && (
            <motion.div 
              key="products"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="glass-card p-8 mb-8">
                <h2 className="font-serif text-2xl font-bold mb-6 flex items-center gap-2">
                  <Plus className="text-nursery-green" />
                  Add New Product
                </h2>
                <form onSubmit={addProduct} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Product Name</label>
                    <input 
                      type="text" 
                      required
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      placeholder="e.g. Aloe Vera"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Price (₹)</label>
                    <input 
                      type="number" 
                      required
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Category</label>
                    <input 
                      type="text" 
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      placeholder="e.g. Indoor"
                    />
                  </div>
                  <button type="submit" className="btn-primary h-[42px] justify-center">
                    Add Product
                  </button>
                </form>
              </div>

              <div className="glass-card overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-bottom border-slate-100">
                      <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Name</th>
                      <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Category</th>
                      <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Price</th>
                      <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product => (
                      <tr key={product.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-medium">{product.name}</td>
                        <td className="p-4 text-sm text-slate-500">{product.category || '-'}</td>
                        <td className="p-4 font-serif font-bold">₹{product.price}</td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => deleteProduct(product.id)}
                            className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-6xl mx-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="font-serif text-3xl font-bold">Sales History</h2>
                <div className="flex gap-2">
                  <button className="btn-secondary">
                    <Download size={18} /> Export CSV
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {sales.map(sale => (
                  <div key={sale.id} className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-all">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-nursery-green/10 rounded-2xl flex items-center justify-center text-nursery-green font-bold text-lg">
                        #{sale.id}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{sale.customer_name || 'Walk-in Customer'}</h3>
                        <p className="text-sm text-slate-500 flex items-center gap-2">
                          <Smartphone size={14} /> {sale.customer_phone || 'N/A'}
                          <span className="mx-2">•</span>
                          {new Date(sale.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 md:gap-8">
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-400 uppercase">Final Amount</p>
                        <p className="text-xl font-serif font-bold text-nursery-green">₹{sale.final_amount}</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => shareBill('whatsapp', sale)}
                          className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-all"
                          title="Share on WhatsApp"
                        >
                          <MessageCircle size={20} />
                        </button>
                        <button 
                          onClick={() => shareBill('sms', sale)}
                          className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"
                          title="Send SMS"
                        >
                          <Smartphone size={20} />
                        </button>
                        <button 
                          onClick={() => shareBill('email', sale)}
                          className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all"
                          title="Send Email"
                        >
                          <Mail size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="glass-card p-8">
                <h2 className="font-serif text-2xl font-bold mb-8 flex items-center gap-2">
                  <SettingsIcon className="text-nursery-green" />
                  Shop Details
                </h2>
                <form onSubmit={updateSettings} className="flex flex-col gap-6">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Shop Name</label>
                    <input 
                      type="text" 
                      value={settings.shop_name}
                      onChange={(e) => setSettings({ ...settings, shop_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Address</label>
                    <textarea 
                      rows={3}
                      value={settings.address}
                      onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                      className="border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nursery-green/20 focus:border-nursery-green"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-400 uppercase">Phone Number</label>
                      <input 
                        type="text" 
                        value={settings.phone}
                        onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-400 uppercase">Email Address</label>
                      <input 
                        type="email" 
                        value={settings.email}
                        onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">GST Number (Optional)</label>
                    <input 
                      type="text" 
                      value={settings.gst_number}
                      onChange={(e) => setSettings({ ...settings, gst_number: e.target.value })}
                    />
                  </div>
                  <button type="submit" className="btn-primary justify-center py-3 mt-4">
                    Save Settings
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
