import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import TimelineScreen from './components/TimelineScreen';
import SummaryScreen from './components/SummaryScreen';
import MapViewScreen from './components/MapViewScreen';
import TodoScreen from './components/TodoScreen';
import CostTrackerScreen from './components/CostTrackerScreen';
import WeatherScreen from './components/WeatherScreen';
import NotesScreen from './components/NotesScreen';
import PackingScreen from './components/PackingScreen';
import DebugScreen from './components/DebugScreen';
import LoginScreen from './components/LoginScreen';
import TripSelector from './components/TripSelector';
import GlobalControls from './components/GlobalControls';
import Sidebar from './components/Sidebar';
import GlobalModals from './components/modals/GlobalModals';
import React, { useEffect, useState } from 'react';
import { auth, db } from './core/firebase';
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useTripStore } from './store/useTripStore';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const userId = useTripStore(s => s.userId);
  const loading = useTripStore(s => s.loading);
  const initialized = useTripStore(s => s.initialized);
  
  if (loading || (userId && !initialized)) return null;
  if (!userId) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const userId = useTripStore(s => s.userId);
  const loading = useTripStore(s => s.loading);
  
  if (loading) return null;
  if (userId) return <Navigate to="/trips" replace />;

  return <>{children}</>;
};

const NoTripState = () => (
  <div style={{ padding: '80px 40px', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ fontSize: '3rem', marginBottom: '20px' }}>✈️</div>
    <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '10px', color: '#fff' }}>No Trip Active</h2>
    <p style={{ color: 'var(--sys-label-secondary)', marginBottom: '30px', maxWidth: '300px' }}>Select a trip from the sidebar or trip selector to view your itinerary.</p>
    <Link to="/trips" style={{ display: 'inline-flex', padding: '12px 24px', borderRadius: '12px', background: 'var(--sys-blue)', color: '#fff', fontWeight: 700, textDecoration: 'none' }}>
      Go to Trip Selector
    </Link>
  </div>
);

const SyncStatus = () => {
  const saving = useTripStore(s => s.saving);
  const error = useTripStore(s => s.lastSaveError);
  
  if (!saving && !error) return null;

  return (
    <div style={{
      position: 'fixed', top: '12px', left: '50%', transform: 'translateX(-50%)',
      zIndex: 11000, display: 'flex', alignItems: 'center', gap: '8px',
      padding: '8px 16px', borderRadius: '100px',
      background: error ? 'rgba(255, 59, 48, 0.95)' : 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)',
      color: '#fff', fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)', pointerEvents: 'none',
      transition: 'all 0.3s ease'
    }}>
      {error ? (
        <><span>⚠️</span> <span>SYNC ERROR: {error}</span></>
      ) : (
        <>
          <div style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span>SAVING TO CLOUD...</span>
        </>
      )}
    </div>
  );
};

function MainLayout({ children }: { children: React.ReactNode }) {
  const { currentTripId } = useTripStore();
  const location = useLocation();
  const [isWide, setIsWide] = useState(window.innerWidth >= 1000);

  useEffect(() => {
    const handleResize = () => setIsWide(window.innerWidth >= 1000);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isAuthPage = location.pathname === '/login' || location.pathname === '/trips';

  if (!isAuthPage && isWide && currentTripId) {
    return (
      <div className="split-layout">
        <div className="split-left">
          <TimelineScreen />
        </div>
        <div className="split-right">
          {location.pathname === '/timeline' ? <MapViewScreen /> : children}
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
      {children}
    </div>
  );
}

function App() {
  const userId = useTripStore(s => s.userId);
  const loading = useTripStore(s => s.loading);
  const currentTripId = useTripStore(s => s.currentTripId);
  const isSidebarOpen = useTripStore(s => s.isSidebarOpen);
  const theme = useTripStore(s => s.theme);
  const initialized = useTripStore(s => s.initialized);
  const setUserId = useTripStore(s => s.setUserId);
  const setLoading = useTripStore(s => s.setLoading);
  const setSidebarOpen = useTripStore(s => s.setSidebarOpen);
  const syncTrips = useTripStore(s => s.syncTrips);
  
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRedirectResult(auth).then((result) => {
      if (result?.user) setUserId(result.user.uid);
    }).catch((err) => {
      console.error("Redirect login error:", err);
      setError(`Auth Redirect Error: ${err.message}`);
    });

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null);
      setLoading(false);
    }, (err) => {
      console.error("Auth state error:", err);
      setError(`Auth State Error: ${err.message}`);
    });

    const timeout = setTimeout(() => setLoading(false), 6000); 
    
    return () => {
      unsubAuth();
      clearTimeout(timeout);
    };
  }, [setUserId, setLoading]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "trips"),
      where("userId", "==", user.uid)
    );

    const unsubSnap = onSnapshot(q, (snapshot) => {
      const tripsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      syncTrips(tripsData);
      setError(null);
    }, (err) => {
      console.error("Firestore Listen Error:", err);
      if (err.code === 'permission-denied') {
        setTimeout(() => {
          if (!auth.currentUser) {
            setError(`Firestore Error: ${err.message}. Please try logging in again.`);
          }
        }, 2000);
      } else {
        setError(`Firestore Error: ${err.message}`);
      }
    });

    return unsubSnap;
  }, [syncTrips, loading, userId]);

  if (error) {
    return (
      <div style={{
        height: '100vh', padding: '40px', backgroundColor: '#300', color: '#ff453a',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', gap: '16px'
      }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>⚠️ APP ERROR</h2>
        <p style={{ maxWidth: '400px', fontSize: '0.8rem', opacity: 0.8 }}>{error}</p>
        <button onClick={() => window.location.reload()} style={{ padding: '12px 24px', backgroundColor: '#fff', color: '#000', borderRadius: '12px' }}>RELOAD</button>
      </div>
    );
  }

  const getThemeBlobs = (t: string) => {
    switch (t) {
      case 'sunset':     return ['#FF3B30', '#FF9F0A', '#FFD60A'];
      case 'midnight':   return ['#5E5CE6', '#BF5AF2', '#32ADE6'];
      case 'forest':     return ['#30D158', '#34C759', '#32ADE6'];
      case 'aurora':     return ['#00F5A0', '#8B5CF6', '#06B6D4'];
      case 'desert':     return ['#E2A57E', '#C9415A', '#EDCA7F'];
      case 'ocean':      return ['#0EA5E9', '#0D9488', '#6366F1'];
      case 'vulcan':     return ['#FF4500', '#FF8C00', '#FF2D55'];
      case 'sakura':     return ['#FF85A2', '#D891EF', '#FFB6CE'];
      case 'cyberpunk':  return ['#FF00AA', '#00FFEA', '#FFE600'];
      case 'slate':      return ['#708090', '#708090', '#708090'];
      case 'black':      return ['#000000', '#000000', '#000000'];
      default:           return [undefined, undefined, undefined];
    }
  };
  const [b1, b2, b3] = getThemeBlobs(theme);

  return (
    <BrowserRouter>
      <div className="ambient-bg">
        <div className="blob blob-1" style={b1 ? { background: b1 } : undefined} />
        <div className="blob blob-2" style={b2 ? { background: b2 } : undefined} />
        <div className="blob blob-3" style={b3 ? { background: b3 } : undefined} />
      </div>

      <div className="app-content-root">
        {(loading || (userId && !initialized)) && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: '#0f1014', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', gap: '15px' }}>
            <div style={{ fontSize: '2.5rem', animation: 'pulse 2s infinite' }}>✈️</div>
            <div style={{ fontSize: '11px', letterSpacing: '0.2em', opacity: 0.8 }}>RESTORING TRIP...</div>
          </div>
        )}

        {userId && (
          <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}

        <SyncStatus />
        <GlobalModals />

        <MainLayout>
          <Routes>
            <Route path="/login" element={<PublicRoute><LoginScreen /></PublicRoute>} />
            <Route path="/trips" element={<ProtectedRoute><TripSelector /></ProtectedRoute>} />
            <Route path="/summary" element={<ProtectedRoute>{currentTripId ? <SummaryScreen /> : <NoTripState />}</ProtectedRoute>} />
            <Route path="/timeline" element={<ProtectedRoute>{currentTripId ? <TimelineScreen /> : <NoTripState />}</ProtectedRoute>} />
            <Route path="/map" element={<ProtectedRoute>{currentTripId ? <MapViewScreen /> : <NoTripState />}</ProtectedRoute>} />
            <Route path="/todo" element={<ProtectedRoute>{currentTripId ? <TodoScreen /> : <NoTripState />}</ProtectedRoute>} />
            <Route path="/costs" element={<ProtectedRoute>{currentTripId ? <CostTrackerScreen /> : <NoTripState />}</ProtectedRoute>} />
            <Route path="/weather" element={<ProtectedRoute>{currentTripId ? <WeatherScreen /> : <NoTripState />}</ProtectedRoute>} />
            <Route path="/notes" element={<ProtectedRoute>{currentTripId ? <NotesScreen /> : <NoTripState />}</ProtectedRoute>} />
            <Route path="/packing" element={<ProtectedRoute>{currentTripId ? <PackingScreen /> : <NoTripState />}</ProtectedRoute>} />
            <Route path="/debug" element={<ProtectedRoute><DebugScreen onBack={() => window.history.back()} /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/timeline" replace />} />
          </Routes>
        </MainLayout>
      </div>

      <NavWrapper />
    </BrowserRouter>
  );
}

const NavWrapper = () => {
  const userId = useTripStore(s => s.userId);
  const loading = useTripStore(s => s.loading);
  if (loading || !userId) return null;
  return <GlobalControls />;
};

export default App;
