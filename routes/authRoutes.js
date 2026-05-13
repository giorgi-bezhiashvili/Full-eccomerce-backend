const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const passport = require("passport")
const router = express.Router()
const User = require("../models/User")
const RefreshToken = require("../models/RefreshToken")
const { generateAccessToken } = require("../utils/tokenUtils")
const { validate, registerSchema, loginSchema } = require("../middleware/validate")
const { limiter } = require("../middleware/security")
const { authenticateToken } = require("../middleware/auth")

const DUMMY_HASH = "$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345"

router.get("/", (req, res) => {
    res.send(`<a href="https://localhost:3000/auth/google">Login with Google</a>`)
})

router.post("/register", limiter, validate(registerSchema), async (req, res) => {
    try {
        const { userName, password } = req.body
        const existingUser = await User.findOne({ userName })
        if (existingUser) return res.status(400).json({ message: "User already exists" })
        const hashedPassword = await bcrypt.hash(password, 10)
        const newUser = new User({ userName, password: hashedPassword })
        await newUser.save()
        return res.send("User registered successfully.")
    } catch (err) {
        console.log(err)
        return res.status(500).send("Server error")
    }
})

router.post("/login", limiter, validate(loginSchema), async (req, res) => {
    try {
        const { userName, password } = req.body
        const existingUser = await User.findOne({ userName })
        const hashToCompare = existingUser ? existingUser.password : DUMMY_HASH
        const isMatch = await bcrypt.compare(password, hashToCompare)
        if (!existingUser || !isMatch) {
            return res.status(401).send("Username or password is incorrect")
        }
        if (existingUser.password === "google-auth-user") {
            return res.status(400).json({ message: "Please log in with Google" })
        }
        const accessToken = generateAccessToken(existingUser)
        const refreshToken = jwt.sign(
            { userName: existingUser.userName },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: "7d" }
        )
        await RefreshToken.findOneAndUpdate(
            { userId: existingUser._id },
            { token: refreshToken, createdAt: new Date() },
            { upsert: true }
        )
        return res.status(200).json({ message: "Login Successfully", accessToken, refreshToken })
    } catch (err) {
        console.log(err)
        return res.status(500).send("Server error")
    }
})

router.post("/token", async (req, res) => {
    try {
        const refreshToken = req.body.token
        if (!refreshToken) return res.sendStatus(401)
        const tokenExists = await RefreshToken.findOne({ token: refreshToken })
        if (!tokenExists) return res.sendStatus(401)
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
            if (err) return res.sendStatus(403)
            const accessToken = generateAccessToken({ userName: user.userName })
            res.json({ accessToken })
        })
    } catch (err) {
        return res.status(500).send("Server error")
    }
})

router.delete("/logout", async (req, res) => {
    try {
        const { token } = req.body
        await RefreshToken.deleteOne({ token })
        res.sendStatus(204)
    } catch (err) {
        return res.status(500).send("Server error")
    }
})

router.get("/auth/google",
    passport.authenticate("google", { scope: ["email", "profile"] })
)

router.get("/auth/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: "/" }),
    async (req, res) => {
        try {
            const accessToken = generateAccessToken(req.user)
            const refreshToken = jwt.sign(
                { userName: req.user.userName },
                process.env.REFRESH_TOKEN_SECRET,
                { expiresIn: "7d" }
            )
            await RefreshToken.findOneAndUpdate(
                { userId: req.user._id },
                { token: refreshToken, createdAt: new Date() },
                { upsert: true, new: true }
            )
            res.json({ message: "Google Login Successful", accessToken, refreshToken })
        } catch (err) {
            res.status(500).send("Server error during login")
        }
    }
)
module.exports = router