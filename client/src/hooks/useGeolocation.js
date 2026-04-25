import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook for handling browser geolocation
 * Requests permission and watches position continuously
 * 
 * @param {boolean} enabled - Whether to enable tracking
 * @param {number} timeout - Timeout in milliseconds for geolocation
 * @returns {Object} - { coords, error, isTracking }
 */
export const useGeolocation = (enabled = false, timeout = 5000) => {
    const [coords, setCoords] = useState(null);
    const [error, setError] = useState(null);
    const [isTracking, setIsTracking] = useState(false);
    const watchIdRef = useRef(null);
    const permissionRequestedRef = useRef(false);

    useEffect(() => {
        if (!enabled) {
            if (watchIdRef.current) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
            setIsTracking(false);
            return;
        }

        if (!navigator.geolocation) {
            setError('Geolocation is not supported by this browser');
            return;
        }

        // Request permission if not already requested
        if (!permissionRequestedRef.current) {
            permissionRequestedRef.current = true;

            // Get initial position with permission prompt
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude, accuracy } = position.coords;
                    setCoords({ latitude, longitude, accuracy });
                    setError(null);
                    setIsTracking(true);

                    // Start watching position
                    watchIdRef.current = navigator.geolocation.watchPosition(
                        (position) => {
                            const { latitude, longitude, accuracy } = position.coords;
                            setCoords({ latitude, longitude, accuracy });
                        },
                        (err) => {
                            console.error('Geolocation error:', err);
                            setError(err.message);
                        },
                        {
                            enableHighAccuracy: true,
                            timeout: timeout,
                            maximumAge: 0
                        }
                    );
                },
                (err) => {
                    console.error('Geolocation permission denied:', err);
                    setError(err.message);
                    setIsTracking(false);
                },
                {
                    enableHighAccuracy: true,
                    timeout: timeout,
                    maximumAge: 0
                }
            );
        }

        return () => {
            if (watchIdRef.current) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, [enabled, timeout]);

    const stopTracking = () => {
        if (watchIdRef.current) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        setIsTracking(false);
        setCoords(null);
    };

    return { coords, error, isTracking, stopTracking };
};
