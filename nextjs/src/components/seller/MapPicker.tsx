'use client';

import { useEffect, useRef, useState } from 'react';

interface MapPickerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

type LeafletPosition = [number, number] | { lat: number; lng: number };
type LeafletLatLng = { lat: number; lng: number };
type LeafletClickEvent = { latlng: LeafletLatLng };
type LeafletIcon = object;

type LeafletMap = {
  setView(center: [number, number], zoom: number): LeafletMap;
  on(event: 'click', handler: (event: LeafletClickEvent) => void): void;
  remove(): void;
};

type LeafletMarker = {
  addTo(map: LeafletMap): LeafletMarker;
  on(event: 'dragend', handler: () => void): void;
  getLatLng(): LeafletLatLng;
  setLatLng(position: LeafletPosition): void;
};

type LeafletApi = {
  map(element: HTMLElement): LeafletMap;
  tileLayer(url: string, options: { attribution: string }): { addTo(map: LeafletMap): void };
  divIcon(options: {
    html: string;
    iconSize: [number, number];
    iconAnchor: [number, number];
    className: string;
  }): LeafletIcon;
  marker(position: LeafletPosition, options: { draggable: boolean; icon: LeafletIcon }): LeafletMarker;
};

declare global {
  interface Window {
    L?: LeafletApi;
  }
}

/**
 * Map picker using Leaflet (loaded via CDN to avoid SSR issues).
 * User can click map or drag marker to select location.
 */
export function MapPicker({ lat, lng, onChange }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObjRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const initialCoordsRef = useRef({ lat, lng });
  const onChangeRef = useRef(onChange);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!mapRef.current || mapObjRef.current) return;

    // Load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Load Leaflet JS
    const loadLeaflet = (): Promise<LeafletApi> => {
      if (window.L) return Promise.resolve(window.L);

      return new Promise((resolve) => {
        if (document.getElementById('leaflet-js')) {
          const check = setInterval(() => {
            if (window.L) { clearInterval(check); resolve(window.L); }
          }, 50);
          return;
        }
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => {
          if (window.L) resolve(window.L);
        };
        document.head.appendChild(script);
      });
    };

    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled || !mapRef.current) return;
      const { lat: initialLat, lng: initialLng } = initialCoordsRef.current;
      const map = L.map(mapRef.current).setView([initialLat, initialLng], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
      }).addTo(map);

      const icon = L.divIcon({
        html: '<div style="width:24px;height:24px;background:#E8242C;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 24],
        className: '',
      });

      const marker = L.marker([initialLat, initialLng], { draggable: true, icon }).addTo(map);
      markerRef.current = marker;

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onChangeRef.current(parseFloat(pos.lat.toFixed(6)), parseFloat(pos.lng.toFixed(6)));
      });

      map.on('click', (e) => {
        const pos = e.latlng;
        marker.setLatLng(pos);
        onChangeRef.current(parseFloat(pos.lat.toFixed(6)), parseFloat(pos.lng.toFixed(6)));
      });

      mapObjRef.current = map;
      setLoaded(true);
    });

    return () => {
      cancelled = true;
      mapObjRef.current?.remove();
      mapObjRef.current = null;
    };
  }, []);

  // Update marker when coords change externally
  useEffect(() => {
    if (markerRef.current && loaded) {
      markerRef.current.setLatLng([lat, lng]);
    }
  }, [lat, lng, loaded]);

  return (
    <div>
      <div
        ref={mapRef}
        style={{
          height: '220px',
          borderRadius: '10px',
          overflow: 'hidden',
          border: '0.5px solid #3D3D3D',
          backgroundColor: 'var(--esl-bg-elevated)',
        }}
      />
      {!loaded && (
        <p style={{ fontSize: '12px', color: '#777', marginTop: '4px', textAlign: 'center' }}>
          Газрын зураг ачааллаж байна...
        </p>
      )}
    </div>
  );
}
