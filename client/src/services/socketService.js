import io from 'socket.io-client';

class SocketIOService {
    constructor() {
        this.socket = null;
        this.listeners = {};
    }

    /**
     * Connect to Socket.IO server
     * @param {string} url - Server URL
     * @param {Object} options - Socket.IO options
     */
    connect(url, options = {}) {
        if (!this.socket) {
            this.socket = io(url, {
                ...options,
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: 5,
                transports: ['websocket', 'polling']
            });

            // Bind standard events
            this.socket.on('connect', () => {
                console.log('Socket.IO connected');
                this.emit('socket:connected');
            });

            this.socket.on('disconnect', () => {
                console.log('Socket.IO disconnected');
                this.emit('socket:disconnected');
            });

            this.socket.on('error', (error) => {
                console.error('Socket.IO error:', error);
                this.emit('socket:error', error);
            });
        }
        return this.socket;
    }

    /**
     * Disconnect from Socket.IO server
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    /**
     * Emit location update to server
     * @param {number} latitude
     * @param {number} longitude
     * @param {number} accuracy
     */
    updateLocation(latitude, longitude, accuracy) {
        if (this.socket && this.socket.connected) {
            const data = {
                userId: JSON.parse(localStorage.getItem('user'))?.userId || null,
                latitude,
                longitude,
                accuracy
            };
            this.socket.emit('location:update', data);
        }
    }

    /**
     * Emit logout event to mark user offline
     * @param {string} userId
     */
    logout(userId) {
        if (this.socket && this.socket.connected) {
            this.socket.emit('location:logout', { userId });
        }
    }

    /**
     * Request all active users' locations
     */
    requestAllLocations() {
        if (this.socket && this.socket.connected) {
            this.socket.emit('location:request-all');
        }
    }

    /**
     * Request specific user's location
     * @param {string} userId
     */
    requestUserLocation(userId) {
        if (this.socket && this.socket.connected) {
            this.socket.emit('location:request-user', { userId });
        }
    }

    /**
     * Listen to location updates from server
     * @param {Function} callback
     */
    onLocationUpdated(callback) {
        if (this.socket) {
            this.socket.off('location:updated'); // Remove existing listener
            this.socket.on('location:updated', callback);
        }
    }

    /**
     * Listen to user offline events
     * @param {Function} callback
     */
    onUserOffline(callback) {
        if (this.socket) {
            this.socket.off('location:user-offline'); // Remove existing listener
            this.socket.on('location:user-offline', callback);
        }
    }

    /**
     * Listen to all users data
     * @param {Function} callback
     */
    onAllUsersData(callback) {
        if (this.socket) {
            this.socket.off('location:all-users'); // Remove existing listener
            this.socket.on('location:all-users', callback);
        }
    }

    /**
     * Listen to specific user data
     * @param {Function} callback
     */
    onUserData(callback) {
        if (this.socket) {
            this.socket.off('location:user-data'); // Remove existing listener
            this.socket.on('location:user-data', callback);
        }
    }

    /**
     * Listen to location update acknowledgment
     * @param {Function} callback
     */
    onLocationUpdateAck(callback) {
        if (this.socket) {
            this.socket.off('location:update-ack'); // Remove existing listener
            this.socket.on('location:update-ack', callback);
        }
    }

    /**
     * Listen to socket errors
     * @param {Function} callback
     */
    onError(callback) {
        if (this.socket) {
            this.socket.off('error'); // Remove existing listener
            this.socket.on('error', callback);
        }
    }

    /**
     * Generic on/off for custom events
     * @param {string} event
     * @param {Function} callback
     */
    on(event, callback) {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    /**
     * Generic emit for custom events
     * @param {string} event
     * @param {*} data
     */
    emit(event, data) {
        if (this.socket && this.socket.connected) {
            this.socket.emit(event, data);
        }
    }

    /**
     * Check if socket is connected
     */
    isConnected() {
        return this.socket && this.socket.connected;
    }
}

export default new SocketIOService();
