import React, { useState, useEffect } from 'react';
import InteractiveMap from './components/InteractiveMap';
import SidePanel from './components/SidePanel';
import EventDetailModal from './components/EventDetailModal';
import AddEventForm from './components/AddEventForm';
import SearchBar from './components/SearchBar';
import { 
  User, 
  Calendar, 
  Info, 
  SlidersHorizontal, 
  Search, 
  Menu, 
  Map as MapIcon, 
  PlusCircle, 
  UserCheck 
} from 'lucide-react';

function App() {
  // State management
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [buildingEvents, setBuildingEvents] = useState([]);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  // Filter Categories State
  const [activeFilters, setActiveFilters] = useState({
    academic: true,
    hostel_boys: true,
    hostel_girls: true,
    admin: true,
    cafeteria: true,
    sports: true,
    gardens: true,
    other: true
  });

  // Views & Modals
  const [currentView, setCurrentView] = useState('map'); // 'map', 'add-event'
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAllEventsOpen, setIsAllEventsOpen] = useState(false);

  // Organizer auth simulation (toggleable in profile for testing)
  const [isOrganizer, setIsOrganizer] = useState(true);

  // Search input state (placeholder functionality for now)
  const [searchQuery, setSearchQuery] = useState('');

  // Track last viewed building timestamps for seen/unseen badges
  const [lastViewedMap, setLastViewedMap] = useState(() => {
    try {
      const saved = localStorage.getItem('campuslink_last_viewed_buildings');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Fetch all buildings on mount
  useEffect(() => {
    fetchBuildings();
  }, []);

  const fetchBuildings = async () => {
    try {
      const response = await fetch('/api/buildings');
      if (response.ok) {
        const data = await response.json();
        setBuildings(data);
      }
    } catch (error) {
      console.error('Error fetching buildings list:', error);
    }
  };

  // Handle building selection
  const handleSelectBuilding = async (building) => {
    setSelectedBuilding(building);
    setIsSidePanelOpen(true);
    
    // Update lastViewedMap timestamp
    const nowISO = new Date().toISOString();
    setLastViewedMap((prev) => {
      const updated = { ...prev, [building.id]: nowISO };
      try {
        localStorage.setItem('campuslink_last_viewed_buildings', JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving to localStorage:', e);
      }
      return updated;
    });
    
    // Fetch active events for this building
    try {
      const response = await fetch(`/api/buildings/${building.id}/events`);
      if (response.ok) {
        const data = await response.json();
        setBuildingEvents(data);
      }
    } catch (error) {
      console.error('Error fetching building events:', error);
    }
  };

  // Handle event selection
  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  // Close panel
  const handleCloseSidePanel = () => {
    setIsSidePanelOpen(false);
    setSelectedBuilding(null);
  };

  // Compile active events counts
  const activeEventsMap = {};
  let totalActiveEventsCount = 0;
  
  buildings.forEach(b => {
    activeEventsMap[b.id] = b.active_event_count;
    totalActiveEventsCount += b.active_event_count;
  });

  // Toggle filter
  const toggleFilter = (category) => {
    setActiveFilters(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Filtered buildings to pass to map
  const filteredBuildings = buildings.filter(b => activeFilters[b.category]);

  // Retrieve all events on campus (approved and active) for the bottom nav sheet
  const [allActiveEvents, setAllActiveEvents] = useState([]);
  
  const fetchAllActiveEvents = async () => {
    try {
      // Collect approved events across all buildings
      const fetchedEventsPromises = buildings.map(b => 
        fetch(`/api/buildings/${b.id}/events`).then(res => res.json())
      );
      const eventsArrays = await Promise.all(fetchedEventsPromises);
      const flatEvents = eventsArrays.flat();
      // Remove duplicates just in case
      const uniqueEvents = Array.from(new Map(flatEvents.map(e => [e.id, e])).values());
      setAllActiveEvents(uniqueEvents);
    } catch (err) {
      console.error('Error fetching all active events:', err);
    }
  };

  useEffect(() => {
    if (buildings.length > 0) {
      fetchAllActiveEvents();
    }
  }, [buildings]);

  return (
    <div className="h-screen bg-canvas text-text-primary font-body flex flex-col overflow-hidden relative">
      
      {/* Header */}
      <header className="bg-white border-b border-text-primary/10 px-4 py-3 flex items-center justify-between shadow-xs z-30 select-none">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-landmark-teal text-white flex items-center justify-center font-display text-2xl font-bold tracking-tighter">
            CL
          </div>
          <div>
            <h1 className="text-2xl font-display uppercase tracking-tight text-text-primary leading-none">
              CAMPUSLINK
            </h1>
            <p className="font-mono text-[9px] text-text-primary/60 tracking-wider uppercase leading-none mt-0.5">
              ITER, SOA University
            </p>
          </div>
        </div>
        
        {/* Organizer Shortcut badge */}
        <div className="flex items-center gap-2">
          {isOrganizer && (
            <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[10px] bg-accent-gold/20 text-text-primary border border-accent-gold py-1 px-2.5 rounded">
              <UserCheck className="w-3 h-3 text-landmark-teal" />
              ORGANIZER MODE
            </span>
          )}
          <button className="p-1 hover:bg-canvas rounded transition-colors focus:outline-none">
            <Menu className="w-6 h-6 text-text-primary" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-canvas">
        
        {/* Search Bar - Floating above Map */}
        {currentView === 'map' && (
          <div className="absolute top-4 inset-x-4 mx-auto max-w-md z-20 px-2 sm:px-0">
            <SearchBar
              buildings={buildings}
              onSelectDepartmentResult={(building) => {
                setSelectedBuilding(building);
              }}
              onSelectEventResult={(building, event) => {
                handleSelectBuilding(building);
                handleSelectEvent(event);
              }}
            />
          </div>
        )}

        {/* Dynamic Views: Map View vs Add Event View */}
        {currentView === 'map' ? (
          <InteractiveMap
            buildings={filteredBuildings}
            selectedBuilding={selectedBuilding}
            onSelectBuilding={handleSelectBuilding}
            activeEventsMap={activeEventsMap}
            lastViewedMap={lastViewedMap}
          />
        ) : (
          <AddEventForm
            buildings={buildings}
            isOrganizer={isOrganizer}
            onBack={() => setCurrentView('map')}
            onSuccess={() => {
              setCurrentView('map');
              fetchBuildings();
              fetchAllActiveEvents();
            }}
          />
        )}
      </main>

      {/* Side Slide Sheets & Modals */}
      
      {/* 1. Building Events Drawer */}
      <SidePanel
        building={selectedBuilding}
        events={buildingEvents}
        isOpen={isSidePanelOpen}
        onClose={handleCloseSidePanel}
        onSelectEvent={handleSelectEvent}
      />

      {/* 2. Event Details Modal */}
      <EventDetailModal
        event={selectedEvent}
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          setSelectedEvent(null);
        }}
      />

      {/* 3. Profile Drawer / Modal */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-text-primary/30 backdrop-blur-xs" onClick={() => setIsProfileOpen(false)} />
          <div className="bg-white rounded-lg shadow-2xl border border-text-primary/10 p-6 w-full max-w-sm relative z-50 space-y-6">
            <div className="flex justify-between items-start border-b border-text-primary/10 pb-3">
              <h3 className="text-2xl font-display uppercase tracking-tight text-text-primary">
                Student Profile
              </h3>
              <button onClick={() => setIsProfileOpen(false)} className="font-mono text-xs opacity-50 hover:opacity-100">
                Close
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-landmark-teal text-white flex items-center justify-center font-display text-xl font-bold uppercase">
                  JD
                </div>
                <div>
                  <h4 className="font-mono text-sm font-bold text-text-primary">John Doe</h4>
                  <span className="font-mono text-xs text-text-primary/60">Junior, B.Tech CSE</span>
                </div>
              </div>

              {/* Organizer Toggle to demo Add Event Form */}
              <div className="flex items-center justify-between border-t border-text-primary/10 pt-4 mt-2">
                <div className="space-y-0.5">
                  <span className="font-mono text-xs font-bold text-text-primary block">Organizer Access</span>
                  <span className="font-mono text-[10px] text-text-primary/50 block">Simulate senior student authorization</span>
                </div>
                <input
                  type="checkbox"
                  checked={isOrganizer}
                  onChange={(e) => setIsOrganizer(e.target.checked)}
                  className="w-5 h-5 accent-accent-gold cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. About App Modal */}
      {isAboutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-text-primary/30 backdrop-blur-xs" onClick={() => setIsAboutOpen(false)} />
          <div className="bg-white rounded-lg shadow-2xl border border-text-primary/10 p-6 w-full max-w-md relative z-50 space-y-4">
            <div className="flex justify-between items-start border-b border-text-primary/10 pb-3">
              <h3 className="text-2xl font-display uppercase tracking-tight text-text-primary">
                About CampusLink
              </h3>
              <button onClick={() => setIsAboutOpen(false)} className="font-mono text-xs opacity-50 hover:opacity-100">
                Close
              </button>
            </div>
            
            <div className="space-y-3 font-mono text-xs text-text-primary/80 leading-relaxed">
              <p>
                <strong>CampusLink</strong> is an opinionated campus discovery tool designed specifically for juniors and freshers at <strong>ITER, SOA University</strong>.
              </p>
              <p>
                Browse active workshops, competitions, and society drives happening around you. Click any highlighted building to view event detail registrations.
              </p>
              <p className="border-t border-text-primary/5 pt-2 opacity-65">
                Version 1.0.0 Scaffolding | Designed for phone viewports.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5. Filter Category Drawer */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-text-primary/30 backdrop-blur-xs" onClick={() => setIsFilterOpen(false)} />
          <div className="bg-white rounded-lg shadow-2xl border border-text-primary/10 p-6 w-full max-w-sm relative z-50 space-y-4">
            <div className="flex justify-between items-start border-b border-text-primary/10 pb-3">
              <h3 className="text-2xl font-display uppercase tracking-tight text-text-primary">
                Filter Buildings
              </h3>
              <button onClick={() => setIsFilterOpen(false)} className="font-mono text-xs opacity-50 hover:opacity-100">
                Done
              </button>
            </div>
            
            <div className="space-y-2">
              {Object.keys(activeFilters).map(catKey => {
                const colors = {
                  academic: 'bg-category-academic-fill border-category-academic-border',
                  hostel_boys: 'bg-category-boys-hostel-fill border-category-boys-hostel-border',
                  hostel_girls: 'bg-category-girls-hostel-fill border-category-girls-hostel-border',
                  admin: 'bg-category-admin-research-fill border-category-admin-research-border',
                  cafeteria: 'bg-category-cafeteria-food-fill border-category-cafeteria-food-border',
                  sports: 'bg-category-sports-fill border-category-sports-border',
                  gardens: 'bg-category-gardens-fill border-category-gardens-border',
                  other: 'bg-category-other-misc-fill border-category-other-misc-border',
                };
                
                const labels = {
                  academic: 'Academic Blocks',
                  hostel_boys: 'Boys Hostels',
                  hostel_girls: 'Girls Hostels',
                  admin: 'Administration',
                  cafeteria: 'Cafeteria & Food',
                  sports: 'Sports Complexes',
                  gardens: 'Parks & Gardens',
                  other: 'Other Utility',
                };

                return (
                  <label key={catKey} className="flex items-center justify-between py-1.5 cursor-pointer font-mono text-xs hover:bg-canvas/20 px-2 rounded">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-3 h-3 rounded-full border ${colors[catKey]}`} />
                      <span>{labels[catKey]}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={activeFilters[catKey]}
                      onChange={() => toggleFilter(catKey)}
                      className="w-4 h-4 accent-landmark-teal"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 6. Active Events List Modal */}
      {isAllEventsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-text-primary/30 backdrop-blur-xs" onClick={() => setIsAllEventsOpen(false)} />
          <div className="bg-white rounded-lg shadow-2xl border border-text-primary/10 p-6 w-full max-w-md relative z-50 flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-start border-b border-text-primary/10 pb-3 mb-4">
              <h3 className="text-2xl font-display uppercase tracking-tight text-text-primary">
                All Campus Events
              </h3>
              <button onClick={() => setIsAllEventsOpen(false)} className="font-mono text-xs opacity-50 hover:opacity-100">
                Close
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3">
              {allActiveEvents.length === 0 ? (
                <p className="font-mono text-xs text-text-primary/50 text-center py-8">
                  No active events listed on campus.
                </p>
              ) : (
                allActiveEvents.map(event => (
                  <div
                    key={event.id}
                    onClick={() => {
                      setIsAllEventsOpen(false);
                      handleSelectEvent(event);
                    }}
                    className="p-3 border border-text-primary/10 rounded hover:border-accent-gold cursor-pointer bg-canvas/10 transition-colors"
                  >
                    <h4 className="font-display text-lg uppercase text-text-primary">{event.title}</h4>
                    <span className="font-mono text-[10px] text-text-primary/60 block mt-1">
                      {event.organizing_club}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="bg-white border-t border-text-primary/10 px-4 py-2 flex items-center justify-around z-30 select-none shadow-md">
        
        {/* Toggle between map and add event button (conditional layout helper) */}
        {currentView === 'map' && isOrganizer ? (
          <button
            onClick={() => setCurrentView('add-event')}
            className="flex flex-col items-center gap-1 text-text-primary/75 hover:text-accent-gold transition-colors focus:outline-none"
          >
            <PlusCircle className="w-5 h-5" />
            <span className="font-mono text-[9px] uppercase tracking-wider">Add Event</span>
          </button>
        ) : currentView === 'add-event' ? (
          <button
            onClick={() => setCurrentView('map')}
            className="flex flex-col items-center gap-1 text-text-primary/75 hover:text-accent-gold transition-colors focus:outline-none"
          >
            <MapIcon className="w-5 h-5" />
            <span className="font-mono text-[9px] uppercase tracking-wider">Show Map</span>
          </button>
        ) : null}

        {/* Filter Buildings */}
        <button
          onClick={() => setIsFilterOpen(true)}
          className="flex flex-col items-center gap-1 text-text-primary/75 hover:text-accent-gold transition-colors focus:outline-none"
        >
          <SlidersHorizontal className="w-5 h-5" />
          <span className="font-mono text-[9px] uppercase tracking-wider">Filters</span>
        </button>

        {/* Active Events with badge count */}
        <button
          onClick={() => {
            fetchAllActiveEvents();
            setIsAllEventsOpen(true);
          }}
          className="flex flex-col items-center gap-1 text-text-primary/75 hover:text-accent-gold transition-colors relative focus:outline-none"
        >
          <Calendar className="w-5 h-5" />
          <span className="font-mono text-[9px] uppercase tracking-wider">Events</span>
          {totalActiveEventsCount > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-accent-gold text-text-primary border border-text-primary text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center font-display leading-none">
              {totalActiveEventsCount}
            </span>
          )}
        </button>

        {/* About App */}
        <button
          onClick={() => setIsAboutOpen(true)}
          className="flex flex-col items-center gap-1 text-text-primary/75 hover:text-accent-gold transition-colors focus:outline-none"
        >
          <Info className="w-5 h-5" />
          <span className="font-mono text-[9px] uppercase tracking-wider">About</span>
        </button>

        {/* Profile */}
        <button
          onClick={() => setIsProfileOpen(true)}
          className="flex flex-col items-center gap-1 text-text-primary/75 hover:text-accent-gold transition-colors focus:outline-none"
        >
          <User className="w-5 h-5" />
          <span className="font-mono text-[9px] uppercase tracking-wider">Profile</span>
        </button>

      </nav>

    </div>
  );
}

export default App;
