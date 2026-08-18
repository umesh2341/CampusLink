import React, { useState, useRef, useEffect } from 'react';
import mapSvg from '../assets/campus-map.svg?raw';
import MapMarker from './MapMarker';
import { buildingCoords } from '../lib/buildingCoords';
import useAppStore from '../store/useAppStore';

function InteractiveMap({ buildings, selectedBuilding, onSelectBuilding, activeEventsMap, lastViewedMap = {} }) {
  const viewportRef = useRef(null);
  const containerRef = useRef(null);
  const svgWrapperRef = useRef(null);
  const interactionLayerRef = useRef(null);

  // Read saved map transform state from Zustand store
  const savedZoom = useAppStore(s => s.mapZoom);
  const savedPan  = useAppStore(s => s.mapPan);
  const setMapTransform = useAppStore(s => s.setMapTransform);

  const [zoom, setZoomState] = useState(() => savedZoom ?? 0.25);
  const [pan, setPanState]   = useState(() => savedPan ?? { x: 0, y: 10 });
  const [isDragging, setIsDragging] = useState(false);

  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });
  const dragDistanceRef = useRef(0);
  const pinchDistRef = useRef(0);
  const pinchCenterRef = useRef({ x: 0, y: 0 });

  const MAX_ZOOM = 1.8;
  const getMinZoom = () => {
    if (!viewportRef.current) return 0.25;
    const vWidth = viewportRef.current.clientWidth;
    return Math.max(0.25, vWidth / 1576);
  };

  const updateTransform = (newZoom, newPan) => {
    const minZ = getMinZoom();
    const clampedZoom = Math.min(MAX_ZOOM, Math.max(minZ, newZoom));

    let clampedPan = newPan;
    if (viewportRef.current) {
      const vWidth = viewportRef.current.clientWidth;
      const vHeight = viewportRef.current.clientHeight;
      const mapWidth = 1576 * clampedZoom;
      const mapHeight = 2893 * clampedZoom;

      // Horizontal clamping: provide clearance so left/right outer road networks & boundaries are fully visible
      let clampedX = newPan.x;
      const horizontalMargin = 40;

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

      // Vertical clamping: provide clearance so floating SearchBar & Bottom Nav don't obscure map shapes
      let clampedY = newPan.y;
      const topMargin = 75;    // Clearance for floating SearchBar at top
      const bottomMargin = 70; // Clearance for Bottom Navigation Bar at bottom

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
      const fitZoom = getMinZoom();
      const initialPan = { x: 0, y: 70 };
      updateTransform(fitZoom, initialPan);
    }
  }, []);

  // Desktop Mouse Scroll Wheel Zoom centered on cursor position
  useEffect(() => {
    const viewportEl = viewportRef.current;
    if (!viewportEl) return;

    const handleWheel = (e) => {
      e.preventDefault();
      const rect = viewportEl.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomDelta = -e.deltaY * 0.0012;
      const minZ = getMinZoom();
      const newZoom = Math.min(MAX_ZOOM, Math.max(minZ, zoom * (1 + zoomDelta)));

      if (Math.abs(newZoom - zoom) < 0.001) return;

      const scaleRatio = newZoom / zoom;
      const newPanX = mouseX - (mouseX - pan.x) * scaleRatio;
      const newPanY = mouseY - (mouseY - pan.y) * scaleRatio;

      updateTransform(newZoom, { x: newPanX, y: newPanY });
    };

    viewportEl.addEventListener('wheel', handleWheel, { passive: false });
    return () => viewportEl.removeEventListener('wheel', handleWheel);
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
          // If the user was dragging (distance > 5px), do not treat as a building tap
          if (dragDistanceRef.current > 5) return;
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

        const focusZoom = Math.min(MAX_ZOOM, Math.max(0.5, (vWidth / 1580) * 1.6));
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
  };

  // Mobile Touch Drag & Pinch-to-Zoom Handlers
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      panStart.current = { ...pan };
      dragDistanceRef.current = 0;
    } else if (e.touches.length === 2) {
      setIsDragging(true);
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      pinchDistRef.current = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      pinchCenterRef.current = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      };
      panStart.current = { ...pan };
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
      if (pinchDistRef.current > 0) {
        const scaleFactor = currentDist / pinchDistRef.current;
        const minZ = getMinZoom();
        const newZoom = Math.min(MAX_ZOOM, Math.max(minZ, zoom * scaleFactor));
        if (viewportRef.current) {
          const rect = viewportRef.current.getBoundingClientRect();
          const midX = pinchCenterRef.current.x - rect.left;
          const midY = pinchCenterRef.current.y - rect.top;
          const scaleRatio = newZoom / zoom;
          const newPanX = midX - (midX - pan.x) * scaleRatio;
          const newPanY = midY - (midY - pan.y) * scaleRatio;
          updateTransform(newZoom, { x: newPanX, y: newPanY });
        }
        pinchDistRef.current = currentDist;
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    pinchDistRef.current = 0;
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

  return (
    <div className="w-full h-full relative bg-canvas select-none overflow-hidden map-perspective-tilt touch-none" ref={viewportRef}>
      {/* Zoomable & Pannable Container */}
      <div
        ref={interactionLayerRef}
        className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default InteractiveMap;
