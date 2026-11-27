'use client';

import { useState, useEffect, useCallback } from 'react';
import { getUserDistrict, UB_DISTRICTS, type Coordinates } from '@/lib/location/userLocation';

interface LocationState {
  location: Coordinates | null;
  district: { key: string; label: string; distance: number } | null;
  loading: boolean;
  error: string | null;
  permissionDenied: boolean;
  refresh: () => void;
  setManualDistrict: (key: string) => void;
}

const CACHE_KEY = 'esl-user-location';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

function getCachedLocation(): { location: Coordinates; district: { key: string; label: string; distance: number }; timestamp: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Date.now() - data.timestamp < CACHE_DURATION) return data;
    localStorage.removeItem(CACHE_KEY);
  } catch {}
  return null;
}

function cacheLocation(location: Coordinates, district: { key: string; label: string; distance: number }) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ location, district, timestamp: Date.now() }));
  } catch {}
}

export function useUserLocation(): LocationState {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [district, setDistrict] = useState<{ key: string; label: string; distance: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const detectLocation = useCallback(() => {
    // Check cache first
    const cached = getCachedLocation();
    if (cached) {
      setLocation(cached.location);
      setDistrict(cached.district);
      setLoading(false);
      return;
    }

    if (!navigator.geolocation) {
      setError('Geolocation дэмжигдэхгүй');
      setLoading(false);
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: Coordinates = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const dist = getUserDistrict(coords.lat, coords.lng);
        setLocation(coords);
        setDistrict(dist);
        setError(null);
        setPermissionDenied(false);
        setLoading(false);
        cacheLocation(coords, dist);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setPermissionDenied(true);
          setError('Байршил зөвшөөрөгдөөгүй');
        } else {
          setError('Байршил тодорхойлж чадсангүй');
        }
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }, []);

  useEffect(() => {
    const deferred = window.setTimeout(() => {
      detectLocation();
    }, 0);
    return () => window.clearTimeout(deferred);
  }, [detectLocation]);

  const setManualDistrict = useCallback((key: string) => {
    const d = UB_DISTRICTS[key];
    if (d) {
      const coords = { lat: d.lat, lng: d.lng };
      const dist = { key, label: d.label, distance: 0 };
      setLocation(coords);
      setDistrict(dist);
      setPermissionDenied(false);
      setError(null);
      cacheLocation(coords, dist);
    }
  }, []);

  return { location, district, loading, error, permissionDenied, refresh: detectLocation, setManualDistrict };
}
