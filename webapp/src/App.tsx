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
import { Plane } from 'lucide-react';
import { cn } from './lib/cn';
import { Button, EmptyState, Toaster } from './components/ui';
import { buttonVariants } from './components/ui/variants';

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
  <EmptyState
    className="h-full px-10 py-20"
    icon={<Plane size={28} />}
    title="No Trip Active"
    description="Select a trip from the sidebar or trip selector to view your itinerary."
    action={
      <Link to="/trips" className={buttonVariants({ variant: 'primary', size: 'lg' })}>
        Go to Trip Selector
      </Link>
    }
  />
);

const SyncStatus = () => {
  const saving = useTripStore(s => s.saving);
  const error = useTripStore(s => s.lastSaveError);

  if (!saving && !error) return null;

  return (
    <div
      role="status"
      className={cn(
        'pointer-events-none fixed top-3 left-1/2 z-[11000] flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-caption font-extrabold tracking-wider text-white shadow-[0_4px_20px_rgba(0,0,0,0.3)] backdrop-blur-md transition-all duration-300',
        error ? 'bg-sys-red/95' : 'bg-black/70',
      )}
    >
      {error ? (
        <><span aria-hidden="true">⚠️</span> <span>SYNC ERROR: {error}</span></>
      ) : (
        <>
          <div className="size-3 animate-spin rounded-full border-2 border-white/30 border-t-white motion-reduce:animate-none" />
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
    <div className="flex min-h-screen w-full flex-1 flex-col">
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
    document.documentElement.dataset.theme = theme;
  }, [theme]);

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
      })) as Parameters<typeof syncTrips>[0];
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
      <div role="alert" className="flex h-screen flex-col items-center justify-center gap-4 bg-[#300] p-10 text-center text-sys-red">
        <h2 className="text-[1.2rem] font-extrabold">⚠️ APP ERROR</h2>
        <p className="max-w-[400px] text-footnote opacity-80">{error}</p>
        <Button className="bg-white text-black shadow-none hover:bg-white/90" onClick={() => window.location.reload()}>RELOAD</Button>
      </div>
    );
  }


  return (
    <BrowserRouter>
      <div className="ambient-bg" aria-hidden="true">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <div className="app-content-root">
        {(loading || (userId && !initialized)) && (
          <div role="status" className="fixed inset-0 z-[10000] flex flex-col items-center justify-center gap-4 bg-app-bg text-white">
            <div className="animate-pulse text-[2.5rem] motion-reduce:animate-none" aria-hidden="true">✈️</div>
            <div className="text-caption tracking-[0.2em] opacity-80">RESTORING TRIP...</div>
          </div>
        )}

        {userId && (
          <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}

        <SyncStatus />
        <GlobalModals />
        <Toaster />

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
