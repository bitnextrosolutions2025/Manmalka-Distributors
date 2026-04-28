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
 */
export const AdminLiveMap = () => {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const markersRef = useRef(new Map());
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userCount, setUserCount] = useState(0);
    const [lastUpdate, setLastUpdate] = useState(null);

    // 1. Initialize Map
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        // Initialize map
        const map = L.map(mapContainerRef.current, {
            zoomControl: false // We can position it manually or leave default
        }).setView([20, 0], 2);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);
        
        // Add zoom control to bottom right so it doesn't overlap our UI
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        mapRef.current = map;
        setLoading(false);

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // 2. Fetch Data & Connect Socket (Runs after map is initialized)
    useEffect(() => {
        if (!mapRef.current) return;

        const initializeDataAndSockets = async () => {
            try {
                // Fetch initial locations
                const response = await locationAPI.getAllUsersLocations();
                if (response.success && response.data) {
                    response.data.forEach(location => addOrUpdateMarker(location));
                    setUserCount(response.count);
                    setLastUpdate(new Date());
                }

                // Connect Sockets
                const serverUrl = import.meta.env.VITE_API_URL?.split('/api')[0] || 'http://localhost:5000';
                socketService.connect(serverUrl);
                socketService.requestAllLocations();

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

                socketService.onUserOffline((data) => {
                    removeMarker(data.userId);
                    setUserCount(prev => Math.max(0, prev - 1));
                });

                socketService.onAllUsersData((res) => {
                    if (res.success && res.data) {
                        // Clear stale markers
                        markersRef.current.forEach(marker => marker.remove());
                        markersRef.current.clear();

                        res.data.forEach(location => addOrUpdateMarker(location));
                        setUserCount(res.count);
                        setLastUpdate(new Date());
                    }
                });

            } catch (err) {
                console.error('Error initializing map data:', err);
                setError('Failed to load user locations. Please try again.');
            }
        };

        initializeDataAndSockets();

        return () => {
            // Unbind socket events on cleanup to prevent memory leaks
            // Make sure your socketService has a way to remove listeners or disconnect
        };
    }, [loading]); // Only run after loading is false (map is ready)

    /**
     * Add or update a user marker efficiently
     */
    const addOrUpdateMarker = (location) => {
        if (!mapRef.current || !location) return;

        const userId = location.user._id;
        const { latitude, longitude, accuracy } = location;

        if (!latitude || !longitude || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            return;
        }

        const markerColor = location.status === 'online' ? '#22c55e' : '#9ca3af';
        const popupContent = `
            <div class="p-1 min-w-37.5">
                <div class="flex items-center gap-2 mb-1">
                    <div class="w-2.5 h-2.5 rounded-full ${location.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}"></div>
                    <h3 class="font-bold text-gray-800 text-sm m-0">${location.user.username}</h3>
                </div>
                ${location.user.email ? `<p class="text-xs text-gray-500 mb-2">${location.user.email}</p>` : ''}
                <div class="bg-gray-50 rounded p-2 text-[11px] text-gray-600">
                    <p class="m-0"><b>Status:</b> ${location.status === 'online' ? 'Online' : 'Offline'}</p>
                    <p class="m-0"><b>Updated:</b> ${new Date(location.lastUpdated).toLocaleTimeString()}</p>
                    ${accuracy ? `<p class="m-0"><b>Accuracy:</b> ${(accuracy / 1000).toFixed(2)}km</p>` : ''}
                </div>
            </div>
        `;

        // Update existing marker instead of removing/re-adding for better performance
        if (markersRef.current.has(userId)) {
            const existingMarker = markersRef.current.get(userId);
            existingMarker.setLatLng([latitude, longitude]);
            existingMarker.setStyle({ fillColor: markerColor });
            existingMarker.getPopup().setContent(popupContent);
        } else {
            // Create new marker
            const marker = L.circleMarker([latitude, longitude], {
                radius: 8,
                fillColor: markerColor,
                color: '#ffffff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.9,
                className: 'shadow-sm'
            })
            .bindPopup(popupContent, { className: 'custom-popup rounded-xl' })
            .addTo(mapRef.current);

            markersRef.current.set(userId, marker);

            // Auto-fit if it's the very first marker
            if (markersRef.current.size === 1) {
                mapRef.current.setView([latitude, longitude], 12);
            }
        }
        
        // Ensure user count stays accurate during updates
        setUserCount(markersRef.current.size);
    };

    const removeMarker = (userId) => {
        if (markersRef.current.has(userId)) {
            markersRef.current.get(userId).remove();
            markersRef.current.delete(userId);
        }
    };

    const handleRefresh = async () => {
        setError(null);
        socketService.requestAllLocations();
    };

return (
    <div className="w-full h-screen flex flex-col bg-gray-50 pt-16">
        {/* Header section */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm z-10 relative">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">Live User Tracking</h1>
                    <div className="flex items-center gap-3 mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${userCount > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {userCount > 0 ? (
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                            ) : (
                                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full mr-1.5"></span>
                            )}
                            {userCount} user{userCount !== 1 ? 's' : ''} active
                        </span>
                        {lastUpdate && (
                            <span className="text-sm text-gray-500">
                                Last synced: {lastUpdate.toLocaleTimeString()}
                            </span>
                        )}
                    </div>
                </div>
                <button
                    onClick={handleRefresh}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Sync Now
                </button>
            </div>

            {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    {error}
                </div>
            )}
        </div>

        {/* Map Container */}
        <div className="flex-1 relative w-full h-full">
            {/* The container MUST be rendered immediately for Leaflet to attach */}
            <div ref={mapContainerRef} className="w-full h-full z-0" />

            {/* Loading Overlay */}
            {loading && (
                <div className="absolute inset-0 z-500 flex flex-col items-center justify-center bg-gray-50/90 backdrop-blur-sm">
                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 font-medium animate-pulse">Initializing map...</p>
                </div>
            )}

            {/* Empty State Overlay */}
            {userCount === 0 && !error && !loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50/70 backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-sm mx-4 transform transition-all">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">No Active Users</h2>
                        <p className="text-gray-500 text-sm mb-6">
                            There are currently no users online or sharing their location data on the map.
                        </p>
                        <button 
                            onClick={handleRefresh}
                            className="w-full py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Check Again
                        </button>
                    </div>
                </div>
            )}

            {/* Map Legend */}
            {!loading && (
                <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur rounded-xl shadow-lg border border-gray-100 p-4 min-w-40 z-400">
                    <h3 className="font-bold text-gray-800 text-sm mb-3 uppercase tracking-wider">Map Legend</h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border border-white"></span>
                            </div>
                            <span className="text-sm font-medium text-gray-700">Online</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="w-3 h-3 rounded-full bg-gray-400 border border-white shadow-sm"></span>
                            <span className="text-sm font-medium text-gray-700">Offline</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
);
};

export default AdminLiveMap;