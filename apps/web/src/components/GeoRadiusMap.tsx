'use client';

import { useEffect, useRef } from 'react';

interface Props {
  latitude: number;
  longitude: number;
  radius: number; // km
}

export function GeoRadiusMap({ latitude, longitude, radius }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Dynamically import leaflet (SSR-safe)
    import('leaflet').then((L) => {
      // Fix default marker icons (webpack issue)
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapInstanceRef.current) {
        const map = L.map(mapRef.current!, {
          zoomControl: true,
          scrollWheelZoom: false,
          dragging: true,
          attributionControl: false,
        }).setView([latitude, longitude], getZoomForRadius(radius));

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap',
        }).addTo(map);

        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;

      // Remove old circle and marker
      if (circleRef.current) circleRef.current.remove();
      if (markerRef.current) markerRef.current.remove();

      // Draw radius circle
      circleRef.current = L.circle([latitude, longitude], {
        radius: radius * 1000, // meters
        color: '#d97706',
        fillColor: '#fbbf24',
        fillOpacity: 0.15,
        weight: 2,
      }).addTo(map);

      // Center marker
      markerRef.current = L.circleMarker([latitude, longitude], {
        radius: 6,
        color: '#d97706',
        fillColor: '#d97706',
        fillOpacity: 1,
        weight: 2,
      }).addTo(map);

      map.setView([latitude, longitude], getZoomForRadius(radius));
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update circle and zoom when radius or position changes (without recreating the map)
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    import('leaflet').then((L) => {
      const map = mapInstanceRef.current;

      if (circleRef.current) circleRef.current.remove();
      if (markerRef.current) markerRef.current.remove();

      circleRef.current = L.circle([latitude, longitude], {
        radius: radius * 1000,
        color: '#d97706',
        fillColor: '#fbbf24',
        fillOpacity: 0.15,
        weight: 2,
      }).addTo(map);

      markerRef.current = L.circleMarker([latitude, longitude], {
        radius: 6,
        color: '#d97706',
        fillColor: '#d97706',
        fillOpacity: 1,
        weight: 2,
      }).addTo(map);

      map.setView([latitude, longitude], getZoomForRadius(radius));
    });
  }, [latitude, longitude, radius]);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <div
        ref={mapRef}
        className="w-full rounded-xl overflow-hidden border border-amber-200"
        style={{ height: 220 }}
      />
    </>
  );
}

function getZoomForRadius(km: number): number {
  if (km <= 5) return 12;
  if (km <= 10) return 11;
  if (km <= 20) return 10;
  return 8;
}
