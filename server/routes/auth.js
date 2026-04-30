import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import LoginTime from "../models/LoginTime.js";
import sendemail from "../middlewares/sendmail.js";
import verifyToken from "../middlewares/verifyToken.js";

const AuthRoute = express.Router();

AuthRoute.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // Check if passwords match

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format"
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Username or email already exists"
            });
        }

        // Try to send email first - MUST succeed before saving to database
        try {
            const send = await sendemail(email, username, password);
            console.log("✅ Email sent successfully:", send);
        } catch (emailError) {
            console.error("❌ Email sending failed:", emailError);
            return res.status(500).json({
                success: false,
                message: "Failed to send welcome email. Please check your email address and try again.",
                error: "EMAIL_SEND_FAILED"
            });
        }

        // Hash password only after email is successfully sent
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = new User({
            username,
            email,
            password: hashedPassword
        });
        await newUser.save();

        return res.status(201).json({
            success: true,
            message: "User registered successfully! Check your email for login details.",
        });

    } catch (error) {
        console.error("Registration error:", error);

        // Distinguish between different types of errors
        const isEmailError = error.message?.includes('email') || error.message?.includes('mail');

        return res.status(500).json({
            success: false,
            message: isEmailError
                ? "Failed to send email. Please try again later."
                : "Server error during registration. Please try again.",
            error: "REGISTRATION_ERROR"
        });
    }
});

AuthRoute.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validation
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Username and password are required"
            });
        }

        // Find user by username or email
        const user = await User.findOne({
            $or: [{ username }, { email: username }]
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        // Compare password with hashed password
        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user._id,
                username: user.username,
                email: user.email
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' } // Token expires in 7 days
        );

        // Save login time to database
        try {
            const loginRecord = new LoginTime({
                userId: user._id,
                username: user.username,
                email: user.email,
                loginTime: new Date(),
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('user-agent')
            });
            await loginRecord.save();
            console.log("✅ Login record saved:", loginRecord._id);
        } catch (loginError) {
            console.error("❌ Error saving login record:", loginError);
            // Continue even if login record fails to save
        }

        // Set HttpOnly cookie on frontend (secure, can't be accessed by JavaScript)
        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('authToken', token, {
            httpOnly: true, // Can't be accessed by JavaScript (prevents XSS attacks)
            secure: isProduction, // HTTPS only in production
            sameSite: isProduction ? 'None' : 'Strict', // CSRF protection
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
            path: '/' // Available on all routes
        });

        // Return success response with user data (token not needed in frontend)
        return res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error during login. Please try again.",
            error: "LOGIN_ERROR"
        });
    }
});
AuthRoute.get('/getuser', verifyToken, (req, res) => {
    console.log(req.user)
    return res.json({
        success: true,
        user: req.user
    });
});

AuthRoute.post('/logout', async (req, res) => {
    try {
        const { userId } = req.body; // Frontend should send userId
        console.log(userId)
        // Update logout time for the most recent unclosed session
        if (userId) {
            try {
                const loginRecord = await LoginTime.findOne({
                    userId: userId,
                    logoutTime: null // Find the most recent login without logout
                }).sort({ loginTime: -1 });

                if (loginRecord) {
                    const logoutTime = new Date();
                    const sessionDuration = logoutTime - loginRecord.loginTime; // Duration in milliseconds

                    loginRecord.logoutTime = logoutTime;
                    loginRecord.sessionDuration = sessionDuration;
                    await loginRecord.save();
                    console.log("✅ Logout record updated:", loginRecord._id);
                }
            } catch (logoutError) {
                console.error("❌ Error updating logout record:", logoutError);
                // Continue even if logout record fails to update
            }
        }

        const isProduction = process.env.NODE_ENV === 'production';
        res.clearCookie("authToken", {
            httpOnly: true,
            secure: isProduction,       // same as when you set it
            sameSite: "strict",
            path: '/'   // must match original config
        });

        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error during logout. Please try again.",
            error: "LOGOUT_ERROR"
        });
    }
})
AuthRoute.post('/adminlogin', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Validation
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Username and password are required"
            });
        }
        
        if (username == process.env.USER && password == process.env.PASS) {
            const token = jwt.sign(
                {
                    username: username,
                    role: 'admin'
                },
                process.env.JWT_SECRET,
                { expiresIn: '1d' } // Token expires in 1 day
            );
            return res.status(200).json({ 
                message: "Login Successful", 
                token: token, 
                status: true 
            })
        }
        return res.status(401).json({ 
            message: "Invalid credentials", 
            status: false 
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ 
            message: "Server error try again", 
            status: false 
        });
    }

})

// Get all login/logout records for admin dashboard
AuthRoute.get('/login-records', async (req, res) => {
    try {
        const records = await LoginTime.find()
            .populate('userId', 'username email')
            .sort({ loginTime: -1 })
            .limit(1000); // Limit to prevent overwhelming the response

        return res.status(200).json({
            success: true,
            message: "Login records retrieved successfully",
            records: records,
            totalRecords: records.length
        });
    } catch (error) {
        console.error("Error fetching login records:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while fetching records",
            error: "FETCH_ERROR"
        });
    }
});

// Get login records for specific user
AuthRoute.get('/login-records/:userId', verifyToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const records = await LoginTime.find({ userId })
            .sort({ loginTime: -1 })
            .limit(100);

        return res.status(200).json({
            success: true,
            message: "User login records retrieved successfully",
            records: records,
            totalRecords: records.length
        });
    } catch (error) {
        console.error("Error fetching user login records:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while fetching records",
            error: "FETCH_ERROR"
        });
    }
});

// Get login statistics (today, this week, etc.)
AuthRoute.get('/login-stats', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        const todayCount = await LoginTime.countDocuments({ 
            loginTime: { $gte: today } 
        });

        const weekCount = await LoginTime.countDocuments({ 
            loginTime: { $gte: weekAgo } 
        });

        const totalCount = await LoginTime.countDocuments();

        const uniqueUsersToday = await LoginTime.distinct('userId', { 
            loginTime: { $gte: today } 
        });

        return res.status(200).json({
            success: true,
            message: "Login statistics retrieved successfully",
            stats: {
                todayLogins: todayCount,
                weekLogins: weekCount,
                totalLogins: totalCount,
                uniqueUsersToday: uniqueUsersToday.length
            }
        });
    } catch (error) {
        console.error("Error fetching login stats:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while fetching statistics",
            error: "STATS_ERROR"
        });
    }
});


export default AuthRoute;