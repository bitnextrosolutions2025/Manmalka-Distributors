import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
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

        // Set HttpOnly cookie on frontend (secure, can't be accessed by JavaScript)
        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('authToken', token, {
            httpOnly: true, // Can't be accessed by JavaScript (prevents XSS attacks)
            secure: isProduction, // HTTPS only in production
            sameSite: 'Strict', // CSRF protection
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
        const isProduction = process.env.NODE_ENV === 'production';
        res.clearCookie("authToken", {
            httpOnly: true,
            secure: isProduction,       // same as when you set it
            sameSite: "strict"  // must match original config
        });

        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error during login. Please try again.",
            error: "LOGIN_ERROR"
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


export default AuthRoute;