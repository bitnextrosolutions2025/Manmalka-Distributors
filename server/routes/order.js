import express from "express";
import verifyToken from "../middlewares/verifyToken.js";
import Order from "../models/Order.js";
const OrderRoute = express.Router();

OrderRoute.post('/add-order', verifyToken, async (req, res) => {
    try {

        const { customerName, customerShop, customerAddress, orderItems } = req.body;
        const neworder = new Order({
            user: req.user.userId,
            customerName,
            customerShop,
            customerAddress,
            orderItems,
        })
        await neworder.save();
        return res.status(201).json({ message: "Order is being resived.", status: true })

    } catch (error) {
        console.log(error);
        return res.status(500).json({ "message": "Sever error try again", status: false })
    }
})

OrderRoute.get('/all-order', async (req, res) => {
    try {
        const allorder = await Order.find();
        return res.status(200).json({ data: allorder, status: true })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ "message": "Sever error try again", status: false })
    }
    console.log(allorder)
})
export default OrderRoute;