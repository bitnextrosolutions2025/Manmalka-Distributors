import mongoose from "mongoose";

const LocationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    latitude: {
        type: Number,
        required: true
    },
    longitude: {
        type: Number,
        required: true
    },
    accuracy: {
        type: Number,
        default: null
    },
    status: {
        type: String,
        enum: ['online', 'offline'],
        default: 'online'
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true,
        // Auto-delete documents after 30 days for storage optimization
        expires: 2592000
    }
}, { timestamps: true });

// Compound index for efficient queries
LocationSchema.index({ user: 1, lastUpdated: -1 });

const Location = mongoose.model('Location', LocationSchema);
export default Location;
