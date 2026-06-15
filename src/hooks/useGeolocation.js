import { useState, useEffect } from 'react';

const HYDERABAD_PK = [25.396, 68.374];

export default function useGeolocation(fallback = HYDERABAD_PK) {
    const [location, setLocation] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [permissionDenied, setPermissionDenied] = useState(false);

    useEffect(() => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser.');
            setLocation(fallback);
            setLoading(false);
            return;
        }

        const onSuccess = (pos) => {
            setLocation([pos.coords.latitude, pos.coords.longitude]);
            setLoading(false);
            setError(null);
        };

        const onError = (err) => {
            if (err.code === 1) {
                setPermissionDenied(true);
                setError('Location permission denied. Please allow location access in your browser settings.');
            } else if (err.code === 2) {
                setError('Location unavailable. Trying without high accuracy...');
                navigator.geolocation.getCurrentPosition(onSuccess, (e2) => {
                    setError('Could not get your location. Showing default location.');
                    setLocation(fallback);
                }, { timeout: 10000, maximumAge: 60000 });
                return;
            } else {
                setError('Location request timed out. Trying again...');
                navigator.geolocation.getCurrentPosition(onSuccess, () => {
                    setError('Could not get your location. Showing default location.');
                    setLocation(fallback);
                }, { timeout: 15000, maximumAge: 60000 });
                return;
            }
            setLocation(fallback);
            setLoading(false);
        };

        navigator.geolocation.getCurrentPosition(onSuccess, onError, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
        });

        const watchId = navigator.geolocation.watchPosition(onSuccess, () => { }, {
            enableHighAccuracy: false,
            timeout: 15000,
            maximumAge: 10000,
        });

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    return { location, error, loading, permissionDenied };
}
