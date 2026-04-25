import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import 'dotenv/config'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { connectDB } from "./db/db.js"
import AuthRoute from "./routes/auth.js"
import OrderRoute from "./routes/order.js"
import LocationRoute from "./routes/location.js"
import { setupLocationHandlers } from "./socket/locationHandler.js"

const app = express()
const httpServer = createServer(app)

// Socket.IO configuration
const io = new Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL,
        methods: ['GET', 'POST'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization']
    },
    transports: ['websocket', 'polling']
})

// CORS configuration for production-ready setup
const corsOptions = {
    origin: process.env.FRONTEND_URL,
    credentials: true, // Allow credentials (cookies, authorization headers)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400 // 24 hours
};

app.use(express.json())
app.use(cookieParser()) // Parse cookies from requests
app.use(cors(corsOptions))
await connectDB();

app.get("/",(req,res)=>{
   res.json({"Message":"Sever done"})
})

app.use('/api/v1/auth',AuthRoute);
app.use('/api/v2/orders',OrderRoute);
app.use('/api/v1/location',LocationRoute);

// Socket.IO connection handler
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    
    // Setup location tracking handlers
    setupLocationHandlers(io, socket);
    
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

// Make io accessible to routes if needed
app.set('io', io);

httpServer.listen(process.env.PORT,()=>{
   console.log(`Server Started on http://localhost:${process.env.PORT}`);
})