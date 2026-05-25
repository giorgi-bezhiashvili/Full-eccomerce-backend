const express = require("express")
const router = express.Router()
const Product = require("../models/Product")
const User = require("../models/User")
const { validate, productSchema } = require("../middleware/validate")
const { authenticateToken } = require(`../middleware/auth`)
const Cart = require(`../models/cart`);
const multer = require(`multer`)
const path= require(`path`)
const fs = require(`fs`)
const { scanFile } = require("../utils/virusScan")

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp']

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/')
  },
  filename: function (req, file, cb) {
    const random = Math.random().toString(36).substring(7)
    const ext = path.extname(file.originalname)
    cb(null, `${Date.now()}-${random}${ext}`)
  }
})

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIMES.includes(file.mimetype)) {
    return cb(new Error('Only image files are allowed'), false)
  }
  cb(null, true)
}

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 12                
  }
})
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find()
    
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
  authenticateToken, 
  (req, res, next) => {
    upload.array('photos', 12)(req, res, function (err) {
      if (err) {
        return res.status(400).json({ error: "Upload failed", details: err.message });
      }
      next();
    });
  }, 
  async (req, res) => {
    try {
      const { name, price, stock } = req.body;
      if (!name || !price) {
        // Clean up uploaded files on validation error
        if (req.files) {
          req.files.forEach(f => fs.unlink(f.path, err => {}));
        }
        return res.status(400).json({ error: "Missing required fields: name, price" });
      }
      
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const stripMetadataResult = await stripFileMetadata(file.path);
          if (!stripMetadataResult) {
            req.files.forEach(f => fs.unlink(f.path, err => {}));
            return res.status(400).json({ error: "Failed to process image metadata" });
          }
          const scanResult = await scanFile(file.path);
          if (!scanResult.safe) {
            req.files.forEach(f => fs.unlink(f.path, err => {}));
            return res.status(400).json({ error: "File contains malware", viruses: scanResult.viruses });
          }
        }
      }
      
      const sellerId = req.user.id || req.user._id;
      const filePaths = req.files ? req.files.map(file => file.path) : [];
      
      const newProduct = new Product({
        name,
        price,
        stock,
        seller: sellerId,
        photos: filePaths
      });
      
      await newProduct.save();
      res.status(201).json(newProduct);
    } catch (err) {
      
      if (req.files) {
        req.files.forEach(f => fs.unlink(f.path, err => {}));
      }
      res.status(500).json({ error: "Server error" });
    }
  }
);
router.delete(`/product/:id`, authenticateToken, async (req, res) => {
  try {
    const productId = req.params.id
    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({ error: "Product not found" })
    }
    if (product.seller.toString() !== req.user.id && product.seller.toString() !== req.user._id) {
      return res.status(403).json({ error: "Unauthorized: You can only delete your own products" })
    }
    
    // Delete uploaded files from disk
    if (product.photos && product.photos.length > 0) {
      product.photos.forEach(photoPath => {
        fs.unlink(photoPath, (err) => {
          if (err) console.error(`Failed to delete file: ${photoPath}`);
        });
      });
    }
    
    await Product.findByIdAndDelete(productId)
    await Cart.updateMany(
      { "items.product": productId },
      { $pull: { items: { product: productId } } }
    )
    res.status(200).json({ message: "Product deleted successfully" })
  } catch (err) {
    res.status(500).json({ error: "Server error" })
  }
})

module.exports = router