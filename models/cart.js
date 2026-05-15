const mongoose = require("mongoose")

// Change this in models/cart.js
const cartSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: Number,
        price: { type: Number, required: true }
    }]
})

const Cart = mongoose.model("Cart", cartSchema)
module.exports = Cart