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
const connectDB = require("./config/db");
const app = express()
const cartRoutes = require(`./routes/cartRoutes`)
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
app.use("/", cartRoutes)
connectDB()
    .then(() => {
        console.log("Database connected successfully.");
        https.createServer(options, app).listen(3000, () => {
            console.log("HTTPS server running at: https://localhost:3000");
        });
    })
    .catch(err => {
        console.error("Critical Database Error:");
        if (!process.env.MONGO_URI) {
            console.error("Error: MONGO_URI is undefined. Check that your .env file is in the root folder.");
        } else {
            console.error(err.message);
        }
        process.exit(1);
    });