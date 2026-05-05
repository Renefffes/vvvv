/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { 
  Home, 
  CreditCard, 
  Users, 
  Trophy, 
  LayoutDashboard, 
  MessageSquare,
  Zap,
  Shield,
  RefreshCcw,
  Clock,
  ChevronRight,
  TrendingUp,
  Circle
} from "lucide-react";
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Link, 
  useLocation,
  Navigate
} from "react-router-dom";
import React, { useState, useEffect, createContext, useContext } from "react";
import { auth, db, discordProvider } from "./lib/firebase";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  User as FirebaseUser 
} from "firebase/auth";
import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  Timestamp,
  where
} from "firebase/firestore";

// --- Types ---

interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  plan?: string;
  expiresAt?: any;
  hwid?: string;
  discordId?: string;
}

interface Alert {
  id: string;
  name: string;
  speed: string;
  timestamp: any;
  avatar: string;
}

// --- Auth Context ---

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Sync user profile to Firestore
        const userDoc = doc(db, "users", user.uid);
        const profileData = {
          uid: user.uid,
          displayName: user.displayName || "User",
          photoURL: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
        };
        
        await setDoc(userDoc, profileData, { merge: true });

        // Listen to profile updates
        onSnapshot(userDoc, (doc) => {
          if (doc.exists()) {
            setProfile(doc.data() as UserProfile);
          }
        });
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, discordProvider);
    } catch (error: any) {
      if (error.code === 'auth/operation-not-allowed') {
        alert("Discord login is still disabled in Firebase. Go to 'Authentication' -> 'Sign-in method' and enable Discord with your Client ID/Secret.");
      } else if (error.code === 'auth/popup-blocked') {
        alert("Pop-up blocked! Please allow pop-ups for this site to sign in.");
      } else if (error.code === 'auth/popup-closed-by-user') {
        console.log("Login popup closed");
      } else {
        alert(`Login failed: ${error.message} (${error.code})`);
      }
      console.error("Full Login Error:", error);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Components ---

const Navbar = () => {
  const location = useLocation();
  const { user, profile, login, logout } = useAuth();
  const navItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "Plans", path: "/plans", icon: CreditCard },
    { name: "Renters", path: "/renters", icon: Users },
  ];

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-[800px]">
      <div className="bg-[#15120e]/60 backdrop-blur-xl border border-white/5 rounded-full px-6 py-2 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-brand-orange rounded-lg flex items-center justify-center p-1 shadow-[0_0_15px_rgba(242,169,59,0.3)] group-hover:scale-110 transition-transform cursor-pointer">
            <svg viewBox="0 0 24 24" className="w-full h-full text-bg-dark fill-current">
              <path d="M12 2s-3.5 1.5-3.5 4.5S10 11 10 11s-.5-1-1-2.5C8 6 5 5 5 5s.5 4 1.5 6c1 2.5 4 4.5 4 4.5s-1.5 2.5-3 3c-1.5.5-3 .5-3 .5s2.5.5 4.5.5c4 0 7-3 7-7 0-2.5-1.5-6-1.5-6s2 1.5 3 3.5c1 2 1.5 4 1.5 4s1-3 0-6c-.5-2-2.5-5-2.5-5S12.5 3.5 12 2z" />
            </svg>
          </div>
          <span className="font-bold text-sm hidden sm:block">Phenix Notifier</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-[13px] font-medium transition-colors hover:text-brand-orange ${
                location.pathname === item.path ? "text-brand-orange" : "text-text-muted"
              }`}
            >
              {item.name}
            </Link>
          ))}
          {user && (
            <Link
              to="/dashboard"
              className={`text-[13px] font-medium transition-colors hover:text-brand-orange ${
                location.pathname === "/dashboard" ? "text-brand-orange" : "text-text-muted"
              }`}
            >
              Dashboard
            </Link>
          )}
        </div>

        {user ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border border-white/10 overflow-hidden hidden sm:block">
              <img src={profile?.photoURL} alt="" className="w-full h-full object-cover" />
            </div>
            <button 
              onClick={logout}
              className="bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs font-bold hover:bg-white/10 transition-colors"
            >
              Logout
            </button>
          </div>
        ) : (
          <button 
            onClick={login}
            className="bg-[#1c1813] border border-white/10 rounded-full px-4 py-1.5 flex items-center gap-2 text-xs font-bold hover:bg-white/5 transition-colors group"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#5865F2]" />
            <span>Login</span>
          </button>
        )}
      </div>
    </nav>
  );
};

// --- Pages ---

const LandingPage = () => {
  const { user, login } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const q = query(collection(db, "alerts"), orderBy("timestamp", "desc"), limit(5));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alert));
      setAlerts(data);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8"
        >
          <div className="space-y-4">
            <h1 className="text-6xl sm:text-7xl font-extrabold leading-tight">
              Best real time alerts <br />
              <span className="text-brand-orange">No delay.</span>
            </h1>
            <p className="text-xl text-text-muted max-w-lg leading-relaxed font-medium">
              Join the best logs from the single second they are found, never miss anything.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 pt-4">
            <Link to="/plans" className="bg-brand-orange text-bg-dark font-black px-10 py-4 rounded-xl hover:scale-105 transition-all shadow-[0_10px_30px_rgba(242,169,59,0.2)] hover:shadow-[0_15px_40px_rgba(242,169,59,0.3)]">
              View plans
            </Link>
            {!user && (
              <button 
                onClick={login}
                className="bg-white/5 border border-white/10 text-white font-black px-10 py-4 rounded-xl flex items-center gap-3 hover:bg-white/10 transition-all scale-105"
              >
                <MessageSquare className="w-6 h-6 text-[#5865F2]" />
                Join with Discord
              </button>
            )}
          </div>
        </motion.div>

        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="relative"
        >
          <div className="bg-bg-card rounded-[40px] border border-white/5 p-8 shadow-2xl relative overflow-hidden group">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-brand-orange" />
                </div>
                <div>
                  <h3 className="font-bold">Live feed</h3>
                  <p className="text-[11px] text-text-muted font-medium">Midlights · Highlights · Peaklights - streaming now</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Live
              </div>
            </div>

            <div className="h-[300px] flex flex-col gap-3 border border-white/5 rounded-3xl bg-black/20 p-4 overflow-y-auto custom-scrollbar">
              {alerts.length > 0 ? (
                alerts.map((alert, i) => (
                  <div key={alert.id} className="bg-black border border-white/5 rounded-xl p-3 flex items-center gap-4 relative group overflow-hidden shrink-0">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-orange" />
                    <div className="w-10 h-10 bg-white/5 rounded-lg p-1.5 flex-shrink-0">
                      <img src={alert.avatar} className="w-full h-full object-contain" alt="" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-black text-white truncate">{alert.name}</h3>
                      <p className="text-xs font-black text-brand-orange/80 mt-0.5">{alert.speed}</p>
                    </div>
                    <div className="text-[9px] font-bold text-text-muted/40 uppercase absolute top-3 right-4">
                      {alert.timestamp?.toDate ? "now" : "..."}
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-10 h-10 border-4 border-brand-orange/20 border-t-brand-orange rounded-full animate-spin" />
                  <p className="text-text-muted text-sm font-medium">Waiting for events...</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-8 text-[11px] font-black uppercase tracking-[0.2em] text-brand-orange/80">
              <Link to="/renters" className="flex items-center gap-1 hover:text-brand-orange transition-colors mx-auto">
                Active renters <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const PlansPage = () => {
  const plans = [
    {
      name: "Premium",
      price: "$5.00",
      unit: "/hr",
      slots: "0/5",
      badge: "Most Popular",
      features: [
        "Instant key via dashboard",
        "Luarmor HWID-locked key",
        "HWID reset in dashboard",
        "Auto-expired cleanly"
      ]
    },
    {
      name: "Farmer",
      price: "$3.00",
      unit: "/hr",
      slots: "0/7",
      features: [
        "Instant key via dashboard",
        "Luarmor HWID-locked key",
        "HWID reset in dashboard",
        "Auto-expired cleanly"
      ]
    }
  ];

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto text-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 mb-16"
      >
        <div className="inline-block bg-white/5 border border-white/10 rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest text-text-muted">Pricing</div>
        <h1 className="text-6xl font-black tracking-tight">Choose your plan</h1>
        <p className="text-text-muted text-lg font-medium max-w-2xl mx-auto leading-relaxed">Real-time notifications with the tier that fits you. Instant delivery and no delay on every tier.</p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {plans.map((plan, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[#15120e] border border-white/5 rounded-[48px] p-12 text-left relative overflow-hidden group shadow-2xl flex flex-col"
          >
            {plan.badge && (
              <div className="absolute top-10 left-12 text-[10px] font-black uppercase tracking-[0.2em] text-brand-orange">
                {plan.badge}
              </div>
            )}

            <div className="pt-6 space-y-8 flex-1 flex flex-col">
              <div className="space-y-1.5">
                <h2 className="text-5xl font-black">{plan.name}</h2>
                <div className="flex items-center gap-1.5">
                   <div className="w-2 h-2 bg-brand-orange rounded-full" />
                   <p className="text-xs text-text-muted font-bold">Capacity {plan.slots}</p>
                </div>
              </div>

              <div className="space-y-4 mb-auto">
                 <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-orange w-0 shadow-[0_0_15px_rgba(242,169,59,0.3)]" />
                 </div>
                 <div className="flex justify-between text-[10px] font-black text-text-muted uppercase tracking-widest">
                   <span>Current Capacity</span>
                   <span className="text-brand-orange">{plan.slots}</span>
                 </div>
                 <div className="space-y-5 pt-4">
                  {plan.features.map((f, j) => (
                      <div key={j} className="flex items-center gap-4 text-sm text-text-muted font-bold">
                        <div className="w-6 h-6 bg-brand-orange/10 rounded-lg flex items-center justify-center">
                          {j === 0 ? <Zap className="w-3.5 h-3.5 text-brand-orange" /> : 
                           j === 1 ? <Shield className="w-3.5 h-3.5 text-brand-orange" /> :
                           j === 2 ? <RefreshCcw className="w-3.5 h-3.5 text-brand-orange" /> :
                           <Clock className="w-3.5 h-3.5 text-brand-orange" />}
                        </div>
                        {f}
                      </div>
                    ))}
                  </div>
                </div>

              <div className="pt-8 border-t border-white/5 mt-auto">
                <div className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2">Price</div>
                <div className="flex items-end gap-1 mb-10">
                  <span className="text-6xl font-black leading-none">{plan.price}</span>
                  <span className="text-xl text-text-muted font-bold pb-1">{plan.unit}</span>
                </div>

                <button className="w-full py-5 rounded-2xl font-black transition-all bg-brand-orange text-bg-dark hover:scale-[1.02] shadow-[0_10px_30px_rgba(242,169,59,0.1)]">
                  Login to buy
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-20 text-text-muted text-[11px] font-bold uppercase tracking-widest">
        Pay with Crypto (BTC, ETH, LTC, USDT, SOL) · Wallet balance
      </div>
    </div>
  );
};



const RentersPage = () => {
  const [renters, setRenters] = useState<UserProfile[]>([]);

  useEffect(() => {
    // Query users with active plans
    const q = query(collection(db, "users"), where("plan", "in", ["Premium", "Farmer"]));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
      setRenters(data);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto text-center">
       <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 mb-20"
      >
        <h1 className="text-7xl font-black tracking-tight">Our Renters</h1>
        
        <div className="flex flex-col items-center pt-8">
           <div className="w-24 h-28 bg-bg-card border border-white/10 rounded-3xl flex flex-col items-center justify-center gap-1 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Active</span>
              <span className="text-5xl font-black">{renters.length}</span>
           </div>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto">
        {renters.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-8">
            {renters.map((renter, i) => (
              <motion.div 
                key={renter.uid}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-bg-card border border-white/5 rounded-[48px] p-10 text-left space-y-10 group transition-all hover:border-brand-orange/20 shadow-xl"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <img src={renter.photoURL} className="w-16 h-16 rounded-2xl object-cover bg-white/5 border border-white/10" alt="" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-brand-orange rounded-full border-2 border-bg-card animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black">{renter.displayName}</h3>
                      <p className="text-xs text-text-muted font-bold">@current_renter</p>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="bg-brand-orange/10 text-brand-orange px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">{renter.plan}</div>
                    <div className="flex items-center gap-1.5 justify-end">
                       <div className="w-1.5 h-1.5 bg-brand-orange rounded-full" />
                       <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Active</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-black uppercase tracking-widest text-text-muted">Status</div>
                    <div className="text-3xl font-black">Online</div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-black uppercase tracking-widest text-text-muted">Subscription</div>
                    <div className="text-3xl font-black text-brand-orange">Valid</div>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-white/5">
                  <div className="text-[10px] font-black uppercase tracking-widest text-text-muted">About Renter</div>
                  <p className="text-[15px] text-text-muted font-bold h-14 flex items-center italic">Verified member of Phenix Notifier</p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-bg-card border border-white/5 rounded-[48px] p-20 text-center space-y-6"
          >
            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto">
              <Users className="w-10 h-10 text-brand-orange/40" />
            </div>
            <div>
              <h3 className="text-2xl font-black">No active renters</h3>
              <p className="text-text-muted font-medium mt-2">All slots are currently available for purchase.</p>
            </div>
            <Link to="/plans" className="inline-block bg-brand-orange text-bg-dark font-black px-8 py-3 rounded-xl hover:scale-105 transition-all">
              View Plans
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const { user, profile, loading } = useAuth();
  const [hwid, setHwid] = useState("");

  if (loading) return null;
  if (!user) return <Navigate to="/" />;

  const updateHwid = async () => {
    if (!hwid) return;
    const userDoc = doc(db, "users", user.uid);
    await setDoc(userDoc, { hwid }, { merge: true });
    alert("HWID Reset Request Sent");
  };

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 mb-20"
      >
        <h1 className="text-7xl font-black tracking-tight underline decoration-brand-orange/30 underline-offset-8">Dashboard</h1>
        <p className="text-text-muted text-xl font-medium">Manage your subscription and settings.</p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-bg-card border border-white/5 rounded-[40px] p-8 shadow-2xl">
            <h2 className="text-2xl font-black mb-8">Profile Details</h2>
            <div className="flex items-center gap-6 mb-10">
              <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-white/5 shadow-xl">
                 <img src={profile?.photoURL} alt="" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="text-3xl font-black">{profile?.displayName}</h3>
                <p className="text-text-muted font-bold">UID: {user.uid.slice(0, 8)}...</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-black/40 border border-white/5 rounded-2xl p-6">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Subscription</p>
                <p className="text-xl font-black text-brand-orange">{profile?.plan || "No Active Plan"}</p>
              </div>
              <div className="bg-black/40 border border-white/5 rounded-2xl p-6">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Discord ID</p>
                <p className="text-xl font-black">{profile?.discordId || "Not Linked"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-[#1c1813] border border-brand-orange/20 rounded-[40px] p-8 shadow-2xl">
            <h3 className="text-lg font-black mb-6">Device Management</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2 block">Set HWID</label>
                <input 
                  type="text" 
                  value={hwid}
                  onChange={(e) => setHwid(e.target.value)}
                  placeholder="Paste your HWID here"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-orange/50 outline-none transition-colors"
                />
              </div>
              <button 
                onClick={updateHwid}
                className="w-full py-4 bg-brand-orange text-bg-dark rounded-xl font-black hover:scale-[1.02] transition-transform shadow-lg"
              >
                Reset & Link Device
              </button>
            </div>
          </div>

          <div className="bg-bg-card border border-white/5 rounded-[40px] p-8">
            <h3 className="text-lg font-black mb-6">Quick Tasks</h3>
            <div className="space-y-4">
              <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors">
                Connect Discord
              </button>
              <button 
                onClick={async () => {
                  // Demo: create an alert in the feed
                  const alertData = {
                    name: profile?.displayName || "Anonymous",
                    speed: `${(Math.random() * 1000).toFixed(2)}M/s`,
                    timestamp: Timestamp.now(),
                    avatar: profile?.photoURL || ""
                  };
                  await setDoc(doc(collection(db, "alerts")), alertData);
                }}
                className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors"
              >
                Simulate Log
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- App ---

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen selection:bg-brand-orange selection:text-bg-dark overflow-x-hidden">
          {/* Background Gradients */}
          <div className="fixed top-0 left-0 w-full h-full bg-[#0a0806] -z-20" />
          <div className="fixed top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#b87b1e]/5 rounded-full blur-[150px] pointer-events-none -z-10" />
          <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#f2a93b]/5 rounded-full blur-[150px] pointer-events-none -z-10" />

          <Navbar />
          
          <main className="relative z-10">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/plans" element={<PlansPage />} />
              <Route path="/renters" element={<RentersPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}
