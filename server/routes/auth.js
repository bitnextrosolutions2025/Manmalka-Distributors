import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import sendemail from "../middlewares/sendmail.js";

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

export default AuthRoute;