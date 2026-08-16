import React, { useState, useEffect, useRef } from 'react';
import { Search, X, MapPin, Calendar, Building2, Loader2 } from 'lucide-react';

function SearchBar({ buildings, onSelectDepartmentResult, onSelectEventResult }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const containerRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search effect (~300ms)
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      setHasSearched(false);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    setIsOpen(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
        } else {
          setResults([]);
        }
      } catch (err) {
        console.error('Error executing live search:', err);
        setResults([]);
      } finally {
        setLoading(false);
        setHasSearched(true);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle department item selection
  const handleSelectDepartment = (item) => {
    setIsOpen(false);
    // Find building object
    const targetBuilding = buildings.find(
      (b) => b.id === item.building_id || b.svg_element_id === item.building_svg_element_id
    );
    if (targetBuilding && onSelectDepartmentResult) {
      onSelectDepartmentResult(targetBuilding, item);
    }
  };

  // Handle event item selection
  const handleSelectEvent = (item) => {
    setIsOpen(false);
    const targetBuilding = buildings.find(
      (b) => b.id === item.building_id || b.svg_element_id === item.building_svg_element_id
    );
    if (targetBuilding && onSelectEventResult) {
      onSelectEventResult(targetBuilding, item);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setHasSearched(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search Input Box */}
      <div className="bg-white border border-text-primary/15 rounded-lg shadow-lg flex items-center px-3.5 py-2.5 focus-within:border-accent-gold transition-colors">
        {loading ? (
          <Loader2 className="w-5 h-5 text-accent-gold animate-spin mr-2 shrink-0" />
        ) : (
          <Search className="w-5 h-5 text-text-primary/40 mr-2 shrink-0" />
        )}
        
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          placeholder="Search department (e.g. Electrical) or event..."
          className="w-full font-mono text-xs sm:text-sm bg-transparent border-none outline-none text-text-primary placeholder:text-text-primary/40"
        />

        {query && (
          <button
            onClick={handleClear}
            className="p-1 hover:bg-canvas/50 rounded-full transition-colors font-mono text-xs text-text-primary/50 hover:text-text-primary focus:outline-none"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Results Dropdown Container */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-2xl border border-text-primary/10 max-h-72 overflow-y-auto z-40 divide-y divide-text-primary/5 select-none">
          {loading && !hasSearched ? (
            <div className="p-4 text-center font-mono text-xs text-text-primary/50 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-landmark-teal" />
              <span>Searching campus directory...</span>
            </div>
          ) : results.length === 0 && hasSearched ? (
            // No Matches State
            <div className="p-5 text-center font-mono text-xs text-text-primary/60 space-y-1">
              <p className="font-bold text-text-primary">No matches found</p>
              <p className="text-[11px] text-text-primary/40">
                No department or active event matches "{query}".
              </p>
            </div>
          ) : (
            results.map((item) => {
              if (item.type === 'department') {
                return (
                  <div
                    key={`dept-${item.id}`}
                    onClick={() => handleSelectDepartment(item)}
                    className="p-3.5 hover:bg-canvas/40 cursor-pointer transition-colors space-y-1 group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-landmark-teal shrink-0" />
                        <span className="font-display text-lg uppercase text-text-primary group-hover:text-accent-gold transition-colors leading-tight">
                          {item.name}
                        </span>
                      </div>
                      <span className="font-mono text-[9px] uppercase tracking-wider bg-landmark-teal/10 text-landmark-teal border border-landmark-teal/20 px-2 py-0.5 rounded font-semibold shrink-0">
                        Department
                      </span>
                    </div>

                    {/* Directional Answer: [Building] -> [Floor] -> [Room] */}
                    <div className="flex items-center gap-1.5 font-mono text-xs text-text-primary/80 pl-6">
                      <MapPin className="w-3.5 h-3.5 text-accent-gold shrink-0" />
                      <span className="font-bold text-text-primary">{item.location_string}</span>
                    </div>
                  </div>
                );
              }

              // Event Result Item
              return (
                <div
                  key={`event-${item.id}`}
                  onClick={() => handleSelectEvent(item)}
                  className="p-3.5 hover:bg-canvas/40 cursor-pointer transition-colors space-y-1 group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-accent-gold shrink-0" />
                      <span className="font-display text-lg uppercase text-text-primary group-hover:text-accent-gold transition-colors leading-tight">
                        {item.title}
                      </span>
                    </div>
                    <span className="font-mono text-[9px] uppercase tracking-wider bg-accent-gold/20 text-text-primary border border-accent-gold px-2 py-0.5 rounded font-semibold shrink-0">
                      Event
                    </span>
                  </div>

                  <div className="pl-6 space-y-0.5">
                    <p className="font-mono text-xs text-text-primary/60">
                      Organized by <strong className="text-text-primary">{item.organizing_club}</strong>
                    </p>
                    {item.location_string && (
                      <div className="flex items-center gap-1.5 font-mono text-xs text-text-primary/80 pt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-landmark-teal shrink-0" />
                        <span>{item.location_string}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
