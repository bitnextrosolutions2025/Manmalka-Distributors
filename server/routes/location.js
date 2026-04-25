import express from "express";
import verifyToken from "../middlewares/verifyToken.js";
import Location from "../models/Location.js";
import User from "../models/User.js";

const LocationRoute = express.Router();

/**
 * @route   POST /api/v1/location/update
 * @desc    Update user location
 * @access  Private
 */
LocationRoute.post('/update', verifyToken, async (req, res) => {
    try {
        const { latitude, longitude, accuracy } = req.body;
        const userId = req.user.userId;

        // Validation
        if (latitude === undefined || longitude === undefined) {
            return res.status(400).json({
                success: false,
                message: "Latitude and longitude are required"
            });
        }

        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
            return res.status(400).json({
                success: false,
                message: "Latitude and longitude must be numbers"
            });
        }

        // Validate coordinates range
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            return res.status(400).json({
                success: false,
                message: "Invalid coordinates"
            });
        }

        // Create or update location
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
        );

        return res.status(200).json({
            success: true,
            message: "Location updated successfully",
            data: location
        });

    } catch (error) {
        console.error("Location update error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while updating location"
        });
    }
});

/**
 * @route   GET /api/v1/location/all-users
 * @desc    Get all active users with their locations (Admin only)
 * @access  Private (Admin)
 */
LocationRoute.get('/all-users', async (req, res) => {
    try {
        // This route should be protected by AdminProtectedRoute in frontend
        // Backend validation for admin can be added via role field in User model
        
        const locations = await Location.find({ status: 'online' })
            .populate('user', 'username email')
            .sort({ lastUpdated: -1 });

        return res.status(200).json({
            success: true,
            message: "Active users locations retrieved successfully",
            count: locations.length,
            data: locations
        });

    } catch (error) {
        console.error("Fetch locations error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while fetching locations"
        });
    }
});

/**
 * @route   GET /api/v1/location/user/:userId
 * @desc    Get specific user's location (for admin tracking)
 * @access  Private (Admin)
 */
LocationRoute.get('/user/:userId', verifyToken, async (req, res) => {
    try {
        const location = await Location.findOne({ user: req.params.userId })
            .populate('user', 'username email');

        if (!location) {
            return res.status(404).json({
                success: false,
                message: "Location not found for this user"
            });
        }

        return res.status(200).json({
            success: true,
            message: "User location retrieved successfully",
            data: location
        });

    } catch (error) {
        console.error("Fetch user location error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while fetching user location"
        });
    }
});

/**
 * @route   POST /api/v1/location/logout
 * @desc    Mark user as offline when logging out
 * @access  Private
 */
LocationRoute.post('/logout', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        await Location.findOneAndUpdate(
            { user: userId },
            { 
                status: 'offline',
                lastUpdated: new Date()
            },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: "User marked as offline"
        });

    } catch (error) {
        console.error("Logout location error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while marking user offline"
        });
    }
});

/**
 * @route   GET /api/v1/location/my-location
 * @desc    Get current user's location
 * @access  Private
 */
LocationRoute.get('/my-location', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const location = await Location.findOne({ user: userId });

        if (!location) {
            return res.status(404).json({
                success: false,
                message: "No location data found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "User location retrieved",
            data: location
        });

    } catch (error) {
        console.error("Fetch my location error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while fetching location"
        });
    }
});

export default LocationRoute;
