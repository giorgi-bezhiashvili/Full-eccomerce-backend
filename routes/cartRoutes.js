const express = require(`express`)
const router = express.Router()
const Cart = require(`../models/cart`)
const authenticateToken = require(`../middleware/auth`)

router.get(`/getCart`, authenticateToken,async (req,res)=>{
    try {
        const cart = await Cart.findOne({user:req.user.id}).populate("items.product", "name price")
        if(!cart){
            return res.json({products:[], price:0 })
        }
        res.send(cart)
    } catch (err) {
        res.status(500).json({ error: "Server error" })
    }
})
router.post(`/addItem`, authenticateToken, async(req,res)=>{
    try {
        const {productId,quantity=1} = req.body
        const product = await Product.findById(productId)
        if(!product) return res.json({error:"product Not Found"})
        if(product.stock<quantity) return res.status(400).send(`Quantity cant be lower that one`)
        let cart = await Cart.findOne({ user: req.user.id })
        if (!cart) {
            cart = new Cart({ user: req.user.id, items: [] })
        }
        const existingItem = cart.items.find(
            item => item.product.toString() === productId
        )
        if (existingItem){
            existingItem.quantity += quantity
        }else{
            cart.items.push({
                product:productId,
                quantity,
                price:product.price
            })
        }
        await cart.save()
        res.status(200).json(cart)
    } catch (err) {
        res.status(500).json({ error: "Server error" })
    }
})