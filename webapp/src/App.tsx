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
import ErrorBoundary from './components/ErrorBoundary';
import SyncIndicator from './components/SyncIndicator';
import AppBanner from './components/AppBanner';
import CommandPalette from './components/CommandPalette';
import { ScreenSkeleton, TimelineSkeleton, TripListSkeleton } from './components/Skeletons';
import React, { useEffect, useState } from 'react';
import { auth, db } from './core/firebase';
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useTripStore } from './store/useTripStore';
import { Plane } from 'lucide-react';
import { EmptyState, Toaster } from './components/ui';
import { buttonVariants } from './components/ui/variants';
import { useUiStore } from './store/useUiStore';
import { useHotkeys, isDialogOpen } from './hooks/useHotkeys';
import { startNewItem } from './store/itemActions';
import { useIsWide } from './hooks/useMediaQuery';
import { DEFAULT_ROUTE, isDebugEnabled } from './app/routes';
import TabBar from './components/TabBar';
import SideRail from './components/layout/SideRail';
import SplitPane from './components/layout/SplitPane';

const RouteSkeleton = () => {
  const { pathname } = useLocation();
  if (pathname === '/trips') return <TripListSkeleton />;
  if (pathname === '/timeline') return <TimelineSkeleton />;
  return <ScreenSkeleton />;
};

const ProtectedRoute = ({ children, name }: { children: React.ReactNode; name?: string }) => {
  const userId = useTripStore(s => s.userId);
  const loading = useTripStore(s => s.loading);
  const initialized = useTripStore(s => s.initialized);
  const { pathname } = useLocation();

  // The splash covers the initial auth check; afterwards show skeletons while trips load.
  if (loading) return null;
  if (!userId) return <Navigate to="/login" replace />;
  if (!initialized) return <RouteSkeleton />;

  return <ErrorBoundary name={name} resetKey={pathname}>{children}</ErrorBoundary>;
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

/** Persistent sync pill, shown on trip screens only. */
const SyncStatus = () => {
  const userId = useTripStore(s => s.userId);
  const currentTripId = useTripStore(s => s.currentTripId);
  const { pathname } = useLocation();
  if (!userId || !currentTripId || pathname === '/login') return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+var(--bottom-nav-offset,0px)+28px)] z-[2600] flex justify-center">
      <SyncIndicator className="pointer-events-auto" />
    </div>
  );
};

/** Global shortcuts: ⌘K / Ctrl+K and "/" open the command palette, "N" adds an item. */
const GlobalShortcuts = () => {
  const userId = useTripStore(s => s.userId);
  const setPaletteOpen = useUiStore(s => s.setPaletteOpen);
  const paletteOpen = useUiStore(s => s.paletteOpen);
  useHotkeys({
    'mod+k': (e) => { e.preventDefault(); setPaletteOpen(!paletteOpen); },
    '/': (e) => { if (isDialogOpen()) return; e.preventDefault(); setPaletteOpen(true); },
    'n': (e) => {
      if (isDialogOpen() || !useTripStore.getState().currentTripId) return;
      e.preventDefault();
      startNewItem();
    },
  }, !!userId);
  return null;
};

/** Which navigation chrome is visible; mirrored to `<html data-nav>` so fixed UI can offset itself in CSS. */
type NavMode = 'none' | 'bottom' | 'rail';

function MainLayout({ children }: { children: React.ReactNode }) {
  const currentTripId = useTripStore(s => s.currentTripId);
  const userId = useTripStore(s => s.userId);
  const initialized = useTripStore(s => s.initialized);
  const collapsed = useUiStore(s => s.timelineCollapsed);
  const { pathname } = useLocation();
  const isWide = useIsWide();

  const showNav = !!userId && pathname !== '/login';
  const navMode: NavMode = !showNav ? 'none' : isWide ? 'rail' : 'bottom';

  useEffect(() => {
    document.documentElement.dataset.nav = navMode;
  }, [navMode]);

  if (navMode === 'none') {
    return <div className="flex min-h-dvh w-full flex-1 flex-col">{children}</div>;
  }

  if (navMode === 'bottom') {
    return (
      <div className="flex min-h-dvh w-full flex-1 flex-col pb-(--bottom-nav-offset)">
        {children}
        <TabBar />
      </div>
    );
  }

  const split = !!currentTripId && initialized && pathname !== '/trips' && pathname !== '/debug';
  return (
    <div className="flex min-h-dvh w-full flex-1 flex-col pl-(--side-rail-w)">
      <SideRail showTimelineToggle={split} />
      {split ? (
        <SplitPane
          leftLabel="Timeline"
          collapsed={collapsed}
          left={<ErrorBoundary name="Timeline" resetKey={currentTripId}><TimelineScreen /></ErrorBoundary>}
          right={pathname === '/timeline' && !collapsed
            ? <ErrorBoundary name="Map" resetKey={pathname}><MapViewScreen /></ErrorBoundary>
            : children}
        />
      ) : (
        <div className="flex min-h-dvh w-full flex-1 flex-col">{children}</div>
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
  const setUserId = useTripStore(s => s.setUserId);
  const setLoading = useTripStore(s => s.setLoading);
  const setSidebarOpen = useTripStore(s => s.setSidebarOpen);
  const syncTrips = useTripStore(s => s.syncTrips);
  
  const showBanner = useUiStore(s => s.showBanner);
  const dismissBanner = useUiStore(s => s.dismissBanner);
  const [listenAttempt, setListenAttempt] = useState(0);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    getRedirectResult(auth).then((result) => {
      if (result?.user) setUserId(result.user.uid);
    }).catch((err) => {
      console.error("Redirect login error:", err);
      showBanner({ id: 'auth', message: `Sign-in didn't complete: ${err.message}`, retry: () => window.location.assign('/login') });
    });

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null);
      setLoading(false);
    }, (err) => {
      console.error("Auth state error:", err);
      showBanner({ id: 'auth', message: `Authentication problem: ${err.message}`, retry: () => window.location.reload() });
      setLoading(false);
    });

    const timeout = setTimeout(() => setLoading(false), 6000); 
    
    return () => {
      unsubAuth();
      clearTimeout(timeout);
    };
  }, [setUserId, setLoading, showBanner]);

  // Commit held (undo-able) deletes before the page goes away.
  useEffect(() => {
    const flush = () => { void useTripStore.getState().flushPendingDeletes(); };
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, []);

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
      dismissBanner('firestore');
    }, (err) => {
      console.error("Firestore Listen Error:", err);
      const retry = () => setListenAttempt(n => n + 1);
      if (err.code === 'permission-denied') {
        setTimeout(() => {
          if (!auth.currentUser) {
            showBanner({ id: 'firestore', message: `Couldn't load your trips (${err.message}). Please try logging in again.`, retry: () => window.location.assign('/login') });
          }
        }, 2000);
      } else {
        showBanner({ id: 'firestore', message: `Couldn't sync your trips: ${err.message}`, retry });
      }
    });

    return unsubSnap;
  }, [syncTrips, loading, userId, listenAttempt, showBanner, dismissBanner]);


  return (
    <BrowserRouter>
      <div className="ambient-bg" aria-hidden="true">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <div className="app-content-root">
        {loading && (
          <div role="status" className="fixed inset-0 z-[10000] flex flex-col items-center justify-center gap-4 bg-app-bg text-white">
            <div className="animate-pulse text-[2.5rem] motion-reduce:animate-none" aria-hidden="true">✈️</div>
            <div className="text-caption tracking-[0.2em] opacity-80">SIGNING IN…</div>
          </div>
        )}

        {userId && (
          <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}

        <SyncStatus />
        <AppBanner />
        <GlobalModals />
        <CommandPalette />
        <GlobalShortcuts />
        <Toaster />

        <MainLayout>
          <Routes>
            <Route path="/login" element={<PublicRoute><ErrorBoundary name="Login"><LoginScreen /></ErrorBoundary></PublicRoute>} />
            <Route path="/trips" element={<ProtectedRoute name="Trips"><TripSelector /></ProtectedRoute>} />
            <Route path="/summary" element={<ProtectedRoute name="Summary">{currentTripId ? <SummaryScreen /> : <NoTripState />}</ProtectedRoute>} />
            <Route path="/timeline" element={<ProtectedRoute name="Timeline">{currentTripId ? <TimelineScreen /> : <NoTripState />}</ProtectedRoute>} />
            <Route path="/map" element={<ProtectedRoute name="Map">{currentTripId ? <MapViewScreen /> : <NoTripState />}</ProtectedRoute>} />
            <Route path="/todo" element={<ProtectedRoute name="Todo">{currentTripId ? <TodoScreen /> : <NoTripState />}</ProtectedRoute>} />
            <Route path="/costs" element={<ProtectedRoute name="Costs">{currentTripId ? <CostTrackerScreen /> : <NoTripState />}</ProtectedRoute>} />
            <Route path="/weather" element={<ProtectedRoute name="Weather">{currentTripId ? <WeatherScreen /> : <NoTripState />}</ProtectedRoute>} />
            <Route path="/notes" element={<ProtectedRoute name="Notes">{currentTripId ? <NotesScreen /> : <NoTripState />}</ProtectedRoute>} />
            <Route path="/packing" element={<ProtectedRoute name="Packing">{currentTripId ? <PackingScreen /> : <NoTripState />}</ProtectedRoute>} />
            {isDebugEnabled() && (
              <Route path="/debug" element={<ProtectedRoute name="Debug"><DebugScreen onBack={() => window.history.back()} /></ProtectedRoute>} />
            )}
            <Route path="*" element={<Navigate to={DEFAULT_ROUTE} replace />} />
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
