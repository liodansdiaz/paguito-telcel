import { useState } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  loading: boolean;
  error: string | null;
  obtained: boolean;
}

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    loading: false,
    error: null,
    obtained: false,
  });

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: 'Tu navegador no soporta geolocalización.',
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          loading: false,
          error: null,
          obtained: true,
        });
      },
      (err) => {
        let message = 'No se pudo obtener la ubicación.';
        if (err.code === err.PERMISSION_DENIED) {
          message = 'Permiso de ubicación denegado.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          message = 'Ubicación no disponible. Verifica que tu GPS esté activado.';
        } else if (err.code === err.TIMEOUT) {
          message = 'Tiempo de espera agotado. Intenta de nuevo.';
        }
        setState((prev) => ({ ...prev, loading: false, error: message, obtained: false }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Permite setear coordenadas manualmente (desde el mapa interactivo)
  const setManual = (latitude: number, longitude: number) => {
    setState({ latitude, longitude, loading: false, error: null, obtained: true });
  };

  const reset = () => {
    setState({ latitude: null, longitude: null, loading: false, error: null, obtained: false });
  };

  return { ...state, requestLocation, setManual, reset };
};
