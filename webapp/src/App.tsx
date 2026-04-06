import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import TimelineScreen from './components/TimelineScreen';
import MapViewScreen from './components/MapViewScreen';
import LoginScreen from './components/LoginScreen';
import TripSelector from './components/TripSelector';
import TabBar from './components/TabBar';
import Sidebar from './components/Sidebar';
import React, { useEffect, useState } from 'react';
import { auth, db } from './core/firebase';
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useTripStore } from './store/useTripStore';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const userId = useTripStore(s => s.userId);
  const loading = useTripStore(s => s.loading);
  
  if (loading) return null;
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

function App() {
  const userId = useTripStore(s => s.userId);
  const loading = useTripStore(s => s.loading);
  const currentTripId = useTripStore(s => s.currentTripId);
  const isSidebarOpen = useTripStore(s => s.isSidebarOpen);
  const theme = useTripStore(s => s.theme);
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
    }, (err) => {
      console.error("Firestore Listen Error:", err);
      setError(`Firestore Error: ${err.message}`);
    });

    return unsubSnap;
  }, [syncTrips, loading]);

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
      case 'sunset': return ['#FF3B30', '#FF9F0A', '#FFD60A'];
      case 'midnight': return ['#5E5CE6', '#BF5AF2', '#32ADE6'];
      case 'forest': return ['#30D158', '#34C759', '#32ADE6'];
      default: return [undefined, undefined, undefined];
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
        {loading && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 5000, background: '#0f1014', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', gap: '15px' }}>
            <div style={{ fontSize: '2.5rem', animation: 'pulse 2s infinite' }}>✈️</div>
            <div style={{ fontSize: '11px', letterSpacing: '0.2em' }}>INITIALIZING...</div>
          </div>
        )}

        {userId && (
          <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}

        <Routes>
          <Route path="/login" element={<PublicRoute><LoginScreen /></PublicRoute>} />
          <Route path="/trips" element={<ProtectedRoute><TripSelector /></ProtectedRoute>} />
          <Route path="/timeline" element={<ProtectedRoute>{currentTripId ? <TimelineScreen /> : <Navigate to="/trips" replace />}</ProtectedRoute>} />
          <Route path="/map" element={<ProtectedRoute>{currentTripId ? <MapViewScreen /> : <Navigate to="/trips" replace />}</ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/trips" replace />} />
        </Routes>
      </div>

      <NavWrapper />
    </BrowserRouter>
  );
}

const NavWrapper = () => {
  const userId = useTripStore(s => s.userId);
  const loading = useTripStore(s => s.loading);
  if (loading || !userId) return null;
  return <TabBar />;
};

export default App;
