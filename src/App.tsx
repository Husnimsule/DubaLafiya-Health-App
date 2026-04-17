import * as React from 'react';
import { useState, useEffect, ReactNode, ErrorInfo } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, User, signInAnonymously } from 'firebase/auth';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp, where, getDocs } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { handleFirestoreError, OperationType } from './lib/firestore-errors';
import { useLanguage, Language } from './contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Wifi,
  WifiOff,
  CloudOff,
  RefreshCw,
  Home, 
  Stethoscope, 
  AlertTriangle, 
  BookOpen, 
  Plus, 
  User as UserIcon,
  LogOut,
  ChevronRight,
  Activity,
  MapPin,
  Clock,
  Camera,
  Send,
  CheckCircle2,
  AlertCircle,
  Languages,
  ChevronDown,
  Search,
  Mail,
  UserCircle,
  MessageSquare,
  Mic,
  MicOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { getDiagnosis, analyzeImage, DiagnosisResult } from './lib/gemini';
import Markdown from 'react-markdown';

// --- Types ---
interface PatientRecord {
  id: string;
  name: string;
  age: number;
  gender: string;
  location: string;
  symptoms: string[];
  diagnosis: string;
  urgency: string;
  createdAt: any;
  status: 'consult' | 'treated' | 'referred';
  isVaccinated: boolean;
  isPregnant?: boolean;
  immunizationUpToDate?: boolean;
  recommendedActions?: string;
}

interface OutbreakAlert {
  id: string;
  disease: string;
  location: string;
  count: number;
  severity: 'low' | 'medium' | 'high';
  lastUpdated: any;
}

interface ChatMessage {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  createdAt: any;
}

// --- Error Boundary ---
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  props: ErrorBoundaryProps;
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong. Please try again later.";
      try {
        const parsed = JSON.parse(this.state.error?.message || "");
        if (parsed.error) {
          errorMessage = `Database Error: ${parsed.error}. Operation: ${parsed.operationType} on ${parsed.path}`;
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="h-screen w-full flex flex-col items-center justify-center p-6 bg-red-50 text-center">
          <AlertCircle size={48} className="text-red-600 mb-4" />
          <h2 className="text-xl font-bold text-red-900 mb-2">Application Error</h2>
          <p className="text-red-700 mb-6 max-w-md">{errorMessage}</p>
          <Button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700">
            Reload Application
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Components ---

const WelcomeView = ({ onDismiss }: { onDismiss: () => void }) => {
  const { t } = useLanguage();
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-blue-600 z-[100] flex flex-col items-center justify-center p-8 text-white text-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center mb-8"
      >
        <Activity size={48} />
      </motion.div>
      <motion.h1 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-4xl font-bold mb-4 tracking-tighter"
      >
        {t('welcome')}
      </motion.h1>
      <motion.p 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-blue-100 text-lg mb-12 max-w-xs leading-relaxed"
      >
        {t('welcomeSub')}
      </motion.p>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="space-y-4 w-full max-w-xs"
      >
        <div className="flex items-center gap-4 text-left bg-white/10 p-4 rounded-2xl border border-white/10">
          <Stethoscope className="text-blue-200" size={24} />
          <div>
            <p className="font-bold text-sm">Smart Diagnosis</p>
            <p className="text-xs text-blue-200">AI-assisted symptom analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-left bg-white/10 p-4 rounded-2xl border border-white/10">
          <AlertTriangle className="text-blue-200" size={24} />
          <div>
            <p className="font-bold text-sm">Outbreak Tracking</p>
            <p className="text-xs text-blue-200">Real-time disease monitoring</p>
          </div>
        </div>
      </motion.div>
      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        onClick={onDismiss}
        className="mt-12 bg-white text-blue-600 px-12 py-4 rounded-2xl font-bold shadow-xl shadow-blue-900/20 active:scale-95 transition-transform"
      >
        {t('getStarted')}
      </motion.button>
    </motion.div>
  );
};

const BottomNav = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) => {
  const { t } = useLanguage();
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-6 py-3 flex justify-between items-center z-50">
      <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-blue-600' : 'text-neutral-500'}`}>
        <Home size={20} />
        <span className="text-[10px] font-medium">{t('home')}</span>
      </button>
      <button onClick={() => setActiveTab('diagnosis')} className={`flex flex-col items-center gap-1 ${activeTab === 'diagnosis' ? 'text-blue-600' : 'text-neutral-500'}`}>
        <Stethoscope size={20} />
        <span className="text-[10px] font-medium">{t('diagnose')}</span>
      </button>
      <button onClick={() => setActiveTab('outbreaks')} className={`flex flex-col items-center gap-1 ${activeTab === 'outbreaks' ? 'text-blue-600' : 'text-neutral-500'}`}>
        <AlertTriangle size={20} />
        <span className="text-[10px] font-medium">{t('outbreaks')}</span>
      </button>
      <button onClick={() => setActiveTab('resources')} className={`flex flex-col items-center gap-1 ${activeTab === 'resources' ? 'text-blue-600' : 'text-neutral-500'}`}>
        <BookOpen size={20} />
        <span className="text-[10px] font-medium">{t('resources')}</span>
      </button>
      <button onClick={() => setActiveTab('chat')} className={`flex flex-col items-center gap-1 ${activeTab === 'chat' ? 'text-blue-600' : 'text-neutral-500'}`}>
        <MessageSquare size={20} />
        <span className="text-[10px] font-medium">{t('chat')}</span>
      </button>
    </div>
  );
};

const Header = ({ user, isOnline, userRole, searchQuery, setSearchQuery, setActiveTab }: { user: User | null, isOnline: boolean, userRole: 'volunteer' | 'official', searchQuery: string, setSearchQuery: (q: string) => void, setActiveTab: (t: string) => void }) => {
  const { language, setLanguage, t } = useLanguage();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'ha', label: 'Hausa' },
    { code: 'yo', label: 'Yoruba' },
    { code: 'ig', label: 'Igbo' }
  ];

  return (
    <header className="px-6 py-4 flex flex-col gap-4 bg-white border-b border-neutral-100 sticky top-0 z-40">
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">D</div>
            <h1 className="font-bold text-lg tracking-tight">{t('appTitle')}</h1>
          </div>
          {user && (
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={userRole === 'official' ? 'default' : 'secondary'} className={`text-[8px] h-4 px-1.5 py-0 uppercase tracking-widest font-black border-none ${userRole === 'official' ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-500'}`}>
                {userRole === 'official' ? t('roleOfficial') : t('roleVolunteer')}
              </Badge>
              <span className="text-[10px] text-neutral-400 font-bold truncate max-w-[100px]">
                {user.displayName || user.email?.split('@')[0]}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <Button 
              variant="ghost" 
              size="icon" 
              className={`h-8 w-8 rounded-full ${isSearchOpen ? 'bg-blue-50 text-blue-600' : 'text-neutral-500'}`}
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search size={18} />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8 gap-1 px-2")}>
              <Languages size={16} className="text-neutral-500" />
              <span className="text-[10px] font-bold uppercase">{language}</span>
              <ChevronDown size={12} className="text-neutral-400" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              {languages.map((lang) => (
                <DropdownMenuItem 
                  key={lang.code} 
                  onClick={() => setLanguage(lang.code)}
                  className="text-xs font-medium"
                >
                  {lang.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-1">
            {isOnline ? (
              <div className="flex items-center gap-1 text-[10px] text-green-600 font-bold uppercase tracking-tighter">
                <Wifi size={12} />
                <span>{t('online')}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[10px] text-orange-600 font-bold uppercase tracking-tighter">
                <WifiOff size={12} />
                <span>{t('offline')}</span>
              </div>
            )}
          </div>
          {user && (
            <div className="flex items-center gap-3 border-l border-neutral-100 pl-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-medium">{user.displayName}</p>
                <p className="text-[10px] text-neutral-500">{userRole === 'official' ? t('roleOfficial') : t('roleVolunteer')}</p>
              </div>
              <img src={user.photoURL || ''} alt="Profile" className="w-8 h-8 rounded-full border border-neutral-200" />
            </div>
          )}
        </div>

        {user && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setActiveTab('diagnosis')}
            className="fixed bottom-24 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-[0_8px_30px_rgb(37,99,235,0.4)] flex items-center justify-center z-50 group transition-all"
            aria-label={t('diagnose')}
          >
            <Plus size={28} className="group-hover:rotate-90 transition-transform duration-300" />
            <div className="absolute right-full mr-4 bg-neutral-900 text-white text-[10px] font-bold uppercase py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
              {t('diagnose')}
            </div>
          </motion.button>
        )}
      </div>
      {isSearchOpen && user && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="relative pb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={14} />
            <Input 
              placeholder={t('searchPatients')} 
              className="pl-9 bg-neutral-50 border-none rounded-xl h-9 text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
        </motion.div>
      )}
    </header>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'volunteer' | 'official'>('volunteer');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [showWelcome, setShowWelcome] = useState(true);
  const [records, setRecords] = useState<PatientRecord[]>([]);
  const [alerts, setAlerts] = useState<OutbreakAlert[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online. Syncing data...');
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Working offline. Changes will sync when reconnected.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        // Check if user is an official (admin)
        // In a real app, this would be a custom claim or a document in 'users' collection
        // For this demo, we use the provided admin email
        const isAdmin = u.email === "husniyasule2m@gmail.com";
        setUserRole(isAdmin ? 'official' : 'volunteer');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Volunteers only see their own patients, Officials see all (district-wide)
    const patientsRef = collection(db, 'patients');
    const q = userRole === 'official' 
      ? query(patientsRef, orderBy('createdAt', 'desc'), limit(100))
      : query(patientsRef, where('chvId', '==', user.uid), orderBy('createdAt', 'desc'), limit(100));
      
    const unsubRecords = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PatientRecord));
      setRecords(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'patients');
    });

    const qAlerts = query(collection(db, 'outbreaks'), orderBy('lastUpdated', 'desc'), limit(5));
    const unsubAlerts = onSnapshot(qAlerts, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OutbreakAlert));
      setAlerts(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'outbreaks');
    });

    const qMessages = query(collection(db, 'messages'), orderBy('createdAt', 'desc'), limit(50));
    const unsubMessages = onSnapshot(qMessages, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage)).reverse();
      setMessages(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'messages');
    });

    return () => {
      unsubRecords();
      unsubAlerts();
      unsubMessages();
    };
  }, [user]);

  const handleLogin = async (type: 'google' | 'guest' | 'email' = 'google') => {
    try {
      if (type === 'google') {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        toast.success('Successfully logged in with Google');
      } else if (type === 'guest') {
        await signInAnonymously(auth);
        toast.success('Signed in as Guest');
      } else if (type === 'email') {
        toast.info('Email authentication requires manual setup in Firebase Console.');
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(`Login failed: ${error.message}`);
    }
  };

  const handleLogout = () => {
    auth.signOut();
    toast.success('Logged out successfully');
  };

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-neutral-50">
      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="w-12 h-12 bg-blue-600 rounded-xl"
      />
    </div>
  );

  if (!user) return (
    <div className="h-screen w-full flex flex-col items-center justify-center px-6 bg-neutral-50">
      <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-blue-200">
        <Activity size={32} />
      </div>
      <h1 className="text-2xl font-bold text-center mb-2">DubaLafiya Health App</h1>
      <p className="text-neutral-500 text-center mb-8 max-w-xs text-sm">
        Empowering Community Health Volunteers with AI-driven diagnosis and real-time outbreak detection.
      </p>
      
      <div className="w-full max-w-xs space-y-3">
        <Button onClick={() => handleLogin('google')} className="w-full bg-blue-600 hover:bg-blue-700 h-12 rounded-xl flex items-center justify-center gap-2">
          <Activity size={18} />
          Sign in with Google
        </Button>
        
        <Button variant="outline" onClick={() => handleLogin('email')} className="w-full border-neutral-200 hover:bg-neutral-50 h-12 rounded-xl flex items-center justify-center gap-2">
          <Mail size={18} className="text-neutral-500" />
          <span>{useLanguage().t('emailLogin')}</span>
        </Button>

        <Button variant="ghost" onClick={() => handleLogin('guest')} className="w-full text-neutral-500 hover:text-blue-600 hover:bg-blue-50 h-12 rounded-xl flex items-center justify-center gap-2">
          <UserCircle size={18} />
          <span>{useLanguage().t('guestLogin')}</span>
        </Button>
      </div>

      <p className="mt-8 text-[10px] text-neutral-400 uppercase tracking-widest">{useLanguage().t('authAuthorizedOnly')}</p>
    </div>
  );

  return (
    <ErrorBoundary>
      <AnimatePresence>
        {showWelcome && <WelcomeView onDismiss={() => setShowWelcome(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {selectedPatient && (
          <PatientDetails 
            patient={selectedPatient} 
            allRecords={records} 
            onClose={() => setSelectedPatient(null)} 
          />
        )}
      </AnimatePresence>
      <div className="min-h-screen bg-neutral-50 pb-24 font-sans text-neutral-900">
        <Header user={user} isOnline={isOnline} userRole={userRole} searchQuery={searchQuery} setSearchQuery={setSearchQuery} setActiveTab={setActiveTab} />
        {!isOnline && (
          <div className="bg-orange-50 border-b border-orange-100 px-6 py-2 flex items-center justify-center gap-2">
            <CloudOff size={14} className="text-orange-600" />
            <p className="text-[10px] font-medium text-orange-700 uppercase tracking-wider">
              Offline Mode Enabled • Local Storage Active
            </p>
          </div>
        )}
        <main className="max-w-md mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'home' && <HomeView key="home" records={records} alerts={alerts} setActiveTab={setActiveTab} userRole={userRole} onSelectPatient={setSelectedPatient} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onLogout={handleLogout} />}
            {activeTab === 'diagnosis' && <DiagnosisView key="diagnosis" user={user} isOnline={isOnline} setActiveTab={setActiveTab} />}
            {activeTab === 'outbreaks' && <OutbreaksView key="outbreaks" alerts={alerts} userRole={userRole} />}
            {activeTab === 'resources' && <ResourcesView key="resources" />}
            {activeTab === 'chat' && <ChatView key="chat" user={user} messages={messages} />}
          </AnimatePresence>
        </main>
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
        <Toaster position="top-center" />
      </div>
    </ErrorBoundary>
  );
}

// --- View Components ---

function HomeView({ records, alerts, setActiveTab, userRole, onSelectPatient, searchQuery, setSearchQuery, onLogout }: { records: PatientRecord[], alerts: OutbreakAlert[], setActiveTab: (t: string) => void, userRole: 'volunteer' | 'official', onSelectPatient: (p: PatientRecord) => void, searchQuery: string, setSearchQuery: (q: string) => void, onLogout: () => void, key?: string }) {
  const { t } = useLanguage();

  const filteredRecords = records.filter(record => 
    record.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Aggregate statistics
  const ailmentsByRegion = records.reduce((acc: any, record) => {
    const region = record.location || 'Unknown';
    const ailment = record.diagnosis || 'Unknown';
    if (!acc[region]) acc[region] = {};
    acc[region][ailment] = (acc[region][ailment] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.keys(ailmentsByRegion).map(region => ({
    name: region,
    ...ailmentsByRegion[region]
  }));

  const vaccinationCount = records.filter(r => r.isVaccinated).length;
  const vaccinationRate = records.length > 0 ? Math.round((vaccinationCount / records.length) * 100) : 0;

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-6 space-y-6"
    >
      <section className="space-y-4">
        <div className="flex justify-between items-end">
          <h2 className="text-xl font-bold tracking-tight">{userRole === 'official' ? t('adminDashboard') : t('dashboard')}</h2>
          <span className="text-xs text-neutral-500 font-medium">{new Date().toLocaleDateString()}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-blue-600 text-white border-none shadow-lg shadow-blue-100">
            <CardHeader className="p-4 pb-0">
              <CardTitle className="text-xs font-bold uppercase tracking-widest opacity-70">{t('totalPatients')}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <p className="text-3xl font-bold">{records.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-neutral-200">
            <CardHeader className="p-4 pb-0">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-neutral-400">{t('vaccinationRate')}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <p className="text-3xl font-bold text-green-600">{vaccinationRate}%</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Common Ailments by Region</h3>
        <Card className="bg-white border-neutral-200 p-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
              />
              <Bar dataKey={(v) => Object.values(v).filter(x => typeof x === 'number').reduce((a:any, b:any) => a + b, 0)} fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </section>

      {alerts.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400">Critical Alerts</h3>
          {alerts.map(alert => (
            <Alert key={alert.id} variant={alert.severity === 'high' ? 'destructive' : 'default'} className="bg-white">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{alert.disease} Outbreak</AlertTitle>
              <AlertDescription className="text-xs">
                {alert.count} cases reported in {alert.location}.
              </AlertDescription>
            </Alert>
          ))}
        </section>
      )}

      <section className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
            <Input 
              placeholder={t('searchPatients')} 
              className="pl-10 bg-white border-neutral-200 rounded-xl h-11"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button className="bg-blue-600 rounded-xl h-11 px-4 shadow-md shadow-blue-100">
            <Search size={18} />
          </Button>
        </div>

        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400">{userRole === 'official' ? t('allPatients') : t('recentPatients')}</h3>
          {userRole === 'volunteer' && (
            <Button variant="ghost" size="sm" className="text-blue-600 text-xs" onClick={() => setActiveTab('diagnosis')}>
              <Plus size={14} className="mr-1" /> {t('new')}
            </Button>
          )}
        </div>
        
        <div className="space-y-3">
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-neutral-200">
              <p className="text-neutral-400 text-sm">{searchQuery ? 'No matching records found.' : 'No patient records yet.'}</p>
            </div>
          ) : (
            filteredRecords.map(record => (
              <Card 
                key={record.id} 
                className="bg-white border-neutral-200 overflow-hidden cursor-pointer hover:border-blue-300 transition-colors"
                onClick={() => onSelectPatient(record)}
              >
                <div className="flex items-center p-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                    record.urgency === 'emergency' ? 'bg-red-100 text-red-600' : 
                    record.urgency === 'high' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    <UserIcon size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm">{record.name}</h4>
                    <p className="text-xs text-neutral-500">{record.age}y • {record.gender} • {record.location}</p>
                  </div>
                  <Badge variant={record.status === 'treated' ? 'default' : 'outline'} className="text-[10px] uppercase font-bold px-2 py-0.5">
                    {t(`status${record.status.charAt(0).toUpperCase() + record.status.slice(1)}`)}
                  </Badge>
                </div>
                <div className="px-4 pb-4 flex items-center justify-between border-t border-neutral-50 pt-3">
                  <div className="flex items-center gap-1 text-[10px] text-neutral-400">
                    <Clock size={12} />
                    {record.createdAt?.toDate ? record.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                  </div>
                  <p className="text-xs font-medium text-blue-600">{record.diagnosis}</p>
                </div>
              </Card>
            ))
          )}
        </div>
      </section>

      <div className="pt-6 pb-4">
        <Button 
          variant="outline" 
          onClick={onLogout} 
          className="w-full border-red-100 text-red-600 hover:bg-neutral-50 h-11 rounded-xl flex items-center justify-center gap-2"
        >
          <LogOut size={18} />
          <span>{t('logout')}</span>
        </Button>
      </div>
    </motion.div>
  );
}

function DiagnosisView({ user, isOnline, setActiveTab }: { user: User, isOnline: boolean, setActiveTab: (t: string) => void, key?: string }) {
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = React.useRef<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'male',
    location: '',
    symptoms: [] as string[],
    isVaccinated: false,
    isPregnant: false,
    immunizationUpToDate: false,
    image: null as string | null,
    imageType: ''
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [visionResult, setVisionResult] = useState<string | null>(null);

  const commonSymptoms = ['Fever', 'Cough', 'Chills', 'Headache', 'Rash', 'Fatigue', 'Vomiting', 'Diarrhea', 'Shortness of breath'];

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const toggleSymptom = (s: string) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(s) 
        ? prev.symptoms.filter(x => x !== s)
        : [...prev.symptoms, s]
    }));
  };

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice recognition is not supported in this browser.');
      return;
    }

    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US'; // Default, ideally matched to current language

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
        // Match transcript to symptoms
        commonSymptoms.forEach(s => {
          if (transcript.includes(s.toLowerCase())) {
            toggleSymptom(s);
          }
        });
        toast.info(`Detected: "${transcript}"`);
      };

      recognitionRef.current.onend = () => setIsListening(false);
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string, imageType: file.type }));
      };
      reader.readAsDataURL(file);
    }
  };

  const runDiagnosis = async () => {
    const ageNum = parseInt(formData.age);
    if (!formData.name || isNaN(ageNum) || ageNum < 0 || ageNum > 120 || !formData.location) {
      toast.error(t('validationError'));
      return;
    }

    if (!isOnline) {
      toast.error('AI Diagnosis requires an internet connection. Patient data will be saved locally and can be diagnosed once online.');
      
      // Save to Firestore anyway (it will sync later)
      try {
        await addDoc(collection(db, 'patients'), {
          name: formData.name,
          age: ageNum,
          gender: formData.gender,
          location: formData.location,
          symptoms: formData.symptoms,
          isVaccinated: formData.isVaccinated,
          isPregnant: formData.isPregnant,
          immunizationUpToDate: formData.immunizationUpToDate,
          diagnosis: 'Consult AI Analysis',
          urgency: 'medium',
          recommendedActions: 'Waiting for connection to run AI diagnosis...',
          chvId: user.uid,
          createdAt: serverTimestamp(),
          status: 'consult'
        });
        toast.success('Patient record saved locally');
        setActiveTab('home');
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, 'patients');
      }
      return;
    }
    setIsAnalyzing(true);
    try {
      const diag = await getDiagnosis(formData.symptoms, { 
        age: ageNum, 
        gender: formData.gender, 
        location: formData.location 
      });
      setResult(diag);

      if (formData.image) {
        const base64 = formData.image.split(',')[1];
        const vision = await analyzeImage(base64, formData.imageType);
        setVisionResult(vision);
      }

      // Save to Firestore
      try {
        await addDoc(collection(db, 'patients'), {
          name: formData.name,
          age: ageNum,
          gender: formData.gender,
          location: formData.location,
          symptoms: formData.symptoms,
          isVaccinated: formData.isVaccinated,
          isPregnant: formData.isPregnant,
          immunizationUpToDate: formData.immunizationUpToDate,
          diagnosis: diag.possibleDiagnoses[0],
          urgency: diag.urgency,
          recommendedActions: diag.recommendedActions.join(', '),
          chvId: user.uid,
          createdAt: serverTimestamp(),
          status: 'consult'
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, 'patients');
      }

      // Update outbreak data (simplified aggregation)
      // In a real app, this would be a cloud function
      toast.success('Diagnosis complete and record saved');
      setStep(4);
    } catch (error) {
      toast.error('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-6 space-y-6"
    >
      <div className="flex items-center gap-4 mb-2">
        <div className="flex-1 h-1 bg-neutral-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${(step / 4) * 100}%` }} />
        </div>
        <span className="text-[10px] font-bold text-neutral-400 uppercase">Step {step} of 4</span>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">{t('patientInfo')}</h2>
          <div className="space-y-3">
            <Input placeholder={t('fullName')} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" placeholder={t('age')} value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
              <select 
                className="w-full h-10 px-3 rounded-md border border-neutral-200 text-sm"
                value={formData.gender}
                onChange={e => setFormData({...formData, gender: e.target.value})}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <Input placeholder={t('location')} value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
            
            {/* Conditional Logic: Pregnancy for females of childbearing age */}
            {formData.gender === 'female' && parseInt(formData.age) >= 12 && parseInt(formData.age) <= 55 && (
              <div className="flex items-center space-x-2 bg-white p-3 rounded-md border border-neutral-200">
                <input 
                  type="checkbox" 
                  id="pregnant" 
                  checked={formData.isPregnant} 
                  onChange={e => setFormData({...formData, isPregnant: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded border-neutral-300 focus:ring-blue-500"
                />
                <label htmlFor="pregnant" className="text-sm font-medium text-neutral-700">{t('isPregnant')}</label>
              </div>
            )}

            {/* Conditional Logic: Immunization for children under 5 */}
            {parseInt(formData.age) < 5 && parseInt(formData.age) >= 0 && (
              <div className="flex items-center space-x-2 bg-white p-3 rounded-md border border-neutral-200">
                <input 
                  type="checkbox" 
                  id="immunization" 
                  checked={formData.immunizationUpToDate} 
                  onChange={e => setFormData({...formData, immunizationUpToDate: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded border-neutral-300 focus:ring-blue-500"
                />
                <label htmlFor="immunization" className="text-sm font-medium text-neutral-700">{t('immunizationUpToDate')}</label>
              </div>
            )}

            <div className="flex items-center space-x-2 bg-white p-3 rounded-md border border-neutral-200">
              <input 
                type="checkbox" 
                id="vaccinated" 
                checked={formData.isVaccinated} 
                onChange={e => setFormData({...formData, isVaccinated: e.target.checked})}
                className="w-4 h-4 text-blue-600 rounded border-neutral-300 focus:ring-blue-500"
              />
              <label htmlFor="vaccinated" className="text-sm font-medium text-neutral-700">{t('vaccinated')}</label>
            </div>
          </div>
          <Button 
            className="w-full bg-blue-600" 
            onClick={() => {
              const ageNum = parseInt(formData.age);
              if (!formData.name || isNaN(ageNum) || ageNum < 0 || ageNum > 120 || !formData.location) {
                toast.error(t('validationError'));
              } else {
                handleNext();
              }
            }}
          >
            {t('next')} <ChevronRight size={16} className="ml-2" />
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">{t('symptoms')}</h2>
            <Button 
              size="sm" 
              variant={isListening ? 'destructive' : 'secondary'}
              className={`rounded-full h-8 px-3 gap-2 animate-in fade-in zoom-in duration-300 ${isListening ? 'animate-pulse' : ''}`}
              onClick={startVoiceInput}
            >
              {isListening ? (
                <>
                  <MicOff size={14} />
                  <span className="text-[10px] font-bold uppercase">{t('stopListening')}</span>
                </>
              ) : (
                <>
                  <Mic size={14} />
                  <span className="text-[10px] font-bold uppercase">{t('voiceInput')}</span>
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-neutral-500">Select all that apply to the patient. You can also use voice to dictate symptoms.</p>
          <div className="grid grid-cols-2 gap-2">
            {commonSymptoms.map(s => (
              <button
                key={s}
                onClick={() => toggleSymptom(s)}
                className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                  formData.symptoms.includes(s) 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'bg-white border-neutral-200 text-neutral-600'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleBack}>{t('back')}</Button>
            <Button className="flex-[2] bg-blue-600" onClick={handleNext} disabled={formData.symptoms.length === 0}>
              {t('next')} <ChevronRight size={16} className="ml-2" />
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Image Analysis (Optional)</h2>
          <p className="text-xs text-neutral-500">Upload a photo of visible symptoms or signs of malnutrition.</p>
          
          <div className="aspect-video w-full border-2 border-dashed border-neutral-200 rounded-3xl flex flex-col items-center justify-center bg-white overflow-hidden relative shadow-sm transition-all hover:border-blue-200">
            {formData.image ? (
              <div className="group relative w-full h-full">
                <img src={formData.image} alt="Patient" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button variant="destructive" size="sm" onClick={() => setFormData({...formData, image: null})} className="rounded-full gap-2">
                    <Plus size={16} className="rotate-45" />
                    {t('removePhoto')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center cursor-pointer hover:bg-neutral-50 w-full h-full transition-colors relative">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                  <Camera size={28} />
                </div>
                <p className="text-sm font-bold text-neutral-700">Take Photo or Upload</p>
                <p className="text-[10px] text-neutral-400 mt-1 uppercase tracking-widest">Supports PNG, JPG (Max 5MB)</p>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  onChange={handleImageUpload} 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                />
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleBack}>{t('back')}</Button>
            <Button className="flex-[2] bg-blue-600" onClick={runDiagnosis} disabled={isAnalyzing}>
              {isAnalyzing ? 'Analyzing...' : t('runDiagnosis')}
              {!isAnalyzing && <Send size={16} className="ml-2" />}
            </Button>
          </div>
        </div>
      )}

      {step === 4 && result && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-2xl font-bold">{t('analysisComplete')}</h2>
            <p className="text-sm text-neutral-500">AI has generated a suggested diagnosis.</p>
          </div>

          <Card className="border-blue-200 bg-blue-50 shadow-xl shadow-blue-100/50 scale-[1.02] transition-transform">
            <CardHeader className="p-5 pb-2">
              <div className="flex justify-between items-center mb-1">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">AI CLINICAL SUGGESTION</CardTitle>
                <Badge variant={result.urgency === 'emergency' ? 'destructive' : 'default'} className="rounded-full px-3">
                  {result.urgency.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-3">
              <p className="text-3xl font-black text-blue-900 leading-tight tracking-tight">{result.possibleDiagnoses[0]}</p>
              <div className="h-px bg-blue-200/50 w-full" />
              <p className="text-sm text-blue-800/80 leading-relaxed font-medium">{result.explanation}</p>
            </CardContent>
          </Card>

          {visionResult && (
            <Card className="border-neutral-200 bg-neutral-50/30">
              <CardHeader className="p-4">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Visual Insights</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-xs text-neutral-600 leading-relaxed italic border-l-2 border-neutral-200 pl-3">{visionResult}</p>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400">{t('recommendedActions')}</h3>
            <div className="space-y-2">
              {result.recommendedActions.map((action, i) => (
                <div key={i} className="flex gap-3 p-4 bg-white border border-neutral-100 rounded-2xl shadow-sm">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black">
                    {i + 1}
                  </div>
                  <p className="text-sm text-neutral-700 font-medium">{action}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setStep(3)}>
              {t('back')}
            </Button>
            <Button className="flex-[2] bg-blue-600 h-12 rounded-xl text-lg font-bold" onClick={() => window.location.reload()}>
              {t('done')}
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function ChatView({ user, messages }: { user: User, messages: ChatMessage[] }) {
  const { t } = useLanguage();
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      await addDoc(collection(db, 'messages'), {
        text: newMessage.trim(),
        authorId: user.uid,
        authorName: user.displayName || 'Volunteer',
        authorPhoto: user.photoURL,
        createdAt: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col h-[calc(100vh-170px)] bg-white/50 backdrop-blur-sm border border-neutral-100 rounded-3xl overflow-hidden shadow-sm m-4"
    >
      <div className="p-4 border-b border-neutral-100 bg-white/80 sticky top-0 z-10 backdrop-blur">
        <h2 className="text-lg font-bold">{t('volunteersChat')}</h2>
        <p className="text-[10px] text-neutral-500 uppercase tracking-widest leading-none mt-1">CHV Knowledge Network</p>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6 pr-3 pb-4">
          {messages.map((msg) => {
            const isMe = msg.authorId === user.uid;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {!isMe && (
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border border-white">
                      {msg.authorPhoto ? (
                        <img src={msg.authorPhoto} alt={msg.authorName} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      ) : (
                        <UserCircle size={14} className="text-blue-600" />
                      )}
                    </div>
                  )}
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-tighter">
                    {isMe ? 'You' : msg.authorName}
                  </span>
                </div>
                <div className={`max-w-[85%] p-4 rounded-3xl text-xs leading-relaxed shadow-[0_1px_2px_rgba(0,0,0,0.05)] ${
                  isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white text-neutral-800 rounded-tl-sm border border-neutral-100'
                }`}>
                  {msg.text}
                </div>
                <span className="text-[8px] text-neutral-300 mt-2 uppercase tracking-widest font-medium">
                  {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                </span>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 bg-white/90 border-t border-neutral-100 backdrop-blur">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input 
            placeholder={t('typeMessage')} 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="rounded-2xl bg-neutral-50 border-none h-12 text-sm shadow-inner px-5"
          />
          <Button type="submit" size="icon" className="h-12 w-12 bg-blue-600 rounded-2xl hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-100" disabled={isSending}>
            <Send size={20} />
          </Button>
        </form>
      </div>
    </motion.div>
  );
}

function OutbreaksView({ alerts, userRole }: { alerts: OutbreakAlert[], userRole: 'volunteer' | 'official', key?: string }) {
  const { t } = useLanguage();
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-6 space-y-6"
    >
      <div className="space-y-1">
        <h2 className="text-xl font-bold">{t('outbreakDetection')}</h2>
        <p className="text-xs text-neutral-500">{t('outbreakSub')}</p>
      </div>

      <div className="aspect-video w-full bg-neutral-200 rounded-2xl flex items-center justify-center overflow-hidden relative">
        <img src="https://picsum.photos/seed/map/800/450" alt="Map" className="w-full h-full object-cover opacity-50 grayscale" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-4 bg-white/80 backdrop-blur rounded-xl border border-white">
            <MapPin className="mx-auto mb-2 text-red-600" />
            <p className="text-[10px] font-bold uppercase tracking-widest">{t('districtMap')}</p>
            <p className="text-[8px] text-neutral-500">Aggregating data from 42 CHVs</p>
          </div>
        </div>
        {/* Mock hotspots */}
        <div className="absolute top-1/4 left-1/3 w-4 h-4 bg-red-500/50 rounded-full animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-6 h-6 bg-orange-500/50 rounded-full animate-pulse" />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400">{t('activeTrends')}</h3>
          {userRole === 'official' && (
            <Button variant="outline" size="sm" className="text-[10px] h-7">
              <Plus size={12} className="mr-1" /> Add Alert
            </Button>
          )}
        </div>
        {alerts.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-neutral-100">
            <AlertCircle className="mx-auto mb-2 text-neutral-300" />
            <p className="text-xs text-neutral-400">{t('noOutbreaks')}</p>
          </div>
        ) : (
          alerts.map(alert => (
            <Card key={alert.id} className="bg-white border-neutral-200">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm">{alert.disease}</h4>
                    <Badge variant={alert.severity === 'high' ? 'destructive' : 'outline'} className="text-[8px] h-4">
                      {alert.severity.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-neutral-500">{alert.location} • {alert.count} cases</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-neutral-400">Last updated</p>
                  <p className="text-[10px] font-medium">{alert.lastUpdated?.toDate ? alert.lastUpdated.toDate().toLocaleDateString() : 'Today'}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </motion.div>
  );
}

function ResourcesView({ key }: { key?: string }) {
  const { t } = useLanguage();
  const [selectedResource, setSelectedResource] = useState<any | null>(null);

  const resources = [
    { 
      title: 'Malaria Prevention', 
      category: 'Prevention', 
      icon: <Activity size={16} />,
      content: `
# Malaria Prevention Guide

Malaria is a life-threatening disease caused by parasites that are transmitted to people through the bites of infected female Anopheles mosquitoes. It is preventable and curable.

## Key Prevention Strategies

### 1. Vector Control
Vector control is the main way to prevent and reduce malaria transmission.
*   **Insecticide-treated mosquito nets (ITNs):** Sleeping under an ITN can reduce contact between mosquitoes and humans.
*   **Indoor residual spraying (IRS):** Spraying the inside of housing structures with an insecticide.

### 2. Preventive Medicines
*   **Intermittent preventive treatment of malaria in pregnancy (IPTp):** For pregnant women living in moderate-to-high transmission areas.
*   **Seasonal malaria chemoprevention (SMC):** For children under 5 years of age during the high-transmission season.

### 3. Personal Protection
*   Wear long-sleeved clothing and long trousers.
*   Use insect repellents on skin or clothing.
*   Ensure windows and doors have screens.

## When to Seek Help
If a person experiences **fever, headache, or chills**, they should seek medical attention immediately. Early diagnosis and treatment of malaria reduce disease and prevent deaths.
      `
    },
    { title: 'Pneumonia in Infants', category: 'Diagnosis', icon: <Stethoscope size={16} />, content: 'Content coming soon...' },
    { title: 'Clean Water Guide', category: 'Hygiene', icon: <Activity size={16} />, content: 'Content coming soon...' },
    { title: 'Malnutrition Signs', category: 'Nutrition', icon: <Activity size={16} />, content: 'Content coming soon...' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-6 space-y-6"
    >
      <AnimatePresence>
        {selectedResource && (
          <ResourceDetail 
            resource={selectedResource} 
            onClose={() => setSelectedResource(null)} 
          />
        )}
      </AnimatePresence>

      <div className="space-y-1">
        <h2 className="text-xl font-bold">{t('educationalResources')}</h2>
        <p className="text-xs text-neutral-500">{t('resourcesSub')}</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {resources.map((res, i) => (
          <Card 
            key={i} 
            className="bg-white border-neutral-200 hover:border-blue-300 transition-colors cursor-pointer"
            onClick={() => setSelectedResource(res)}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center text-neutral-600">
                  {res.icon}
                </div>
                <div>
                  <h4 className="font-bold text-sm">{res.title}</h4>
                  <p className="text-[10px] text-neutral-400 uppercase tracking-widest">{res.category}</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-neutral-300" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-blue-600 text-white border-none overflow-hidden">
        <CardContent className="p-6 relative">
          <div className="relative z-10 space-y-2">
            <h3 className="font-bold">{t('offlineMode')}</h3>
            <p className="text-xs opacity-80 leading-relaxed">
              {t('offlineModeDesc')}
            </p>
            <Button variant="secondary" size="sm" className="text-xs bg-white text-blue-600">
              {t('manageDownloads')}
            </Button>
          </div>
          <BookOpen size={80} className="absolute -bottom-4 -right-4 opacity-10 rotate-12" />
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ResourceDetail({ resource, onClose }: { resource: any, onClose: () => void }) {
  const { t } = useLanguage();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-neutral-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-neutral-100 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
              {resource.icon}
            </div>
            <div>
              <h2 className="text-xl font-bold">{resource.title}</h2>
              <p className="text-[10px] text-neutral-400 uppercase tracking-widest">{resource.category}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <Plus size={24} className="rotate-45" />
          </Button>
        </div>

        <ScrollArea className="flex-1 p-6">
          <div className="prose prose-sm max-w-none">
            <Markdown>{resource.content}</Markdown>
          </div>
        </ScrollArea>

        <div className="p-6 border-t border-neutral-100">
          <Button className="w-full bg-blue-600" onClick={onClose}>
            {t('close')}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function PatientDetails({ patient, allRecords, onClose }: { patient: PatientRecord, allRecords: PatientRecord[], onClose: () => void }) {
  const { t } = useLanguage();
  const history = allRecords
    .filter(r => r.name.toLowerCase() === patient.name.toLowerCase() && r.id !== patient.id)
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-neutral-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-neutral-100 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
              <UserIcon size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">{patient.name}</h2>
              <p className="text-xs text-neutral-500">{patient.age}y • {patient.gender} • {patient.location}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <Plus size={24} className="rotate-45" />
          </Button>
        </div>

        <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 border-b border-neutral-100">
            <TabsList className="w-full bg-transparent p-0 h-12 gap-6">
              <TabsTrigger value="details" className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs font-bold uppercase tracking-widest">
                {t('details')}
              </TabsTrigger>
              <TabsTrigger value="history" className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs font-bold uppercase tracking-widest">
                {t('history')}
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 p-6">
            <TabsContent value="details" className="mt-0 space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Diagnosis</p>
                    <p className="text-sm font-bold text-blue-600">{patient.diagnosis}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Urgency</p>
                    <Badge variant={patient.urgency === 'emergency' ? 'destructive' : 'outline'} className="text-[10px]">
                      {patient.urgency}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Symptoms</p>
                  <div className="flex flex-wrap gap-2">
                    {patient.symptoms.map((s, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px] bg-neutral-100 text-neutral-600 border-none">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Recommended Actions</p>
                  <p className="text-xs leading-relaxed text-neutral-600 bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                    {patient.recommendedActions || 'No specific actions recommended.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className={patient.isVaccinated ? "text-green-500" : "text-neutral-300"} />
                    <span className="text-[10px] font-medium text-neutral-500">Vaccinated</span>
                  </div>
                  {patient.isPregnant && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-blue-500" />
                      <span className="text-[10px] font-medium text-neutral-500">Pregnant</span>
                    </div>
                  )}
                  {patient.immunizationUpToDate && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-green-500" />
                      <span className="text-[10px] font-medium text-neutral-500">Immunization OK</span>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-0 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-4">{t('pastDiagnoses')}</h3>
              {history.length === 0 ? (
                <div className="text-center py-12 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
                  <Clock className="mx-auto mb-2 text-neutral-300" size={24} />
                  <p className="text-xs text-neutral-400">{t('noHistory')}</p>
                </div>
              ) : (
                history.map(record => (
                  <div key={record.id} className="p-4 bg-white border border-neutral-100 rounded-2xl space-y-2">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold text-blue-600">{record.diagnosis}</p>
                      <p className="text-[10px] text-neutral-400">
                        {record.createdAt?.toDate ? record.createdAt.toDate().toLocaleDateString() : 'Unknown Date'}
                      </p>
                    </div>
                    <p className="text-[10px] text-neutral-500 line-clamp-2 italic">
                      {record.symptoms.join(', ')}
                    </p>
                  </div>
                ))
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="p-6 border-t border-neutral-100">
          <Button className="w-full bg-blue-600" onClick={onClose}>
            {t('close')}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
