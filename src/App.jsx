import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Smartphone, 
  Search, 
  CheckCircle, 
  ExternalLink, 
  AlertTriangle, 
  RefreshCw, 
  Plus, 
  Trash2, 
  X, 
  MessageSquare, 
  Share2, 
  AlertOctagon, 
  Clock, 
  Database, 
  LogOut,
  User,
  Edit2,
  Download,
  Upload,
  Filter,
  ChevronDown
} from 'lucide-react';

// --- DATABASE ---
const COMMON_SERVICES = [
  { name: 'Google', category: 'Tech', riskLevel: 'High', updateUrl: 'https://myaccount.google.com/phone' },
  { name: 'Aadhaar (UIDAI)', category: 'Govt', riskLevel: 'Critical', updateUrl: 'https://myaadhaar.uidai.gov.in/' },
  { name: 'SBI Bank', category: 'Finance', riskLevel: 'Critical', updateUrl: 'https://www.onlinesbi.sbi/' },
  { name: 'IRCTC', category: 'Travel', riskLevel: 'High', updateUrl: 'https://www.irctc.co.in/' },
  { name: 'Amazon', category: 'Shopping', riskLevel: 'Medium', updateUrl: 'https://www.amazon.in/gp/css/homepage.html' },
  { name: 'Paytm', category: 'Finance', riskLevel: 'Critical', isUpi: true, updateUrl: 'https://paytm.com/' },
  { name: 'PhonePe', category: 'Finance', riskLevel: 'Critical', isUpi: true, updateUrl: 'https://www.phonepe.com/' },
  { name: 'WhatsApp', category: 'Social', riskLevel: 'High', updateUrl: 'https://www.whatsapp.com/settings' }
];

// --- ANIMATION VARIANTS ---
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.05 } }
};

// --- COMPONENTS ---

const Button = ({ children, onClick, variant = 'primary', className = '', icon: Icon, disabled = false, loading = false }) => {
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700",
    danger: "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20",
    whatsapp: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20",
    outline: "border border-slate-700 hover:bg-slate-800 text-slate-400"
  };

  return (
    <motion.button 
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick} 
      disabled={disabled || loading} 
      className={`px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${variants[variant]} ${className}`}
    >
      {loading ? <RefreshCw className="animate-spin" size={18} /> : Icon && <Icon size={18} />}
      {children}
    </motion.button>
  );
};

const ServiceCard = ({ service, onUpdateStatus, onDelete, onMarkDoneRequest }) => (
  <motion.div 
    variants={fadeInUp}
    layout
    className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
      service.status === 'updated' 
      ? 'bg-emerald-500/5 border-emerald-500/20 shadow-none opacity-80' 
      : 'bg-slate-900/50 backdrop-blur-sm border-slate-800 hover:border-indigo-500/50 shadow-xl'
    }`}
  >
    <div className="p-5">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${
          service.status === 'updated' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'
        }`}>
          {service.name[0]}
        </div>
        <button onClick={() => onDelete(service.id)} className="text-slate-600 hover:text-red-400 transition-colors p-1">
          <Trash2 size={16} />
        </button>
      </div>

      <h3 className={`font-bold text-lg mb-1 ${service.status === 'updated' ? 'text-slate-400' : 'text-white'}`}>
        {service.name}
      </h3>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {service.riskLevel === 'Critical' && (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-red-500/10 text-red-500 border border-red-500/20 uppercase">Critical</span>
        )}
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border uppercase ${
          service.status === 'updated' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'
        }`}>
          {service.status === 'updated' ? 'Secured' : 'Pending'}
        </span>
      </div>

      <div className="flex gap-2">
        <a 
          href={service.updateUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-lg transition-all"
        >
          Portal <ExternalLink size={12} />
        </a>
        
        {service.status === 'pending' ? (
          <button 
            onClick={() => onMarkDoneRequest(service)}
            className="flex-1 text-xs font-bold bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600 hover:text-white py-2.5 rounded-lg transition-all"
          >
            Mark Done
          </button>
        ) : (
          <button 
            onClick={() => onUpdateStatus(service.id, 'pending')}
            className="flex-1 text-xs font-bold text-slate-500 hover:text-slate-300 py-2.5"
          >
            Undo
          </button>
        )}
      </div>
    </div>
  </motion.div>
);

export default function App() {
  // --- CORE STATE ---
  const [userPhone, setUserPhone] = useState(null);
  const [userName, setUserName] = useState('');
  const [myServices, setMyServices] = useState([]);
  
  // --- UI STATE ---
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showUpiWarning, setShowUpiWarning] = useState(null);
  
  // --- FORM STATE ---
  const [inputPhone, setInputPhone] = useState('');
  const [tempName, setTempName] = useState('');
  const [newServiceName, setNewServiceName] = useState('');
  const [broadcastNewNumber, setBroadcastNewNumber] = useState('');

  // --- INITIALIZATION ---
  useEffect(() => {
    const storedPhone = localStorage.getItem('ng_user');
    const storedName = localStorage.getItem('ng_user_name');
    if (storedPhone) {
      setUserPhone(storedPhone);
      setUserName(storedName || 'Guardian');
      const data = localStorage.getItem(`ng_data_${storedPhone}`);
      if (data) setMyServices(JSON.parse(data));
    }
    setLoading(false);
  }, []);

  // --- PERSISTENCE ---
  const saveVault = (phone, services) => {
    localStorage.setItem(`ng_data_${phone}`, JSON.stringify(services));
    setMyServices(services);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (inputPhone.length < 10) return;
    const formatted = inputPhone.startsWith('+91') ? inputPhone : `+91${inputPhone}`;
    localStorage.setItem('ng_user', formatted);
    localStorage.setItem('ng_user_name', tempName || 'Guardian');
    setUserPhone(formatted);
    setUserName(tempName || 'Guardian');
  };

  const handleUpdateProfile = () => {
    localStorage.setItem('ng_user_name', tempName);
    setUserName(tempName);
    setShowProfileModal(false);
  };

  // --- SERVICE LOGIC ---
  const handleScan = () => {
    setScanning(true);
    setTimeout(() => {
      const existingNames = new Set(myServices.map(s => s.name));
      const newItems = COMMON_SERVICES
        .filter(s => !existingNames.has(s.name))
        .map((s, i) => ({ ...s, id: Date.now() + i, status: 'pending' }));
      saveVault(userPhone, [...myServices, ...newItems]);
      setScanning(false);
    }, 1500);
  };

  const updateStatus = (id, status) => {
    saveVault(userPhone, myServices.map(s => s.id === id ? { ...s, status } : s));
    setShowUpiWarning(null);
  };

  const handleWhatsAppBroadcast = () => {
    const name = userName && userName !== 'Guardian' ? userName : "I";
    const oldNum = userPhone;
    const newNum = broadcastNewNumber || "[My New Number]";

    const message = `Hello! ${name} have changed my number.\n\nOld: ${oldNum}\nNew: ${newNum}\n\nPlease update your contact list! 📱\n\n(Secured by NumberGuard)`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    setShowBroadcastModal(false);
  };

  // --- DATA PORTABILITY ---
  const exportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(myServices));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `numberguard_backup_${userPhone}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const importData = (e) => {
    const fileReader = new FileReader();
    fileReader.readAsText(e.target.files[0], "UTF-8");
    fileReader.onload = e => {
      try {
        const imported = JSON.parse(e.target.result);
        if (Array.isArray(imported)) {
          saveVault(userPhone, imported);
        }
      } catch (err) {
        alert("Invalid backup file.");
      }
    };
  };

  // --- FILTERING & SORTING ---
  const filteredAndSortedServices = useMemo(() => {
    return myServices
      .filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === 'All' || s.category === filterCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        // Critical first
        if (a.riskLevel === 'Critical' && b.riskLevel !== 'Critical') return -1;
        if (a.riskLevel !== 'Critical' && b.riskLevel === 'Critical') return 1;
        // Then Pending vs Updated
        if (a.status === 'pending' && b.status === 'updated') return -1;
        if (a.status === 'updated' && b.status === 'pending') return 1;
        return 0;
      });
  }, [myServices, searchQuery, filterCategory]);

  const progress = myServices.length > 0 
    ? Math.round((myServices.filter(s => s.status === 'updated').length / myServices.length) * 100) 
    : 0;

  if (!userPhone) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-6 selection:bg-indigo-500/30">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full">
          <div className="text-center mb-10">
            <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ repeat: Infinity, duration: 5 }} className="inline-flex p-5 rounded-3xl bg-indigo-600/20 mb-6 shadow-2xl shadow-indigo-500/20 ring-1 ring-indigo-500/30">
              <Shield size={48} className="text-indigo-500" />
            </motion.div>
            <h1 className="text-5xl font-black text-white mb-3 tracking-tight italic">NumberGuard</h1>
            <p className="text-slate-400 font-medium tracking-wide">Digital Migration Management</p>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Your Name</label>
                <input 
                  type="text" 
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  placeholder="e.g. Rithin"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-4 text-white outline-none focus:border-indigo-500/50 transition-all mb-4"
                />
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Phone Identity</label>
                <div className="relative group">
                  <span className="absolute left-4 top-4 text-slate-500 font-mono">+91</span>
                  <input 
                    type="tel" 
                    value={inputPhone}
                    onChange={(e) => setInputPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="98XXX XXXXX"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-14 pr-4 text-white outline-none group-focus-within:border-indigo-500/50 transition-all font-mono text-lg"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full py-4 text-lg" disabled={inputPhone.length < 10}>
                Open Vault
              </Button>
            </form>
          </div>

          {/* --- WATERMARK FOOTER (LOGIN SCREEN) --- */}
          <div className="mt-12 text-center">
            <div className="flex items-center justify-center gap-2 text-slate-600 mb-2 opacity-50">
              <Shield size={14} />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em]">NumberGuard Core v1.2</span>
            </div>
            <p className="text-slate-500 text-sm font-medium">
              Built with precision by <span className="text-indigo-400 font-bold tracking-tight">Ravoori Rithin</span> © 2026
            </p>
          </div>

        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans pb-12 selection:bg-indigo-500/30">
      {/* --- NAVBAR --- */}
      <nav className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/30">
              <Shield className="text-white" size={20} />
            </div>
            <span className="font-black text-xl text-white italic tracking-tighter hidden sm:block uppercase">NUMBERGUARD</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
               variant="outline" 
               className="hidden sm:flex text-xs py-1.5 h-9 bg-slate-900 border-slate-800 hover:bg-slate-800" 
               icon={Share2}
               onClick={() => setShowBroadcastModal(true)}
            >
               Notify Contacts
            </Button>
            <button 
              onClick={() => { setTempName(userName); setShowProfileModal(true); }}
              className="flex items-center gap-3 bg-slate-900 border border-slate-800 pl-2 pr-4 py-1.5 rounded-xl hover:bg-slate-800 transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <User size={16} />
              </div>
              <div className="flex flex-col items-start leading-none">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">User</span>
                <span className="text-xs font-bold text-white">{userName}</span>
              </div>
            </button>
            <div className="h-10 w-px bg-slate-800 hidden sm:block"></div>
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Linked ID</span>
              <span className="text-xs font-mono text-indigo-400">{userPhone}</span>
            </div>
            <button 
              onClick={() => { localStorage.clear(); window.location.reload(); }}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-red-500/10 hover:text-red-400 transition-all text-slate-500"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-10 space-y-8">
        {/* --- HERO SECTION --- */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative group overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-indigo-900 p-8 sm:p-12 shadow-2xl shadow-indigo-500/10">
          <div className="relative z-10 max-w-2xl">
            <div className="flex justify-between items-start">
              <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 leading-tight italic uppercase tracking-tighter">Safe Passage.</h2>
              <button 
                onClick={() => setShowBroadcastModal(true)}
                className="sm:hidden p-3 bg-white/10 hover:bg-white/20 text-white rounded-full shadow-lg backdrop-blur-md transition-all"
              >
                <Share2 size={20} />
              </button>
            </div>
            <p className="text-indigo-100 text-lg mb-8 leading-relaxed opacity-90">
              Welcome back, <span className="font-bold underline decoration-indigo-300">{userName}</span>. Indian telecom numbers are recycled after 90 days. Secure your linked services today.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button onClick={handleScan} loading={scanning} className="bg-white text-indigo-600 hover:bg-slate-100 px-8 py-4" icon={Search}>
                {scanning ? 'Detecting Services...' : 'Scan Ecosystem'}
              </Button>
              <Button variant="outline" className="bg-indigo-500/20 border-indigo-400/30 text-white hover:bg-indigo-500/30" onClick={() => setShowAddModal(true)} icon={Plus}>
                Add Custom
              </Button>
            </div>
          </div>
          <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 8, repeat: Infinity }} className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-[100px] rounded-full -mr-20 -mt-20" />
        </motion.div>

        {/* --- SEARCH & TOOLS --- */}
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4 w-full lg:max-w-md">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Search services..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-white outline-none focus:border-indigo-500/50 transition-all"
              />
            </div>
            <div className="relative group">
              <Filter className="absolute left-4 top-3.5 text-slate-500" size={20} />
              <select 
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="appearance-none bg-slate-900 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-10 text-white outline-none focus:border-indigo-500/50 transition-all cursor-pointer"
              >
                <option>All</option>
                <option>Finance</option>
                <option>Govt</option>
                <option>Tech</option>
                <option>Shopping</option>
              </select>
              <ChevronDown className="absolute right-4 top-4 text-slate-500 pointer-events-none" size={16} />
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <Button variant="outline" className="flex-1 lg:flex-none text-xs" icon={Download} onClick={exportData}>Export Backup</Button>
            <label className="flex-1 lg:flex-none">
              <input type="file" className="hidden" accept=".json" onChange={importData} />
              <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-400 text-xs font-medium cursor-pointer transition-all">
                <Upload size={14} /> Import Data
              </div>
            </label>
          </div>
        </div>

        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <motion.div variants={fadeInUp} initial="initial" animate="animate" className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500"><Database size={24} /></div>
            <div>
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Vaulted Items</div>
              <div className="text-3xl font-black text-white">{myServices.length}</div>
            </div>
          </motion.div>
          <motion.div variants={fadeInUp} initial="initial" animate="animate" transition={{ delay: 0.1 }} className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500"><Clock size={24} /></div>
            <div>
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">To Update</div>
              <div className="text-3xl font-black text-white">{myServices.filter(s => s.status === 'pending').length}</div>
            </div>
          </motion.div>
          <motion.div variants={fadeInUp} initial="initial" animate="animate" transition={{ delay: 0.2 }} className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
            <div className="flex justify-between items-center mb-3">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Migration Progress</span>
              <span className="text-emerald-400 font-bold">{progress}%</span>
            </div>
            <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
            </div>
          </motion.div>
        </div>

        {/* --- MAIN GRID --- */}
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredAndSortedServices.map(service => (
              <ServiceCard 
                key={service.id} 
                service={service} 
                onUpdateStatus={updateStatus}
                onDelete={(id) => saveVault(userPhone, myServices.filter(s => s.id !== id))}
                onMarkDoneRequest={(s) => s.isUpi ? setShowUpiWarning(s) : updateStatus(s.id, 'updated')}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredAndSortedServices.length === 0 && !scanning && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
            <div className="mb-4 inline-block p-4 rounded-full bg-slate-800/50 text-slate-600"><Search size={40} /></div>
            <h3 className="text-xl font-bold text-slate-400">No results found</h3>
            <p className="text-slate-600 text-sm mt-2">Try adjusting your filters or search keywords.</p>
          </motion.div>
        )}
      </main>

      {/* --- WATERMARK FOOTER --- */}
      <footer className="mt-20 py-12 border-t border-slate-800/50 text-center">
        <div className="flex items-center justify-center gap-2 text-slate-600 mb-3 opacity-50">
          <Shield size={16} />
          <span className="text-[10px] font-bold uppercase tracking-[0.4em]">NumberGuard Core v1.2</span>
        </div>
        <p className="text-slate-400 text-sm font-medium">
          Built with precision by <span className="text-indigo-400 font-bold tracking-tight">Ravoori Rithin</span> © 2026
        </p>
      </footer>

      {/* --- MODALS --- */}
      <AnimatePresence>
        {/* Profile Modal */}
        {showProfileModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowProfileModal(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-8 shadow-2xl">
              <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3 italic tracking-tighter uppercase"><Edit2 className="text-indigo-500" /> Edit Profile</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Display Name</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white outline-none focus:border-indigo-500 transition-all"
                    value={tempName}
                    onChange={e => setTempName(e.target.value)}
                    placeholder="New name..."
                  />
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                <Button variant="outline" className="flex-1" onClick={() => setShowProfileModal(false)}>Cancel</Button>
                <Button className="flex-1" onClick={handleUpdateProfile}>Save Changes</Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Add Service Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-8 shadow-2xl">
              <h3 className="text-2xl font-black text-white mb-6 italic tracking-tighter uppercase">Add Custom Service</h3>
              <input 
                autoFocus
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white mb-6 outline-none focus:border-indigo-500 transition-all"
                placeholder="Service Name (e.g. Netflix, LinkedIn)"
                value={newServiceName}
                onChange={e => setNewServiceName(e.target.value)}
              />
              <div className="flex gap-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button className="flex-1" onClick={() => {
                  const s = { id: Date.now(), name: newServiceName, category: 'Custom', riskLevel: 'Medium', status: 'pending', updateUrl: `https://www.google.com/search?q=change+phone+number+on+${newServiceName}` };
                  saveVault(userPhone, [...myServices, s]);
                  setNewServiceName('');
                  setShowAddModal(false);
                }}>Add Item</Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Broadcast Modal */}
        {showBroadcastModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowBroadcastModal(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-8 shadow-2xl">
              <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3 italic tracking-tighter uppercase">
                <MessageSquare className="text-emerald-500" /> Notify Contacts
              </h3>
              <p className="text-slate-400 text-sm mb-6">Send a pre-formatted broadcast message to your friends and family via WhatsApp.</p>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-6 font-mono text-xs text-slate-300">
                 <p>Hello! {userName !== 'Guardian' ? userName : 'I'} have changed my number.</p>
                 <p className="mt-2 text-red-400">Old: {userPhone}</p>
                 <p className="text-emerald-400">New: {broadcastNewNumber || "[Your New Number]"}</p>
                 <p className="mt-2">Please update your contact list! 📱</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Your New Number (Optional)</label>
                  <input
                    type="tel"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white outline-none focus:border-emerald-500 transition-all"
                    placeholder="+91..."
                    value={broadcastNewNumber}
                    onChange={(e) => setBroadcastNewNumber(e.target.value)}
                  />
                </div>

                <Button
                  className="w-full py-4 text-lg"
                  variant="whatsapp"
                  onClick={handleWhatsAppBroadcast}
                  icon={Share2}
                >
                  Open WhatsApp
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setShowBroadcastModal(false)}>Cancel</Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* UPI Warning Modal */}
        {showUpiWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-red-950/60 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 50 }} className="relative bg-slate-900 border border-red-500/50 w-full max-w-md rounded-3xl p-8 text-center shadow-[0_0_50px_rgba(239,68,68,0.3)]">
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                <AlertOctagon size={48} />
              </div>
              <h3 className="text-3xl font-black text-white mb-4 italic uppercase tracking-tighter">Security Stop!</h3>
              <p className="text-slate-300 mb-8 leading-relaxed">
                You are marking <strong className="text-white">{showUpiWarning.name}</strong> as secured. Have you <span className="text-red-400 font-bold underline underline-offset-4 tracking-tight">DEREGISTERED your UPI ID</span> inside the app first?
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="secondary" onClick={() => setShowUpiWarning(null)}>Go Back</Button>
                <Button variant="danger" className="bg-red-600 hover:bg-red-500 text-white" onClick={() => updateStatus(showUpiWarning.id, 'updated')}>Yes, Deregistered</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
        }
