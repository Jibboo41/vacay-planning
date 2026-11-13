import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import TimelineScreen from './components/TimelineScreen';
import SummaryScreen from './components/SummaryScreen';
import MapViewScreen from './components/MapViewScreen';
import TodoScreen from './components/TodoScreen';
import CostTrackerScreen from './components/CostTrackerScreen';
import WeatherScreen from './components/WeatherScreen';
import NotesScreen from './components/NotesScreen';
import PackingScreen from './components/PackingScreen';
import CreditCardsScreen from './components/CreditCardsScreen';
import DebugScreen from './components/DebugScreen';
import LoginScreen from './components/LoginScreen';
import BrandMark from './components/BrandMark';
import TripSelector from './components/TripSelector';
import GlobalControls from './components/GlobalControls';
import Sidebar from './components/Sidebar';
import TabBar from './components/TabBar';
import SideRail from './components/layout/SideRail';
import SplitPane from './components/layout/SplitPane';
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
  <div className="empty-state empty-state--page">
    <BrandMark />
    <h2 className="empty-state__title">No Trip Active</h2>
    <p className="empty-state__text">Select a trip from the sidebar or trip selector to view your itinerary.</p>
    <Link to="/trips" className="btn btn--primary">
      Go to Trip Selector
    </Link>
  </div>
);

const SyncStatus = () => {
  const saving = useTripStore(s => s.saving);
  const error = useTripStore(s => s.lastSaveError);
  
  if (!saving && !error) return null;

  return (
    <div className={`sync-pill${error ? ' sync-pill--error' : ''}`} role="status">
      {error ? (
        <><span>⚠️</span> <span>Sync error: {error}</span></>
      ) : (
        <>
          <div className="sync-pill__spinner" />
          <span>Saving to cloud…</span>
        </>
      )}
    </div>
  );
};

function MainLayout({ children }: { children: React.ReactNode }) {
  const currentTripId = useTripStore(state => state.currentTripId);
  const userId = useTripStore(state => state.userId);
  const tripTitle = useTripStore(state =>
    state.trips.find(trip => trip.id === state.currentTripId)?.title);
  const location = useLocation();
  const [isWide, setIsWide] = useState(window.innerWidth >= 1000);

  useEffect(() => {
    const handleResize = () => setIsWide(window.innerWidth >= 1000);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showNavigation = !!userId && location.pathname !== '/login';

  if (!showNavigation) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
        {children}
      </div>
    );
  }

  if (!isWide) {
    return (
      <div className="mobile-nav-layout">
        {children}
        <TabBar />
      </div>
    );
  }

  const showSplitLayout = !!currentTripId
    && location.pathname !== '/trips'
    && location.pathname !== '/debug';

  return (
    <div className="desktop-nav-layout">
      <SideRail />
      {showSplitLayout ? (
        <div className="desktop-split-layout">
          <header className="desktop-trip-banner">
            <h1 className="desktop-trip-banner__title">{tripTitle || 'Current Trip'}</h1>
          </header>
          <SplitPane
            leftLabel="Timeline"
            left={<TimelineScreen title="Timeline" />}
            right={location.pathname === '/timeline' ? <MapViewScreen /> : children}
          />
        </div>
      ) : (
        <div className="desktop-nav-layout__content">
          {children}
        </div>
      )}
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
      <div className="app-error" role="alert">
        <h2>⚠️ App error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="btn btn--danger">Reload</button>
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
          <div className="app-splash" role="status">
            <BrandMark size={56} />
            <div className="app-splash__label">Restoring trip…</div>
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
            <Route path="/cards" element={<ProtectedRoute>{currentTripId ? <CreditCardsScreen /> : <NoTripState />}</ProtectedRoute>} />
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
