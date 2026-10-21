import { useState } from 'react';
import type { LatLng } from './unitUtils';

export function useUserLocation() {
  const [location, setLocation] = useState<LatLng | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const request = () => {
    setError('');
    if (!('geolocation' in navigator)) {
      setError('Seu aparelho não oferece localização.');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      (err) => {
        setError(err.code === err.PERMISSION_DENIED ? 'Permissão de localização negada.' : 'Não foi possível obter sua localização.');
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  };

  return { location, error, loading, request };
}
