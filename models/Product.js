const mongoose = require("mongoose")
const { productConnection } = require("../config/db")

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, default: 1 },
    userName: {type:String , required:true}
})

const Product = productConnection.model("Product", productSchema)

module.exports = Product