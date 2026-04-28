import mongoose from "mongoose";

const LoginTimeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    loginTime: {
        type: Date,
        required: true,
        default: Date.now
    },
    logoutTime: {
        type: Date,
        default: null
    },
    sessionDuration: {
        type: Number, // Duration in milliseconds
        default: null
    },
    ipAddress: {
        type: String,
        default: null
    },
    userAgent: {
        type: String,
        default: null
    }
}, { timestamps: true });

const LoginTime = mongoose.model('LoginTime', LoginTimeSchema);
export default LoginTime;