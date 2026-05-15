const express = require(`express`);
const router = express.Router();
const Cart = require(`../models/cart`);
const { authenticateToken } = require(`../middleware/auth`);
const Product = require("../models/Product");

router.get(`/getCart`, authenticateToken, async (req, res) => {
    try {
        // Use ._id instead of .id
        const cart = await Cart.findOne({ user: req.user._id }).populate("items.product", "name price");
        if (!cart) {
            return res.json({ items: [], price: 0 });
        }
        res.send(cart);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

router.post(`/addItem`, authenticateToken, async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;
        const product = await Product.findById(productId);
        
        if (!product) return res.status(404).json({ error: "Product Not Found" });

        // Use req.user._id (Ensure you re-logged in to get this!)
        let cart = await Cart.findOne({ user: req.user._id });
        
        if (!cart) {
            cart = new Cart({ user: req.user._id, items: [] });
        }

        const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);

        if (itemIndex > -1) {
            cart.items[itemIndex].quantity += quantity;
        } else {
            // Include price here if your schema requires it!
            cart.items.push({ 
                product: productId, 
                quantity, 
                price: product.price 
            });
        }

        await cart.save();
        res.status(200).json(cart);
    } catch (err) {
        console.error("SAVE ERROR:", err);
        res.status(500).json({ error: "Server error" });
    }
})
router.delete(`/removeItem`, authenticateToken, async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;
        let cart = await Cart.findOne({ user: req.user._id });
        
        if (!cart) return res.status(404).send("Cart not found");

        const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
        
        if (itemIndex > -1) {
            cart.items[itemIndex].quantity -= quantity;
            if (cart.items[itemIndex].quantity <= 0) {
                cart.items.splice(itemIndex, 1);
            }
            await cart.save();
            res.status(200).json(cart);
        } else {
            res.status(400).send(`Item isn't in cart`);
        }
    } catch (err) {
        res.status(500).send("Server error");
    }
});

router.delete(`/clear`, authenticateToken, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) return res.status(404).send(`Cart Not found`);
        
        cart.items = [];
        await cart.save(); // Added ()
        return res.status(200).send(`Cart cleared successfully`);
    } catch (err) {
        return res.status(500).send("Server error");
    }
});

module.exports = router;