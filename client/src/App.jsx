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

import useAppStore from './shared/store/useAppStore';
import NotificationPrompt from './features/notifications/NotificationPrompt';
import NotificationPreferencesModal from './features/notifications/NotificationPreferencesModal';
import NavMenuDrawer from './shared/components/NavMenuDrawer';
import ClubsDirectoryModal from './features/clubs/ClubsDirectoryModal';
import ClubCardModal from './features/clubs/ClubCardModal';
import FeedbackModal from './shared/components/FeedbackModal';
import LocationConsentModal from './features/map/LocationConsentModal';
import NoticeBanner from './features/notices/NoticeBanner';
import NoticeBoardModal from './features/notices/NoticeBoardModal';

const AddEventForm = lazy(() => import('./features/events/AddEventForm'));
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
  ClipboardList
} from 'lucide-react';

function App() {
  const queryClient = useQueryClient();

  // ── Zustand store — building selection, panel, seen/unseen ──
  const selectedBuilding  = useAppStore(s => s.selectedBuilding);
  const isSidePanelOpen   = useAppStore(s => s.isSidePanelOpen);
  const lastViewedMap     = useAppStore(s => s.lastViewedMap);
  const selectBuilding    = useAppStore(s => s.selectBuilding);
  const highlightBuilding = useAppStore(s => s.highlightBuilding);
  const closeSidePanel    = useAppStore(s => s.closeSidePanel);

  // ── Local UI state (not shared across layers) ──────────────
  const [selectedEvent,        setSelectedEvent]        = useState(null);
  const [isEventModalOpen,     setIsEventModalOpen]     = useState(false);
  const [currentView,         setCurrentView]         = useState('map');
  const [isNavMenuOpen,       setIsNavMenuOpen]       = useState(false);
  const [isProfileOpen,       setIsProfileOpen]       = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAboutOpen,         setIsAboutOpen]         = useState(false);
  const [isNoticeBoardOpen,   setIsNoticeBoardOpen]   = useState(false);
  const [isAllEventsOpen,     setIsAllEventsOpen]     = useState(false);
  const [isClubsOpen,         setIsClubsOpen]         = useState(false);
  const [selectedClub,        setSelectedClub]        = useState(null);
  const [isClubDetailOpen,    setIsClubDetailOpen]    = useState(false);
  const [isFeedbackOpen,      setIsFeedbackOpen]      = useState(false);
  const [isOrganizer,         setIsOrganizer]         = useState(true);
  const [allActiveEvents,     setAllActiveEvents]     = useState([]);
  const [isNoticeBannerDismissed, setIsNoticeBannerDismissed] = useState(
    () => sessionStorage.getItem('notices_dismissed') === 'true'
  );

  const [isLiveLocationActive, setIsLiveLocationActive]   = useState(false);
  const [userLocation,         setUserLocation]           = useState(null);
  const [isLocationConsentOpen,setIsLocationConsentOpen]  = useState(false);
  const [locationError,        setLocationError]          = useState(null);
  const [isEventsLoading,      setIsEventsLoading]        = useState(false);

  const watchIdRef = useRef(null);
  const lastSentPosRef = useRef(null);
  const lastSentTimeRef = useRef(0);

  const LOCATION_CONFIG = {
    minimumDistanceMeters: 4,
    minimumUpdateIntervalMs: 5000,
    maximumAccuracyMeters: 65,
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

  /** Search result: department or building tap — highlight on map ONLY, do NOT open side panel */
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
    setIsLiveLocationActive(false);
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
      setIsLocationConsentOpen(true);
    }
  };

  const startTrackingAfterConsent = () => {
    setIsLocationConsentOpen(false);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setIsLocationConsentOpen(true);
      return;
    }

    setIsLiveLocationActive(true);

    const geoOptions = {
      enableHighAccuracy: true,
      maximumAge: 3000,
      timeout: 15000,
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy, altitude, heading, speed } = position.coords;
        const now = Date.now();

        // Convert real GPS coordinates to SVG canvas position via Affine transformation
        const campusPos = convertGpsToCampusCoordinates({ latitude, longitude, accuracy });

        // Update local live marker position
        setUserLocation({
          x: campusPos.x,
          y: campusPos.y,
          latitude,
          longitude,
          accuracy,
          accuracyRadius: campusPos.accuracyRadiusPixels,
          heading,
          speed,
          isInsideCampus: campusPos.isInsideCampus,
          userName: 'JOHN DOE',
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
      },
      (err) => {
        console.warn('Geolocation watch error:', err.message);
        let msg = 'Unable to retrieve your location.';
        if (err.code === 1) msg = 'Location permission was denied. Please allow location access in your browser settings.';
        else if (err.code === 2) msg = 'GPS signal is currently unavailable on campus.';
        else if (err.code === 3) msg = 'Location request timed out. Retrying...';
        setLocationError(msg);
        setIsLiveLocationActive(false);
      },
      geoOptions
    );
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
              isLiveLocationActive
                ? 'bg-confirm text-white border-ink shadow-hard'
                : 'bg-paper text-ink border-ink hover:bg-card'
            }`}
          >
            <Navigation className={`w-3.5 h-3.5 ${isLiveLocationActive ? 'text-white' : 'text-signal'}`} />
            <span>{isLiveLocationActive ? 'LIVE: ON' : 'TRACKER'}</span>
          </button>

          {isOrganizer && (
            <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[10px] font-bold bg-signal text-ink border-2 border-ink px-2 py-0.5 rounded-xs uppercase">
              <UserCheck className="w-3.5 h-3.5" />
              ORGANIZER
            </span>
          )}
          <button
            onClick={() => setIsNavMenuOpen(prev => !prev)}
            aria-label={isNavMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            title={isNavMenuOpen ? "Close menu" : "Open menu"}
            className="p-1.5 border border-transparent hover:border-ink hover:bg-paper text-ink rounded-xs transition-all focus:outline-none active:translate-y-[1px] relative z-50"
          >
            <div className="w-5 h-5 flex items-center justify-center relative">
              {isNavMenuOpen ? (
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
            onOpenNotices={() => setIsNoticeBoardOpen(true)}
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
          />
        ) : (
          <Suspense fallback={
            <div className="flex-1 flex items-center justify-center p-6 text-center font-mono text-xs text-muted uppercase">— LOADING FORM…</div>
          }>
            <AddEventForm
              buildings={buildings}
              isOrganizer={isOrganizer}
              onBack={() => setCurrentView('map')}
              onSuccess={handleEventSubmitSuccess}
            />
          </Suspense>
        )}

        {/* Slide-in Navigation Menu Drawer */}
        <NavMenuDrawer
          isOpen={isNavMenuOpen}
          onClose={() => setIsNavMenuOpen(false)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenFeedback={() => setIsFeedbackOpen(true)}
          onOpenAbout={() => setIsAboutOpen(true)}
          isOrganizer={isOrganizer}
        />
      </main>

      {/* ── Sheets & Modals ── */}
      <NoticeBoardModal
        isOpen={isNoticeBoardOpen}
        onClose={() => setIsNoticeBoardOpen(false)}
        notices={notices}
      />

      <SidePanel
        building={selectedBuilding}
        events={buildingEvents}
        isOpen={isSidePanelOpen}
        onClose={closeSidePanel}
        onSelectEvent={handleSelectEvent}
      />

      {/* ── Clubs Directory Modal ── */}
      <ClubsDirectoryModal
        isOpen={isClubsOpen}
        onClose={() => setIsClubsOpen(false)}
        clubs={clubs}
        activeEvents={allActiveEvents}
        isLoading={isClubsLoading}
        onSelectClub={(club) => {
          setSelectedClub(club);
          setIsClubDetailOpen(true);
        }}
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
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />

      {/* ── Live Location Consent & Privacy Modal ── */}
      <LocationConsentModal
        isOpen={isLocationConsentOpen}
        onClose={() => setIsLocationConsentOpen(false)}
        onConfirm={startTrackingAfterConsent}
        error={locationError}
      />

      {/* ── Profile Modal ── */}
      <AnimatePresence>
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-mono">
          <motion.div key="profile-backdrop" className="fixed inset-0 bg-ink/40 backdrop-blur-xs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={() => setIsProfileOpen(false)} />
          <motion.div key="profile-card" className="bg-card border-2 border-ink shadow-hard-xl rounded-xs p-5 w-full max-w-sm relative z-50 space-y-4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ type: 'tween', duration: 0.2 }}>
            <div className="flex justify-between items-start border-b-2 border-ink pb-2">
              <h3 className="text-2xl font-display uppercase tracking-tight text-ink">[ PROFILE ]</h3>
              <button onClick={() => setIsProfileOpen(false)}
                className="text-xs font-bold border-2 border-ink px-2 py-0.5 rounded-xs bg-paper hover:bg-ink hover:text-paper transition-all active:translate-y-[1px]">
                CLOSE
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xs bg-ink text-paper border-2 border-ink flex items-center justify-center font-display text-lg font-bold uppercase">
                JD
              </div>
              <div>
                <h4 className="text-sm font-bold text-ink uppercase">JOHN DOE</h4>
                <span className="text-xs text-muted">JUNIOR, B.TECH CSE</span>
              </div>
            </div>
            <div className="flex items-center justify-between border-t-2 border-ink/10 pt-3">
              <div>
                <span className="text-xs font-bold text-ink block uppercase">ORGANIZER ACCESS</span>
                <span className="text-[10px] text-muted">— simulate authorization</span>
              </div>
              <input type="checkbox" checked={isOrganizer} onChange={(e) => setIsOrganizer(e.target.checked)}
                className="w-4 h-4 accent-signal cursor-pointer" />
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* ── About Modal ── */}
      <AnimatePresence>
      {isAboutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-mono">
          <motion.div key="about-backdrop" className="fixed inset-0 bg-ink/40 backdrop-blur-xs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={() => setIsAboutOpen(false)} />
          <motion.div key="about-card" className="bg-card border-2 border-ink shadow-hard-xl rounded-xs p-5 w-full max-w-md relative z-50 space-y-3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ type: 'tween', duration: 0.2 }}>
            <div className="flex justify-between items-start border-b-2 border-ink pb-2">
              <h3 className="text-2xl font-display uppercase tracking-tight text-ink">[ ABOUT ]</h3>
              <button onClick={() => setIsAboutOpen(false)}
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

      {/* ── All Events Modal ── */}
      <AnimatePresence>
      {isAllEventsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-mono">
          <motion.div key="events-backdrop" className="fixed inset-0 bg-ink/40 backdrop-blur-xs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={() => setIsAllEventsOpen(false)} />
          <motion.div key="events-card" className="bg-card border-2 border-ink shadow-hard-xl rounded-xs p-5 w-full max-w-md relative z-50 flex flex-col max-h-[80vh]" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ type: 'tween', duration: 0.2 }}>
            <div className="flex justify-between items-start border-b-2 border-ink pb-2 mb-3 shrink-0">
              <h3 className="text-2xl font-display uppercase tracking-tight text-ink">[ ALL EVENTS ]</h3>
              <button onClick={() => setIsAllEventsOpen(false)}
                className="text-xs font-bold border-2 border-ink px-2 py-0.5 rounded-xs bg-paper hover:bg-ink hover:text-paper transition-all active:translate-y-[1px]">
                CLOSE
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2.5">
              {isEventsLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-signal">
                  <span className="font-mono text-sm font-bold tracking-widest uppercase animate-pulse">
                    [ LOADING EVENTS... ]
                  </span>
                </div>
              ) : allActiveEvents.length === 0 ? (
                <p className="text-xs text-muted text-center py-8">— No active events on campus.</p>
              ) : (
                allActiveEvents.map(event => (
                  <div
                    key={event.id}
                    onClick={() => { setIsAllEventsOpen(false); handleSelectEvent(event); }}
                    className="p-3 border-2 border-ink rounded-xs bg-card shadow-hard cursor-pointer
                               hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none
                               active:translate-y-[2px] transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-display text-lg uppercase text-ink">{event.title}</h4>
                      <span className="text-[9px] font-bold bg-signal text-ink border border-ink px-1 py-0.5 rounded-xs shrink-0">PASS</span>
                    </div>
                    <span className="text-[10px] text-muted block mt-0.5">
                      CLUB: <strong className="text-ink">{event.organizing_club}</strong>
                    </span>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* ── Terminal Bottom Nav Bar ── */}
      <nav className="bg-card border-t-2 border-ink px-3 py-3 flex items-center justify-around z-30 select-none shrink-0">
        {currentView === 'map' && isOrganizer ? (
          <button onClick={() => setCurrentView('add-event')}
            className="flex flex-col items-center gap-1 text-ink hover:text-signal active:translate-y-[2px] transition-all focus:outline-none py-0.5">
            <PlusCircle className="w-5.5 h-5.5 sm:w-6 sm:h-6" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider">ADD</span>
          </button>
        ) : currentView === 'add-event' ? (
          <button onClick={() => setCurrentView('map')}
            className="flex flex-col items-center gap-1 text-ink hover:text-signal active:translate-y-[2px] transition-all focus:outline-none py-0.5">
            <MapIcon className="w-5.5 h-5.5 sm:w-6 sm:h-6" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider">MAP</span>
          </button>
        ) : null}

        <button onClick={() => setIsNoticeBoardOpen(true)}
          className="flex flex-col items-center gap-1 text-ink hover:text-signal active:translate-y-[2px] transition-all focus:outline-none py-0.5">
          <ClipboardList className="w-5.5 h-5.5 sm:w-6 sm:h-6" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider">NOTICES</span>
        </button>

        <button onClick={async () => { 
            setIsAllEventsOpen(true); 
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
          setIsClubsOpen(true);
        }}
          className="flex flex-col items-center gap-1 text-ink hover:text-signal active:translate-y-[2px] transition-all focus:outline-none py-0.5">
          <Users className="w-5.5 h-5.5 sm:w-6 sm:h-6" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider">CLUBS</span>
        </button>

        <button onClick={() => setIsProfileOpen(true)}
          className="flex flex-col items-center gap-1 text-ink hover:text-signal active:translate-y-[2px] transition-all focus:outline-none py-0.5">
          <User className="w-5.5 h-5.5 sm:w-6 sm:h-6" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider">PROFILE</span>
        </button>
      </nav>

      {/* Custom In-App Web Push Notification Prompt */}
      <NotificationPrompt />

      {/* Notifications Preferences Modal */}
      <NotificationPreferencesModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

    </div>
    </MotionConfig>
  );
}

export default App;

