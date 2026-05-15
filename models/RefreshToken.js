const mongoose = require("mongoose")
const { authConnection } = require("../config/db")

const tokenSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    token: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: "7d" }
})

const RefreshToken = mongoose.model("RefreshToken", tokenSchema)

module.exports = RefreshToken