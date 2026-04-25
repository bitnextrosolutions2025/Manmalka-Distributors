import { useEffect, useState } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
import socketService from '../services/socketService';
import locationAPI from '../services/locationService';
import { throttle } from '../utils/locationUtils';

export const LocationTracker = ({ isLoggedIn, userId, onPermissionDenied }) => {
    const [trackingEnabled, setTrackingEnabled] = useState(false);
    const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState('prompt');
    
    const { coords, error: geoError, isTracking, stopTracking } = useGeolocation(
        trackingEnabled,
        15000 // FIX 1: Increased timeout to 15 seconds to give devices time to connect
    );

    const throttledLocationUpdate = throttle(async (latitude, longitude, accuracy) => {
        try {
            await locationAPI.updateLocation(latitude, longitude, accuracy);
            socketService.updateLocation(latitude, longitude, accuracy);
        } catch (error) {
            console.error('Failed to update location:', error);
        }
    }, 300000); 

    useEffect(() => {
        if (navigator.permissions && navigator.permissions.query) {
            navigator.permissions.query({ name: 'geolocation' }).then((result) => {
                setPermissionStatus(result.state);
                
                if (result.state === 'denied') {
                    onPermissionDenied?.();
                }

                // NEW: Listen for the user clicking "Allow" or "Block" in the browser popup
                result.onchange = () => {
                    setPermissionStatus(result.state);
                    if (result.state === 'denied') {
                        onPermissionDenied?.();
                    }
                };
            });
        }
    }, [onPermissionDenied]);

   useEffect(() => {
        if (!isLoggedIn) {
            setShowPermissionPrompt(false);
            setTrackingEnabled(false);
            stopTracking();
            return;
        }

        // Only show the prompt if a decision hasn't been made yet
        if (permissionStatus === 'prompt') {
            setShowPermissionPrompt(true);
        } 
        // If permission is already granted, hide the modal and start tracking
        else if (permissionStatus === 'granted') {
            setShowPermissionPrompt(false);
            setTrackingEnabled(true);
        }
    }, [isLoggedIn, permissionStatus, stopTracking]);

    useEffect(() => {
        if (coords && trackingEnabled) {
            throttledLocationUpdate(coords.latitude, coords.longitude, coords.accuracy);
        }
    }, [coords, trackingEnabled]);

    /**
     * FIX 2: Handle specific Geolocation error codes
     */
    useEffect(() => {
        if (geoError && isLoggedIn) {
            console.error('Geolocation error:', geoError);
            
            // Error Code 1: PERMISSION_DENIED
            if (geoError.code === 1) {
                onPermissionDenied?.();
            } 
            // Error Code 3: TIMEOUT
            else if (geoError.code === 3) {
                console.warn('Location request timed out. Device is struggling to find a signal.');
                // Do NOT call onPermissionDenied here. 
                // Depending on how useGeolocation is written, it might retry automatically.
            }
            // Error Code 2: POSITION_UNAVAILABLE
            else if (geoError.code === 2) {
                console.warn('Location position unavailable (e.g., GPS is turned off or blocked).');
            }
        }
    }, [geoError, isLoggedIn, onPermissionDenied]);

    const handleEnableTracking = () => {
        setTrackingEnabled(true);
        setShowPermissionPrompt(false);
    };

    const handleDenyPermission = () => {
        setShowPermissionPrompt(false);
        setTrackingEnabled(false);
        onPermissionDenied?.();
    };

    if (!isLoggedIn) return null;

    if (showPermissionPrompt && permissionStatus !== 'denied') {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 pointer-events-auto">
                <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-lg">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                        Location Permission Required
                    </h3>
                    <p className="text-gray-600 mb-4">
                        We'd like to track your location to help admins monitor deliveries and orders. Your location will only be visible to authorized admins.
                    </p>
                    <p className="text-sm text-gray-500 mb-6">
                        Updates are sent every 5 minutes to minimize battery usage.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={handleDenyPermission}
                            className="flex-1 px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                        >
                            Not Now
                        </button>
                        <button
                            onClick={handleEnableTracking}
                            className="flex-1 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
                        >
                            Allow Location
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (trackingEnabled) {
        return (
            <div className="fixed bottom-4 right-4 bg-green-100 border border-green-300 rounded-lg p-3 text-sm text-green-800 pointer-events-none">
                <p className="font-semibold">Location Tracking Active</p>
                {coords && (
                    <p className="text-xs mt-1">
                        Lat:  {coords.latitude.toFixed(4)}, Lon: {coords.longitude.toFixed(4)}
                    </p>
                )}
            </div>
        );
    }

    return null;
};

export default LocationTracker;