import jwt from 'jsonwebtoken';

/**
 * Middleware to verify JWT token from HttpOnly cookie
 * Protects routes that require authentication
 * 
 * Usage:
 * AuthRoute.get('/profile', verifyToken, profileController);
 */
export const verifyToken = (req, res, next) => {
  try {
    // Get token from HttpOnly cookie (preferred method)
    let token = req.cookies?.authToken;

    // Fallback: Check Authorization header (for API clients like Postman, mobile apps)
    if (!token && req.headers.authorization) {
      token = req.headers.authorization.split(' ')[1]; // Bearer TOKEN
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token is required",
        error: "NO_TOKEN"
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user data to request
    req.user = decoded;
    next();

  } catch (error) {
    console.error("Token verification error:", error);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: "Token has expired",
        error: "TOKEN_EXPIRED"
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
        error: "INVALID_TOKEN"
      });
    }

    return res.status(401).json({
      success: false,
      message: "Authentication failed",
      error: "AUTH_FAILED"
    });
  }
};

export default verifyToken;
