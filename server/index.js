import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import 'dotenv/config'
import { connectDB } from "./db/db.js"
import AuthRoute from "./routes/auth.js"
import OrderRoute from "./routes/order.js"

const app = express()

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
app.use('/api/v2/order',OrderRoute);

app.listen(process.env.PORT,()=>{
   console.log(`Server Started on http://localhost:${process.env.PORT}`)
})