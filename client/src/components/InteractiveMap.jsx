import React, { useState, useRef, useEffect } from 'react';
import mapSvg from '../assets/campus-map.svg?raw';
import MapMarker from './MapMarker';
import { buildingCoords } from '../lib/buildingCoords';
import { Plus, Minus } from 'lucide-react';

function InteractiveMap({ buildings, selectedBuilding, onSelectBuilding, activeEventsMap, lastViewedMap = {} }) {
  const viewportRef = useRef(null);
  const containerRef = useRef(null);
  const svgWrapperRef = useRef(null);


  const [zoom, setZoom] = useState(0.25);
  const [pan, setPan] = useState({ x: 0, y: 10 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });

  // Handle initial sizing to fit viewport width
  useEffect(() => {
    if (viewportRef.current) {
      const vWidth = viewportRef.current.clientWidth;
      const fitZoom = vWidth / 1580;
      setZoom(Math.max(0.15, fitZoom));
      // Center map horizontally
      setPan({ x: (vWidth - 1580 * fitZoom) / 2, y: 10 });
    }
  }, []);

  // Set up event listeners on SVG elements after mounting/updating
  useEffect(() => {
    if (!svgWrapperRef.current || buildings.length === 0) return;

    // Attach click listeners to all clickable building elements
    buildings.forEach((building) => {
      const el = svgWrapperRef.current.querySelector(`#${building.svg_element_id}`);
      if (el) {
        // Style cursor and pointer events
        el.style.cursor = 'pointer';
        el.style.pointerEvents = 'auto';
        el.style.transition = 'opacity 0.2s ease, filter 0.2s ease';

        const clickHandler = (e) => {
          e.stopPropagation();
          onSelectBuilding(building);
        };

        const mouseEnterHandler = () => {
          el.style.opacity = '0.85';
        };

        const mouseLeaveHandler = () => {
          // Keep hover effect unless it is the selected building
          if (selectedBuilding?.id !== building.id) {
            el.style.opacity = '1';
          }
        };

        el.addEventListener('click', clickHandler);
        el.addEventListener('mouseenter', mouseEnterHandler);
        el.addEventListener('mouseleave', mouseLeaveHandler);

        // Cleanup function for listeners
        building._listeners = { clickHandler, mouseEnterHandler, mouseLeaveHandler, el };
      }
    });

    return () => {
      buildings.forEach((building) => {
        if (building._listeners) {
          const { clickHandler, mouseEnterHandler, mouseLeaveHandler, el } = building._listeners;
          el.removeEventListener('click', clickHandler);
          el.removeEventListener('mouseenter', mouseEnterHandler);
          el.removeEventListener('mouseleave', mouseLeaveHandler);
          delete building._listeners;
        }
      });
    };
  }, [buildings, onSelectBuilding, selectedBuilding]);

  // Apply selected building outline/glow highlight
  useEffect(() => {
    if (!svgWrapperRef.current) return;

    // First reset all highlights
    buildings.forEach((building) => {
      const el = svgWrapperRef.current.querySelector(`#${building.svg_element_id}`);
      if (el) {
        el.style.filter = 'none';
        el.style.opacity = '1';
      }
    });

    // Apply gold drop-shadow glow to selected building
    if (selectedBuilding) {
      const el = svgWrapperRef.current.querySelector(`#${selectedBuilding.svg_element_id}`);
      if (el) {
        el.style.filter = 'drop-shadow(0 0 12px #F2B84B)';
        el.style.opacity = '0.9';
      }
    }
  }, [selectedBuilding, buildings]);

  // Auto-center and zoom map to selected building
  useEffect(() => {
    if (selectedBuilding && viewportRef.current) {
      const coords = buildingCoords[selectedBuilding.svg_element_id];
      if (coords) {
        const vWidth = viewportRef.current.clientWidth;
        const vHeight = viewportRef.current.clientHeight;

        // Calculate focus zoom and centering pan coordinates
        const focusZoom = Math.max(0.5, (vWidth / 1580) * 1.6);
        const targetPanX = (vWidth / 2) - (coords.x * focusZoom);
        const targetPanY = (vHeight / 2) - (coords.y * focusZoom);

        setZoom(focusZoom);
        setPan({ x: targetPanX, y: targetPanY });
      }
    }
  }, [selectedBuilding]);

  // Pan handlers (Desktop mouse dragging)
  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    panStart.current = { ...pan };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPan({
      x: panStart.current.x + dx,
      y: panStart.current.y + dy
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Pan handlers (Mobile touch dragging)
  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    panStart.current = { ...pan };
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStart.current.x;
    const dy = e.touches[0].clientY - dragStart.current.y;
    setPan({
      x: panStart.current.x + dx,
      y: panStart.current.y + dy
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Zoom controls
  const zoomIn = () => {
    setZoom(prev => Math.min(3.0, prev + 0.1));
  };

  const zoomOut = () => {
    setZoom(prev => Math.max(0.15, prev - 0.1));
  };

  return (
    <div className="w-full h-full relative bg-canvas select-none overflow-hidden" ref={viewportRef}>
      
      {/* Zoomable & Pannable Container */}
      <div
        className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          ref={containerRef}
          className="absolute origin-top-left w-[1580px] h-[2891px]"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out'
          }}
        >
          {/* Static SVG Map Layer */}
          <div
            ref={svgWrapperRef}
            className="w-full h-full pointer-events-auto"
            dangerouslySetInnerHTML={{ __html: mapSvg }}
          />

          {/* Interactive Absolute Overlays Layer (Markers) */}
          <div className="absolute inset-0 pointer-events-none select-none z-10">
            {buildings.map((building) => {
              const coords = buildingCoords[building.svg_element_id];
              if (!coords) return null;

              const activeEventsCount = activeEventsMap[building.id] || 0;
              if (activeEventsCount <= 0) return null;

              const lastViewed = lastViewedMap[building.id];
              const latestEventCreatedAt = building.latest_event_created_at;

              // Unseen if never viewed OR latest event was created after lastViewed timestamp
              const isUnseen = !lastViewed || (latestEventCreatedAt && new Date(latestEventCreatedAt) > new Date(lastViewed));
              const isSelected = selectedBuilding?.id === building.id;

              return (
                <MapMarker
                  key={building.id}
                  x={coords.x}
                  y={coords.y}
                  badgeCount={activeEventsCount}
                  isUnseen={isUnseen}
                  category={building.category}
                  active={isSelected}
                  onClick={() => onSelectBuilding(building)}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating Zoom Controls (Bottom Right) */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-30">
        <button
          onClick={zoomIn}
          className="w-12 h-12 flex items-center justify-center bg-white hover:bg-canvas text-text-primary rounded-full shadow-lg border border-text-primary/10 transition-all active:scale-95 cursor-pointer focus:outline-none"
          aria-label="Zoom in"
        >
          <Plus className="w-5 h-5" />
        </button>
        <button
          onClick={zoomOut}
          className="w-12 h-12 flex items-center justify-center bg-white hover:bg-canvas text-text-primary rounded-full shadow-lg border border-text-primary/10 transition-all active:scale-95 cursor-pointer focus:outline-none"
          aria-label="Zoom out"
        >
          <Minus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default InteractiveMap;
