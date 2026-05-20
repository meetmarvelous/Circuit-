'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { QRCodeCanvas } from 'qrcode.react';
import { supabase, getEditions, saveEdition, updateOrderStatusLifecycle, updateOrderShipmentDetails } from '@/lib/db';
import { solscanTxUrl, formatSerialNumber } from '@/lib/utils';
import AdminNavbar from '@/components/AdminNavbar';
import { showToast } from '@/components/Toast';

interface Order {
  id: string;
  email: string;
  drop_id: string;
  status: string;
  tx_signature: string;
  created_at: string;
  size?: string;
  amount_sol: number;
  garment_serial?: string;
  delivery_location?: string;
  delivery_address?: string;
  shipment_details?: string;
}

interface Edition {
  id: string;
  name: string;
  image_url: string;
  description: string;
  price_sol: number;
  has_variable_prices: boolean;
  prices_by_size: Record<string, number>;
  max_supply: number;
  fabric: string;
  headpiece: string;
  embroidery: string;
  is_active: boolean;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'orders' | 'collections'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [editions, setEditions] = useState<Edition[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedQR, setSelectedQR] = useState<Order | null>(null);
  const router = useRouter();

  // Lifecycle modifications states per order
  const [editableStates, setEditableStates] = useState<Record<string, {
    status: string;
    serial: string;
    shipmentDetails: string;
  }>>({});

  // Collection creation/editing states
  const [selectedEdition, setSelectedEdition] = useState<Edition | null>(null);
  const [editionForm, setEditionForm] = useState<{
    id: string;
    name: string;
    image_url: string;
    description: string;
    price_sol: number;
    has_variable_prices: boolean;
    prices_by_size: Record<string, number>;
    max_supply: number;
    fabric: string;
    headpiece: string;
    embroidery: string;
    is_active: boolean;
  }>({
    id: '',
    name: '',
    image_url: '/satin.png',
    description: '',
    price_sol: 0.8,
    has_variable_prices: false,
    prices_by_size: {
      Small: 0.8,
      Medium: 0.8,
      Large: 0.8,
      'Extra Large': 0.8
    },
    max_supply: 40,
    fabric: 'Duchess satin',
    headpiece: 'Velvet',
    embroidery: 'Metallic thread',
    is_active: true
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      if (!supabase) return;

      // 1. Fetch Orders
      const { data: ord, error: ordErr } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (ordErr) throw ordErr;
      
      const ordersList = ord || [];
      setOrders(ordersList);

      // Initialize states map for updates
      const statesMap: typeof editableStates = {};
      ordersList.forEach((o: Order) => {
        statesMap[o.id] = {
          status: o.status || 'pending',
          serial: o.garment_serial || '',
          shipmentDetails: o.shipment_details || ''
        };
      });
      setEditableStates(statesMap);

      // 2. Fetch Editions
      const editionsList = await getEditions();
      setEditions(editionsList || []);
    } catch (err) {
      console.error('Error querying dynamic dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const session = sessionStorage.getItem('circuit_admin_session');
    if (!session) {
      router.push('/admin/login');
      return;
    }
    setIsAuthorized(true);
    fetchData();
  }, [router]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-white/10 border-t-white rounded-full animate-spin" />
          <span className="text-[0.6rem] font-bold uppercase tracking-[0.3em] text-[#444]">Authorizing Security Clearance</span>
        </div>
      </div>
    );
  }

  // Calculate dynamic stats
  const totalRevenue = orders.reduce((acc, o) => acc + Number(o.amount_sol || 0), 0);
  const stats = {
    totalRevenue,
    totalClaims: orders.length,
    inProduction: orders.filter(o => o.status === 'in_production').length,
    produced: orders.filter(o => ['produced', 'shipped', 'delivered'].includes(o.status)).length,
    pending: orders.filter(o => o.status === 'pending').length,
  };

  const filteredOrders = orders.filter(o => 
    o.email.toLowerCase().includes(search.toLowerCase()) || 
    o.garment_serial?.toLowerCase().includes(search.toLowerCase()) ||
    o.drop_id.toLowerCase().includes(search.toLowerCase())
  );

  // Trigger Order Lifecycle & Shipment update
  const saveOrderLifecycle = async (orderId: string) => {
    const dataState = editableStates[orderId];
    if (!dataState) return;

    setProcessingId(orderId);
    try {
      // 1. If transitioning to production or produced, automatically generate serial if none exists
      let finalSerial = dataState.serial;
      if (!finalSerial && ['in_production', 'produced', 'shipped', 'delivered'].includes(dataState.status)) {
        const existingSerials = orders
          .map(o => parseInt(o.garment_serial || '0'))
          .filter(n => !isNaN(n));
        const nextNum = Math.max(0, ...existingSerials) + 1;
        finalSerial = String(nextNum).padStart(2, '0');
        
        setEditableStates(prev => ({
          ...prev,
          [orderId]: {
            ...prev[orderId],
            serial: finalSerial
          }
        }));
      }

      // 2. Call DB lifecycle state and shipment comments updates
      await updateOrderStatusLifecycle(orderId, dataState.status, finalSerial || undefined);
      await updateOrderShipmentDetails(orderId, dataState.shipmentDetails);

      showToast('✓ Update Complete', 'Order lifecycle credentials and logistic logs refreshed successfully.');
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('✗ Error', 'Failed to update order lifecycle settings.');
    } finally {
      setProcessingId(null);
    }
  };

  // Manage Collection Submit
  const handleEditionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editionForm.id) {
      showToast('ID Required', 'Please specify a unique drop collection ID slug.');
      return;
    }

    try {
      await saveEdition(editionForm);
      showToast('✓ Success', 'Drop collection parameters synced to database.');
      fetchData();
      resetEditionForm();
    } catch (err) {
      console.error(err);
      showToast('✗ Error', 'Failed to save drop collection details.');
    }
  };

  const loadEditionToForm = (ed: Edition) => {
    setSelectedEdition(ed);
    setEditionForm({
      id: ed.id,
      name: ed.name,
      image_url: ed.image_url,
      description: ed.description,
      price_sol: ed.price_sol,
      has_variable_prices: ed.has_variable_prices,
      prices_by_size: ed.prices_by_size || { Small: 0.8, Medium: 0.8, Large: 0.8, 'Extra Large': 0.8 },
      max_supply: ed.max_supply,
      fabric: ed.fabric,
      headpiece: ed.headpiece,
      embroidery: ed.embroidery,
      is_active: ed.is_active
    });
  };

  const resetEditionForm = () => {
    setSelectedEdition(null);
    setEditionForm({
      id: '',
      name: '',
      image_url: '/satin.png',
      description: '',
      price_sol: 0.8,
      has_variable_prices: false,
      prices_by_size: { Small: 0.8, Medium: 0.8, Large: 0.8, 'Extra Large': 0.8 },
      max_supply: 40,
      fabric: 'Duchess satin',
      headpiece: 'Velvet',
      embroidery: 'Metallic thread',
      is_active: true
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <AdminNavbar />
      
      <main className="section-container pt-32 pb-20 print:p-0 print:pt-0">
        
        {/* Navigation Tabs */}
        <div className="flex gap-4 border-b border-white/10 pb-4 mb-10 print:hidden">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'orders' ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'
            }`}
          >
            Orders Gating Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('collections')}
            className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'collections' ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'
            }`}
          >
            Manage Collections
          </button>
        </div>

        {/* Tab 1: Orders Lifecycle */}
        {activeTab === 'orders' && (
          <div>
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 print:hidden">
              <header>
                <span className="text-[0.6rem] font-bold uppercase tracking-[0.3em] text-[#666] mb-3 block">
                  Circuit — Identity Management
                </span>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Active Drops Control Hub</h1>
                <p className="text-[#666] mt-3 text-sm max-w-md leading-relaxed">
                  Refactor status lifecycles, log shipping waybills, and print digital-passport identity tags.
                </p>
              </header>

              <div className="relative group w-full md:w-80">
                <input 
                  type="text"
                  placeholder="Search email, serial, drop ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 px-6 py-3 rounded-full text-sm focus:outline-none focus:border-white/30 transition-all placeholder:text-[#333]"
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-12 print:hidden">
              {[
                { label: 'Total Revenue', value: `${stats.totalRevenue.toFixed(2)} SOL`, color: 'text-white' },
                { label: 'Total Claims', value: `${stats.totalClaims} Runs`, color: 'text-white' },
                { label: 'Awaiting Tailor', value: stats.pending, color: 'text-amber-500' },
                { label: 'In Production', value: stats.inProduction, color: 'text-blue-500' },
                { label: 'Produced / Minted', value: stats.produced, color: 'text-emerald-500' },
              ].map((stat, i) => (
                <div key={i} className="card-glass p-6 border-white/[0.06]">
                  <span className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-[#444] mb-2 block">{stat.label}</span>
                  <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
                </div>
              ))}
            </div>

            {/* Orders Table */}
            {loading ? (
              <div className="flex items-center justify-center py-20 print:hidden">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="card-glass p-20 text-center border-dashed border-white/5 print:hidden">
                <p className="text-[#444] font-medium">No matching orders found in active database.</p>
              </div>
            ) : (
              <div className="grid gap-6 print:hidden">
                {filteredOrders.map((order) => {
                  const stateVal = editableStates[order.id] || { status: 'pending', serial: '', shipmentDetails: '' };
                  const isMinted = ['produced', 'shipped', 'delivered'].includes(stateVal.status);

                  return (
                    <div key={order.id} className="card-glass p-6 md:p-8 flex flex-col gap-6 border-white/[0.06] hover:border-white/10">
                      {/* Top Summary */}
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-white/5">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-xs font-mono text-[#555]">Order Reference: #{order.id.slice(0, 12)}</span>
                            <span className="text-xs font-mono text-white/40 bg-white/5 px-2 py-0.5 rounded uppercase">{order.drop_id}</span>
                            {order.garment_serial && (
                              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase font-semibold">
                                Serial: {formatSerialNumber(order.garment_serial, editions.find(e => e.id === order.drop_id)?.max_supply)}
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-bold text-white">{order.email}</h3>
                        </div>
                        <div className="text-right">
                          <span className="block text-[0.6rem] text-[#444] uppercase font-mono">Amount Paid</span>
                          <span className="text-md font-bold text-white">{order.amount_sol} SOL | Size: {order.size || 'M'}</span>
                        </div>
                      </div>

                      {/* Interactive Configuration Layout */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Column 1: Status Dropdown & Serial */}
                        <div className="space-y-4">
                          <div className="flex flex-col gap-2">
                            <label className="text-[0.65rem] text-[#666] uppercase tracking-wider font-bold">Lifecycle Status</label>
                            <select
                              value={stateVal.status}
                              onChange={(e) => setEditableStates(prev => ({
                                ...prev,
                                [order.id]: { ...stateVal, status: e.target.value }
                              }))}
                              className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-white/30"
                            >
                              <option value="pending">Pending (Escrow Locked)</option>
                              <option value="in_production">In Production</option>
                              <option value="produced">Produced (Generates Passport Mint)</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-2">
                            <label className="text-[0.65rem] text-[#666] uppercase tracking-wider font-bold">Garment Serial</label>
                            <input
                              type="text"
                              value={stateVal.serial}
                              onChange={(e) => setEditableStates(prev => ({
                                ...prev,
                                [order.id]: { ...stateVal, serial: e.target.value }
                              }))}
                              placeholder="Auto-assigned if left blank"
                              className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-white/30 font-mono"
                            />
                          </div>
                        </div>

                        {/* Column 2: Logistics shipment Notes */}
                        <div className="flex flex-col gap-2">
                          <label className="text-[0.65rem] text-[#666] uppercase tracking-wider font-bold">Shipment Logistics Details</label>
                          <textarea
                            value={stateVal.shipmentDetails}
                            onChange={(e) => setEditableStates(prev => ({
                              ...prev,
                              [order.id]: { ...stateVal, shipmentDetails: e.target.value }
                            }))}
                            placeholder="Courier waybill notes, tracking details, delivery comments..."
                            className="w-full h-full min-h-[100px] bg-[#0D0D0D] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-white/30 resize-none"
                          />
                        </div>

                        {/* Column 3: Prints & Actions */}
                        <div className="flex flex-col justify-between items-end min-h-[120px]">
                          <div className="w-full flex gap-3">
                            <a
                              href={solscanTxUrl(order.tx_signature)}
                              target="_blank"
                              rel="noopener"
                              className="btn-outline-circuit py-2.5 px-4 text-[0.65rem] text-center flex-1"
                            >
                              Registry Proof
                            </a>
                            
                            {/* Printable gated strictly to Produced status or higher */}
                            <button
                              disabled={!isMinted}
                              onClick={() => setSelectedQR(order)}
                              className={`p-2.5 border rounded-full flex items-center justify-center shrink-0 transition-all ${
                                isMinted 
                                  ? 'border-white/20 hover:bg-white/5 text-white cursor-pointer' 
                                  : 'border-white/5 text-white/10 cursor-not-allowed'
                              }`}
                              title={isMinted ? 'Generate Physical Identity QR Tag' : 'Printing locked (Garment must be Produced first)'}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M7 7h.01M17 7h.01M17 17h.01M7 17h.01"/>
                              </svg>
                            </button>
                          </div>

                          <button
                            onClick={() => saveOrderLifecycle(order.id)}
                            disabled={processingId === order.id}
                            className="btn-circuit w-full py-3.5 text-[0.7rem] justify-center mt-4"
                          >
                            <span>{processingId === order.id ? 'Saving Changes...' : 'Update Order Lifecycle'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Display delivery details if loaded */}
                      {order.delivery_location && (
                        <div className="mt-2 p-4 rounded-xl bg-amber-500/[0.02] border border-amber-500/10 text-xs flex flex-col gap-1">
                          <span className="font-bold text-amber-500 uppercase tracking-widest text-[0.55rem]">Preferred Drop Destination</span>
                          <span className="text-[#A3A3A3]">Location: {order.delivery_location} | Address: {order.delivery_address}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Collections Manager */}
        {activeTab === 'collections' && (
          <div>
            <header className="mb-12">
              <span className="text-[0.6rem] font-bold uppercase tracking-[0.3em] text-[#666] mb-3 block">
                Circuit — Collection Architect
              </span>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Active Collections Run</h1>
              <p className="text-[#666] mt-3 text-sm max-w-md leading-relaxed">
                Add multiple editions dynamically, enable size variable prices overrides, and configure technical spec fields.
              </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              {/* Left Column: Form Editor */}
              <div className="lg:col-span-5 card-glass p-8 border-white/10">
                <form onSubmit={handleEditionSubmit} className="space-y-6">
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-xl font-bold">{selectedEdition ? 'Edit Collection' : 'Create Drop'}</h3>
                    {selectedEdition && (
                      <button type="button" onClick={resetEditionForm} className="text-xs text-white/50 hover:text-white">
                        Clear Form
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[0.65rem] text-[#666] uppercase tracking-wider font-bold">Unique Slug ID</label>
                    <input
                      type="text"
                      value={editionForm.id}
                      disabled={!!selectedEdition}
                      onChange={(e) => setEditionForm(prev => ({ ...prev, id: e.target.value }))}
                      placeholder="e.g. drop-one"
                      className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-white/30 disabled:opacity-50"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[0.65rem] text-[#666] uppercase tracking-wider font-bold">Edition Name</label>
                    <input
                      type="text"
                      value={editionForm.name}
                      onChange={(e) => setEditionForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. 3 Piece Agbada"
                      className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-white/30"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[0.65rem] text-[#666] uppercase tracking-wider font-bold">Image URL / Path</label>
                    <input
                      type="text"
                      value={editionForm.image_url}
                      onChange={(e) => setEditionForm(prev => ({ ...prev, image_url: e.target.value }))}
                      className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-white/30"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[0.65rem] text-[#666] uppercase tracking-wider font-bold">Description</label>
                    <textarea
                      value={editionForm.description}
                      onChange={(e) => setEditionForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Garment collection concept outline..."
                      className="w-full h-24 bg-[#0D0D0D] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-white/30 resize-none text-[#888]"
                    />
                  </div>

                  {/* Fabrics specifications */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-[0.55rem] text-[#666] uppercase font-bold">Main Fabric</label>
                      <input
                        type="text"
                        value={editionForm.fabric}
                        onChange={(e) => setEditionForm(prev => ({ ...prev, fabric: e.target.value }))}
                        className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-white/30"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[0.55rem] text-[#666] uppercase font-bold">Headpiece</label>
                      <input
                        type="text"
                        value={editionForm.headpiece}
                        onChange={(e) => setEditionForm(prev => ({ ...prev, headpiece: e.target.value }))}
                        className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-white/30"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[0.55rem] text-[#666] uppercase font-bold">Embroidery</label>
                      <input
                        type="text"
                        value={editionForm.embroidery}
                        onChange={(e) => setEditionForm(prev => ({ ...prev, embroidery: e.target.value }))}
                        className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-white/30"
                      />
                    </div>
                  </div>

                  {/* Quantity & Base Price */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-[0.65rem] text-[#666] uppercase tracking-wider font-bold">Max Supply</label>
                      <input
                        type="number"
                        value={editionForm.max_supply}
                        onChange={(e) => setEditionForm(prev => ({ ...prev, max_supply: Number(e.target.value) }))}
                        className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-white/30"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[0.65rem] text-[#666] uppercase tracking-wider font-bold">Base Price (SOL)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editionForm.price_sol}
                        onChange={(e) => setEditionForm(prev => ({ ...prev, price_sol: Number(e.target.value) }))}
                        className="w-full bg-[#0D0D0D] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-white/30"
                      />
                    </div>
                  </div>

                  {/* Toggle size pricing */}
                  <div className="flex items-center gap-3 py-2 border-y border-white/5">
                    <input
                      type="checkbox"
                      id="has_variable_prices"
                      checked={editionForm.has_variable_prices}
                      onChange={(e) => setEditionForm(prev => ({ ...prev, has_variable_prices: e.target.checked }))}
                      className="w-4 h-4 accent-white cursor-pointer"
                    />
                    <label htmlFor="has_variable_prices" className="text-xs text-[#A3A3A3] font-bold select-none cursor-pointer">
                      Enable size-based variable prices override
                    </label>
                  </div>

                  {/* Pricing Matrix per size */}
                  {editionForm.has_variable_prices && (
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 gap-4 grid grid-cols-2">
                      {['Small', 'Medium', 'Large', 'Extra Large'].map((sz) => (
                        <div key={sz} className="flex flex-col gap-1">
                          <span className="text-[0.55rem] font-bold text-[#666] uppercase font-mono">{sz}</span>
                          <input
                            type="number"
                            step="0.01"
                            value={(editionForm.prices_by_size as any)[sz] || editionForm.price_sol}
                            onChange={(e) => setEditionForm(prev => ({
                              ...prev,
                              prices_by_size: {
                                ...prev.prices_by_size,
                                [sz]: Number(e.target.value)
                              }
                            }))}
                            className="bg-[#0D0D0D] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-white/30 font-mono"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button type="submit" className="btn-circuit w-full justify-center py-4 text-xs">
                    <span>{selectedEdition ? 'Sync Drop Collection' : 'Architect Drop Collection'}</span>
                  </button>
                </form>
              </div>

              {/* Right Column: Grid List of collections */}
              <div className="lg:col-span-7 space-y-6">
                <span className="text-[0.65rem] font-bold uppercase tracking-widest text-[#666] block">
                  Active Dynamic Collections Directory ({editions.length})
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {editions.map((ed) => (
                    <div 
                      key={ed.id} 
                      onClick={() => loadEditionToForm(ed)}
                      className={`card-glass p-5 flex flex-col justify-between gap-6 overflow-hidden border cursor-pointer hover:border-white/30 hover:bg-white/[0.02] transition-all duration-300 ${
                        selectedEdition?.id === ed.id ? 'border-white bg-white/[0.04]' : 'border-white/[0.06]'
                      }`}
                    >
                      <div className="flex gap-4">
                        <div className="w-16 h-20 rounded-xl border border-white/10 relative overflow-hidden shrink-0">
                          <Image src={ed.image_url || '/satin.png'} alt={ed.name} fill className="object-cover" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-white truncate text-md">{ed.name}</h4>
                          <span className="text-[0.6rem] font-mono text-white/40 block mt-0.5">Slug ID: {ed.id}</span>
                          <span className="text-xs text-emerald-400 font-bold block mt-2">
                            {ed.has_variable_prices ? 'Variable Sizing' : `${ed.price_sol} SOL`}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[0.6rem] text-[#666] pt-4 border-t border-white/5 font-mono">
                        <span>Max Cap: {ed.max_supply} Units</span>
                        <span>Fabric: {ed.fabric}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PRINT QR CODE SHIELD MODAL */}
        {selectedQR && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-6 print:p-0 print:static print:inset-auto">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-xl print:hidden" onClick={() => setSelectedQR(null)} />
            
            <div className="relative w-full max-w-md md:max-w-lg card-glass p-6 md:p-10 flex flex-col items-center animate-scale-in print:shadow-none print:border-none print:bg-white print:text-black print:p-0 border-white/20 max-h-[90vh] overflow-y-auto no-scrollbar">
              <div className="print:hidden w-full flex justify-between items-center mb-8 text-[#666]">
                <div className="flex flex-col">
                  <span className="text-[0.6rem] font-bold tracking-[0.3em] uppercase text-white/80">Physical Identity Tag</span>
                  <span className="text-[0.5rem] font-medium tracking-[0.1em] uppercase mt-1">Ready for Print</span>
                </div>
                <button onClick={() => setSelectedQR(null)} className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors text-lg">×</button>
              </div>

              {/* Printable Tag Area */}
              <div id="identity-tag" className="flex flex-col items-center bg-white p-8 md:p-10 rounded-[2rem] print:p-4 print:rounded-none shadow-2xl w-full max-w-[320px]">
                <div className="mb-6 opacity-90 scale-100 invert print:invert-0 flex items-center justify-center">
                  <span className="text-xl font-bold uppercase tracking-wider text-black">CIRCUIT</span>
                </div>
                
                <div className="bg-white p-4 rounded-3xl border border-black/[0.03] mb-6 shadow-sm">
                  <QRCodeCanvas 
                    value={`${window.location.origin}/passport?order=${selectedQR.id}`}
                    size={160}
                    level="H"
                    includeMargin={false}
                  />
                </div>

                <div className="text-center">
                  <span className="text-[0.55rem] font-bold tracking-[0.3em] uppercase text-black/30 block mb-1">Edition Serial</span>
                  <span className="text-2xl font-mono font-bold text-black tracking-tight">
                    {formatSerialNumber(selectedQR.garment_serial, editions.find(e => e.id === selectedQR.drop_id)?.max_supply)}
                  </span>
                </div>

                <div className="mt-8 pt-6 border-t border-black/[0.05] w-full text-center">
                  <span className="text-[0.5rem] font-bold tracking-[0.2em] uppercase text-black/80">AUTHENTIC PHYSICAL MINT</span>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full max-w-[320px] print:hidden">
                <button 
                  onClick={handlePrint}
                  className="flex-1 btn-circuit py-3.5 text-[0.65rem] justify-center"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mr-2"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z"/></svg>
                  <span>Print Identity Tag</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
