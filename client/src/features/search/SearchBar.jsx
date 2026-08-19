import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSearchResults } from '../../shared/lib/api';
import { useDebounce } from '../../shared/hooks/useDebounce';
import { Search, X, MapPin, Calendar, Building2, Loader2 } from 'lucide-react';

function SearchBar({ buildings, onSelectDepartmentResult, onSelectEventResult }) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query.trim(), 300);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  /* ── Close dropdown on outside click ── */
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── Search query — keyed by debouncedQuery so each term has its own cache ── */
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => fetchSearchResults(debouncedQuery),
    enabled: debouncedQuery.length > 0,
    staleTime: 120_000,
    gcTime: 300_000,
  });

  const results = data?.results ?? [];
  const hasSearched = !isLoading && !isFetching && debouncedQuery.length > 0;
  const showLoading = (isLoading || isFetching) && debouncedQuery.length > 0;

  /* ── Keep dropdown open when there is an active query ── */
  useEffect(() => {
    if (debouncedQuery.length > 0) setIsOpen(true);
    else setIsOpen(false);
  }, [debouncedQuery]);

  const handleSelectDepartment = (item) => {
    setIsOpen(false);
    const targetBuilding = buildings.find(
      b => b.id === item.building_id || b.svg_element_id === item.building_svg_element_id || b.svg_element_id === item.svg_element_id || b.id === item.id
    ) || item;
    if (onSelectDepartmentResult) onSelectDepartmentResult(targetBuilding, item);
  };

  const handleSelectBuildingItem = (item) => {
    setIsOpen(false);
    const targetBuilding = buildings.find(
      b => b.id === item.building_id || b.svg_element_id === item.building_svg_element_id || b.svg_element_id === item.svg_element_id || b.id === item.id
    ) || item;
    if (onSelectDepartmentResult) onSelectDepartmentResult(targetBuilding, item);
  };

  const handleSelectEvent = (item) => {
    setIsOpen(false);
    const targetBuilding = buildings.find(
      b => b.id === item.building_id || b.svg_element_id === item.building_svg_element_id
    ) || item;
    if (onSelectEventResult) onSelectEventResult(targetBuilding, item);
  };

  const handleClear = () => { setQuery(''); setIsOpen(false); };

  return (
    <div ref={containerRef} className="relative w-full font-mono">

      {/* ── Search input bar ── */}
      <div className="bg-card border-2 border-ink shadow-hard flex items-center px-3 py-2 rounded-xs focus-within:bg-paper transition-colors">
        {showLoading
          ? <Loader2 className="w-4 h-4 text-signal animate-spin mr-2.5 shrink-0" />
          : <Search className="w-4 h-4 text-ink/50 mr-2.5 shrink-0" />}

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (debouncedQuery.length > 0) setIsOpen(true); }}
          placeholder="SEARCH DEPT, EVENT, OR BUILDING..."
          className="w-full text-xs bg-transparent border-none outline-none text-ink placeholder:text-muted uppercase tracking-tight"
        />

        {query && (
          <button onClick={handleClear} aria-label="Clear"
            className="ml-1 p-0.5 text-ink/60 hover:text-ink transition-colors focus:outline-none active:translate-y-[1px]">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Results dropdown ── */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-card border-2 border-ink shadow-hard-lg rounded-xs max-h-72 overflow-y-auto z-40 divide-y divide-ink/10 select-none">

          {/* Header strip */}
          <div className="bg-paper px-3 py-1 flex items-center justify-between text-[10px] uppercase tracking-widest font-bold text-muted border-b border-ink/20">
            <span>— SEARCH RESULTS</span>
            {hasSearched && <span>{results.length} MATCH{results.length !== 1 ? 'ES' : ''}</span>}
          </div>

          {showLoading ? (
            <div className="p-4 flex items-center gap-2 text-xs text-muted">
              <Loader2 className="w-4 h-4 animate-spin text-signal" />
              <span>SCANNING CAMPUS DIRECTORY…</span>
            </div>
          ) : results.length === 0 && hasSearched ? (
            <div className="p-4 text-xs text-muted space-y-1">
              <p className="font-bold text-ink uppercase">— No matches found</p>
              <p className="text-[11px]">No matching building, department, or event for "{debouncedQuery}".</p>
            </div>
          ) : results.map((item) => {
            const isDept = item.type === 'department';
            const isBld = item.type === 'building';
            const isEvt = item.type === 'event';

            const badgeLabel = isBld ? 'BUILDING' : (isDept ? 'DEPT' : 'EVENT');
            const badgeStyle = isEvt ? 'bg-signal text-ink' : 'bg-paper text-ink';

            const handleClick = () => {
              if (isBld) handleSelectBuildingItem(item);
              else if (isDept) handleSelectDepartment(item);
              else if (isEvt) handleSelectEvent(item);
            };

            return (
              <div
                key={`${item.type}-${item.id}`}
                onClick={handleClick}
                className="p-3 hover:bg-paper cursor-pointer transition-colors group active:translate-y-[1px]"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {isEvt ? (
                      <Calendar className="w-4 h-4 text-signal shrink-0" />
                    ) : isBld ? (
                      <MapPin className="w-4 h-4 text-signal shrink-0" />
                    ) : (
                      <Building2 className="w-4 h-4 text-ink shrink-0" />
                    )}
                    <span className="font-display text-lg uppercase text-ink group-hover:text-signal transition-colors leading-tight">
                      {isEvt ? item.title : item.name}
                    </span>
                  </div>
                  <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 border border-ink rounded-xs shrink-0 ${badgeStyle}`}>
                    {badgeLabel}
                  </span>
                </div>

                {/* Directional / Building location string */}
                {item.location_string && (
                  <div className="flex items-center gap-1.5 text-xs text-ink font-bold pl-6 pt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-signal shrink-0" />
                    <span>{item.location_string}</span>
                  </div>
                )}

                {/* Event club */}
                {isEvt && item.organizing_club && (
                  <p className="pl-6 text-[11px] text-muted pt-0.5">
                    CLUB: <strong className="text-ink">{item.organizing_club}</strong>
                  </p>
                )}

                {/* Building Category */}
                {isBld && item.building_category && (
                  <p className="pl-6 text-[10px] text-muted pt-0.5 uppercase font-mono">
                    CATEGORY: <strong className="text-ink">{item.building_category.replace(/_/g, ' ')}</strong>
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
