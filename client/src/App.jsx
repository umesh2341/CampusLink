import React, { useState, useEffect, useMemo, useRef, Suspense, lazy } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import InteractiveMap from './features/map/InteractiveMap';
import SidePanel from './features/events/SidePanel';
import EventDetailModal from './features/events/EventDetailModal';
import SearchBar from './features/search/SearchBar';
import {
  fetchBuildings,
  fetchBuildingEvents,
  fetchClubs,
  fetchNotices,
  updateUserLocation,
  stopUserLocationSharing,
  API_BASE,
} from './shared/lib/api';
import {
  convertGpsToCampusCoordinates,
  calculateDistanceMeters,
} from './shared/lib/locationToCampusCoordinates';
import useNavigation from './features/map/hooks/useNavigation';

import useAppStore from './shared/store/useAppStore';
import NotificationPrompt from './features/notifications/NotificationPrompt';
import NotificationPreferencesModal from './features/notifications/NotificationPreferencesModal';
import NavMenuDrawer from './shared/components/NavMenuDrawer';
import { AuthProvider, useAuth } from './shared/context/AuthContext';
import { supabase } from './shared/lib/supabaseClient';
import ClubsDirectoryModal from './features/clubs/ClubsDirectoryModal';
import ClubCardModal from './features/clubs/ClubCardModal';
import AllEventsModal from './features/events/AllEventsModal';
import FeedbackModal from './shared/components/FeedbackModal';
import LocationConsentModal from './features/map/LocationConsentModal';
import NoticeBanner from './features/notices/NoticeBanner';
import NoticeBoardModal from './features/notices/NoticeBoardModal';
import UpdatePrompt from './shared/components/UpdatePrompt';
import RedBullViewerModal from './features/map/RedBullViewerModal.jsx';

const AddEventForm = lazy(() => import('./features/events/AddEventForm'));
const AddNoticeForm = lazy(() => import('./features/notices/AddNoticeForm'));
const AdminRequestsModal = lazy(() => import('./features/admin/AdminRequestsModal'));
import {
  User,
  Calendar,
  Info,
  Menu,
  X,
  Bell,
  Map as MapIcon,
  PlusCircle,
  UserCheck,
  Users,
  Navigation,
  ClipboardList,
  LogOut,
  AlertCircle
} from 'lucide-react';

function AppContent() {
  const queryClient = useQueryClient();
  const { user, profile, isLoading, signInWithGoogle, signOut } = useAuth();

  // ── Zustand store — building selection, panel, seen/unseen, overlays ──
  const selectedBuilding  = useAppStore(s => s.selectedBuilding);
  const activeOverlay     = useAppStore(s => s.activeOverlay);
  const switchOverlay     = useAppStore(s => s.switchOverlay);
  const closeOverlay      = useAppStore(s => s.closeOverlay);
  const lastViewedMap     = useAppStore(s => s.lastViewedMap);
  const selectBuilding    = useAppStore(s => s.selectBuilding);
  const highlightBuilding = useAppStore(s => s.highlightBuilding);

  // ── Local UI state (not shared across layers) ──────────────
  const [selectedEvent,        setSelectedEvent]        = useState(null);
  const [isEventModalOpen,     setIsEventModalOpen]     = useState(false); // Can stack on top of directories
  const [currentView,         setCurrentView]         = useState('map');
  const [selectedClub,        setSelectedClub]        = useState(null);
  const [isClubDetailOpen,    setIsClubDetailOpen]    = useState(false); // Can stack on top of directories
  const [isAdminRequestsModalOpen, setIsAdminRequestsModalOpen] = useState(false);
  
  // Real auth logic replaces local states
  const isOrganizer = profile?.role === 'organizer' || profile?.role === 'admin';
  const isAuthority = profile?.role === 'authority' || profile?.role === 'admin';
  
  const [allActiveEvents,     setAllActiveEvents]     = useState([]);
  const [redBullVehicleState, setRedBullVehicleState] = useState(null);
  const [isRedBullModalOpen,  setIsRedBullModalOpen]  = useState(false);
  const [customRedBullRoute,  setCustomRedBullRoute]  = useState(null);
  const [isNoticeBannerDismissed, setIsNoticeBannerDismissed] = useState(
    () => sessionStorage.getItem('notices_dismissed') === 'true'
  );

  const [isLiveLocationActive, setIsLiveLocationActive]   = useState(false);
  const [userLocation,         setUserLocation]           = useState(null);
  const [locationError,        setLocationError]          = useState(null);
  const [isEventsLoading,      setIsEventsLoading]        = useState(false);
  // True between the user enabling tracking and the first valid GPS fix arriving
  const [isGpsAcquiring,       setIsGpsAcquiring]         = useState(false);
  // True when GPS is working but user is physically outside the ITER campus bounds
  const [isOffCampus,          setIsOffCampus]            = useState(false);

  const watchIdRef = useRef(null);
  const lastSentPosRef = useRef(null);
  const lastSentTimeRef = useRef(0);
  // Tracks when the previous valid GPS fix arrived so we can measure the real update interval.
  // That interval becomes the CSS transition duration — the Ola/Uber technique.
  const lastGpsReceivedRef = useRef(0);

  const LOCATION_CONFIG = {
    minimumDistanceMeters: 4,
    minimumUpdateIntervalMs: 5000,
    // GPS fixes worse than this (in meters) are ignored — no marker placed.
    // Indoor first-fixes can be 100–500 m off; this prevents the frozen-(10,10) bug.
    maximumAccuracyMeters: 120,
  };

  // ── Navigation Hook ─────────────────────────────────────────
  const {
    isNavigating,
    navigationStatus,
    activeRoute,
    destinationBuilding: navDestination,
    navigationError,
    transportMode,
    startNavigation,
    stopNavigation,
    updateDestination,
    setTransportMode,
  } = useNavigation();

  const handleStartNavigation = (building, mode = 'WALK') => {
    closeOverlay(); // Close side panel to view full campus map & route
    if (!isLiveLocationActive) {
      switchOverlay('LOCATION_CONSENT');
      return;
    }
    startNavigation(building, userLocation, mode);
  };

  // ── React Query — data fetching ─────────────────────────────

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: fetchBuildings,
    staleTime: 60_000,
  });

  const { data: clubs = [], isLoading: isClubsLoading } = useQuery({
    queryKey: ['clubs'],
    queryFn: fetchClubs,
    staleTime: 120_000,
  });

  const { data: notices = [] } = useQuery({
    queryKey: ['notices'],
    queryFn: fetchNotices,
    staleTime: 60_000,
  });

  // Handle URL deep-linking for ?event_id=... (from Web Push Notification clicks)
  useEffect(() => {
    if (buildings.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('event_id');
    if (eventId) {
      fetch(`${API_BASE}/api/events/${eventId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((eventData) => {
          if (eventData) {
            const building = buildings.find((b) => b.id === eventData.building_id);
            if (building) {
              selectBuilding(building);
            }
            setSelectedEvent(eventData);
            setIsEventModalOpen(true);
            
            // Clean up the URL so it doesn't refetch on subsequent renders
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        })
        .catch((err) => console.error('Deep link event fetch error:', err));
    }
  }, [buildings, selectBuilding]);

  const { data: buildingEvents = [] } = useQuery({
    queryKey: ['buildingEvents', selectedBuilding?.id],
    queryFn: () => fetchBuildingEvents(selectedBuilding.id),
    enabled: !!selectedBuilding?.id,
    staleTime: 60_000,
  });

  const fetchAllActiveEvents = async () => {
    const fetches = buildings
      .filter(b => b.active_event_count > 0)
      .map(b =>
        queryClient.fetchQuery({
          queryKey: ['buildingEvents', b.id],
          queryFn: () => fetchBuildingEvents(b.id),
          staleTime: 60_000,
        })
      );
    const arrays = await Promise.all(fetches);
    const flat = arrays.flat();
    return Array.from(new Map(flat.map(e => [e.id, e])).values());
  };

  // ── Derived data ──────────────────────────────────────────

  const activeEventsMap = useMemo(() => {
    const map = {};
    buildings.forEach(b => { map[b.id] = b.active_event_count; });
    return map;
  }, [buildings]);

  const totalActiveEventsCount = useMemo(
    () => buildings.reduce((sum, b) => sum + b.active_event_count, 0),
    [buildings]
  );

  /** Direct building click on map — highlight building AND open side panel */
  const handleSelectBuilding = (building) => selectBuilding(building);

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  // ── Role Request Logic ──
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isRequestingRole, setIsRequestingRole] = useState(false);

  useEffect(() => {
    if (user && activeOverlay === 'PROFILE') {
      checkPendingRequests();
    }
  }, [user, activeOverlay]);

  const checkPendingRequests = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('role_requests')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['pending', 'approved', 'rejected'])
        .order('created_at', { ascending: false });
      if (!error && data) {
        setPendingRequests(data);
      }
    } catch (err) {
      console.error('Error fetching role request status:', err);
    }
  };

  const handleRequestRole = async (role) => {
    if (!user) return;
    setIsRequestingRole(true);
    try {
      const { error } = await supabase
        .from('role_requests')
        .insert({
          user_id: user.id,
          requested_role: role,
          status: 'pending'
        });
      if (error) throw error;
      
      // Trigger push notification to admins
      fetch(`${API_BASE}/api/push/notify-admins-role-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterName: profile?.full_name || user.user_metadata?.full_name || 'A user',
          requesterEmail: user.email,
          requestedRole: role
        })
      }).catch(err => console.error('Failed to trigger admin notification:', err));

      await checkPendingRequests();
      alert(`Successfully requested ${role} access.`);
    } catch (err) {
      console.error('Error requesting role:', err);
      alert('Failed to request role.');
    } finally {
      setIsRequestingRole(false);
    }
  };

  /**
   * Search result: building or department tap.
   * HIGHLIGHT ONLY — do NOT call selectBuilding() or any panel-opening logic here.
   * Only a direct click on the building shape on the map should open the side panel.
   * Using highlightBuilding() sets selectedBuilding (map glow) without triggering the overlay.
   */
  const handleSelectBuildingFromSearch = (building) => highlightBuilding(building);

  /** Search result: event tap — highlight building on map and open event pass modal ONLY (without side panel) */
  const handleSelectEventFromSearch = (building, event) => {
    highlightBuilding(building);
    handleSelectEvent(event);
  };

  const handleEventSubmitSuccess = () => {
    setCurrentView('map');
    queryClient.invalidateQueries({ queryKey: ['buildings'] });
    queryClient.invalidateQueries({ queryKey: ['buildingEvents'] });
  };

  // ── Geolocation Tracking Handlers ───────────────────────────

  const stopTracking = async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    stopNavigation();
    setIsLiveLocationActive(false);
    setIsGpsAcquiring(false);
    setIsOffCampus(false);
    setUserLocation(null);
    lastSentPosRef.current = null;
    lastSentTimeRef.current = 0;
    try {
      await stopUserLocationSharing();
    } catch (e) {
      console.warn('Backend location sharing cleanup error:', e.message);
    }
  };

  const handleToggleLiveLocation = () => {
    if (isLiveLocationActive) {
      stopTracking();
    } else {
      setLocationError(null);
      switchOverlay('LOCATION_CONSENT');
    }
  };

  const startTrackingAfterConsent = () => {
    closeOverlay();

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      switchOverlay('LOCATION_CONSENT');
      return;
    }

    setIsLiveLocationActive(true);
    setIsGpsAcquiring(true); // Show "ACQUIRING..." UI while GPS warms up

    const geoOptions = {
      enableHighAccuracy: true,
      maximumAge: 0,
      // 30s timeout — mobile GPS can take 10-20s to get a first fix indoors.
      // 10s was too short and was silently killing watchPosition.
      timeout: 30000,
    };

    const handlePositionUpdate = async (position) => {
      const { latitude, longitude, accuracy, altitude, heading, speed } = position.coords;
      const now = Date.now();

      // Dev-only diagnostic log — never logs in production
      if (import.meta.env.DEV) {
        console.log('[TRACKER] GPS UPDATE', {
          latitude: latitude.toFixed(5),
          longitude: longitude.toFixed(5),
          accuracy: accuracy ? Math.round(accuracy) + 'm' : 'unknown',
        });
      }

      // ACCURACY GATE: ignore fixes that are too imprecise to be useful.
      // Indoor first-fixes can be 100–500m off and would snap the marker to a random corner.
      // We keep isGpsAcquiring=true until we get one clean fix.
      if (accuracy !== null && accuracy > LOCATION_CONFIG.maximumAccuracyMeters) {
        if (import.meta.env.DEV) {
          console.log('[TRACKER] Fix rejected — accuracy too low:', Math.round(accuracy) + 'm >', LOCATION_CONFIG.maximumAccuracyMeters + 'm');
        }
        return; // Wait for GPS to improve before rendering/sending
      }

      // Convert real GPS coordinates to SVG canvas position via calibrated affine transformation
      const campusPos = convertGpsToCampusCoordinates({ latitude, longitude, accuracy });

      // OUT_OF_BOUNDS: GPS is working fine, but user is physically far from campus.
      // This is different from ACQUIRING — GPS IS acquired, user is simply NOT on campus.
      // We: clear the acquiring spinner, mark as off-campus, clear any marker,
      //     and still sync to backend so their last location is recorded.
      if (campusPos.status === 'OUT_OF_BOUNDS') {
        if (import.meta.env.DEV) {
          console.log('[TRACKER] User is outside campus bounds. rawX:', campusPos.rawX, 'rawY:', campusPos.rawY);
        }
        setIsGpsAcquiring(false);
        setIsOffCampus(true);
        setUserLocation(null); // No marker on campus map

        // Still sync to backend (valid GPS data, just outside campus)
        if (!lastSentPosRef.current ||
            calculateDistanceMeters(lastSentPosRef.current.latitude, lastSentPosRef.current.longitude, latitude, longitude) >= LOCATION_CONFIG.minimumDistanceMeters ||
            (now - lastSentTimeRef.current) >= LOCATION_CONFIG.minimumUpdateIntervalMs) {
          lastSentPosRef.current = { latitude, longitude };
          lastSentTimeRef.current = now;
          try {
            await updateUserLocation({ latitude, longitude, accuracy, altitude, heading, speed });
          } catch (err) {
            console.warn('Backend location sync error (off-campus):', err.message);
          }
        }
        return;
      }

      // We have a valid on-campus fix — clear both acquiring and off-campus states
      setIsGpsAcquiring(false);
      setIsOffCampus(false);

        // ── Ola/Uber-style animation ────────────────────────────────────────
        // Measure the real time since the last valid GPS fix.
        // This becomes the CSS transition duration in LiveUserMarker so the marker
        // slides at exactly the right speed to arrive just as the next fix comes in.
        const rawInterval = lastGpsReceivedRef.current > 0
          ? now - lastGpsReceivedRef.current
          : 1500; // Sensible first-fix default
        // Clamp: never faster than 400ms (too jittery) or slower than 5s (too sluggish)
        const transitionMs = Math.min(Math.max(rawInterval, 400), 5000);
        lastGpsReceivedRef.current = now;
        // ────────────────────────────────────────────────────────────────────

        setUserLocation({
        x: campusPos.x,
        y: campusPos.y,
        rawX: campusPos.rawX,
        rawY: campusPos.rawY,
        latitude,
        longitude,
        accuracy,
        accuracyRadius: campusPos.accuracyRadiusPixels,
        heading,
        speed,
        isInsideCampus: campusPos.isInsideCampus,
        status: campusPos.status,
        userName: 'YOU',
        transitionMs,
      });

      // Throttle backend updates by distance and minimum time threshold
      let shouldSend = false;
      if (!lastSentPosRef.current) {
        shouldSend = true;
      } else {
        const dist = calculateDistanceMeters(
          lastSentPosRef.current.latitude,
          lastSentPosRef.current.longitude,
          latitude,
          longitude
        );
        const timeElapsed = now - lastSentTimeRef.current;

        if (dist >= LOCATION_CONFIG.minimumDistanceMeters || timeElapsed >= LOCATION_CONFIG.minimumUpdateIntervalMs) {
          shouldSend = true;
        }
      }

      if (shouldSend) {
        lastSentPosRef.current = { latitude, longitude };
        lastSentTimeRef.current = now;
        try {
          await updateUserLocation({
            latitude,
            longitude,
            accuracy,
            altitude,
            heading,
            speed,
          });
        } catch (err) {
          console.warn('Backend location sync error:', err.message);
        }
      }
    };

    // Instant initial GPS fix — fires as soon as the browser returns any position.
    // We re-use the same handlePositionUpdate which applies the accuracy gate.
    navigator.geolocation.getCurrentPosition(
      (pos) => handlePositionUpdate(pos),
      (err) => {
        // First-fix failed — watchPosition will keep trying
        if (import.meta.env.DEV) console.warn('[TRACKER] Initial fix failed:', err.message);
      },
      geoOptions
    );

    // Continuous watchPosition for real-time walking updates
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => handlePositionUpdate(pos),
      (err) => {
        if (import.meta.env.DEV) console.warn('[TRACKER] watchPosition error:', err.message);
        let msg = 'Unable to retrieve your location.';
        if (err.code === 1) {
          msg = 'Location permission was denied. Please allow location access in your browser settings.';
          setIsGpsAcquiring(false);
        } else if (err.code === 2) {
          msg = 'GPS signal is currently unavailable on campus.';
        } else if (err.code === 3) {
          // Timeout: watchPosition keeps running, don't stop tracking
          msg = 'GPS is taking longer than usual. Move to an open area for a better signal.';
        }
        setLocationError(msg);
      },
      geoOptions
    );
  };

  const handleSwitchView = (view) => {
    if (activeOverlay) {
      closeOverlay();
      setTimeout(() => setCurrentView(view), 200);
    } else {
      setCurrentView(view);
    }
  };

  // Cleanup geolocation watcher on component unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // ─────────────────────────────────────────────────────────────
  return (
    <MotionConfig reducedMotion="user">
    <div className="h-dvh max-h-dvh w-full bg-grain text-ink font-mono flex flex-col overflow-hidden fixed inset-0 select-none">

      {/* ── Kiosk Header Bar ── */}
      <header className="bg-card border-b-2 border-ink px-4 py-2.5 flex items-center justify-between z-30 select-none shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xs bg-ink text-paper flex items-center justify-center font-display text-xl font-bold leading-none">
            CL
          </div>
          <div>
            <h1 className="text-2xl font-display uppercase tracking-tight text-ink leading-none">
              [ CAMPUSLINK ]
            </h1>
            <p className="font-mono text-[9px] font-bold text-muted tracking-widest uppercase leading-none mt-0.5">
              — ITER, SOA UNIVERSITY
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Live Location Tracker Button */}
          <button
            onClick={handleToggleLiveLocation}
            title={isLiveLocationActive ? "Stop live tracking" : "Enable live tracking on campus map"}
            className={`flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-1 rounded-xs border-2 uppercase transition-all active:translate-y-[1px] ${
              isGpsAcquiring
                ? 'bg-amber-400 text-ink border-ink shadow-hard'
                : isOffCampus
                ? 'bg-paper text-ink border-red-500 shadow-hard'
                : isLiveLocationActive
                ? 'bg-confirm text-white border-ink shadow-hard'
                : 'bg-paper text-ink border-ink hover:bg-card'
            }`}
          >
            <Navigation className={`w-3.5 h-3.5 ${
              isGpsAcquiring ? 'animate-spin text-ink'
              : isOffCampus ? 'text-red-500'
              : isLiveLocationActive ? 'text-white'
              : 'text-signal'
            }`} />
            <span>{isGpsAcquiring ? 'ACQUIRING...' : isOffCampus ? 'OFF CAMPUS' : isLiveLocationActive ? 'LIVE: ON' : 'TRACKER'}</span>
          </button>

          {isOrganizer && (
            <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[10px] font-bold bg-signal text-ink border-2 border-ink px-2 py-0.5 rounded-xs uppercase">
              <UserCheck className="w-3.5 h-3.5" />
              ORGANIZER
            </span>
          )}
          <button
            onClick={() => activeOverlay === 'NAV_MENU' ? closeOverlay() : switchOverlay('NAV_MENU')}
            aria-label={activeOverlay === 'NAV_MENU' ? "Close navigation menu" : "Open navigation menu"}
            title={activeOverlay === 'NAV_MENU' ? "Close menu" : "Open menu"}
            className="p-1.5 border border-transparent hover:border-ink hover:bg-paper text-ink rounded-xs transition-all focus:outline-none active:translate-y-[1px] relative z-50"
          >
            <div className="w-5 h-5 flex items-center justify-center relative">
              {activeOverlay === 'NAV_MENU' ? (
                <X className="w-5 h-5 text-ink transition-transform duration-300 rotate-90" />
              ) : (
                <Menu className="w-5 h-5 text-ink transition-transform duration-300 rotate-0" />
              )}
            </div>
          </button>
        </div>
      </header>

      {/* ── Main Area ── */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-grain">
        {!isNoticeBannerDismissed && notices.length > 0 && (
          <NoticeBanner
            notices={notices}
            onOpenNotices={() => switchOverlay('NOTICE_BOARD')}
            onClose={() => {
              sessionStorage.setItem('notices_dismissed', 'true');
              setIsNoticeBannerDismissed(true);
            }}
          />
        )}

        {/* Floating Search Bar */}
        {currentView === 'map' && (
          <div className="absolute top-3 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md z-20">
            <SearchBar
              buildings={buildings}
              onSelectDepartmentResult={handleSelectBuildingFromSearch}
              onSelectEventResult={handleSelectEventFromSearch}
            />
          </div>
        )}

        {currentView === 'map' ? (
          <InteractiveMap
            buildings={buildings}
            selectedBuilding={selectedBuilding}
            onSelectBuilding={handleSelectBuilding}
            activeEventsMap={activeEventsMap}
            lastViewedMap={lastViewedMap}
            userLocation={userLocation}
            isGpsAcquiring={isGpsAcquiring}
            isOffCampus={isOffCampus}
            route={customRedBullRoute || activeRoute}
            navigationStatus={customRedBullRoute ? 'active' : navigationStatus}
            navigationError={navigationError}
            onStopNavigation={() => {
              setCustomRedBullRoute(null);
              stopNavigation();
            }}
            destinationBuilding={customRedBullRoute ? { name: 'Red Bull Car', svg_element_id: null } : navDestination}
            transportMode={transportMode}
            onSetTransportMode={setTransportMode}
            onSelectRedBull={() => setIsRedBullModalOpen(true)}
            redBullVehicleState={redBullVehicleState}
            onRedBullStateUpdate={setRedBullVehicleState}
          />
        ) : currentView === 'addEvent' ? (
          <Suspense fallback={
            <div className="flex-1 flex items-center justify-center p-6 text-center font-mono text-xs text-muted uppercase">— LOADING FORM…</div>
          }>
            <AddEventForm
              buildings={buildings}
              isOrganizer={isOrganizer}
              userId={user?.id}
              onBack={() => setCurrentView('map')}
              onSuccess={handleEventSubmitSuccess}
            />
          </Suspense>
        ) : currentView === 'addNotice' ? (
          <Suspense fallback={
            <div className="flex-1 flex items-center justify-center p-6 text-center font-mono text-xs text-muted uppercase">— LOADING FORM…</div>
          }>
            <AddNoticeForm
              isAuthority={isAuthority}
              userId={user?.id}
              onBack={() => setCurrentView('map')}
              onSuccess={() => {
                queryClient.invalidateQueries(['notices']);
              }}
            />
          </Suspense>
        ) : null}

        {/* Slide-in Navigation Menu Drawer */}
        <NavMenuDrawer
          isOpen={activeOverlay === 'NAV_MENU'}
          onClose={closeOverlay}
          onOpenNotifications={() => switchOverlay('NOTIFICATIONS')}
          onOpenFeedback={() => switchOverlay('FEEDBACK')}
          onOpenAbout={() => switchOverlay('ABOUT')}
          onOpenAddNotice={() => setCurrentView('addNotice')}
          onOpenAdminRequests={() => setIsAdminRequestsModalOpen(true)}
          isOrganizer={isOrganizer}
          isAuthority={isAuthority}
          isAdmin={profile?.role === 'admin'}
        />

        {/* ── Constrained Modals (inside main) ── */}
        <NoticeBoardModal
          isOpen={activeOverlay === 'NOTICE_BOARD'}
          onClose={closeOverlay}
          notices={notices}
        />

        <ClubsDirectoryModal
          isOpen={activeOverlay === 'CLUBS'}
          onClose={closeOverlay}
          clubs={clubs}
          activeEvents={allActiveEvents}
          isLoading={isClubsLoading}
          onSelectClub={(club) => {
            setSelectedClub(club);
            setIsClubDetailOpen(true);
          }}
        />

        <AllEventsModal
          isOpen={activeOverlay === 'ALL_EVENTS'}
          onClose={closeOverlay}
          allActiveEvents={allActiveEvents}
          isEventsLoading={isEventsLoading}
          onSelectEvent={handleSelectEvent}
        />

        {/* ── Profile Modal ── */}
        <AnimatePresence>
        {activeOverlay === 'PROFILE' && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 font-mono">
            <motion.div key="profile-backdrop" className="absolute inset-0 bg-ink/40 backdrop-blur-xs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={closeOverlay} />
            <motion.div key="profile-card" className="bg-card border-2 border-ink shadow-hard-xl rounded-xs p-5 w-full max-w-sm relative z-50 space-y-4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ type: 'tween', duration: 0.2 }}>
              <div className="flex justify-between items-start border-b-2 border-ink pb-2">
                <h3 className="text-2xl font-display uppercase tracking-tight text-ink">[ PROFILE ]</h3>
                <button onClick={closeOverlay}
                  className="text-xs font-bold border-2 border-ink px-2 py-0.5 rounded-xs bg-paper hover:bg-ink hover:text-paper transition-all active:translate-y-[1px]">
                  CLOSE
                </button>
              </div>

              {isLoading ? (
                <div className="flex justify-center p-4">
                  <span className="font-mono text-xs font-bold tracking-widest uppercase text-muted animate-pulse">LOADING...</span>
                </div>
              ) : user ? (
                <>
                  <div className="flex items-center gap-3">
                    {user.user_metadata?.avatar_url ? (
                      <img src={user.user_metadata.avatar_url} alt="Profile" className="w-10 h-10 rounded-xs border-2 border-ink object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-xs bg-ink text-paper border-2 border-ink flex items-center justify-center font-display text-lg font-bold uppercase">
                        {profile?.full_name ? profile.full_name.substring(0, 2) : user.email.substring(0, 2)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-ink uppercase truncate">{profile?.full_name || user.user_metadata?.full_name || 'USER'}</h4>
                      <span className="text-xs text-muted block truncate">{user.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t-2 border-ink/10 pt-3">
                    <div>
                      <span className="text-xs font-bold text-ink block uppercase">ACCOUNT ROLE</span>
                      <span className="text-[10px] text-muted uppercase">— {profile?.role || 'USER'}</span>
                    </div>
                    
                    {/* Role Request UI */}
                    <div className="text-right flex flex-col gap-2 items-end">
                      {/* Organizer Access Logic */}
                      {(() => {
                        const orgReq = pendingRequests.find(r => r.requested_role === 'organizer');
                        if (profile?.role === 'organizer' || profile?.role === 'admin') return null;
                        if (orgReq?.status === 'pending') {
                          return (
                            <span className="text-[10px] font-bold bg-signal/20 text-ink px-2 py-0.5 rounded-xs border border-ink uppercase">
                              ORGANIZER REQUEST PENDING
                            </span>
                          );
                        }
                        if (orgReq?.status === 'rejected') {
                          return (
                            <span className="text-[10px] font-bold text-red-500 uppercase">
                              ORGANIZER REQUEST REJECTED
                            </span>
                          );
                        }
                        return (
                          <button 
                            disabled={isRequestingRole}
                            onClick={() => handleRequestRole('organizer')}
                            className="text-[10px] font-bold bg-ink text-paper px-2 py-1 rounded-xs uppercase hover:bg-signal hover:text-ink transition-colors disabled:opacity-50"
                          >
                            {isRequestingRole ? '...' : 'REQ. ORGANIZER'}
                          </button>
                        );
                      })()}

                      {/* Authority Access Logic */}
                      {(() => {
                        const authReq = pendingRequests.find(r => r.requested_role === 'authority');
                        if (profile?.role === 'authority' || profile?.role === 'admin') return null;
                        if (authReq?.status === 'pending') {
                          return (
                            <span className="text-[10px] font-bold bg-signal/20 text-ink px-2 py-0.5 rounded-xs border border-ink uppercase">
                              AUTHORITY REQUEST PENDING
                            </span>
                          );
                        }
                        if (authReq?.status === 'rejected') {
                          return (
                            <span className="text-[10px] font-bold text-red-500 uppercase">
                              AUTHORITY REQUEST REJECTED
                            </span>
                          );
                        }
                        return (
                          <button 
                            disabled={isRequestingRole}
                            onClick={() => handleRequestRole('authority')}
                            className="text-[10px] font-bold bg-ink text-paper px-2 py-1 rounded-xs uppercase hover:bg-signal hover:text-ink transition-colors disabled:opacity-50"
                          >
                            {isRequestingRole ? '...' : 'REQ. AUTHORITY'}
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                  <button 
                    onClick={signOut}
                    className="w-full flex items-center justify-center gap-2 text-xs font-bold border-2 border-red-500 text-red-500 px-3 py-2 rounded-xs bg-paper hover:bg-red-500 hover:text-white transition-all active:translate-y-[1px] mt-2"
                  >
                    <LogOut className="w-4 h-4" />
                    SIGN OUT
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="text-center space-y-1">
                    <p className="text-xs font-bold text-ink uppercase">NOT LOGGED IN</p>
                    <p className="text-[10px] text-muted uppercase">Sign in to manage your campus experience</p>
                  </div>
                  <button 
                    onClick={signInWithGoogle}
                    className="w-full flex items-center justify-center gap-2 text-xs font-bold border-2 border-ink text-ink px-3 py-2 rounded-xs bg-paper hover:bg-ink hover:text-paper transition-all active:translate-y-[1px]"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    SIGN IN WITH GOOGLE
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
        </AnimatePresence>

      </main>

      {/* ── Sheets & Modals (Outside main, can cover header/nav if fixed) ── */}
      <SidePanel
        building={selectedBuilding}
        events={buildingEvents}
        isOpen={activeOverlay === 'SIDE_PANEL'}
        onClose={closeOverlay}
        onSelectEvent={handleSelectEvent}
        onStartNavigation={handleStartNavigation}
      />

      {/* ── Club Detail Card Modal ── */}
      <ClubCardModal
        club={selectedClub}
        isOpen={isClubDetailOpen}
        onClose={() => {
          setIsClubDetailOpen(false);
          setSelectedClub(null);
        }}
        activeEvents={allActiveEvents}
        onSelectEvent={handleSelectEvent}
      />

      {/* ── Event Detail Modal (Rendered last so it sits on top of other z-50 modals) ── */}
      <EventDetailModal
        event={selectedEvent}
        isOpen={isEventModalOpen}
        onClose={() => { setIsEventModalOpen(false); setSelectedEvent(null); }}
      />

      {/* ── Student Feedback Modal ── */}
      <FeedbackModal
        isOpen={activeOverlay === 'FEEDBACK'}
        onClose={closeOverlay}
      />

      {/* ── Live Location Consent & Privacy Modal ── */}
      <LocationConsentModal
        isOpen={activeOverlay === 'LOCATION_CONSENT'}
        onClose={closeOverlay}
        onConfirm={startTrackingAfterConsent}
        error={locationError}
      />

      {/* ── Red Bull Live Radar Modal ── */}
      <RedBullViewerModal
        isOpen={isRedBullModalOpen}
        onClose={() => setIsRedBullModalOpen(false)}
        vehicleState={redBullVehicleState}
        userLocation={userLocation}
        onStartNavigation={(route) => {
          setIsRedBullModalOpen(false);
          setCustomRedBullRoute(route);
        }}
      />

      {/* ── About Modal ── */}
      <AnimatePresence>
      {activeOverlay === 'ABOUT' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-mono">
          <motion.div key="about-backdrop" className="fixed inset-0 bg-ink/40 backdrop-blur-xs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={closeOverlay} />
          <motion.div key="about-card" className="bg-card border-2 border-ink shadow-hard-xl rounded-xs p-5 w-full max-w-md relative z-50 space-y-3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ type: 'tween', duration: 0.2 }}>
            <div className="flex justify-between items-start border-b-2 border-ink pb-2">
              <h3 className="text-2xl font-display uppercase tracking-tight text-ink">[ ABOUT ]</h3>
              <button onClick={closeOverlay}
                className="text-xs font-bold border-2 border-ink px-2 py-0.5 rounded-xs bg-paper hover:bg-ink hover:text-paper transition-all active:translate-y-[1px]">
                CLOSE
              </button>
            </div>
            <div className="text-xs text-ink leading-relaxed space-y-2">
              <p><strong>CAMPUSLINK</strong> is a wayfinding &amp; event kiosk for students at <strong>ITER, SOA University</strong>.</p>
              <p>Browse workshops, competitions, and society drives. Search departments to resolve exact floor &amp; room numbers.</p>
              <p className="text-muted text-[10px] border-t border-ink/20 pt-2">— Terminal Edition v2.0</p>
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>



      {/* ── PWA Update Prompt ── */}
      <UpdatePrompt />

      {/* ── Terminal Bottom Nav Bar ── */}
      <nav className="bg-card border-t-2 border-ink px-3 py-3 flex items-center justify-around z-30 select-none shrink-0">
        {currentView === 'map' && isOrganizer ? (
          <button onClick={() => handleSwitchView('addEvent')}
            className="flex flex-col items-center gap-1 text-ink hover:text-signal active:translate-y-[2px] transition-all focus:outline-none py-0.5">
            <PlusCircle className="w-5.5 h-5.5 sm:w-6 sm:h-6" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider">ADD</span>
          </button>
        ) : currentView === 'addEvent' ? (
          <button onClick={() => handleSwitchView('map')}
            className="flex flex-col items-center gap-1 text-ink hover:text-signal active:translate-y-[2px] transition-all focus:outline-none py-0.5">
            <MapIcon className="w-5.5 h-5.5 sm:w-6 sm:h-6" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider">MAP</span>
          </button>
        ) : null}

        <button onClick={() => switchOverlay('NOTICE_BOARD')}
          className="flex flex-col items-center gap-1 text-ink hover:text-signal active:translate-y-[2px] transition-all focus:outline-none py-0.5">
          <ClipboardList className="w-5.5 h-5.5 sm:w-6 sm:h-6" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider">NOTICES</span>
        </button>

        <button onClick={async () => { 
            switchOverlay('ALL_EVENTS'); 
            setIsEventsLoading(true);
            const events = await fetchAllActiveEvents(); 
            setAllActiveEvents(events); 
            setIsEventsLoading(false);
          }}
          className="flex flex-col items-center gap-1 text-ink hover:text-signal active:translate-y-[2px] transition-all relative focus:outline-none py-0.5">
          <Calendar className="w-5.5 h-5.5 sm:w-6 sm:h-6" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider">EVENTS</span>
          <AnimatePresence>
          {totalActiveEventsCount > 0 && (
            <motion.span
              key="event-badge"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className="absolute -top-1 -right-2 bg-signal text-ink border border-ink text-[9px] font-bold font-mono px-1 rounded-xs leading-tight"
            >
              {totalActiveEventsCount}
            </motion.span>
          )}
          </AnimatePresence>
        </button>

        <button onClick={async () => {
          if (allActiveEvents.length === 0) {
            const evts = await fetchAllActiveEvents();
            setAllActiveEvents(evts);
          }
          switchOverlay('CLUBS');
        }}
          className="flex flex-col items-center gap-1 text-ink hover:text-signal active:translate-y-[2px] transition-all focus:outline-none py-0.5">
          <Users className="w-5.5 h-5.5 sm:w-6 sm:h-6" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider">CLUBS</span>
        </button>

        <button onClick={() => switchOverlay('PROFILE')}
          className="flex flex-col items-center gap-1 text-ink hover:text-signal active:translate-y-[2px] transition-all focus:outline-none py-0.5">
          <User className="w-5.5 h-5.5 sm:w-6 sm:h-6" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider">PROFILE</span>
        </button>
      </nav>

      {/* Custom In-App Web Push Notification Prompt */}
      <NotificationPrompt />

      {/* ── Admin Requests Modal ── */}
      <Suspense fallback={null}>
        <AdminRequestsModal 
          isOpen={isAdminRequestsModalOpen} 
          onClose={() => setIsAdminRequestsModalOpen(false)} 
        />
      </Suspense>

      {/* Notifications Preferences Modal */}
      <NotificationPreferencesModal
        isOpen={activeOverlay === 'NOTIFICATIONS'}
        onClose={closeOverlay}
      />

    </div>
    </MotionConfig>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
