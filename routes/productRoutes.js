const express = require("express")
const router = express.Router()
const Product = require("../models/Product")
const User = require("../models/User")
const { validate, productSchema } = require("../middleware/validate")
const{authenticateToken} = require(`../middleware/auth`)
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
    const newProduct = new Product({
      name,
      price,
      stock,
      userName: req.user.userName
    })
    await newProduct.save()
    res.status(201).json(newProduct)
  } catch (err) {
    console.error(err)
    res.status(500).send("Server error")
  }
})
module.exports = router