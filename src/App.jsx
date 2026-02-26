import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Smartphone, 
  Search, 
  CheckCircle, 
  ExternalLink, 
  AlertTriangle, 
  RefreshCw, 
  Lock,
  Plus,
  Trash2,
  Menu,
  X,
  MessageSquare,
  Share2,
  AlertOctagon,
  Clock,
  Database,
  LogOut,
  ChevronRight
} from 'lucide-react';

// --- MVP CONFIGURATION: "INTELLIGENCE" DATABASE ---
// This static list provides the core value: knowing where to go.
const COMMON_SERVICES = [
  { 
    name: 'Google', 
    category: 'Tech', 
    riskLevel: 'High',
    updateUrl: 'https://myaccount.google.com/phone',
  },
  { 
    name: 'Aadhaar (UIDAI)', 
    category: 'Government', 
    riskLevel: 'Critical',
    updateUrl: 'https://myaadhaar.uidai.gov.in/',
  },
  { 
    name: 'SBI (State Bank of India)', 
    category: 'Finance', 
    riskLevel: 'Critical',
    updateUrl: 'https://www.onlinesbi.sbi/',
  },
  { 
    name: 'IRCTC', 
    category: 'Travel', 
    riskLevel: 'High',
    updateUrl: 'https://www.irctc.co.in/nget/train-search',
  },
  { 
    name: 'Amazon India', 
    category: 'Shopping', 
    riskLevel: 'Medium',
    updateUrl: 'https://www.amazon.in/gp/css/homepage.html',
  },
  { 
    name: 'Flipkart', 
    category: 'Shopping', 
    riskLevel: 'Medium',
    updateUrl: 'https://www.flipkart.com/account/settings',
  },
  { 
    name: 'Paytm', 
    category: 'Finance', 
    riskLevel: 'Critical',
    isUpi: true,
    updateUrl: 'https://paytm.com/settings/profile',
  },
  { 
    name: 'PhonePe', 
    category: 'Finance', 
    riskLevel: 'Critical',
    isUpi: true,
    updateUrl: 'https://www.phonepe.com/',
  },
  { 
    name: 'Zomato', 
    category: 'Food', 
    riskLevel: 'Low',
    updateUrl: 'https://www.zomato.com/users/edit',
  },
  { 
    name: 'Swiggy', 
    category: 'Food', 
    riskLevel: 'Low',
    updateUrl: 'https://www.swiggy.com/my-account',
  }
];

// --- UI COMPONENTS ---

const Button = ({ children, onClick, variant = 'primary', className = '', icon: Icon, disabled = false }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 active:scale-95 disabled:active:scale-100 disabled:cursor-not-allowed disabled:opacity-50";
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700",
    danger: "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20",
    whatsapp: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20",
    outline: "border border-slate-600 hover:bg-slate-800 text-slate-300"
  };

  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

const StatusBadge = ({ status }) => {
  if (status === 'updated') {
    return <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs border border-emerald-500/20 flex items-center gap-1"><CheckCircle size={10} /> Done</span>;
  }
  return <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs border border-amber-500/20 flex items-center gap-1"><Clock size={10} /> Pending</span>;
};

const ServiceCard = ({ service, onUpdateStatus, onDelete, onMarkDoneRequest }) => {
  return (
    <div className={`
      relative overflow-hidden rounded-xl border transition-all duration-300 group
      ${service.status === 'updated' 
        ? 'bg-slate-900/30 border-emerald-900/30' 
        : 'bg-slate-900 border-slate-800 hover:border-indigo-500/30'
      }
    `}>
      {/* Card Header */}
      <div className="p-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={`
            w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold shadow-inner
            ${service.status === 'updated' ? 'bg-emerald-900/20 text-emerald-500' : 'bg-slate-800 text-slate-400'}
          `}>
            {service.name[0]}
          </div>
          
          <div>
            <h3 className={`font-bold text-lg flex items-center gap-2 ${service.status === 'updated' ? 'text-slate-400' : 'text-slate-100'}`}>
              {service.name}
            </h3>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <StatusBadge status={service.status} />
              {service.riskLevel === 'Critical' && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">CRITICAL</span>
              )}
              {service.isUpi && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">UPI</span>
              )}
            </div>
          </div>
        </div>

        <button 
          onClick={() => onDelete(service.id)}
          className="text-slate-600 hover:text-red-400 transition-colors p-1"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Card Actions */}
      <div className="bg-slate-950/30 p-3 flex gap-2 border-t border-white/5">
        <a 
          href={service.updateUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 text-sm bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 py-2 rounded-lg transition-colors font-medium"
        >
          Update <ExternalLink size={12} />
        </a>
        
        {service.status === 'pending' ? (
          <button 
            onClick={() => onMarkDoneRequest(service)}
            className="flex-1 flex items-center justify-center gap-2 text-sm bg-slate-800 text-slate-300 hover:bg-emerald-600 hover:text-white py-2 rounded-lg transition-colors font-medium"
          >
            Mark Done
          </button>
        ) : (
          <button 
            onClick={() => onUpdateStatus(service.id, 'pending')}
            className="flex-1 flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-300 py-2 rounded-lg transition-colors font-medium"
          >
            Undo
          </button>
        )}
      </div>
    </div>
  );
};

// --- MAIN APP LOGIC ---

export default function App() {
  // State: Identity
  const [userPhone, setUserPhone] = useState(null);
  
  // State: Data
  const [myServices, setMyServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  
  // State: UI & Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showUpiWarning, setShowUpiWarning] = useState(null);
  
  // State: Forms
  const [inputPhone, setInputPhone] = useState('');
  const [newServiceName, setNewServiceName] = useState('');
  const [broadcastNewNumber, setBroadcastNewNumber] = useState('');

  // --- 1. PERSISTENCE LAYER (LocalStorage) ---
  
  useEffect(() => {
    const storedPhone = localStorage.getItem('ng_mvp_user');
    if (storedPhone) {
      setUserPhone(storedPhone);
      loadVault(storedPhone);
    } else {
      setLoading(false);
    }
  }, []);

  const loadVault = (phone) => {
    setLoading(true);
    try {
      const data = localStorage.getItem(`ng_mvp_data_${phone}`);
      if (data) {
        setMyServices(JSON.parse(data));
      } else {
        setMyServices([]);
      }
    } catch (e) {
      console.error("Corrupt data", e);
    }
    setLoading(false);
  };

  const saveVault = (phone, services) => {
    localStorage.setItem(`ng_mvp_data_${phone}`, JSON.stringify(services));
    setMyServices(services);
  };

  // --- 2. AUTHENTICATION (Local) ---

  const handleLogin = (e) => {
    e.preventDefault();
    if (!inputPhone || inputPhone.length < 10) return;
    const formatted = inputPhone.startsWith('+91') ? inputPhone : `+91${inputPhone}`;
    
    localStorage.setItem('ng_mvp_user', formatted);
    setUserPhone(formatted);
    loadVault(formatted);
  };

  const handleLogout = () => {
    localStorage.removeItem('ng_mvp_user');
    setUserPhone(null);
    setMyServices([]);
    setInputPhone('');
  };

  // --- 3. CORE FEATURES ---

  // Feature: Scan (Populate Defaults)
  const handleScan = () => {
    setScanning(true);
    setTimeout(() => {
      const existingNames = new Set(myServices.map(s => s.name));
      const newItems = COMMON_SERVICES
        .filter(s => !existingNames.has(s.name))
        .map((s, i) => ({
          ...s,
          id: Date.now() + i,
          status: 'pending',
          addedAt: new Date().toISOString()
        }));
      
      saveVault(userPhone, [...myServices, ...newItems]);
      setScanning(false);
    }, 1200); // Fake delay for UX
  };

  // Feature: Add Custom
  const handleAddCustom = () => {
    if (!newServiceName) return;
    const newItem = {
      id: Date.now(),
      name: newServiceName,
      category: 'Custom',
      riskLevel: 'Medium',
      updateUrl: `https://google.com/search?q=${newServiceName}+change+phone+number`,
      status: 'pending',
      addedAt: new Date().toISOString()
    };
    saveVault(userPhone, [...myServices, newItem]);
    setNewServiceName('');
    setShowAddModal(false);
  };

  // Feature: Update Status
  const updateStatus = (id, status) => {
    const updated = myServices.map(s => s.id === id ? { ...s, status } : s);
    saveVault(userPhone, updated);
    setShowUpiWarning(null);
  };

  // Feature: UPI Safety Check
  const requestMarkDone = (service) => {
    if (service.isUpi || service.category === 'Finance') {
      setShowUpiWarning(service);
    } else {
      updateStatus(service.id, 'updated');
    }
  };

  // Feature: WhatsApp Broadcast
  const sendBroadcast = () => {
    const name = "I";
    const oldNum = userPhone;
    const newNum = broadcastNewNumber || "[My New Number]";
    const text = `Hello! ${name} have changed my number.\n\nOld: ${oldNum}\nNew: ${newNum}\n\nPlease update your contact list! 📱\n\n(Sent via NumberGuard)`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    setShowBroadcastModal(false);
  };

  // Metrics
  const progress = myServices.length > 0 
    ? Math.round((myServices.filter(s => s.status === 'updated').length / myServices.length) * 100) 
    : 0;
  const pendingCritical = myServices.filter(s => s.status === 'pending' && s.riskLevel === 'Critical').length;

  // --- VIEW: LOGIN ---
  if (!userPhone) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="inline-flex p-4 rounded-2xl bg-indigo-500/10 mb-4 shadow-2xl shadow-indigo-500/10 ring-1 ring-indigo-500/20">
              <Shield size={48} className="text-indigo-500" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">NumberGuard</h1>
            <p className="text-slate-400">Your personal digital identity vault.</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
            <div className="flex items-center gap-2 mb-6 text-xs text-emerald-400 bg-emerald-950/30 p-2 rounded-lg border border-emerald-900/50">
              <Database size={14} />
              <span>MVP Mode: Data stays on this device.</span>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Phone Number</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-slate-500 font-mono">+91</span>
                  <input 
                    type="tel" 
                    value={inputPhone}
                    onChange={(e) => setInputPhone(e.target.value)}
                    placeholder="98XXX XXXXX"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                    autoFocus
                  />
                </div>
              </div>
              <Button type="submit" className="w-full py-3 text-lg" disabled={inputPhone.length < 10}>
                Open Vault
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW: DASHBOARD ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/60">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <Shield className="text-indigo-500" size={24} />
            <span className="hidden sm:inline">NumberGuard</span>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="secondary" className="text-xs h-9 hidden sm:flex" icon={Share2} onClick={() => setShowBroadcastModal(true)}>
              Broadcast
            </Button>
            <div className="h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2 text-sm text-slate-400 font-mono">
              <Smartphone size={14} /> {userPhone}
            </div>
            <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-white transition-colors">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 space-y-6 pb-24">
        
        {/* Hero / Scanner */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900/40 via-slate-900 to-slate-900 border border-indigo-500/20 p-6 sm:p-8">
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Secure your digital footprint.</h2>
            <p className="text-slate-400 mb-6 max-w-lg">
              Changing numbers? Scan to find high-risk accounts linked to your old number and update them before it's recycled.
            </p>
            <Button 
              onClick={handleScan} 
              disabled={scanning} 
              className="w-full sm:w-auto py-3 px-6"
              icon={scanning ? RefreshCw : Search}
            >
              {scanning ? 'Scanning Ecosystem...' : 'Identify Linked Accounts'}
            </Button>
          </div>
          {/* Decorative Background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none -mr-16 -mt-16"></div>
        </section>

        {/* Risk Alert Banner */}
        {pendingCritical > 0 && (
          <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 p-4 flex gap-4 items-start">
            <AlertOctagon className="text-orange-500 shrink-0 mt-1" size={24} />
            <div>
              <h3 className="text-orange-200 font-bold">Recycle Risk Detected</h3>
              <p className="text-sm text-orange-200/70 mt-1">
                You have <strong>{pendingCritical} critical services</strong> (like Banks/UPI) pending. 
                Telecom operators may recycle your old number after 90 days. Update these immediately.
              </p>
            </div>
          </div>
        )}

        {/* Stats / Progress */}
        {myServices.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-slate-500 text-xs mb-1">Total Services</div>
              <div className="text-2xl font-bold text-white">{myServices.length}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-slate-500 text-xs mb-1">Pending</div>
              <div className="text-2xl font-bold text-amber-400">{myServices.length - myServices.filter(s => s.status === 'updated').length}</div>
            </div>
            <div className="col-span-2 bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-center">
              <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span>Migration Progress</span>
                <span className="text-white font-bold">{progress}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Service List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Action Items</h3>
            <Button variant="outline" className="text-xs" icon={Plus} onClick={() => setShowAddModal(true)}>
              Add Custom
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-600 animate-pulse">Loading Vault...</div>
          ) : myServices.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/50">
              <Search className="mx-auto text-slate-700 mb-4" size={32} />
              <p className="text-slate-500">Vault is empty.</p>
              <p className="text-slate-600 text-sm">Click "Identify Linked Accounts" to start.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myServices
                .sort((a, b) => (a.status === b.status ? 0 : a.status === 'pending' ? -1 : 1))
                .map(service => (
                  <ServiceCard 
                    key={service.id} 
                    service={service}
                    onUpdateStatus={updateStatus}
                    onDelete={() => {
                      const newList = myServices.filter(s => s.id !== service.id);
                      saveVault(userPhone, newList);
                    }}
                    onMarkDoneRequest={requestMarkDone}
                  />
                ))}
            </div>
          )}
        </div>
      </main>

      {/* MODAL: Add Service */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Add Service</h3>
              <button onClick={() => setShowAddModal(false)}><X className="text-slate-500 hover:text-white" /></button>
            </div>
            <input 
              autoFocus
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white mb-4 outline-none focus:border-indigo-500"
              placeholder="Service Name (e.g. Netflix)"
              value={newServiceName}
              onChange={e => setNewServiceName(e.target.value)}
            />
            <Button className="w-full py-3" onClick={handleAddCustom}>Add to Vault</Button>
          </div>
        </div>
      )}

      {/* MODAL: Broadcast */}
      {showBroadcastModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <MessageSquare className="text-emerald-500" size={20} /> Notify Contacts
              </h3>
              <button onClick={() => setShowBroadcastModal(false)}><X className="text-slate-500 hover:text-white" /></button>
            </div>
            <p className="text-slate-400 text-sm mb-4">Send a pre-filled message via WhatsApp.</p>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-4 text-xs font-mono text-slate-300">
              Hello! I have changed my number.<br/>
              <span className="text-red-400">Old: {userPhone}</span><br/>
              <span className="text-emerald-400">New: {broadcastNewNumber || "..."}</span>
            </div>
            <input 
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white mb-4 outline-none focus:border-emerald-500"
              placeholder="Enter New Number (+91...)"
              value={broadcastNewNumber}
              onChange={e => setBroadcastNewNumber(e.target.value)}
            />
            <Button variant="whatsapp" className="w-full py-3" icon={Share2} onClick={sendBroadcast}>Open WhatsApp</Button>
          </div>
        </div>
      )}

      {/* MODAL: UPI Warning */}
      {showUpiWarning && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/50 w-full max-w-sm rounded-2xl p-6 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
            <AlertOctagon className="text-red-500 mx-auto mb-4" size={48} />
            <h3 className="text-2xl font-bold text-white mb-2">STOP!</h3>
            <p className="text-slate-300 mb-6">
              You are removing <strong className="text-white">{showUpiWarning.name}</strong>. 
              Did you <span className="text-red-400 underline">deregister your UPI ID</span> inside the app first?
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowUpiWarning(null)}>Check Again</Button>
              <Button variant="danger" className="flex-1" onClick={() => requestMarkDone({ ...showUpiWarning, isUpi: false })}>Yes, I'm Safe</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}