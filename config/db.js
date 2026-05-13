const mongoose = require("mongoose")
 
const userConnection = mongoose.createConnection(process.env.USER_DB_URL || "mongodb://localhost:27017/users_db")
const authConnection = mongoose.createConnection(process.env.AUTH_DB_URL || "mongodb://localhost:27017/auth_db")
const productConnection = mongoose.createConnection(process.env.PRODUCT_DB_URL || "mongodb://localhost:27017/products_db")
 
module.exports = { userConnection, authConnection, productConnection }
