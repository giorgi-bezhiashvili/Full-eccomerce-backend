const mongoose = require("mongoose")
const { productConnection } = require("../config/db")

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  images: [String],
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  ratings: { average: Number, count: Number },
}, { timestamps: true });
const Product = mongoose.model("Product", productSchema)

module.exports = Product