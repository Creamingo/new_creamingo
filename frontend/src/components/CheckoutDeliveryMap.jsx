'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const OSM_TILE = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

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
          className="relative z-0 h-[min(260px,45vh)] w-full"
          scrollWheelZoom={!readOnly}
          dragging
          doubleClickZoom={!readOnly}
          zoomControl
        >
          <TileLayer attribution={OSM_ATTR} url={OSM_TILE} />
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
