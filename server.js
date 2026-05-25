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
const paymentRoutes = require(`./routes/paymentRoutes`)
const options = {
    key: fs.readFileSync("key.pem"),
    cert: fs.readFileSync("cert.pem")
}
 
app.disable("x-powered-by")
app.use((req, res, next) => {
    const contentType = req.headers['content-type'];
    
    // 1. Bypass body parsers completely for file uploads and webhooks
    if (contentType && contentType.includes('multipart/form-data')) {
        return next();
    }
    if (req.originalUrl === '/webhook') {
        return next();
    }

    express.json({ limit: "10kb" })(req, res, (err) => {
        if (err) return next(err);
        express.urlencoded({ extended: true })(req, res, next);
    });
});


app.use(hpp())
app.use(passport.initialize())
app.use(helmet({
    xPoweredBy: false,
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            imgSrc: ["'self'", "data:"]
        }
    },
    xDownloadOptions: false,
}))

// Serve static files from public folder (for images/photos)
app.use(express.static("public"))
 
app.use("/", authRoutes)
app.use("/", productRoutes)
app.use("/", cartRoutes)
app.use(`/`, paymentRoutes)
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