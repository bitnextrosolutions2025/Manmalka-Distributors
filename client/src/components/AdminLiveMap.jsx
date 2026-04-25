import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import socketService from '../services/socketService';
import locationAPI from '../services/locationService';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

/**
 * AdminLiveMap Component
 * Displays all active users on a live map with real-time updates
 * Only accessible to admins via AdminProtectedRoute
 */
export const AdminLiveMap = () => {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const markersRef = useRef(new Map()); // Store markers by userId
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [userCount, setUserCount] = useState(0);
    const [lastUpdate, setLastUpdate] = useState(null);

    /**
     * Initialize map on component mount
     */
    useEffect(() => {
          console.log('hello')
        if (!mapContainerRef.current) return;

        // Create map centered on default location (adjust as needed)
        const map = L.map(mapContainerRef.current).setView([20, 0], 2);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);

        mapRef.current = map;
        setLoading(false);

        return () => {
            map.remove();
        };
    }, []);

    /**
     * Request initial locations from server
     */
    useEffect(() => {
        console.log('hello')
        const fetchInitialLocations = async () => {
            try {
                const response = await locationAPI.getAllUsersLocations();
                if (response.success && response.data) {
                    response.data.forEach(location => {
                        addOrUpdateMarker(location);
                    });
                    setUserCount(response.count);
                    setLastUpdate(new Date());
                }
            } catch (err) {
                console.error('Error fetching initial locations:', err);
                setError('Failed to load user locations');
            }
        };

        fetchInitialLocations();
    }, []);

    /**
     * Connect to Socket.IO for real-time updates
     */
    useEffect(() => {
          console.log('hello')
        const serverUrl = import.meta.env.VITE_API_URL?.split('/api')[0] || 'http://localhost:5000';
        socketService.connect(serverUrl);

        // Request all active locations on connection
        socketService.requestAllLocations();

        // Listen for location updates
        socketService.onLocationUpdated((data) => {
            addOrUpdateMarker({
                user: { username: data.username, _id: data.userId },
                latitude: data.latitude,
                longitude: data.longitude,
                accuracy: data.accuracy,
                lastUpdated: data.lastUpdated,
                status: data.status
            });
            setLastUpdate(new Date());
        });

        // Listen for user offline events
        socketService.onUserOffline((data) => {
            removeMarker(data.userId);
        });

        // Listen for all users data
        socketService.onAllUsersData((response) => {
            if (response.success && response.data) {
                // Clear existing markers
                markersRef.current.forEach(marker => marker.remove());
                markersRef.current.clear();

                // Add all markers
                response.data.forEach(location => {
                    addOrUpdateMarker(location);
                });
                setUserCount(response.count);
                setLastUpdate(new Date());
            }
        });

        return () => {
            // Cleanup will be handled by socketService
        };
    }, []);

    /**
     * Add or update a user marker on the map
     */
    const addOrUpdateMarker = (location) => {
        if (!mapRef.current || !location) return;

        const userId = location.user._id;
        const { latitude, longitude, accuracy } = location;

        // Validate coordinates
        if (!latitude || !longitude || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            return;
        }

        // Remove old marker if exists
        if (markersRef.current.has(userId)) {
            markersRef.current.get(userId).remove();
        }

        // Create popup content
        const popupContent = `
            <div class="p-2">
                <h3 class="font-bold text-gray-800">${location.user.username}</h3>
                <p class="text-sm text-gray-600">${location.user.email}</p>
                <p class="text-xs text-gray-500">
                    <span class="inline-block w-2 h-2 rounded-full ${location.status === 'online' ? 'bg-green-500' : 'bg-gray-400'} mr-1"></span>
                    ${location.status === 'online' ? 'Online' : 'Offline'}
                </p>
                <p class="text-xs text-gray-500 mt-1">
                    Last: ${new Date(location.lastUpdated).toLocaleTimeString()}
                </p>
                ${accuracy ? `<p class="text-xs text-gray-400">Accuracy: ${(accuracy / 1000).toFixed(2)}km</p>` : ''}
            </div>
        `;

        // Create marker with custom styling
        const markerColor = location.status === 'online' ? '#22c55e' : '#6b7280';
        const marker = L.circleMarker([latitude, longitude], {
            radius: 8,
            fillColor: markerColor,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        })
            .bindPopup(popupContent)
            .addTo(mapRef.current);

        markersRef.current.set(userId, marker);

        // Auto-fit map bounds if first marker
        if (markersRef.current.size === 1) {
            mapRef.current.setView([latitude, longitude], 12);
        }
    };

    /**
     * Remove a user marker from the map
     */
    const removeMarker = (userId) => {
        if (markersRef.current.has(userId)) {
            markersRef.current.get(userId).remove();
            markersRef.current.delete(userId);
        }
    };

    /**
     * Refetch all locations
     */
    const handleRefresh = async () => {
        try {
            setError(null);
            socketService.requestAllLocations();
        } catch (err) {
            setError('Failed to refresh locations');
        }
    };

    if (loading) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading map...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-screen flex flex-col bg-white">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Live User Tracking</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {userCount} user{userCount !== 1 ? 's' : ''} online • Last updated: {lastUpdate?.toLocaleTimeString()}
                        </p>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                </div>

                {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}
            </div>

            {/* Map Container */}
            <div className="flex-1 relative">
                <div ref={mapContainerRef} className="w-full h-full" />

                {/* Info Panel */}
                <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs z-400 pointer-events-auto">
                    <h3 className="font-bold text-gray-800 mb-3">Map Legend</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full bg-green-500"></span>
                            <span className="text-gray-700">Online Users</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full bg-gray-400"></span>
                            <span className="text-gray-700">Offline Users</span>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                        Click on any marker to see user details
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminLiveMap;
