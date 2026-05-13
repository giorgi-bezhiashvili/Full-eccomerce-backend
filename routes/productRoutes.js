const express = require("express")
const router = express.Router()
const Product = require("../models/Product")
const User = require("../models/User")
const { validate, productSchema } = require("../middleware/validate")
const{authenticateToken} = require(`../middleware/auth`)
router.get("/products", validate(productSchema) , async (req, res) => {
    try {
        const products = await Product.find()
        res.json(products)
    } catch (err) {
        res.status(500).send("Server error")
    }
})
router.post(`/products`,authenticateToken,async(req,res)=>{
    try{
        const sellerName = req.user.userName; 
        const { name, price, stock } = req.body;
        const userExists = await User.findOne({ userName: userName });
        if(!userExists){
            return res.send(`User doesnt exist`)
        }
        const newProduct ={
            name,
            price,
            stock,
            seller:userName
        }
        await db.products.insertOne(newProduct)        
        res.status(200).json(newProduct)
    }catch(err){
        console.error(err)
        res.status(500).send(`Server error`)
    }
})
module.exports = router