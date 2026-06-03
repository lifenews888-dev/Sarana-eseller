'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface Props {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number, address?: string) => void;
  height?: number;
}

/* Google Maps types loaded dynamically — use any for map objects */

export function GoogleMapPicker({ lat, lng, onChange, height = 280 }: Props) {
  const mapRef    = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapObj    = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);
  const [loading, setLoading]       = useState(true);
  const [address, setAddress]       = useState('');
  const [searching, setSearching]   = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ placeId: string; mainText: string; secondaryText: string }>>([]);
  const [token] = useState(() => Math.random().toString(36).slice(2));

  const initMap = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = (window as any).google;
    if (!mapRef.current || !g?.maps) return;

    const map = new g.maps.Map(mapRef.current, {
      center:            { lat, lng },
      zoom:              15,
      mapTypeControl:    false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
      ],
    });

    const marker = new g.maps.Marker({
      position:  { lat, lng },
      map,
      draggable: true,
      icon: {
        path:         g.maps.SymbolPath.CIRCLE,
        scale:        10,
        fillColor:    '#E8242C',
        fillOpacity:  1,
        strokeColor:  '#ffffff',
        strokeWeight: 2,
      },
    });

    // Marker drag
    marker.addListener('dragend', async () => {
      const pos = marker.getPosition();
      if (!pos) return;
      const nlat = pos.lat();
      const nlng = pos.lng();
      onChange(nlat, nlng);
      try {
        const res = await fetch(`/api/maps/reverse?lat=${nlat}&lng=${nlng}`);
        const d = await res.json();
        if (d.address) setAddress(d.address);
      } catch {}
    });

    // Map click
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.addListener('click', async (e: any) => {
      if (!e.latLng) return;
      const nlat = e.latLng.lat();
      const nlng = e.latLng.lng();
      marker.setPosition({ lat: nlat, lng: nlng });
      onChange(nlat, nlng);
      try {
        const res = await fetch(`/api/maps/reverse?lat=${nlat}&lng=${nlng}`);
        const d = await res.json();
        if (d.address) setAddress(d.address);
      } catch {}
    });

    mapObj.current = map;
    markerRef.current = marker;
    setLoading(false);
  }, [lat, lng, onChange]);

  // Load Google Maps script
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).google?.maps) {
      const timer = window.setTimeout(initMap, 0);
      return () => window.clearTimeout(timer);
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&language=mn`;
    script.async = true;
    script.onload = initMap;
    document.head.appendChild(script);
    return () => {
      script.onload = null;
    };
  }, [initMap]);

  // Address search
  const handleSearch = useCallback(async (q: string) => {
    setAddress(q);
    if (q.length < 2) { setSuggestions([]); return; }

    try {
      const res = await fetch(`/api/maps/places?q=${encodeURIComponent(q)}&token=${token}`);
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch {
      setSuggestions([]);
    }
  }, [token]);

  const selectSuggestion = useCallback(async (s: { placeId: string }) => {
    setSuggestions([]);
    setSearching(true);

    try {
      const res = await fetch(`/api/maps/place-details?placeId=${s.placeId}&token=${token}`);
      const data = await res.json();

      if (data.lat && mapObj.current && markerRef.current) {
        const pos = { lat: data.lat, lng: data.lng };
        mapObj.current.panTo(pos);
        mapObj.current.setZoom(17);
        markerRef.current.setPosition(pos);
        onChange(data.lat, data.lng, data.address);
        setAddress(data.address);
      }
    } catch {}
    setSearching(false);
  }, [token, onChange]);

  // Auto-verify
  const autoVerify = useCallback(async () => {
    if (!address) return;
    setSearching(true);
    try {
      const res = await fetch('/api/maps/geocode', {
        method: 'POST',
        body: JSON.stringify({ address }),
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();

      if (data.lat && mapObj.current && markerRef.current) {
        const pos = { lat: data.lat, lng: data.lng };
        mapObj.current.panTo(pos);
        mapObj.current.setZoom(17);
        markerRef.current.setPosition(pos);
        onChange(data.lat, data.lng, data.formattedAddr);
      }
    } catch {}
    setSearching(false);
  }, [address, onChange]);

  return (
    <div style={{ position: 'relative' }}>
      {/* Search bar */}
      <div style={{ position: 'relative', marginBottom: 8 }}>
        <div style={{
          display: 'flex', gap: 0,
          border: '1px solid #3D3D3D',
          borderRadius: 10,
          background: 'var(--esl-bg-elevated)',
          overflow: 'hidden',
        }}>
          <input
            value={address}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Хаяг хайх... жш: Байсан Хилл, 2-р давхар"
            style={{
              flex: 1, padding: '8px 12px', border: 'none',
              background: 'transparent', outline: 'none',
              fontSize: 13, color: '#FFF',
            }}
          />
          <button onClick={autoVerify} disabled={searching || !address}
            style={{
              padding: '0 14px', border: 'none', cursor: 'pointer',
              background: '#E8242C', color: '#fff', fontSize: 12, fontWeight: 500,
              opacity: (!address || searching) ? 0.5 : 1,
            }}>
            {searching ? '...' : 'Хайх'}
          </button>
        </div>

        {/* Autocomplete dropdown */}
        {suggestions.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
            background: 'var(--esl-bg-card)',
            border: '1px solid #3D3D3D',
            borderRadius: '0 0 10px 10px',
            overflow: 'hidden',
          }}>
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => selectSuggestion(s)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '9px 12px', border: 'none', background: 'none',
                  cursor: 'pointer', borderBottom: '0.5px solid #2A2A2A',
                }}>
                <p style={{ fontSize: 13, color: '#FFF', margin: 0 }}>{s.mainText}</p>
                <p style={{ fontSize: 11, color: '#777', margin: 0 }}>{s.secondaryText}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div style={{
        position: 'relative', borderRadius: 10, overflow: 'hidden',
        border: '1px solid #3D3D3D', height,
      }}>
        {loading && (
          <div style={{
            position: 'absolute', inset: 0, background: 'var(--esl-bg-elevated)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, color: '#777',
          }}>
            Газрын зураг ачааллаж байна...
          </div>
        )}
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      </div>

      {/* Coord display */}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        {[
          { label: 'Өргөрөг (lat)', value: lat.toFixed(6) },
          { label: 'Уртраг (lng)', value: lng.toFixed(6) },
        ].map(f => (
          <div key={f.label} style={{ flex: 1 }}>
            <p style={{ fontSize: 10, color: '#777', marginBottom: 3 }}>{f.label}</p>
            <div style={{
              padding: '6px 10px', border: '1px solid #3D3D3D',
              borderRadius: 8, background: 'var(--esl-bg-elevated)',
              fontFamily: 'monospace', fontSize: 12, color: '#FFF',
            }}>
              {f.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
