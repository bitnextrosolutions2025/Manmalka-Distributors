import mongoose from "mongoose";

const OderSchema= new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    customerName:{
        type:String,
        require:true
    },
    customerShop:{
        type:String,
        require:true
    },
    customerAddress:{
        type:String,
        require:true
    },
    orderItems:{
        type:Array,
        require:true
    },
    orderstatus: {
    type: String,
    required: true,
    enum: ['pending', 'Out of Delivary', 'Delivered'],
    default: 'pending'
  },
  paymentstatus:{
    type: String,
    required: true,
    enum: ['Due','Done'],
    default: 'Due'
  }

})

const Order= mongoose.model('Order',OderSchema);
export default Order;