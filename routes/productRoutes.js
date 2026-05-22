const express = require("express")
const router = express.Router()
const Product = require("../models/Product")
const User = require("../models/User")
const { validate, productSchema } = require("../middleware/validate")
const { authenticateToken } = require(`../middleware/auth`)
const Cart = require(`../models/cart`);

router.get("/products", async (req, res) => {
  try {
    const products = await Product.find()
    res.json(products)
  } catch (err) {
    res.status(500).send("Server error")
  }
})
router.post("/products", authenticateToken, async (req, res) => {
  try {
    const { name, price, stock } = req.body
    const sellerId = req.user.id || req.user._id;
    const newProduct = new Product({
      name,
      price,
      stock,
      seller: sellerId
    })
    await newProduct.save()
    res.status(201).json(newProduct)
  } catch (err) {
    console.error(err)
    res.status(500).send("Server error")
  }
})
router.delete(`product`, authenticateToken, async (req, res) => {
  try {
    const productId = req.params.id
    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).send(`Product doesn't exists`)
    }
    if (product.user.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized: You can only delete your own products" })
    }
    await Product.findByIdAndDelete(productId)
    await Cart.updateMany(
      { "items.product": productId },
      { $pull: { items: { product: productId } } }
    )
    res.status(200).send(`Item delated succesfully`)
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" })
  }
})
module.exports = router