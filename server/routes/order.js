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
OrderRoute.put('/upatePaymnetAndDelivaryStatus', async (req, res) => {
    try {
        const { orderId, paymentstatus, orderstatus } = req.body;

        // Validate input
        if (!orderId) {
            return res.status(400).json({ message: "Order ID is required", status: false });
        }

        // Validate payment status
        if (paymentstatus && !['Due', 'Done'].includes(paymentstatus)) {
            return res.status(400).json({ message: "Invalid payment status", status: false });
        }

        // Validate delivery status
        if (orderstatus && !['pending', 'Out of Delivary', 'Delivered'].includes(orderstatus)) {
            return res.status(400).json({ message: "Invalid delivery status", status: false });
        }

        // Update order
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            {
                ...(paymentstatus && { paymentstatus }),
                ...(orderstatus && { orderstatus })
            },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ message: "Order not found", status: false });
        }

        return res.status(200).json({
            message: "Order status updated successfully",
            status: true,
            data: updatedOrder
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server error try again", status: false });
    }
})

OrderRoute.get('/getuserorder', verifyToken, async (req, res) => {
    try {
        const allOrderOfUser = await Order.find({ user: req.user.userId });
        res.status(200).json({ 'message': 'All oredr are found', status: true, data: allOrderOfUser })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server error try again", status: false });
    }
})

export default OrderRoute;