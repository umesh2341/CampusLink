import React, { useState, useRef, useEffect } from 'react';
import { LocateFixed, Plus, Minus } from 'lucide-react';
import mapSvg from '../../assets/campus-map.svg?raw';
import MapMarker from './MapMarker';
import LiveUserMarker from './LiveUserMarker';
import { buildingCoords } from '../../shared/lib/buildingCoords';
import useAppStore from '../../shared/store/useAppStore';

function InteractiveMap({
  buildings,
  selectedBuilding,
  onSelectBuilding,
  activeEventsMap,
  lastViewedMap = {},
  userLocation = null,
}) {
  const viewportRef = useRef(null);
  const containerRef = useRef(null);
  const svgWrapperRef = useRef(null);
  const interactionLayerRef = useRef(null);

  // Read saved map transform state from Zustand store
  const savedZoom = useAppStore(s => s.mapZoom);
  const savedPan = useAppStore(s => s.mapPan);
  const setMapTransform = useAppStore(s => s.setMapTransform);

  const [zoom, setZoomState] = useState(() => savedZoom ?? 0.25);
  const [pan, setPanState] = useState(() => savedPan ?? { x: 0, y: 10 });
  const [isDragging, setIsDragging] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);

  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });
  const dragDistanceRef = useRef(0);
  const pinchStartDistRef = useRef(0);
  const pinchStartZoomRef = useRef(0.25);
  const pinchStartPanRef = useRef({ x: 0, y: 0 });
  const pinchCenterRef = useRef({ x: 0, y: 0 });
  const lastTapRef = useRef({ time: 0, x: 0, y: 0 });

  const MAX_ZOOM = 3.5;

  // These multipliers are applied to the initial 'fit to viewport' zoom level
  // Adjust these to control how far users can zoom out on different devices
  const MIN_ZOOM_MOBILE = 0.8;
  const MIN_ZOOM_DESKTOP = 2.4;

  const getFitZoom = () => {
    if (!viewportRef.current) return 0.25;
    const vWidth = viewportRef.current.clientWidth;
    const vHeight = viewportRef.current.clientHeight;
    // Calculate scale to fit width and height, handling the 3D tilt perspective distortion roughly
    const scaleX = vWidth / 1580;
    const scaleY = vHeight / 2891;
    // Use the smaller scale so it fully contains within the viewport, with 5% padding
    return Math.min(scaleX, scaleY) * 0.95;
  };

  const getMinZoom = () => {
    const fitZoom = getFitZoom();
    const isMobile = window.innerWidth < 768;
    // Apply the responsive multiplier to give a comfortable overview 
    // without exposing too much empty background.
    return fitZoom * (isMobile ? MIN_ZOOM_MOBILE : MIN_ZOOM_DESKTOP);
  };

  const updateTransform = (newZoom, newPan) => {
    const minZ = getMinZoom();
    const clampedZoom = Math.min(MAX_ZOOM, Math.max(minZ, newZoom));

    let clampedPan = newPan;
    if (viewportRef.current) {
      const vWidth = viewportRef.current.clientWidth;
      const vHeight = viewportRef.current.clientHeight;
      const mapWidth = 1580 * clampedZoom;
      const mapHeight = 2891 * clampedZoom;

      let clampedX = newPan.x;
      const horizontalMargin = 80;

      if (mapWidth >= vWidth) {
        const minPanX = vWidth - mapWidth - horizontalMargin;
        const maxPanX = horizontalMargin;
        clampedX = Math.min(maxPanX, Math.max(minPanX, newPan.x));
      } else {
        const centerX = (vWidth - mapWidth) / 2;
        const minPanX = centerX - horizontalMargin;
        const maxPanX = centerX + horizontalMargin;
        clampedX = Math.min(maxPanX, Math.max(minPanX, newPan.x));
      }

      let clampedY = newPan.y;
      const topMargin = 90;
      const bottomMargin = 90;

      if (mapHeight > vHeight) {
        const minPanY = vHeight - mapHeight - bottomMargin;
        const maxPanY = topMargin;
        clampedY = Math.min(maxPanY, Math.max(minPanY, newPan.y));
      } else {
        const centerY = (vHeight - mapHeight) / 2;
        const minPanY = centerY - bottomMargin;
        const maxPanY = centerY + topMargin;
        clampedY = Math.min(maxPanY, Math.max(minPanY, newPan.y));
      }

      clampedPan = { x: clampedX, y: clampedY };
    }

    setZoomState(clampedZoom);
    setPanState(clampedPan);
    setMapTransform(clampedZoom, clampedPan);
  };

  // Initial sizing if no saved transform exists
  useEffect(() => {
    if (viewportRef.current && (savedZoom === null || savedPan === null)) {
      const fitZoom = getFitZoom();
      // Center the map initially
      const vWidth = viewportRef.current.clientWidth;
      const vHeight = viewportRef.current.clientHeight;
      const mapWidth = 1580 * fitZoom;
      const mapHeight = 2891 * fitZoom;
      const initialPan = {
        x: (vWidth - mapWidth) / 2,
        y: (vHeight - mapHeight) / 2
      };
      updateTransform(fitZoom, initialPan);
    }
  }, []);

  // Desktop Mouse Scroll Wheel & Trackpad Zoom
  useEffect(() => {
    const viewportEl = viewportRef.current;
    if (!viewportEl) return;

    let wheelTimeout;

    const handleWheel = (e) => {
      e.preventDefault();
      setIsInteracting(true);

      const rect = viewportEl.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Exponential zoom scaling for smooth response across trackpads & mouse wheels
      const factor = Math.exp(-e.deltaY * 0.0022);
      const minZ = getMinZoom();
      const newZoom = Math.min(MAX_ZOOM, Math.max(minZ, zoom * factor));

      if (Math.abs(newZoom - zoom) < 0.0005) return;

      const scaleRatio = newZoom / zoom;
      const newPanX = mouseX - (mouseX - pan.x) * scaleRatio;
      const newPanY = mouseY - (mouseY - pan.y) * scaleRatio;

      updateTransform(newZoom, { x: newPanX, y: newPanY });

      clearTimeout(wheelTimeout);
      wheelTimeout = setTimeout(() => setIsInteracting(false), 150);
    };

    viewportEl.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      viewportEl.removeEventListener('wheel', handleWheel);
      clearTimeout(wheelTimeout);
    };
  }, [zoom, pan]);

  // Set up event listeners on SVG elements after mounting/updating
  useEffect(() => {
    if (!svgWrapperRef.current || buildings.length === 0) return;

    buildings.forEach((building) => {
      const el = svgWrapperRef.current.querySelector(`#${building.svg_element_id}`);
      if (el) {
        el.style.cursor = 'pointer';
        el.style.pointerEvents = 'auto';
        el.style.transition = 'opacity 0.2s ease, filter 0.2s ease';

        const clickHandler = (e) => {
          if (dragDistanceRef.current > 6) return;
          e.stopPropagation();
          onSelectBuilding(building);
        };

        const mouseEnterHandler = () => {
          el.style.opacity = '0.85';
        };

        const mouseLeaveHandler = () => {
          if (selectedBuilding?.id !== building.id) {
            el.style.opacity = '1';
          }
        };

        el.addEventListener('click', clickHandler);
        el.addEventListener('mouseenter', mouseEnterHandler);
        el.addEventListener('mouseleave', mouseLeaveHandler);

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

    buildings.forEach((building) => {
      const el = svgWrapperRef.current.querySelector(`#${building.svg_element_id}`);
      if (el) {
        el.style.filter = 'none';
        el.style.opacity = '1';
      }
    });

    if (selectedBuilding) {
      const svgId = selectedBuilding.svg_element_id || selectedBuilding.building_svg_element_id;
      if (svgId) {
        const el = svgWrapperRef.current.querySelector(`#${svgId}`);
        if (el) {
          el.style.filter = 'drop-shadow(0 0 16px #FF7A33)';
          el.style.opacity = '0.9';
        }
      }
    }
  }, [selectedBuilding, buildings]);

  // Auto-center and zoom map when a building is selected
  useEffect(() => {
    if (selectedBuilding && viewportRef.current) {
      const svgId = selectedBuilding.svg_element_id || selectedBuilding.building_svg_element_id;
      const coords = svgId ? buildingCoords[svgId] : null;
      if (coords) {
        const vWidth = viewportRef.current.clientWidth;
        const vHeight = viewportRef.current.clientHeight;

        const focusZoom = Math.min(MAX_ZOOM, Math.max(0.6, (vWidth / 1580) * 1.8));
        const targetPanX = (vWidth / 2) - (coords.x * focusZoom);
        const targetPanY = (vHeight / 2) - (coords.y * focusZoom);

        updateTransform(focusZoom, { x: targetPanX, y: targetPanY });
      }
    }
  }, [selectedBuilding]);

  // Desktop Mouse Drag Handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setIsInteracting(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    panStart.current = { ...pan };
    dragDistanceRef.current = 0;
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    dragDistanceRef.current = Math.hypot(dx, dy);
    updateTransform(zoom, { x: panStart.current.x + dx, y: panStart.current.y + dy });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
    setIsInteracting(false);
  };

  // Double-click to zoom in on cursor
  const handleDoubleClick = (e) => {
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const newZoom = Math.min(MAX_ZOOM, zoom * 1.6);
    const scaleRatio = newZoom / zoom;
    const newPanX = mouseX - (mouseX - pan.x) * scaleRatio;
    const newPanY = mouseY - (mouseY - pan.y) * scaleRatio;
    updateTransform(newZoom, { x: newPanX, y: newPanY });
  };

  // Mobile Touch Drag & Continuous Pinch-to-Zoom
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setIsInteracting(true);
      dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      panStart.current = { ...pan };
      dragDistanceRef.current = 0;

      // Handle double-tap to zoom
      const now = Date.now();
      const tapX = e.touches[0].clientX;
      const tapY = e.touches[0].clientY;
      if (now - lastTapRef.current.time < 300 && Math.hypot(tapX - lastTapRef.current.x, tapY - lastTapRef.current.y) < 25) {
        if (viewportRef.current) {
          const rect = viewportRef.current.getBoundingClientRect();
          const midX = tapX - rect.left;
          const midY = tapY - rect.top;
          const newZoom = Math.min(MAX_ZOOM, zoom * 1.7);
          const scaleRatio = newZoom / zoom;
          const newPanX = midX - (midX - pan.x) * scaleRatio;
          const newPanY = midY - (midY - pan.y) * scaleRatio;
          updateTransform(newZoom, { x: newPanX, y: newPanY });
        }
        lastTapRef.current = { time: 0, x: 0, y: 0 };
        return;
      }
      lastTapRef.current = { time: now, x: tapX, y: tapY };

    } else if (e.touches.length === 2) {
      setIsDragging(true);
      setIsInteracting(true);
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      pinchStartDistRef.current = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      pinchStartZoomRef.current = zoom;
      pinchStartPanRef.current = { ...pan };
      pinchCenterRef.current = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      };
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    if (e.cancelable) e.preventDefault();
    if (e.touches.length === 1) {
      const dx = e.touches[0].clientX - dragStart.current.x;
      const dy = e.touches[0].clientY - dragStart.current.y;
      dragDistanceRef.current = Math.hypot(dx, dy);
      updateTransform(zoom, { x: panStart.current.x + dx, y: panStart.current.y + dy });
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      if (pinchStartDistRef.current > 0 && viewportRef.current) {
        const ratio = currentDist / pinchStartDistRef.current;
        const minZ = getMinZoom();
        const targetZoom = Math.min(MAX_ZOOM, Math.max(minZ, pinchStartZoomRef.current * ratio));

        const rect = viewportRef.current.getBoundingClientRect();
        const midX = pinchCenterRef.current.x - rect.left;
        const midY = pinchCenterRef.current.y - rect.top;

        const scaleRatio = targetZoom / pinchStartZoomRef.current;
        const newPanX = midX - (midX - pinchStartPanRef.current.x) * scaleRatio;
        const newPanY = midY - (midY - pinchStartPanRef.current.y) * scaleRatio;

        updateTransform(targetZoom, { x: newPanX, y: newPanY });
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setIsInteracting(false);
    pinchStartDistRef.current = 0;
  };


  const handleTouchStartRef = useRef(handleTouchStart);
  const handleTouchMoveRef = useRef(handleTouchMove);
  const handleTouchEndRef = useRef(handleTouchEnd);

  useEffect(() => {
    handleTouchStartRef.current = handleTouchStart;
    handleTouchMoveRef.current = handleTouchMove;
    handleTouchEndRef.current = handleTouchEnd;
  });

  useEffect(() => {
    const el = interactionLayerRef.current;
    if (!el) return;

    const onTouchStart = (e) => handleTouchStartRef.current(e);
    const onTouchMove = (e) => handleTouchMoveRef.current(e);
    const onTouchEnd = (e) => handleTouchEndRef.current(e);

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: false });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  // Smooth Button Zoom In / Out Handlers
  const handleZoomIn = () => {
    if (!viewportRef.current) return;
    const vpWidth = viewportRef.current.clientWidth;
    const vpHeight = viewportRef.current.clientHeight;
    const centerX = vpWidth / 2;
    const centerY = vpHeight / 2;
    const newZoom = Math.min(MAX_ZOOM, zoom * 1.35);
    const scaleRatio = newZoom / zoom;
    const newPanX = centerX - (centerX - pan.x) * scaleRatio;
    const newPanY = centerY - (centerY - pan.y) * scaleRatio;
    updateTransform(newZoom, { x: newPanX, y: newPanY });
  };

  const handleZoomOut = () => {
    if (!viewportRef.current) return;
    const vpWidth = viewportRef.current.clientWidth;
    const vpHeight = viewportRef.current.clientHeight;
    const centerX = vpWidth / 2;
    const centerY = vpHeight / 2;
    const minZ = getMinZoom();
    const newZoom = Math.max(minZ, zoom / 1.35);
    const scaleRatio = newZoom / zoom;
    const newPanX = centerX - (centerX - pan.x) * scaleRatio;
    const newPanY = centerY - (centerY - pan.y) * scaleRatio;
    updateTransform(newZoom, { x: newPanX, y: newPanY });
  };

  const handleCenterOnUser = () => {
    if (!userLocation || userLocation.x === null || userLocation.y === null) return;
    const vp = viewportRef.current;
    if (!vp) return;
    const vpWidth = vp.clientWidth;
    const vpHeight = vp.clientHeight;
    const targetZoom = 0.95; // Close-up walking view
    const newPanX = vpWidth / 2 - userLocation.x * targetZoom;
    const newPanY = vpHeight / 2 - userLocation.y * targetZoom;
    updateTransform(targetZoom, { x: newPanX, y: newPanY });
  };

  return (
    <div className="w-full h-full relative bg-canvas select-none overflow-hidden touch-none" ref={viewportRef}>

      {/* Zoomable & Pannable Container */}
      <div
        ref={interactionLayerRef}
        className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onDoubleClick={handleDoubleClick}
      >
        <div
          ref={containerRef}
          className="absolute origin-top-left w-[1580px] h-[2891px]"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transition: isInteracting || isDragging ? 'none' : 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
            willChange: 'transform',
          }}
        >
          {/* Static SVG Map Layer */}
          <div
            id="svg-map-wrapper"
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

            {/* Live User Location Beacon Marker */}
            {userLocation && userLocation.x !== null && userLocation.y !== null && (
              <LiveUserMarker
                x={userLocation.x}
                y={userLocation.y}
                accuracyRadius={userLocation.accuracyRadius}
                userName={userLocation.userName || 'YOU'}
                heading={userLocation.heading}
                isInsideCampus={userLocation.isInsideCampus}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Persistent Map Control Dock (Elevated above bottom nav) ── */}
      <div className="absolute bottom-4 right-3 sm:right-5 z-40 flex flex-col items-end gap-1.5 sm:gap-2 pointer-events-auto select-none max-w-[calc(100vw-24px)]">

        {/* Live GPS Telemetry Pill (when tracking active) */}
        {userLocation && userLocation.x !== null && userLocation.y !== null && (
          <div className="bg-card border-2 border-ink shadow-hard px-2 py-1 rounded-xs font-mono text-[8px] sm:text-[9px] text-ink space-y-0.5 max-w-[190px] sm:max-w-xs animate-in fade-in duration-200">
            <div className="flex items-center justify-between font-bold text-signal">
              <span>● LIVE GPS</span>
              <span className="text-[7.5px] sm:text-[8px] text-muted font-bold">±{Math.round(userLocation.accuracy || 0)}m</span>
            </div>
            <div className="text-[7.5px] sm:text-[8px] text-muted font-bold truncate">
              {userLocation.latitude?.toFixed(5)}, {userLocation.longitude?.toFixed(5)}
            </div>
            <div className="text-[7.5px] sm:text-[8px] text-muted font-bold truncate">
              SVG: ({userLocation.x}, {userLocation.y}) {userLocation.speed ? `| ${userLocation.speed.toFixed(1)}m/s` : ''}
            </div>
          </div>
        )}

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Center On Me Button */}
          {userLocation && userLocation.x !== null && userLocation.y !== null && (
            <button
              type="button"
              onClick={handleCenterOnUser}
              title="Center and zoom on your live position"
              className="flex items-center gap-1 font-mono text-[10px] sm:text-[11px] font-bold uppercase bg-signal hover:bg-signal/90 text-ink border-2 border-ink px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xs shadow-hard active:translate-y-[1px] active:shadow-none transition-all cursor-pointer whitespace-nowrap"
            >
              <LocateFixed className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-ink animate-pulse" />
              <span>CENTER ON ME</span>
            </button>
          )}

          {/* Smooth Zoom Controls (+ / -) */}
          <div className="flex flex-col border-2 border-ink bg-card rounded-xs shadow-hard overflow-hidden">
            <button
              type="button"
              onClick={handleZoomIn}
              title="Zoom In"
              aria-label="Zoom in on map"
              className="p-1.5 sm:p-2 hover:bg-paper active:bg-ink active:text-paper border-b border-ink text-ink transition-colors flex items-center justify-center cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              title="Zoom Out"
              aria-label="Zoom out on map"
              className="p-1.5 sm:p-2 hover:bg-paper active:bg-ink active:text-paper text-ink transition-colors flex items-center justify-center cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InteractiveMap;


