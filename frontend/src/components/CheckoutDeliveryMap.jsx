'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/* Default: Carto Voyager (no API key). Optional: MapTiler or Mapbox via NEXT_PUBLIC_* — see .env.example */
const CARTO_TILE = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const CARTO_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

/**
 * Raster tiles for Leaflet. Priority: MapTiler → Mapbox → Carto (free, no key).
 * Keys must be NEXT_PUBLIC_* so the browser can load tiles (same as any client map SDK).
 */
function getCheckoutBasemapTileConfig() {
  const maptilerKey =
    typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_MAPTILER_API_KEY?.trim() : '';
  if (maptilerKey) {
    const mapId = process.env.NEXT_PUBLIC_MAPTILER_MAP_ID?.trim() || 'streets-v2';
    return {
      url: `https://api.maptiler.com/maps/${mapId}/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(maptilerKey)}`,
      attribution:
        '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank" rel="noreferrer">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 22,
      detectRetina: true,
    };
  }

  const mapboxToken =
    typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() : '';
  if (mapboxToken) {
    const stylePath =
      process.env.NEXT_PUBLIC_MAPBOX_STYLE_PATH?.trim() || 'mapbox/streets-v12';
    return {
      url: `https://api.mapbox.com/styles/v1/${stylePath}/tiles/256/{z}/{x}/{y}{r}?access_token=${encodeURIComponent(mapboxToken)}`,
      attribution:
        '&copy; <a href="https://www.mapbox.com/about/maps/" target="_blank" rel="noreferrer">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 22,
      detectRetina: true,
    };
  }

  return {
    url: CARTO_TILE,
    attribution: CARTO_ATTR,
    maxZoom: 20,
    detectRetina: true,
    subdomains: 'abcd',
  };
}

function fixLeafletDefaultIconsOnce() {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

function RecenterWhenViewChanges({ centerLat, centerLng, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (Number.isFinite(centerLat) && Number.isFinite(centerLng)) {
      map.setView([centerLat, centerLng], zoom, { animate: true });
    }
  }, [centerLat, centerLng, zoom, map]);
  return null;
}

function MapClickToMovePin({ onPinMove, readOnly }) {
  useMapEvents({
    click(e) {
      if (!readOnly && typeof onPinMove === 'function') {
        onPinMove(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

/**
 * OpenStreetMap for checkout delivery pin.
 * - centerLat/centerLng + zoom: view (e.g. PIN service area).
 * - markerLat/markerLng: optional pin + accuracy circle.
 * - showTapHint: passive overlay (pointer-events none) so map stays interactive.
 */
export default function CheckoutDeliveryMap({
  centerLat,
  centerLng,
  zoom = 17,
  markerLat,
  markerLng,
  accuracyM,
  onPinMove,
  readOnly = false,
  showTapHint = true,
  className = '',
}) {
  const iconsFixed = useRef(false);
  useEffect(() => {
    if (!iconsFixed.current) {
      fixLeafletDefaultIconsOnce();
      iconsFixed.current = true;
    }
  }, []);

  if (!Number.isFinite(centerLat) || !Number.isFinite(centerLng)) {
    return null;
  }

  const hasMarker = Number.isFinite(markerLat) && Number.isFinite(markerLng);
  const showAccuracy =
    hasMarker &&
    typeof accuracyM === 'number' &&
    Number.isFinite(accuracyM) &&
    accuracyM >= 10 &&
    accuracyM <= 5000;

  const showOverlay = showTapHint && !readOnly;
  const tapHintLabel = hasMarker ? 'Tap to move pin' : 'Tap map to place pin';

  const basemap = getCheckoutBasemapTileConfig();

  return (
    <div
      role="region"
      aria-label="Delivery location map"
      className={`checkout-delivery-map isolate overflow-hidden rounded-lg border border-gray-200 dark:border-gray-600 [&_.leaflet-control-attribution]:pointer-events-none [&_.leaflet-control-attribution]:select-none [&_.leaflet-control-attribution]:whitespace-nowrap [&_.leaflet-control-attribution]:!mx-0 [&_.leaflet-control-attribution]:!max-w-none [&_.leaflet-control-attribution]:!rounded-tl [&_.leaflet-control-attribution]:!border-0 [&_.leaflet-control-attribution]:!bg-white/85 [&_.leaflet-control-attribution]:!px-1.5 [&_.leaflet-control-attribution]:!py-0.5 [&_.leaflet-control-attribution]:!text-[2px] [&_.leaflet-control-attribution]:!leading-none [&_.leaflet-control-attribution_a]:!text-[2px] [&_.leaflet-control-attribution]:!text-gray-600 dark:[&_.leaflet-control-attribution]:!bg-gray-900/80 dark:[&_.leaflet-control-attribution]:!text-gray-300 [&_.leaflet-control-attribution_a]:pointer-events-none ${className}`}
    >
      <div className="relative">
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={zoom}
          className="relative z-0 h-[min(143px,24.75vh)] w-full sm:h-[min(260px,45vh)]"
          scrollWheelZoom={!readOnly}
          dragging
          doubleClickZoom={!readOnly}
          zoomControl
        >
          <TileLayer
            attribution={basemap.attribution}
            url={basemap.url}
            maxZoom={basemap.maxZoom}
            detectRetina={basemap.detectRetina}
            {...(basemap.subdomains ? { subdomains: basemap.subdomains } : {})}
          />
          <RecenterWhenViewChanges centerLat={centerLat} centerLng={centerLng} zoom={zoom} />
          {showAccuracy ? (
            <Circle
              center={[markerLat, markerLng]}
              radius={accuracyM}
              pathOptions={{
                color: '#2563eb',
                weight: 1,
                fillColor: '#3b82f6',
                fillOpacity: 0.12,
              }}
            />
          ) : null}
          {hasMarker ? <Marker position={[markerLat, markerLng]} /> : null}
          <MapClickToMovePin onPinMove={onPinMove} readOnly={readOnly} />
        </MapContainer>
        {showOverlay ? (
          <div
            className="pointer-events-none absolute inset-0 z-[400] flex items-end justify-center pb-3"
            aria-hidden
          >
            <span className="rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-[2px] dark:bg-black/70">
              {tapHintLabel}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
