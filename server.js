require("dotenv").config()
const express = require("express")
const https = require("https")
const fs = require("fs")
const sanitize = require("mongo-sanitize")
const hpp = require("hpp")
const helmet = require("helmet")
const passport = require("./config/passport")
const { userConnection, authConnection, productConnection } = require("./config/db")
const authRoutes = require("./routes/authRoutes")
const productRoutes = require("./routes/productRoutes")
 
const app = express()
 
const options = {
    key: fs.readFileSync("key.pem"),
    cert: fs.readFileSync("cert.pem")
}
 
app.disable("x-powered-by")
app.use(express.json({ limit: "10kb" }))
app.use((req, res, next) => {
    if (req.body) req.body = sanitize(req.body)
    next()
})
app.use(hpp())
app.use(passport.initialize())
app.use(helmet({
    xPoweredBy: false,
    contentSecurityPolicy: false,
    xDownloadOptions: false,
}))
 
app.use("/", authRoutes)
app.use("/", productRoutes)
 
const connections = [userConnection, authConnection, productConnection]
 
Promise.all(connections.map(conn => new Promise((resolve, reject) => {
    conn.on("connected", () => resolve())
    conn.on("error", (err) => reject(err))
})))
.then(() => {
    console.log("All three databases connected successfully.")
    https.createServer(options, app).listen(3000, () => {
        console.log("HTTPS server running at: https://localhost:3000")
    })
})
.catch(err => {
    console.error("Database connection error:", err)
})
