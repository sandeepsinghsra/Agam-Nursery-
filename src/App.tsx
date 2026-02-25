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
  Printer,
  Calendar,
  MoreVertical,
  Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Settings, SaleItem, Sale } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'billing' | 'products' | 'history' | 'settings'>('billing');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
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
  const [customerPhone, setCustomerPhone] = useState('+91');
  const [customerAddress, setCustomerAddress] = useState('');
  const [discount, setDiscount] = useState(0);
  const [manualTotal, setManualTotal] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Share Modal State
  const [showShareModal, setShowShareModal] = useState(false);
  const [showMoreShareOptions, setShowMoreShareOptions] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [lastGeneratedSale, setLastGeneratedSale] = useState<Sale | null>(null);

  // History Filters
  const [historySearch, setHistorySearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDateFilters, setShowDateFilters] = useState(false);

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
      customer_address: customerAddress,
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
        const newSale: Sale = {
          ...saleData,
          id,
          created_at: new Date().toISOString()
        };
        
        setLastGeneratedSale(newSale);
        setShowShareModal(true);
        
        setCart([]);
        setCustomerName('');
        setCustomerPhone('+91');
        setCustomerAddress('');
        setDiscount(0);
        setManualTotal(null);
        fetchData();
      }
    } catch (error) {
      console.error("Error generating bill:", error);
    }
  };

  const exportCSV = (range: '1day' | '1month' | '6months' | 'all') => {
    const now = new Date();
    let filteredSales = sales;

    if (range !== 'all') {
      const cutoff = new Date();
      if (range === '1day') cutoff.setDate(now.getDate() - 1);
      if (range === '1month') cutoff.setMonth(now.getMonth() - 1);
      if (range === '6months') cutoff.setMonth(now.getMonth() - 6);
      
      filteredSales = sales.filter(sale => new Date(sale.created_at) >= cutoff);
    }

    if (filteredSales.length === 0) {
      alert("No data found for the selected range.");
      return;
    }

    const headers = ["Bill No", "Date", "Customer Name", "Phone", "Address", "Total Amount", "Discount", "Final Amount", "Items"];
    const rows = filteredSales.map(sale => [
      sale.id,
      new Date(sale.created_at).toLocaleString(),
      sale.customer_name || "Walk-in",
      `'${sale.customer_phone || "N/A"}`, // Added single quote prefix to force string in Excel/CSV
      sale.customer_address || "N/A",
      sale.total_amount,
      sale.discount,
      sale.final_amount,
      sale.items.map(i => `${i.name}(${i.quantity})`).join("; ")
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Agam_Nursery_Sales_${range}_${now.toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportModal(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const matchesSearch = 
        (sale.customer_name?.toLowerCase() || '').includes(historySearch.toLowerCase()) ||
        (sale.customer_phone || '').includes(historySearch);
      
      const saleDate = new Date(sale.created_at);
      const matchesStart = !startDate || saleDate >= new Date(startDate);
      const matchesEnd = !endDate || saleDate <= new Date(endDate + 'T23:59:59');

      return matchesSearch && matchesStart && matchesEnd;
    });
  }, [sales, historySearch, startDate, endDate]);

  const shareBill = (type: 'whatsapp' | 'email' | 'sms', sale: Sale) => {
    const billText = `
*${settings.shop_name}*
Bill No: ${sale.id}
Date: ${new Date(sale.created_at).toLocaleDateString()}
Customer: ${sale.customer_name || 'N/A'}
Phone: ${sale.customer_phone || 'N/A'}
Address: ${sale.customer_address || 'N/A'}
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
    <div className="min-h-screen flex flex-col bg-nursery-light">
      {/* Header */}
      <header className="bg-nursery-green text-white p-4 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="relative">
          <button 
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-2 hover:bg-white/10 rounded-xl transition-all"
          >
            <MoreVertical size={24} />
          </button>

          <AnimatePresence>
            {showMobileMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowMobileMenu(false)} 
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute left-0 mt-2 w-56 glass-card bg-white shadow-xl z-50 overflow-hidden border border-slate-100"
                >
                  <div className="p-2 flex flex-col gap-1">
                    <button 
                      onClick={() => { setActiveTab('billing'); setShowMobileMenu(false); }}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all text-sm ${activeTab === 'billing' ? 'bg-nursery-green text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      <ShoppingCart size={18} />
                      <span className="font-medium">Billing</span>
                    </button>
                    <button 
                      onClick={() => { setActiveTab('products'); setShowMobileMenu(false); }}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all text-sm ${activeTab === 'products' ? 'bg-nursery-green text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      <Plus size={18} />
                      <span className="font-medium">Products</span>
                    </button>
                    <button 
                      onClick={() => { setActiveTab('history'); setShowMobileMenu(false); }}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all text-sm ${activeTab === 'history' ? 'bg-nursery-green text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      <History size={18} />
                      <span className="font-medium">Sales History</span>
                    </button>
                    <button 
                      onClick={() => { setActiveTab('settings'); setShowMobileMenu(false); }}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all text-sm ${activeTab === 'settings' ? 'bg-nursery-green text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      <SettingsIcon size={18} />
                      <span className="font-medium">Settings</span>
                    </button>
                  </div>
                  <div className="bg-slate-50 p-3 border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Shop Info</p>
                    <p className="mt-1 font-serif italic text-xs text-slate-600">{settings.shop_name}</p>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-3">
          <h1 className="font-serif text-lg font-bold tracking-tight">Agam Nursery</h1>
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <ShoppingCart className="text-white" size={18} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
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
                    <div className="grid grid-cols-1 gap-4">
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
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val.startsWith('+91')) {
                                setCustomerPhone(val);
                              } else if (val === '' || val === '+') {
                                setCustomerPhone('+91');
                              } else {
                                setCustomerPhone('+91' + val.replace(/^\+91/, ''));
                              }
                            }}
                            className="text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-400 uppercase">Customer Address</label>
                        <input 
                          type="text" 
                          placeholder="Address" 
                          value={customerAddress}
                          onChange={(e) => setCustomerAddress(e.target.value)}
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
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <h2 className="font-serif text-3xl font-bold">Sales History</h2>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => setShowExportModal(true)}
                    className="btn-secondary"
                  >
                    <Download size={18} /> Export CSV
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="glass-card p-4 mb-8 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search name or phone..." 
                      className="w-full pl-10"
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={() => setShowDateFilters(!showDateFilters)}
                    className={`p-2.5 rounded-lg border transition-all flex items-center gap-2 ${showDateFilters ? 'bg-nursery-green text-white border-nursery-green' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                    title="Filter by Date"
                  >
                    <Calendar size={18} className={showDateFilters ? 'text-white' : 'text-slate-400'} />
                    <span className="text-sm font-medium hidden sm:inline">Calendar</span>
                  </button>
                </div>

                <AnimatePresence>
                  {showDateFilters && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">From Date</label>
                          <input 
                            type="date" 
                            className="w-full text-sm py-1.5"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">To Date</label>
                          <input 
                            type="date" 
                            className="w-full text-sm py-1.5"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {filteredSales.length === 0 ? (
                  <div className="glass-card p-12 text-center text-slate-400">
                    <History size={48} className="mx-auto mb-4 opacity-20" />
                    <p>No sales found matching your filters.</p>
                  </div>
                ) : (
                  filteredSales.map(sale => (
                    <div 
                      key={sale.id} 
                      onClick={() => {
                        setSelectedSale(sale);
                        setShowDetailsModal(true);
                      }}
                      className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-all cursor-pointer border-l-4 border-l-transparent hover:border-l-nursery-green"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-nursery-green/10 rounded-2xl flex items-center justify-center text-nursery-green font-bold text-lg">
                          #{sale.id}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{sale.customer_name || 'Walk-in Customer'}</h3>
                          <div className="flex flex-col gap-1 mt-1">
                            <p className="text-sm text-slate-500 flex items-center gap-2">
                              <Smartphone size={14} /> {sale.customer_phone || 'N/A'}
                              <span className="mx-2">•</span>
                              {new Date(sale.created_at).toLocaleString()}
                            </p>
                            {sale.customer_address && (
                              <p className="text-xs text-slate-400 flex items-center gap-2">
                                <ChevronRight size={12} /> {sale.customer_address}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 md:gap-8">
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-400 uppercase">Final Amount</p>
                          <p className="text-xl font-serif font-bold text-nursery-green">₹{sale.final_amount}</p>
                        </div>
                        
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
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
                        </div>
                      </div>
                    </div>
                  ))
                )}
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

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && lastGeneratedSale && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card p-8 max-w-md w-full bg-white shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-serif text-2xl font-bold text-nursery-green">Bill Generated!</h2>
                <button 
                  onClick={() => setShowShareModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="bg-nursery-green/5 p-4 rounded-2xl border border-nursery-green/10 mb-8">
                <p className="text-sm text-slate-500 mb-1">Bill Amount</p>
                <p className="text-3xl font-serif font-bold text-nursery-green">₹{lastGeneratedSale.final_amount}</p>
                <p className="text-xs text-slate-400 mt-2">Bill No: #{lastGeneratedSale.id}</p>
              </div>

              <p className="text-sm font-bold text-slate-400 uppercase mb-4 tracking-widest">Share Bill via</p>
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => shareBill('whatsapp', lastGeneratedSale)}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-green-50 text-green-600 hover:bg-green-100 transition-all border border-green-100"
                >
                  <MessageCircle size={24} />
                  <span className="text-xs font-bold">WhatsApp</span>
                </button>
                <button 
                  onClick={handlePrint}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-800 text-white hover:bg-slate-900 transition-all border border-slate-800"
                >
                  <Printer size={24} />
                  <span className="text-xs font-bold">Print Bill</span>
                </button>
              </div>

              <div className="mt-4">
                {!showMoreShareOptions ? (
                  <button 
                    onClick={() => setShowMoreShareOptions(true)}
                    className="w-full py-3 flex items-center justify-center gap-2 text-slate-500 hover:text-nursery-green transition-all text-sm font-bold"
                  >
                    <MoreVertical size={16} /> More Options
                  </button>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100"
                  >
                    <button 
                      onClick={() => shareBill('sms', lastGeneratedSale)}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all border border-blue-100"
                    >
                      <Smartphone size={24} />
                      <span className="text-xs font-bold">SMS</span>
                    </button>
                    <button 
                      onClick={() => shareBill('email', lastGeneratedSale)}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all border border-slate-100"
                    >
                      <Mail size={24} />
                      <span className="text-xs font-bold">Email</span>
                    </button>
                  </motion.div>
                )}
              </div>

              <button 
                onClick={() => { setShowShareModal(false); setShowMoreShareOptions(false); }}
                className="w-full mt-8 py-3 text-slate-500 font-medium hover:text-slate-800 transition-all"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bill Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedSale && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card p-8 max-w-2xl w-full bg-white shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-nursery-green">Bill Details</h2>
                  <p className="text-xs text-slate-400">Bill No: #{selectedSale.id} • {new Date(selectedSale.created_at).toLocaleString()}</p>
                </div>
                <button 
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer Information</p>
                    <p className="font-bold text-lg mt-1">{selectedSale.customer_name || 'Walk-in Customer'}</p>
                    <p className="text-sm text-slate-600 flex items-center gap-2 mt-1">
                      <Smartphone size={14} /> {selectedSale.customer_phone || 'N/A'}
                    </p>
                    {selectedSale.customer_address && (
                      <p className="text-sm text-slate-600 flex items-center gap-2 mt-1">
                        <ChevronRight size={14} /> {selectedSale.customer_address}
                      </p>
                    )}
                  </div>
                </div>
                <div className="bg-nursery-green/5 p-4 rounded-2xl border border-nursery-green/10">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Payment Summary</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Subtotal</span>
                      <span className="font-medium">₹{selectedSale.total_amount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Discount</span>
                      <span className="font-medium text-red-500">-₹{selectedSale.discount}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-nursery-green/10">
                      <span className="font-bold text-nursery-green">Total Paid</span>
                      <span className="font-serif font-bold text-xl text-nursery-green">₹{selectedSale.final_amount}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Items Purchased</p>
                <div className="space-y-3">
                  {selectedSale.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-slate-500">₹{item.price} x {item.quantity}</p>
                      </div>
                      <p className="font-bold">₹{item.total}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => shareBill('whatsapp', selectedSale)}
                  className="flex-1 btn-primary justify-center bg-green-600 hover:bg-green-700"
                >
                  <MessageCircle size={18} /> WhatsApp
                </button>
                <button 
                  onClick={handlePrint}
                  className="flex-1 btn-primary justify-center bg-slate-800 hover:bg-slate-900"
                >
                  <Printer size={18} /> Print
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Printable Bill (Hidden) */}
      <div id="printable-bill" className="hidden">
        {(lastGeneratedSale || selectedSale) && (
          <div className="max-w-md mx-auto p-8 border border-slate-200">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold uppercase">{settings.shop_name}</h1>
              <p className="text-sm">{settings.address}</p>
              <p className="text-sm">Phone: {settings.phone}</p>
              {settings.gst_number && <p className="text-sm">GST: {settings.gst_number}</p>}
            </div>

            <div className="flex justify-between mb-6 text-sm">
              <div>
                <p><strong>Bill No:</strong> #{(lastGeneratedSale || selectedSale)?.id}</p>
                <p><strong>Date:</strong> {new Date((lastGeneratedSale || selectedSale)?.created_at || '').toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p><strong>Customer:</strong> {(lastGeneratedSale || selectedSale)?.customer_name || 'Walk-in'}</p>
                <p><strong>Phone:</strong> {(lastGeneratedSale || selectedSale)?.customer_phone || 'N/A'}</p>
              </div>
            </div>

            <table className="w-full text-sm mb-6 border-collapse">
              <thead>
                <tr className="border-y border-slate-200">
                  <th className="py-2 text-left">Item</th>
                  <th className="py-2 text-center">Qty</th>
                  <th className="py-2 text-right">Price</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {(lastGeneratedSale || selectedSale)?.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-100">
                    <td className="py-2">{item.name}</td>
                    <td className="py-2 text-center">{item.quantity}</td>
                    <td className="py-2 text-right">₹{item.price}</td>
                    <td className="py-2 text-right">₹{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{(lastGeneratedSale || selectedSale)?.total_amount}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount:</span>
                <span>-₹{(lastGeneratedSale || selectedSale)?.discount}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-slate-200">
                <span>Grand Total:</span>
                <span>₹{(lastGeneratedSale || selectedSale)?.final_amount}</span>
              </div>
            </div>

            <div className="mt-12 text-center text-xs italic text-slate-500">
              Thank you for shopping with us!
            </div>
          </div>
        )}
      </div>

      {/* Export Modal */}
      <AnimatePresence>
        {showExportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card p-8 max-w-md w-full bg-white shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-serif text-2xl font-bold text-nursery-green">Export Sales Data</h2>
                <button 
                  onClick={() => setShowExportModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-sm text-slate-500 mb-6">Select the time range for which you want to download the sales report in CSV format.</p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => exportCSV('1day')}
                  className="w-full p-4 rounded-xl border border-slate-100 hover:border-nursery-green hover:bg-nursery-green/5 transition-all text-left flex justify-between items-center group"
                >
                  <span className="font-medium group-hover:text-nursery-green">Last 24 Hours</span>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-nursery-green" />
                </button>
                <button 
                  onClick={() => exportCSV('1month')}
                  className="w-full p-4 rounded-xl border border-slate-100 hover:border-nursery-green hover:bg-nursery-green/5 transition-all text-left flex justify-between items-center group"
                >
                  <span className="font-medium group-hover:text-nursery-green">Last 1 Month</span>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-nursery-green" />
                </button>
                <button 
                  onClick={() => exportCSV('6months')}
                  className="w-full p-4 rounded-xl border border-slate-100 hover:border-nursery-green hover:bg-nursery-green/5 transition-all text-left flex justify-between items-center group"
                >
                  <span className="font-medium group-hover:text-nursery-green">Last 6 Months</span>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-nursery-green" />
                </button>
                <button 
                  onClick={() => exportCSV('all')}
                  className="w-full p-4 rounded-xl border border-slate-100 hover:border-nursery-green hover:bg-nursery-green/5 transition-all text-left flex justify-between items-center group"
                >
                  <span className="font-medium group-hover:text-nursery-green">All Time Data</span>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-nursery-green" />
                </button>
              </div>

              <button 
                onClick={() => setShowExportModal(false)}
                className="w-full mt-8 py-3 text-slate-500 font-medium hover:text-slate-800 transition-all"
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
