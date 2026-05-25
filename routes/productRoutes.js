const express = require("express")
const router = express.Router()
const Product = require("../models/Product")
const User = require("../models/User")
const { validate, productSchema } = require("../middleware/validate")
const { authenticateToken } = require(`../middleware/auth`)
const Cart = require(`../models/cart`);
const multer = require(`multer`)
const path= require(`path`)

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
})


const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 12                
  }
})
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find()
    
    // Transform photo paths to URLs accessible from frontend
    const productsWithUrls = products.map(product => ({
      ...product.toObject(),
      photos: product.photos.map(photo => `/uploads/${path.basename(photo)}`)
    }))
    
    res.json(productsWithUrls)
  } catch (err) {
    res.status(500).send("Server error")
  }
})



router.post("/products", 
  (req, res, next) => { 
    console.log("1. Request hit the route container"); 
    next(); 
  }, 
  authenticateToken, 
  (req, res, next) => { 
    console.log("2. Passed authenticateToken middleware"); 
    next(); 
  }, 
  (req, res, next) => {
    upload.array('photos', 12)(req, res, function (err) {
      if (err) {
        console.error("----> Multer parsing error caught:", err.message);
        return res.status(400).json({ error: "Multer upload error", details: err.message });
      }
      console.log("3. Passed Multer file upload cleanly");
      next();
    });
  }, 
  async (req, res) => {
    try {
      console.log("4. Inside Try Block. Body received:", req.body);
      console.log("5. Total files received:", req.files ? req.files.length : 0);
      
      const { name, price, stock } = req.body;
      if (!name || !price) {
        console.log("5a. Failed text validation - name or price missing");
        return res.status(400).json({ error: "Required fields are missing from req.body" });
      }
      
      const sellerId = req.user.id || req.user._id;
      const filePaths = req.files.map(file => file.path);
      
      const newProduct = new Product({
        name,
        price,
        stock,
        seller: sellerId,
        photos: filePaths
      });
      
      console.log("6. Saving product to MongoDB...");
      await newProduct.save();
      console.log("7. Saved successfully!");
      
      res.status(201).json(newProduct);
    } catch (err) {
      console.error("Catch block caught a database/server error:", err);
      res.status(500).send("Server error");
    }
  }
);
router.delete(`/product/:id`, authenticateToken, async (req, res) => {
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