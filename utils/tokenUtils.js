const jwt = require("jsonwebtoken")

function generateAccessToken(user) {
    return jwt.sign(
        { userName: user.userName },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
    )
}

module.exports = { generateAccessToken }