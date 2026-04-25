import Location from "../models/Location.js";

/**
 * Socket.IO event handlers for location tracking
 * Manages real-time location updates and broadcasts to admins
 */

// Store active users with their socket IDs
const activeUsers = new Map(); // userId -> { socketId, location }

export const setupLocationHandlers = (io, socket) => {
    /**
     * Handle user location update
     * Saves to database and broadcasts to admin clients
     */
    socket.on('location:update', async (data) => {
        try {
            const { userId, latitude, longitude, accuracy } = data;

            if (!userId || latitude === undefined || longitude === undefined) {
                socket.emit('error', { message: 'Invalid location data' });
                return;
            }

            // Update active users map
            activeUsers.set(userId, {
                socketId: socket.id,
                location: { latitude, longitude, accuracy },
                lastUpdated: new Date(),
                status: 'online'
            });

            // Save to database
            const location = await Location.findOneAndUpdate(
                { user: userId },
                {
                    latitude,
                    longitude,
                    accuracy,
                    status: 'online',
                    lastUpdated: new Date()
                },
                { 
                    upsert: true, 
                    new: true 
                }
            ).populate('user', 'username email');

            // Broadcast updated location to all admin clients
            io.emit('location:updated', {
                userId,
                username: location.user.username,
                email: location.user.email,
                latitude,
                longitude,
                accuracy,
                lastUpdated: new Date(),
                status: 'online'
            });

            // Acknowledge to sender
            socket.emit('location:update-ack', { 
                success: true, 
                message: 'Location updated successfully' 
            });

        } catch (error) {
            console.error('Location update error:', error);
            socket.emit('error', { 
                message: 'Failed to update location',
                error: error.message 
            });
        }
    });

    /**
     * Handle user disconnect
     * Marks user as offline
     */
    socket.on('disconnect', async () => {
        try {
            // Find and update the disconnected user
            for (const [userId, userData] of activeUsers.entries()) {
                if (userData.socketId === socket.id) {
                    // Mark as offline in database
                    await Location.findOneAndUpdate(
                        { user: userId },
                        { 
                            status: 'offline',
                            lastUpdated: new Date()
                        },
                        { new: true }
                    );

                    // Remove from active users
                    activeUsers.delete(userId);

                    // Broadcast offline status to all clients
                    io.emit('location:user-offline', {
                        userId,
                        lastUpdated: new Date(),
                        status: 'offline'
                    });

                    break;
                }
            }
        } catch (error) {
            console.error('Disconnect handler error:', error);
        }
    });

    /**
     * Handle explicit logout
     * Marks user as offline and removes from active tracking
     */
    socket.on('location:logout', async (data) => {
        try {
            const { userId } = data;

            // Mark as offline in database
            const location = await Location.findOneAndUpdate(
                { user: userId },
                { 
                    status: 'offline',
                    lastUpdated: new Date()
                },
                { new: true }
            );

            // Remove from active users
            activeUsers.delete(userId);

            // Broadcast offline status
            io.emit('location:user-offline', {
                userId,
                lastUpdated: new Date(),
                status: 'offline'
            });

            socket.emit('location:logout-ack', { 
                success: true, 
                message: 'Logged out successfully' 
            });

        } catch (error) {
            console.error('Logout error:', error);
            socket.emit('error', { 
                message: 'Failed to logout',
                error: error.message 
            });
        }
    });

    /**
     * Request all active users locations (for admin dashboard)
     */
    socket.on('location:request-all', async () => {
        try {
            const locations = await Location.find({ status: 'online' })
                .populate('user', 'username email')
                .lean();

            socket.emit('location:all-users', {
                success: true,
                data: locations,
                count: locations.length,
                timestamp: new Date()
            });

        } catch (error) {
            console.error('Request all locations error:', error);
            socket.emit('error', { 
                message: 'Failed to fetch locations',
                error: error.message 
            });
        }
    });

    /**
     * Request specific user location
     */
    socket.on('location:request-user', async (data) => {
        try {
            const { userId } = data;

            const location = await Location.findOne({ user: userId })
                .populate('user', 'username email')
                .lean();

            if (!location) {
                socket.emit('error', { 
                    message: 'Location not found for this user' 
                });
                return;
            }

            socket.emit('location:user-data', {
                success: true,
                data: location
            });

        } catch (error) {
            console.error('Request user location error:', error);
            socket.emit('error', { 
                message: 'Failed to fetch user location',
                error: error.message 
            });
        }
    });
};

export { activeUsers };
